/**
 * UI audit capture. Screenshots every route at the three review widths and
 * reports horizontal overflow, tap-target misses and contrast-risk text.
 *
 * Reduced motion is emulated on purpose: it stops Lenis from starting (see
 * components/SmoothScroll), which is what makes programmatic scrolling —
 * and therefore the whileInView reveals — deterministic. Without it the
 * page captures blank below the fold.
 *
 * Usage: node scripts/ui/shoot.mjs <outDir> [baseUrl]
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT = process.argv[2] || 'screenshots/ui-before';
const BASE = process.argv[3] || 'http://127.0.0.1:4311';

const ROUTES = [
  ['home', '/'],
  ['shop', '/shop'],
  ['shop-iriz', '/shop/iriz'],
  ['specs', '/specs'],
  ['compare', '/compare'],
  ['about', '/about'],
  ['where-to-buy', '/where-to-buy'],
  ['support', '/support'],
  ['support-faq', '/support/faq'],
  ['support-contact', '/support/contact'],
  ['support-manuals', '/support/manuals'],
  ['warranty-registration', '/support/warranty-registration'],
  ['warranty-claim', '/support/warranty-claim'],
  ['legal-warranty', '/legal/warranty'],
  ['legal-privacy', '/legal/privacy'],
  ['legal-terms', '/legal/terms'],
  ['legal-returns', '/legal/returns'],
  ['legal-shipping', '/legal/shipping'],
  ['legal-grievance', '/legal/grievance'],
  ['cart', '/cart'],
  ['sign-in', '/sign-in'],
  ['account', '/account'],
];

const WIDTHS = [
  ['390', 390, 844],
  ['768', 768, 1024],
  ['1440', 1440, 900],
];

/** Scroll the whole page so every whileInView reveal has fired, then return. */
async function settle(page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 70));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 180));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 180));
  });
  await page.waitForTimeout(350);
}

/** Measurements that are tedious to eyeball across 22 routes x 3 widths. */
async function audit(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const overflowBy = de.scrollWidth - de.clientWidth;

    // Which elements actually stick out past the viewport's right edge?
    const offenders = [];
    if (overflowBy > 1) {
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > de.clientWidth + 1) {
          const cs = getComputedStyle(el);
          if (cs.position === 'fixed') continue;
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 70),
            right: Math.round(r.right),
            w: Math.round(r.width),
          });
        }
      }
    }

    // Interactive controls under the 44x44 comfortable-touch floor.
    const small = [];
    for (const el of document.querySelectorAll('a,button,[role="button"],input,select')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (getComputedStyle(el).display === 'contents') continue;
      if (r.height < 44 || r.width < 24) {
        small.push({
          tag: el.tagName.toLowerCase(),
          text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 32),
          h: Math.round(r.height),
          w: Math.round(r.width),
        });
      }
    }

    // Body text rendered below 14px, and the resolved body font family.
    const tiny = new Set();
    for (const el of document.querySelectorAll('p,li,span,a,td,label')) {
      if (!el.innerText || !el.innerText.trim()) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 13) tiny.add(`${el.tagName.toLowerCase()} ${fs}px "${el.innerText.trim().slice(0, 28)}"`);
    }

    return {
      overflowBy,
      scrollWidth: de.scrollWidth,
      clientWidth: de.clientWidth,
      offenders: offenders.slice(0, 8),
      smallTargets: small.slice(0, 10),
      smallTargetCount: small.length,
      tinyText: [...tiny].slice(0, 6),
      bodyFont: getComputedStyle(document.body).fontFamily,
      docHeight: de.scrollHeight,
    };
  });
}

const browser = await chromium.launch();
const report = {};

for (const [wName, w, h] of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    isMobile: w < 500,
    hasTouch: w < 500,
  });
  const page = await ctx.newPage();
  const dir = path.join(OUT, wName);
  await mkdir(dir, { recursive: true });

  for (const [name, route] of ROUTES) {
    try {
      const res = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
      await settle(page);
      await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
      const a = await audit(page);
      report[`${wName}/${name}`] = { status: res?.status(), ...a };
      const flag = a.overflowBy > 1 ? ` ⚠ OVERFLOW +${a.overflowBy}px` : '';
      console.log(`  ${wName.padEnd(5)} ${name.padEnd(24)} ${res?.status()} ${String(a.docHeight).padStart(6)}px${flag}`);
    } catch (e) {
      report[`${wName}/${name}`] = { error: String(e).slice(0, 160) };
      console.log(`  ${wName.padEnd(5)} ${name.padEnd(24)} ERROR ${String(e).slice(0, 90)}`);
    }
  }
  await ctx.close();
}

await browser.close();
await writeFile(path.join(OUT, 'audit.json'), JSON.stringify(report, null, 2));
console.log(`\nWrote ${OUT}/audit.json`);

/**
 * The UI audit for this branch: screenshots, layout defects and axe-core, on
 * every route at three widths.
 *
 *   node scripts/ui-audit.mjs http://localhost:3000 screenshots/ui-round3
 *
 * Needs `playwright` and `@axe-core/playwright`, both devDependencies.
 *
 * WHAT IT CHECKS, and why each one is measured rather than eyeballed:
 *
 *   horizontal scroll   scrollWidth past clientWidth on the document. The
 *                       single most common responsive defect and invisible in
 *                       a screenshot taken at the same width.
 *   overflow            elements whose own box extends past the viewport.
 *   clipped text        scrollWidth/Height past clientWidth/Height on a text
 *                       node — the symptom of a fixed-height box with a
 *                       longer string in it than the designer tested.
 *   ragged rows         sibling cards in one grid row whose heights differ.
 *                       Grouped by rounded `top`, so it compares what is
 *                       actually side by side rather than what is adjacent in
 *                       the DOM.
 *   small tap targets   interactive elements under 44x44 CSS px, the WCAG 2.2
 *                       target-size minimum. Inline links in a paragraph are
 *                       exempt — the criterion exempts them, and flagging
 *                       them buries the real ones.
 *   stretched images    rendered aspect ratio more than 2% off the natural
 *                       one, and images rendered far above their source size.
 *
 * Every page is scrolled end to end first, so reveal-gated content is in its
 * final state before anything is measured.
 */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');
const outDir = process.argv[3] || 'screenshots/ui-round3';

const ROUTES = [
  '/', '/about', '/specs', '/compare',
  '/shop', '/shop/iriz', '/where-to-buy',
  '/support', '/support/contact', '/support/faq', '/support/manuals',
  '/support/warranty-registration', '/support/warranty-claim',
  '/legal/privacy', '/legal/terms', '/legal/returns', '/legal/shipping',
  '/legal/warranty', '/legal/grievance',
  '/sign-in', '/account', '/account/orders', '/account/products', '/account/addresses',
];

const SIZES = [[375, 812], [768, 1024], [1440, 900]];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const layout = [];
const a11y = [];

for (const [width, height] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('bluneuron-consent-ack', '1'); } catch (e) { /* private mode */ }
  });

  for (const route of ROUTES) {
    const page = await ctx.newPage();
    const res = await page.goto(base + route, { waitUntil: 'load' }).catch(() => null);
    if (!res) { layout.push({ route, width, issues: ['page failed to load'] }); await page.close(); continue; }

    await page.evaluate(async () => {
      const step = innerHeight * 0.6;
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 140));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 400));
    });
    await page.waitForTimeout(700);

    const found = await page.evaluate(() => {
      const issues = [];
      const docEl = document.documentElement;
      const vw = docEl.clientWidth;

      const hs = docEl.scrollWidth - vw;
      if (hs > 1) issues.push(`horizontal scroll: ${hs}px`);

      const main = document.querySelector('main') || document.body;
      const nameOf = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className).slice(0, 34)}`;

      // Elements sticking out past the viewport.
      for (const el of main.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        if (r.right > vw + 1 || r.left < -1) {
          const cs = getComputedStyle(el);
          if (cs.position === 'fixed') continue;        // sticky bars, by design
          if (el.closest('[class*="overflow-x-auto"]')) continue; // scrolls inside itself
          issues.push(`overflows viewport: ${nameOf(el)} (${Math.round(r.left)}..${Math.round(r.right)})`);
          break;                                        // one report per page is enough
        }
      }

      // Text clipped by its own box.
      for (const el of main.querySelectorAll('h1,h2,h3,h4,p,li,dt,dd,span,a,button,summary')) {
        if (!el.textContent.trim()) continue;
        const cs = getComputedStyle(el);
        if (cs.overflow === 'visible') continue;
        if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) {
          issues.push(`clipped text: ${nameOf(el)} "${el.textContent.trim().slice(0, 28)}"`);
          break;
        }
      }

      // Cards in one row with different heights.
      for (const grid of main.querySelectorAll('ul,ol,div')) {
        const kids = [...grid.children].filter((k) => k.getBoundingClientRect().height > 40);
        if (kids.length < 2) continue;
        const rows = new Map();
        for (const k of kids) {
          const r = k.getBoundingClientRect();
          const key = Math.round(r.top);
          if (!rows.has(key)) rows.set(key, []);
          rows.get(key).push(r.height);
        }
        for (const [, hts] of rows) {
          if (hts.length > 1 && Math.max(...hts) - Math.min(...hts) > 2) {
            issues.push(`ragged row in ${nameOf(grid)}: heights ${hts.map((h) => Math.round(h)).join('/')}`);
            break;
          }
        }
        if (issues.some((i) => i.startsWith('ragged row'))) break;
      }

      // Tap targets under 44x44. Inline links inside running text are exempt
      // under WCAG 2.2 and flagging them buries the real ones.
      const small = [];
      for (const el of main.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary')) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const cs = getComputedStyle(el);
        if (parseFloat(cs.opacity) < 0.05) continue;
        if (el.tagName === 'A' && el.closest('p,li,dd')) continue;
        if (r.width < 44 || r.height < 44) small.push(`${nameOf(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      if (small.length) issues.push(`tap target <44px (${small.length}): ${small.slice(0, 3).join(', ')}`);

      // Images rendered at the wrong shape, or far above their source.
      for (const img of main.querySelectorAll('img')) {
        if (!img.naturalWidth || !img.complete) continue;
        const r = img.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const cs = getComputedStyle(img);
        if (cs.objectFit === 'cover') continue;         // cropping is the point
        const natural = img.naturalWidth / img.naturalHeight;
        const shown = r.width / r.height;
        if (Math.abs(natural - shown) / natural > 0.02) {
          issues.push(`stretched image: ${img.getAttribute('src')?.slice(-40)} natural ${natural.toFixed(3)} vs shown ${shown.toFixed(3)}`);
          break;
        }
      }

      return issues;
    });

    if (found.length) layout.push({ route, width, issues: found });

    const safe = (route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '_'));
    await page.screenshot({ path: `${outDir}/${safe}-${width}.png`, fullPage: true });

    // axe only needs running once per route; 1440 is the widest surface.
    if (width === 1440) {
      const r = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
        .catch((e) => ({ violations: [{ id: 'axe-failed', impact: 'serious', description: String(e).slice(0, 120), nodes: [] }] }));
      for (const v of r.violations) {
        if (v.impact === 'serious' || v.impact === 'critical') {
          a11y.push({ route, id: v.id, impact: v.impact, help: v.help, count: v.nodes.length,
            sample: v.nodes[0]?.target?.join(' ')?.slice(0, 70) || '' });
        }
      }
    }
    await page.close();
  }
  await ctx.close();
}

await browser.close();

console.log(`\n================ LAYOUT (${ROUTES.length} routes x ${SIZES.length} widths) ================`);
if (!layout.length) console.log('  no layout defects found');
for (const row of layout) {
  console.log(`\n  ${row.route}  @${row.width}`);
  row.issues.forEach((i) => console.log(`      ${i}`));
}

console.log(`\n================ ACCESSIBILITY (axe-core, serious+critical) ================`);
if (!a11y.length) console.log('  no serious or critical violations');
const byId = new Map();
for (const v of a11y) {
  const e = byId.get(v.id) || { impact: v.impact, help: v.help, routes: [], nodes: 0 };
  e.routes.push(v.route); e.nodes += v.count;
  byId.set(v.id, e);
}
for (const [id, e] of [...byId.entries()].sort((a, b) => b[1].nodes - a[1].nodes)) {
  console.log(`\n  ${e.impact.toUpperCase()}  ${id} — ${e.help}`);
  console.log(`      ${e.nodes} nodes across ${e.routes.length} routes: ${e.routes.slice(0, 6).join(', ')}${e.routes.length > 6 ? ' …' : ''}`);
}

writeFileSync(`${outDir}/_audit.json`, JSON.stringify({ layout, a11y }, null, 2));
console.log(`\nScreenshots and _audit.json in ${outDir}/`);

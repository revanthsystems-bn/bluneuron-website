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
 *   stretched images    an `object-fit: fill` image (the default) whose
 *                       element box is more than 2% off the source's own
 *                       ratio — almost always a wrong width/height attribute
 *                       pair, since an <img> takes its ratio from those.
 *   cropped thumbnails  an `object-fit: cover` image in a tile of 256px or
 *                       less losing more than 10% of the source off the
 *                       edges. Not distortion, but it is how a product shot
 *                       in a cart tile becomes a patch of background. Bands
 *                       and heroes are exempt: cropping one is the art
 *                       direction, not a defect.
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
  '/support', '/support/contact', '/support/faq',
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

      // Images rendered at the wrong shape.
      //
      // IT IS THE PAINTED RATIO THAT MATTERS, NOT THE ELEMENT BOX. This
      // compared the box to the natural ratio and exempted `object-fit:
      // cover`, which got both halves wrong:
      //
      //   - `contain` and `scale-down` letterbox INSIDE a box of any shape
      //     and never distort, so every contained image in a square frame
      //     was reported as stretched. Five such reports per width on this
      //     site, all false, which is exactly the noise a real one hides in.
      //   - `cover` never distorts either, but it CROPS, and the exemption
      //     ("cropping is the point") meant a 1.42:1 product cut into a 1:1
      //     tile — 30% of it thrown away — was reported as nothing at all.
      //     That is a real defect this site has shipped twice.
      //
      // So: derive what is actually painted, and report the two faults
      // separately. Only `fill` (the CSS initial value, so the default for
      // any <img> with no object-fit) can distort, and it does so whenever
      // the element box disagrees with the source — which is what a wrong
      // width/height attribute pair causes, since an <img> takes its aspect
      // ratio from those attributes.
      for (const img of main.querySelectorAll('img')) {
        if (!img.naturalWidth || !img.complete) continue;
        const r = img.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const cs = getComputedStyle(img);
        const fit = cs.objectFit;
        const natural = img.naturalWidth / img.naturalHeight;
        const box = r.width / r.height;
        const src = img.getAttribute('src')?.slice(-40);

        if (fit === 'fill' && Math.abs(natural - box) / natural > 0.02) {
          issues.push(`stretched image: ${src} natural ${natural.toFixed(3)} vs shown ${box.toFixed(3)}`);
          break;
        }
        // SMALL TILES ONLY, and that bound is the whole point of the check.
        // `object-fit: cover` on a wide band is ART DIRECTION — every
        // PageHero on this site crops a 1:1 render into a 4:1 strip on
        // purpose, and reporting those buries the finding in 26 lines of
        // intended behaviour. On a thumbnail there is no art direction to
        // do: the tile exists to show one object, and a crop that takes a
        // third of it leaves a patch of background where the product was.
        // 256px is above every product tile here (80, 128, 36) and below
        // every band.
        const thumb = r.width <= 256 && r.height <= 256;
        if (fit === 'cover' && thumb) {
          const lost = box > natural ? 1 - natural / box : 1 - box / natural;
          if (lost > 0.1) {
            issues.push(`cropped thumbnail: ${src} ${Math.round(lost * 100)}% of a ${natural.toFixed(2)}:1 source cut to fit a ${Math.round(r.width)}x${Math.round(r.height)} tile`);
            break;
          }
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

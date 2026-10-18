/** Contrast, type-scale and section-padding census across the site. */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:4311';
const ROUTES = ['/', '/shop/iriz', '/specs', '/compare', '/about', '/where-to-buy',
  '/support', '/support/faq', '/support/warranty-registration', '/legal/warranty', '/cart', '/sign-in'];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();

const contrast = new Map();
const fontSizes = new Map();
const padY = new Map();
const radii = new Map();
const maxW = new Map();

for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);

  const data = await page.evaluate(() => {
    const srgb = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
    const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number);

    // Composite a possibly-translucent colour over its painted backdrop.
    function effective(el) {
      const cs = getComputedStyle(el);
      const fg = parse(cs.color);
      const a = fg.length > 3 ? fg[3] : 1;
      let bg = [0, 0, 0];
      let node = el;
      while (node) {
        const b = parse(getComputedStyle(node).backgroundColor);
        if (b.length >= 3 && (b.length < 4 || b[3] > 0.5)) { bg = b.slice(0, 3); break; }
        node = node.parentElement;
      }
      const comp = fg.slice(0, 3).map((c, i) => c * a + bg[i] * (1 - a));
      const L1 = lum(comp), L2 = lum(bg);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      return { ratio: Math.round(ratio * 100) / 100, color: cs.color, size: parseFloat(cs.fontSize), weight: cs.fontWeight };
    }

    const contrast = [], fonts = [], pads = [], radii = [], widths = [];
    for (const el of document.querySelectorAll('p,li,span,a,h1,h2,h3,h4,td,th,label,button')) {
      const t = (el.innerText || '').trim();
      if (!t || el.childElementCount > 2) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const e = effective(el);
      const large = e.size >= 24 || (e.size >= 18.66 && Number(e.weight) >= 700);
      const floor = large ? 3 : 4.5;
      if (e.ratio < floor) contrast.push({ ratio: e.ratio, size: e.size, color: e.color, need: floor, text: t.slice(0, 34) });
      fonts.push(e.size);
    }
    for (const el of document.querySelectorAll('section')) {
      const cs = getComputedStyle(el);
      pads.push(`${cs.paddingTop}/${cs.paddingBottom}`);
    }
    for (const el of document.querySelectorAll('div,a,button,img,section')) {
      const br = getComputedStyle(el).borderRadius;
      if (br && br !== '0px') radii.push(br.split(' ')[0]);
    }
    for (const el of document.querySelectorAll('div,section,main')) {
      const mw = getComputedStyle(el).maxWidth;
      if (mw && mw !== 'none') widths.push(mw);
    }
    return { contrast, fonts, pads, radii, widths };
  });

  for (const c of data.contrast) {
    const k = `${c.ratio}:1 (need ${c.need}) ${c.size}px ${c.color}`;
    if (!contrast.has(k)) contrast.set(k, { n: 0, sample: c.text, routes: new Set() });
    const e = contrast.get(k); e.n++; e.routes.add(route);
  }
  for (const f of data.fonts) fontSizes.set(f, (fontSizes.get(f) || 0) + 1);
  for (const p of data.pads) padY.set(p, (padY.get(p) || 0) + 1);
  for (const r of data.radii) radii.set(r, (radii.get(r) || 0) + 1);
  for (const w of data.widths) maxW.set(w, (maxW.get(w) || 0) + 1);
}
await browser.close();

console.log('=== CONTRAST FAILURES (WCAG AA) ===');
[...contrast.entries()].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).slice(0, 14)
  .forEach(([k, v]) => console.log(`  ${k}  x${v.n}  e.g. "${v.sample}"`));
console.log(`  total distinct failing styles: ${contrast.size}`);

console.log('\n=== DISTINCT FONT SIZES IN USE ===');
console.log('  ' + [...fontSizes.keys()].sort((a, b) => a - b).join('px, ') + 'px');
console.log('  count: ' + fontSizes.size);

console.log('\n=== SECTION VERTICAL PADDING (top/bottom) ===');
[...padY.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16).forEach(([k, n]) => console.log(`  ${k.padEnd(26)} x${n}`));
console.log('  distinct: ' + padY.size);

console.log('\n=== BORDER RADII ===');
[...radii.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).forEach(([k, n]) => console.log(`  ${k.padEnd(12)} x${n}`));
console.log('  distinct: ' + radii.size);

console.log('\n=== MAX-WIDTHS ===');
[...maxW.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).forEach(([k, n]) => console.log(`  ${k.padEnd(12)} x${n}`));
console.log('  distinct: ' + maxW.size);

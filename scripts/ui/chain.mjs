import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: 'reduce' });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:4311/shop/iriz', { waitUntil: 'networkidle' });
const out = await p.evaluate(() => {
  const ul = document.querySelector('ul.bleed-x');
  const rows = [];
  let n = ul;
  while (n && n !== document.documentElement) {
    const r = n.getBoundingClientRect();
    const cs = getComputedStyle(n);
    rows.push({
      tag: n.tagName.toLowerCase(),
      cls: (n.className || '').toString().slice(0, 64),
      w: Math.round(r.width), l: Math.round(r.left),
      display: cs.display, minW: cs.minWidth, overflowX: cs.overflowX,
      gridCols: cs.gridTemplateColumns.slice(0, 40),
    });
    n = n.parentElement;
  }
  return rows;
});
out.forEach((r, i) => console.log(
  `${'  '.repeat(0)}${String(i).padStart(2)} <${r.tag}> w=${String(r.w).padStart(4)} l=${String(r.l).padStart(4)} ` +
  `display=${r.display.padEnd(10)} minW=${r.minW.padEnd(8)} ovfX=${r.overflowX.padEnd(8)} cols=${r.gridCols}\n     .${r.cls}`));
await b.close();

import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
const p = await ctx.newPage();
for (const route of process.argv.slice(2)) {
  await p.goto('http://127.0.0.1:4311' + route, { waitUntil: 'networkidle' });
  const r = await p.evaluate(() => {
    const de = document.documentElement;
    const over = de.scrollWidth - de.clientWidth;
    const bad = [];
    if (over > 1) for (const el of document.querySelectorAll('body *')) {
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height) continue;
      if (getComputedStyle(el).position === 'fixed') continue;
      if (b.right > de.clientWidth + 1 || b.left < -1) {
        bad.push({ tag: el.tagName.toLowerCase(), cls: (el.className||'').toString().slice(0,80),
                   l: Math.round(b.left), r: Math.round(b.right), w: Math.round(b.width) });
      }
    }
    return { over, sw: de.scrollWidth, cw: de.clientWidth, bad: bad.slice(0, 6) };
  });
  console.log(`${route}: scrollWidth ${r.sw} vs ${r.cw} => ${r.over > 1 ? 'OVERFLOW +' + r.over : 'ok'}`);
  r.bad.forEach(x => console.log(`    <${x.tag}> l=${x.l} r=${x.r} w=${x.w}  .${x.cls}`));
}
await b.close();

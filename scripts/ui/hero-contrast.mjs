/**
 * The hero's text sits over VIDEO, so its contrast cannot be computed from
 * CSS: the backdrop is whatever frame is playing, through two scrims. This
 * hides the text, samples the pixels it would have covered, and reports the
 * worst case against the text's own computed colour.
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:4311';
const W = Number(process.argv[3] || 390);

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 844 : 900 }, reducedMotion: 'reduce' });
const p = await ctx.newPage();
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);

const targets = await p.evaluate(() => {
  const sel = ['.type-label', '.type-display', '.type-lede', 'header a', 'header button'];
  const out = [];
  for (const s of sel) {
    for (const el of document.querySelectorAll(s)) {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.top > window.innerHeight) continue;
      out.push({
        sel: s,
        text: (el.innerText || '').trim().slice(0, 28),
        color: getComputedStyle(el).color,
        ownBg: (() => {
          // Walk up for the nearest painted background. If it is opaque,
          // this element is not sitting on the video and the backdrop
          // sample below would be measuring the wrong thing entirely.
          let n = el;
          while (n && n !== document.body) {
            const bg = getComputedStyle(n).backgroundColor;
            const m = (bg.match(/[\d.]+/g) || []).map(Number);
            if (m.length >= 3 && (m.length < 4 || m[3] > 0.92)) return `rgb(${m.slice(0,3).join(',')})`;
            n = n.parentElement;
          }
          return null;
        })(),
        size: parseFloat(getComputedStyle(el).fontSize),
        weight: getComputedStyle(el).fontWeight,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      });
    }
  }
  return out;
});

// Hide the text, keep every backdrop layer, and photograph what is behind it.
await p.addStyleTag({ content: '.type-label,.type-display,.type-lede,header a,header button{visibility:hidden!important}' });
await p.waitForTimeout(300);
const shot = await p.screenshot({ type: 'png' });

const stats = await p.evaluate(async (dataUrl) => {
  const img = new Image();
  await new Promise((r) => { img.onload = r; img.src = dataUrl; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  c.getContext('2d').drawImage(img, 0, 0);
  window.__ctx2d = c.getContext('2d');
  return { w: img.width, h: img.height };
}, 'data:image/png;base64,' + shot.toString('base64'));

const results = await p.evaluate((items) => {
  const g = window.__ctx2d;
  const srgb = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = (r, gg, bb) => 0.2126 * srgb(r) + 0.7152 * srgb(gg) + 0.0722 * srgb(bb);
  const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number);

  return items.map((it) => {
    const { x, y, w, h } = it.rect;
    const d = g.getImageData(Math.max(0, x), Math.max(0, y), Math.max(1, w), Math.max(1, h)).data;
    // Worst case = the LIGHTEST backdrop pixel under light text.
    let worst = null, worstL = -1;
    for (let i = 0; i < d.length; i += 4) {
      const L = lum(d[i], d[i + 1], d[i + 2]);
      if (L > worstL) { worstL = L; worst = [d[i], d[i + 1], d[i + 2]]; }
    }
    // An opaque background of its own wins over whatever is behind it.
    const base = it.ownBg ? parse(it.ownBg) : worst;
    const baseL = it.ownBg ? lum(...parse(it.ownBg)) : worstL;
    const fg = parse(it.color);
    const a = fg.length > 3 ? fg[3] : 1;
    const comp = fg.slice(0, 3).map((ch, i) => ch * a + base[i] * (1 - a));
    const L1 = lum(...comp), L2 = baseL;
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const large = it.size >= 24 || (it.size >= 18.66 && Number(it.weight) >= 700);
    return { ...it, bg: it.ownBg || `rgb(${worst.join(',')})`, ratio: Math.round(ratio * 100) / 100, need: large ? 3 : 4.5 };
  });
}, targets);

console.log(`=== HERO CONTRAST @ ${W}px (worst backdrop pixel under each element) ===`);
let bad = 0;
for (const r of results) {
  const ok = r.ratio >= r.need;
  if (!ok) bad++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${String(r.ratio).padStart(6)}:1 (need ${r.need})  ${String(Math.round(r.size)) + 'px'} on ${r.bg.padEnd(18)} "${r.text}"`);
}
console.log(bad === 0 ? '\nAll hero text passes AA.' : `\n${bad} element(s) below AA.`);
await b.close();
process.exit(bad === 0 ? 0 : 1);

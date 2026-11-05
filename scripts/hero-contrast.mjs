/**
 * Text contrast over the neuron network, MEASURED rather than computed.
 *
 *   node scripts/hero-contrast.mjs <url> [outDir]
 *
 * The hero sets white and light-blue type over a canvas of drifting blue
 * nodes. A contrast figure worked out on paper assumes a flat #030303 behind
 * every glyph, which is exactly what the canvas stops being true — so this
 * measures the real thing instead:
 *
 *   1. the canvas is captured on its own, with the type and the card hidden,
 *      so every pixel in frame is actual painted network;
 *   2. for each text element on the first screen, the BRIGHTEST pixel the
 *      canvas paints anywhere inside that element's box is found — the worst
 *      case a glyph could possibly sit on, not an average;
 *   3. that pixel is composited over the page ground the same way the
 *      browser does, and the element's own computed colour is composited
 *      over THAT (type here is white at 60-88%, so its alpha matters);
 *   4. WCAG 2.x relative luminance and contrast ratio, against the 4.5:1
 *      floor for body text and 3:1 for large text.
 *
 * It samples over several frames, because the field moves: the node that
 * matters is the brightest one that passes under a given word at any point,
 * not whichever one happened to be there when a single screenshot was taken.
 *
 * Local tooling, like scripts/shot.mjs. Nothing in the app or any host loads
 * it.
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

const [url, outDir = 'screenshots/hero-neuron'] = process.argv.slice(2);
if (!url) {
  console.error('usage: node scripts/hero-contrast.mjs <url> [outDir]');
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });

/** The page ground the canvas is painted on. */
const GROUND = [3, 3, 3];

/**
 * THE WINDOW HAS TO BE LONGER THAN IT LOOKS, and the arithmetic is the
 * reason rather than caution.
 *
 * This takes the brightest pixel the canvas paints inside each text box over
 * the sampling window. That is only a worst case if the window is long
 * enough for a node to have DRIFTED through the box — nodes move at
 * NeuronNetwork's DRIFT, 7.5 CSS px per second, and the eyebrow's box is
 * ~310px wide, so a node needs ~41s to cross it. A 3.6s window samples a
 * 27px slice of that and reports whatever happened to be standing there:
 * the same element measured 12.35:1 on one short run and 3.91:1 on the next.
 *
 * 34 frames 1.2s apart is ~41s, which is one full traverse.
 */
const FRAMES = 34;
const FRAME_GAP = 1200;

const TARGETS = [
  ['.hero-eyebrow', 'eyebrow (11px)', 4.5],
  ['#showcase h1 span[aria-hidden="true"]', 'IRIZ wordmark (108px)', 3],
  ['.hero-headline', 'headline (38px)', 3],
  ['.hero-shimmer', 'headline accent "awaits." (38px)', 3],
  ['#showcase dd.hero-stat', 'stat figures (32px)', 3],
  ['#showcase dt.type-label', 'stat labels (11px)', 4.5],
  ['#showcase .btn-secondary', '"See specs" button', 4.5],
];

function srgbToLin(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
const luminance = ([r, g, b]) =>
  0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/** `over` painted at `alpha` on top of `under`. */
const composite = (over, under, alpha) =>
  over.map((c, i) => Math.round(c * alpha + under[i] * (1 - alpha)));

const parseColor = (css) => {
  const n = css.match(/[\d.]+/g).map(Number);
  return { rgb: n.slice(0, 3), alpha: n.length > 3 ? n[3] : 1 };
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
await ctx.addInitScript(() => {
  try { localStorage.setItem('bluneuron-consent-ack', '1'); } catch (e) { /* private mode */ }
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(
  () => document.querySelector('.hero-network')?.classList.contains('is-live'),
  null,
  { timeout: 10000 },
);

// Boxes and colours first, while the page is still intact.
const boxes = await page.evaluate((targets) => {
  const base = document.querySelector('#showcase').getBoundingClientRect();
  return targets.map(([sel, label, floor]) => {
    const el = document.querySelector(sel);
    if (!el) return { sel, label, floor, missing: true };

    /* THE TEXT'S OWN RECTS, NOT THE ELEMENT'S BOX.
       ============================================================
       `.hero-eyebrow` is a <p>, so its box is the full width of the
       left column — 624px at 1440 — while the words
       "MINI PROJECTOR FOR HOME" occupy the first 310px of it. Sampling
       the box therefore found the brightest node anywhere in 624px,
       including the right-hand half where the canvas mask is at full
       strength and no glyph has ever been, and reported the eyebrow at
       4.10:1 against a node nothing was ever drawn on top of.

       A Range over the element's contents gives the LINE BOXES the
       glyphs actually occupy, which is the only region a contrast
       question is about. Union of the rects, since a wrapped line
       produces several. */
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((q) => q.width > 0 && q.height > 0);
    const r = rects.length
      ? {
        left: Math.min(...rects.map((q) => q.left)),
        top: Math.min(...rects.map((q) => q.top)),
        right: Math.max(...rects.map((q) => q.right)),
        bottom: Math.max(...rects.map((q) => q.bottom)),
      }
      : el.getBoundingClientRect();
    r.width = r.right - r.left;
    r.height = r.bottom - r.top;
    const cs = getComputedStyle(el);
    return {
      sel,
      label,
      floor,
      color: cs.color,
      // The shimmer paints through `background-clip: text`, so its computed
      // `color` is the measured fallback and `-webkit-text-fill-color` is
      // what is actually drawn. Report the one the eye sees.
      fill: cs.webkitTextFillColor,
      backgroundImage: cs.backgroundImage !== 'none',
      box: {
        x: Math.max(0, Math.round(r.left - base.left)),
        y: Math.max(0, Math.round(r.top - base.top)),
        w: Math.round(r.width),
        h: Math.round(r.height),
      },
    };
  });
}, TARGETS);

/* Hide everything but the canvas, so the capture is pure network. The page
   is disposable; nothing is written back to the build.

   THE MASTHEAD HAS TO GO TOO, and that is not tidiness. It floats over the
   hero and is NOT inside #showcase, so the first version of this left it
   standing — and `locator('#showcase').screenshot()` stitches a scrolling
   capture for a section taller than the viewport, which dragged the header's
   white "Buy" pill down through the frame and reported the "See specs"
   button sitting on rgb(255,255,255) at 1.00:1. The fix is both halves: hide
   the header, and clip the VIEWPORT at scroll 0 rather than stitching. Every
   element sampled here is on the first screen anyway. */
await page.evaluate(() => {
  for (const el of document.querySelectorAll('#showcase > *')) {
    if (!el.classList.contains('hero-network')) el.style.visibility = 'hidden';
  }
  document.querySelector('.hero-aura')?.style.setProperty('visibility', 'hidden');
  for (const el of document.querySelectorAll('header, [data-sticky-buy]')) {
    el.style.visibility = 'hidden';
  }
  window.scrollTo(0, 0);
});

/* A WARM-UP CAPTURE THAT IS THROWN AWAY, AND IT IS NOT PADDING.
   ====================================================================
   `page.evaluate` resolves when the script has run, not when the browser has
   painted what it changed — and Chromium's FIRST screenshot after a change
   can still come back from the previous frame even after two rAFs have gone
   by. Both were observed here: the discarded frame contained the hero and
   the masthead exactly as they were before everything was hidden, which put
   the masthead's white "Buy" pill and the "See specs" glyphs into frame.
   The button then reported a worst-case background of rgb(255,255,255) at
   1.00:1 — its own white type, not the network.

   One bad frame is all it takes, because this tool deliberately takes the
   MAXIMUM over the window rather than an average. So the first capture is
   taken and dropped, and only what follows is measured. */
await page.evaluate(() => new Promise((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(resolve));
}));
await page.waitForTimeout(120);
await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 900 } });
await page.waitForTimeout(120);

const peak = boxes.map(() => [0, 0, 0]);
for (let f = 0; f < FRAMES; f += 1) {
  const shot = await page.screenshot({
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  });
  const { data, info } = await sharp(shot).removeAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  boxes.forEach((t, i) => {
    if (t.missing) return;
    const x0 = Math.min(t.box.x, info.width - 1);
    const y0 = Math.min(t.box.y, info.height - 1);
    const x1 = Math.min(t.box.x + t.box.w, info.width);
    const y1 = Math.min(t.box.y + t.box.h, info.height);
    let best = peak[i];
    let bestL = luminance(best);
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const p = (y * info.width + x) * 3;
        const px = [data[p], data[p + 1], data[p + 2]];
        const l = luminance(px);
        if (l > bestL) { bestL = l; best = px; }
      }
    }
    peak[i] = best;
  });
  if (f < FRAMES - 1) await page.waitForTimeout(FRAME_GAP);
}

const lines = [
  'TEXT CONTRAST OVER THE NEURON NETWORK — measured, 1440x900',
  '',
  `  ${url}`,
  `  ${FRAMES} frames ${FRAME_GAP}ms apart; the BRIGHTEST network pixel found`,
  '  anywhere inside each text box over that window is the background used.',
  '',
];
let worstFail = null;

boxes.forEach((t, i) => {
  if (t.missing) { lines.push(`  ${t.label.padEnd(34)} ELEMENT NOT FOUND (${t.sel})`); return; }
  // The captured canvas pixel is already composited over nothing (transparent
  // canvas on a transparent section), so put it on the page ground first.
  const bg = peak[i];
  const ground = luminance(bg) > luminance(GROUND) ? bg : GROUND;
  const painted = t.backgroundImage && t.fill === 'rgba(0, 0, 0, 0)' ? t.color : (t.fill || t.color);
  const { rgb, alpha } = parseColor(painted);
  const fg = composite(rgb, ground, alpha);
  const ratio = contrast(fg, ground);
  const pass = ratio >= t.floor;
  if (!pass && (!worstFail || ratio < worstFail.ratio)) worstFail = { ...t, ratio };
  lines.push(
    `  ${t.label.padEnd(34)} ${ratio.toFixed(2)}:1   floor ${t.floor}   ${pass ? 'PASS' : 'FAIL'}`,
  );
  lines.push(
    `  ${''.padEnd(34)} text rgb(${fg.join(',')})  worst ground rgb(${ground.join(',')})`,
  );
});

lines.push('');
lines.push(worstFail
  ? `  FAIL — ${worstFail.label} at ${worstFail.ratio.toFixed(2)}:1`
  : '  Every sampled element clears its WCAG AA floor over the brightest'
    + ' network pixel measured under it.');

const out = lines.join('\n');
writeFileSync(`${outDir}/contrast-over-network.txt`, out);
console.log(out);

await browser.close();
process.exit(worstFail ? 1 : 0);

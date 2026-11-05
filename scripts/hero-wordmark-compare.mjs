/**
 * The IRIZ wordmark, old hero against new, cropped from both live pages.
 *
 *   node scripts/hero-wordmark-compare.mjs <newUrl> <oldUrl> [outDir]
 *
 * The brief for the Neuron Network hero said the wordmark had to come out
 * identical — same glyphs, same weight, same proportions, same colour, with
 * only its size allowed to change. There is no wordmark ASSET to diff: the
 * four letters are live text (HERO.display, lowercased with a dotless U+0131)
 * set in Zen Dots and dressed by `.font-iriz`. So the proof is a pixel crop
 * of the rendered <h1> from each build at the same viewport, stacked with the
 * computed font shorthand and the measured box printed under each.
 *
 * It diffs the two crops as well, which is the part a screenshot cannot
 * argue with: identical input should produce a zero-pixel difference.
 *
 * Local tooling, like scripts/shot.mjs. Nothing in the app or any host loads
 * it. `sharp` is already a dependency (next/image needs it at runtime).
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

const [newUrl, oldUrl, outDir = 'screenshots/hero-neuron'] = process.argv.slice(2);
if (!newUrl || !oldUrl) {
  console.error('usage: node scripts/hero-wordmark-compare.mjs <newUrl> <oldUrl> [outDir]');
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });

const WIDTH = 1440;
const HEIGHT = 900;
const SCALE = 2;
const PAD = 16;

const browser = await chromium.launch();

async function grab(url, tag) {
  const ctx = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: SCALE,
  });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('bluneuron-consent-ack', '1'); } catch (e) { /* private mode */ }
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  // The entrance is a 0.4s CSS rise; the wordmark must be settled before it
  // is measured or the two crops differ by the 12px of that animation.
  await page.waitForTimeout(1800);

  const info = await page.evaluate((pad) => {
    const h1 = document.querySelector('#showcase h1');
    const visual = h1.querySelector('span[aria-hidden="true"]');

    /* EVERYTHING ELSE IN THE HERO IS HIDDEN BEFORE THE CROP, and both
       builds get exactly the same treatment.
       ================================================================
       The first version of this cropped the <h1>'s own rect plus 16px of
       padding and came back with a 2.9% pixel difference — all of it the
       EYEBROW above and the HEADLINE below, which this rebuild did change
       and which have no business being in a comparison of the wordmark.
       `line-height: 0.88` makes the inline box shorter than the painted
       glyphs, so any padding at all reaches into the neighbours.

       Hiding them leaves the mark alone on the hero's own ground, which
       is the only thing the "identical wordmark" claim is about. It is a
       measurement-time change to a throwaway page, not to the build. */
    for (const el of document.querySelectorAll('#showcase *')) {
      if (el === h1 || el.contains(h1) || h1.contains(el)) continue;
      el.style.visibility = 'hidden';
    }
    // Including the canvas, so a node drifting behind the mark cannot
    // show up as a difference between the two builds either.
    const canvas = document.querySelector('.hero-network');
    if (canvas) canvas.style.display = 'none';

    const r = visual.getBoundingClientRect();
    const cs = getComputedStyle(h1);
    return {
      box: {
        x: Math.max(0, Math.round(r.x - pad)),
        y: Math.max(0, Math.round(r.y - pad)),
        width: Math.round(r.width + pad * 2),
        height: Math.round(r.height + pad * 2),
      },
      text: visual.textContent,
      codepoints: [...visual.textContent].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' '),
      font: cs.font,
      fontFamily: cs.fontFamily,
      fontWeight: cs.fontWeight,
      fontSize: cs.fontSize,
      letterSpacing: cs.letterSpacing,
      lineHeight: cs.lineHeight,
      textTransform: cs.textTransform,
      color: cs.color,
      measured: `${Math.round(r.width)} x ${Math.round(r.height)} css px`,
    };
  }, PAD);

  const buf = await page.screenshot({ clip: info.box });
  await ctx.close();
  return { tag, info, buf };
}

const next = await grab(newUrl, 'hero-neuron');
const prev = await grab(oldUrl, 'easy-swaps');

/* ------------------------------------------------------------------ *
 * THE DIFF. Both crops are normalised to the same box before they are
 * compared, so a one-pixel difference in where the <h1> happened to sit
 * on the page cannot read as a difference in the mark itself.
 * ------------------------------------------------------------------ */
const w = Math.min(next.info.box.width, prev.info.box.width) * SCALE;
const h = Math.min(next.info.box.height, prev.info.box.height) * SCALE;

const [aRaw, bRaw] = await Promise.all([
  sharp(next.buf).extract({ left: 0, top: 0, width: w, height: h })
    .removeAlpha().raw().toBuffer(),
  sharp(prev.buf).extract({ left: 0, top: 0, width: w, height: h })
    .removeAlpha().raw().toBuffer(),
]);

let differing = 0;
let maxDelta = 0;
for (let i = 0; i < aRaw.length; i += 3) {
  const d = Math.max(
    Math.abs(aRaw[i] - bRaw[i]),
    Math.abs(aRaw[i + 1] - bRaw[i + 1]),
    Math.abs(aRaw[i + 2] - bRaw[i + 2]),
  );
  // 8/255 of tolerance, for the canvas node that may drift behind the
  // mark on the new build. Anything to do with the GLYPHS is far past it.
  if (d > 8) differing += 1;
  if (d > maxDelta) maxDelta = d;
}
const totalPx = w * h;

/* ------------------------------------------------------------------ *
 * THE SHEET. Two crops stacked, each with its own caption, on the
 * hero's own #030303 so the white mark is read the way the page draws
 * it.
 * ------------------------------------------------------------------ */
const LABEL_H = 92;
const GAP = 28;
const MARGIN = 32;
// A floor as well as the crop width: the captions are longer than a 180px
// wordmark and were being sliced off the right edge of the sheet.
const sheetW = Math.max(
  Math.max(next.info.box.width, prev.info.box.width) * SCALE + MARGIN * 2,
  1000,
);
const sheetH = MARGIN * 2 + GAP + (LABEL_H + h) * 2;

function caption(title, info) {
  return `
    <tspan x="0" dy="0" font-size="22" font-weight="700" fill="#ffffff">${title}</tspan>
    <tspan x="0" dy="26" font-size="17" fill="#9dc4ff">${info.measured} · ${info.fontWeight} · ${info.letterSpacing} tracking · ${info.color}</tspan>
    <tspan x="0" dy="24" font-size="15" fill="#8a8a8a">${info.fontFamily.replace(/"/g, '')} · "${info.text}" ${info.codepoints}</tspan>`;
}

const svg = Buffer.from(`
<svg width="${sheetW}" height="${sheetH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#030303"/>
  <g font-family="Segoe UI, Arial, sans-serif">
    <text x="${MARGIN}" y="${MARGIN + 22}">${caption('NEW — hero-neuron', next.info)}</text>
    <text x="${MARGIN}" y="${MARGIN + LABEL_H + h + GAP + 22}">${caption('OLD — easy-swaps (the live wordmark)', prev.info)}</text>
  </g>
</svg>`);

await sharp({
  create: {
    width: sheetW, height: sheetH, channels: 3, background: '#030303',
  },
})
  .composite([
    { input: svg, top: 0, left: 0 },
    { input: next.buf, top: MARGIN + LABEL_H, left: MARGIN },
    { input: prev.buf, top: MARGIN + LABEL_H + h + GAP + LABEL_H, left: MARGIN },
  ])
  .png()
  .toFile(`${outDir}/wordmark-side-by-side.png`);

const report = [
  'IRIZ WORDMARK — new hero vs. old hero, rendered at 1440x900, DPR 2',
  '',
  `  new  ${newUrl}`,
  `  old  ${oldUrl}`,
  '',
  ...['font', 'fontFamily', 'fontWeight', 'fontSize', 'letterSpacing', 'lineHeight',
    'textTransform', 'color', 'text', 'codepoints', 'measured'].map((k) => {
    const same = String(next.info[k]) === String(prev.info[k]);
    return `  ${k.padEnd(14)} ${same ? 'SAME' : 'DIFFERENT'}\n      new: ${next.info[k]}\n      old: ${prev.info[k]}`;
  }),
  '',
  `  pixel diff     ${differing} of ${totalPx} px differ by more than 8/255`
    + ` (${((differing / totalPx) * 100).toFixed(4)}%), max channel delta ${maxDelta}`,
  '',
  `  sheet          ${outDir}/wordmark-side-by-side.png`,
].join('\n');

writeFileSync(`${outDir}/wordmark-compare.txt`, report);
console.log(report);

await browser.close();

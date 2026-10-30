/**
 * Builds the social card: public/media/iriz/product/iriz-og-1200x630.jpg
 *
 *   node design-src/og-card.mjs
 *
 * WHY THIS IS A SCRIPT AND NOT A ONE-OFF. The card is the product shot on its
 * own ground beside the wordmark, and every number below was derived from the
 * source files rather than chosen. Re-deriving them by hand after the
 * photography changes is how a social card ends up with a seam down it — see
 * THE GROUND below, which is the specific trap this file exists to document.
 *
 * 1200x630 (1.91:1) BECAUSE THAT IS WHAT THE PLATFORMS CROP TO. lib/seo.js
 * declares `card: 'summary_large_image'`; X, LinkedIn and Facebook all
 * centre-crop to roughly this ratio. The asset here was a 1600x1600 square
 * until 30 Oct 2026, so each of them threw away its top and bottom thirds.
 * Authoring at the target ratio is what stops a platform composing the image.
 *
 * NO TEXT BUT THE WORDMARK, and that is a content rule, not a layout one. A
 * social card has no room for the sentence that qualifies a spec, so a number
 * printed here ships without it. The picture and the brand, nothing else.
 *
 * ---------------------------------------------------------------------------
 * THE GROUND IS READ OUT OF THE DECODED PHOTOGRAPH. DO NOT TYPE A HEX VALUE.
 * ---------------------------------------------------------------------------
 * The canvas has to be the same colour as the photograph's own seamless, or
 * the pasted rectangle shows as a panel against it. Two things make that
 * harder than it sounds, and both produced a visibly seamed card before this
 * script settled:
 *
 *   1. `sharp(file).extract(...).stats()` DOES NOT SAMPLE THE EXTRACTED
 *      REGION. `stats()` reports on the whole input image, so every "sample"
 *      taken that way comes back as the same whole-image mean — 207,207,208
 *      here, which is the average of a white stage and a black lens band, and
 *      is not the colour of anything in the picture. A canvas filled with it
 *      put a grey border around a white photograph.
 *
 *   2. The resize happens in the decode pipeline. The only value guaranteed
 *      to match what lands in the output is one read from the pipeline's OWN
 *      raw output, after resizing, in the same colour space.
 *
 * So: decode to raw sRGB once, read pixel (0,0) of that buffer, and fill the
 * canvas with it. The assertion at the end re-reads the written file either
 * side of the paste boundary and fails if they differ, so a future change to
 * the source photography cannot reintroduce the seam silently.
 */

import sharp from 'sharp';
import { strict as assert } from 'node:assert';

const SRC = 'public/media/iriz/product/iriz-product-shot.jpg';
const MARK = 'public/brand/wordmark-ink.png';
const OUT = 'public/media/iriz/product/iriz-og-1200x630.jpg';

const W = 1200;
const H = 630;
const UNIT_WIDTH = 780; // The shot carries its own margins; this fits them.
const MARK_WIDTH = 280;
const UNIT_RIGHT_MARGIN = 36;
const MARK_LEFT_MARGIN = 64;
const MIN_GAP = 20; // Between the wordmark and the photograph.

// The wordmark is the INK version: the card's ground is the photograph's, and
// that is white. wordmark-white.png would be invisible on it.
const unit = await sharp(SRC)
  .resize({ width: UNIT_WIDTH })
  .toColourspace('srgb')
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: uw, height: uh, channels } = unit.info;
const ground = { r: unit.data[0], g: unit.data[1], b: unit.data[2] };

const mark = await sharp(MARK).resize({ width: MARK_WIDTH }).toBuffer({ resolveWithObject: true });

const unitLeft = W - uw - UNIT_RIGHT_MARGIN;
const unitTop = Math.round((H - uh) / 2);
const markLeft = MARK_LEFT_MARGIN;
const markTop = Math.round((H - mark.info.height) / 2);

assert.ok(uh <= H, `the photograph is ${uh}px tall and the card is ${H}px`);
assert.ok(
  markLeft + mark.info.width <= unitLeft - MIN_GAP,
  'the wordmark overlaps the photograph — reduce MARK_WIDTH or UNIT_WIDTH'
);

await sharp({ create: { width: W, height: H, channels: 3, background: ground } })
  .composite([
    { input: unit.data, raw: { width: uw, height: uh, channels }, left: unitLeft, top: unitTop },
    { input: mark.data, left: markLeft, top: markTop },
  ])
  .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
  .toFile(OUT);

// THE SEAM ASSERTION. Read the written file back and compare a pixel just
// outside the pasted photograph with one just inside it, at its vertical
// centre. Equal means the canvas and the photograph's ground agree.
const out = await sharp(OUT).raw().toBuffer({ resolveWithObject: true });
const pixel = (x, y) => {
  const i = (y * out.info.width + x) * out.info.channels;
  return [out.data[i], out.data[i + 1], out.data[i + 2]];
};
const outside = pixel(unitLeft - 6, Math.round(H / 2));
const inside = pixel(unitLeft + 6, Math.round(H / 2));
assert.deepEqual(
  outside,
  inside,
  `seam at the photograph's left edge: canvas ${outside} vs photograph ${inside}. `
    + 'The ground no longer matches — re-read the note at the top of this file.'
);

console.log(
  `${OUT} — ${out.info.width}x${out.info.height}, `
    + `ground rgb(${ground.r},${ground.g},${ground.b}), no seam.`
);

#!/usr/bin/env node
/**
 * Builds public/media/iriz/product/iriz-hero.{webp,jpg} — the homepage hero's
 * product photograph.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS SCRIPT EXISTS AT ALL
 * ---------------------------------------------------------------------------
 * The site's own studio photograph (public/media/iriz/product/iriz-product-shot.jpg)
 * draws the SIDE STAND TOO SHORT — the folding leg is rendered at roughly
 * two-thirds the height the real part has, so the unit sits lower and flatter
 * than it does on a desk. Our Flipkart listing's main photo shows the stand
 * correctly, and it is our own listing photo, so it is the better base.
 *
 * What the Flipkart photo does NOT have is the `IRIZ` wordmark under
 * `bluneuron` on the front panel. The unit that ships has it; that frame was
 * shot before it, or retouched out. So the wordmark is transplanted from our
 * own photograph, which has it, rather than typeset — a typeset one would be
 * the wrong face, the wrong perspective and the wrong specular behaviour, and
 * it would be a claim about the product made in a font rather than a
 * photograph of the product.
 *
 * NEITHER SOURCE IS MODIFIED. iriz-product-shot.jpg is read and left alone;
 * it is still the asset every other surface renders.
 *
 * ---------------------------------------------------------------------------
 * RE-RUNNING IT WHEN THE DESIGNER SENDS THE ORIGINAL
 * ---------------------------------------------------------------------------
 *     node scripts/build-hero-image.mjs
 *     node scripts/build-hero-image.mjs --proof <dir>   # + zoomed checks
 *
 * Everything that could change with a new source file is a named constant in
 * the block below. Point BASE at the new photograph and, if it already
 * carries the wordmark, set PASTE_WORDMARK to false — the rest of the
 * pipeline (background floor, trim, margin, encode) measures what it is
 * given rather than assuming this particular frame.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ *
 * THE INPUTS AND THE NUMBERS. Everything a new source file can move.
 * ------------------------------------------------------------------ */

/** The base frame — our Flipkart listing's main photo, with the correct stand. */
const BASE = path.join(ROOT, 'design-src/product/flipkart-main-1664.jpg');

/** The photograph the wordmark is lifted FROM. Read-only; never written. */
const WORDMARK_SOURCE = path.join(ROOT, 'public/media/iriz/product/iriz-product-shot.jpg');

/** Set false when the base frame already carries `IRIZ` on its front panel. */
const PASTE_WORDMARK = true;

/** The `IRIZ` glyphs on WORDMARK_SOURCE, in its own pixels (1536x1024). */
const CROP = { left: 292, top: 503, width: 78, height: 34 };

/** Where those glyphs land on BASE, in ITS pixels (1664x1093). Same size. */
const PASTE = { left: 200, top: 444 };

/**
 * Softens the transplanted glyphs by half a pixel, so their edges match the
 * base frame's own focus instead of arriving a touch crisper than the
 * `bluneuron` directly above them.
 */
const PASTE_BLUR = 0.5;

/** White margin around the product, as a fraction of the product's width. */
const MARGIN_RATIO = 0.055;

/** Output width. The card never renders wider than ~620 CSS px, so 1400 is 2x+. */
const OUT_WIDTH = 1400;

const QUALITY = 85;

const OUT_DIR = path.join(ROOT, 'public/media/iriz/product');
const OUT_BASE = 'iriz-hero';

/* ------------------------------------------------------------------ *
 * THE ONE PIECE OF REAL IMAGE WORK
 * ------------------------------------------------------------------ */

/**
 * The transplant, and why it is a `lighten` over a LIFTED crop rather than a
 * straight paste.
 *
 * A straight paste puts a 78x34 rectangle of one photograph's black panel on
 * top of another's. The two panels are not the same black — measured, the
 * crop's panel sits at luma ~34 and the base's at ~25 — so the rectangle
 * reads as a faintly lighter patch with four visible edges. That is exactly
 * the "white line or edge" this is checked for.
 *
 * `lighten` takes max(base, overlay) per channel, so a crop whose background
 * is DARKER than the destination contributes nothing outside the glyphs and
 * leaves no rectangle at all. The crop's background is not darker, so it is
 * made so first: a linear lift maps the measured panel level to 0 while
 * leaving the glyph whites at 255. The floor is MEASURED from the crop each
 * run (p90 of its sub-midpoint pixels — the panel and its grain, stopping
 * below the glyph antialiasing ramp) rather than typed in, so a differently
 * exposed source re-derives its own.
 */
async function wordmarkLayer() {
  const crop = sharp(WORDMARK_SOURCE).extract(CROP);

  const { data, info } = await crop.clone().raw().toBuffer({ resolveWithObject: true });
  const panel = [];
  for (let i = 0; i < data.length; i += info.channels) {
    // Red channel alone: the panel and the glyphs are both neutral, and the
    // decision this feeds is a threshold, not a colour.
    if (data[i] < 128) panel.push(data[i]);
  }
  panel.sort((a, b) => a - b);
  const floor = panel.length ? panel[Math.floor((panel.length - 1) * 0.9)] : 0;

  // out = (v - floor) * 255 / (255 - floor), clamped by sharp at both ends.
  const gain = 255 / (255 - floor);

  return {
    floor,
    buffer: await crop
      .linear(gain, -floor * gain)
      .blur(PASTE_BLUR)
      .png()
      .toBuffer(),
  };
}

/**
 * Re-frames the composite so the product sits centred in an even margin.
 *
 * The base frame is cropped hard to the top-left: the lid logo grazes y=0
 * while 100px of empty white sits on the right. In a rounded card that reads
 * as a mistake rather than as a tight crop. So the background is trimmed off
 * and put back evenly.
 *
 * The threshold is 240, not 250: this JPEG's "white" seamless is 254 with
 * grain that dips to ~245, and a 250 threshold calls that grain product and
 * trims nothing.
 */
async function reframe(buffer) {
  const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * ch;
      if (Math.min(data[i], data[i + 1], data[i + 2]) < 240) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error('reframe: the whole frame reads as background');

  // The seamless's own colour, read out of a corner rather than typed as
  // #FFFFFF — the padding has to be the photograph's white, not ours, or the
  // join shows.
  const corner = (data[0] << 16) | (data[1] << 8) | data[2];
  const background = {
    r: (corner >> 16) & 255,
    g: (corner >> 8) & 255,
    b: corner & 255,
  };

  const content = { width: maxX - minX + 1, height: maxY - minY + 1 };
  const margin = Math.round(content.width * MARGIN_RATIO);

  return {
    content,
    background,
    // Where a pixel of the INPUT frame ends up in the output, so the proof
    // crops below can be expressed in the base photograph's coordinates.
    offset: { left: margin - minX, top: margin - minY },
    buffer: await sharp(buffer)
      .extract({ left: minX, top: minY, ...content })
      .extend({ top: margin, bottom: margin, left: margin, right: margin, background })
      .toBuffer(),
  };
}

/* ------------------------------------------------------------------ *
 * RUN
 * ------------------------------------------------------------------ */

async function main() {
  const proofIndex = process.argv.indexOf('--proof');
  const proofDir = proofIndex > -1 ? process.argv[proofIndex + 1] : null;

  for (const file of [BASE, WORDMARK_SOURCE]) {
    if (!fs.existsSync(file)) throw new Error(`missing input: ${path.relative(ROOT, file)}`);
  }

  const base = sharp(BASE);
  const meta = await base.metadata();
  console.log(`base          ${path.relative(ROOT, BASE)} ${meta.width}x${meta.height}`);

  let composed = base;
  if (PASTE_WORDMARK) {
    const { buffer, floor } = await wordmarkLayer();
    console.log(
      `wordmark      ${CROP.width}x${CROP.height} from ${path.relative(ROOT, WORDMARK_SOURCE)}`
        + ` at (${CROP.left},${CROP.top}) -> (${PASTE.left},${PASTE.top})`
        + `, panel floor ${floor}, blur ${PASTE_BLUR}px, blend lighten`
    );
    composed = sharp(
      await base
        .composite([{ input: buffer, left: PASTE.left, top: PASTE.top, blend: 'lighten' }])
        .toBuffer()
    );
  }

  const composite = await composed.toBuffer();
  const { buffer: framed, content, background, offset } = await reframe(composite);
  const framedMeta = await sharp(framed).metadata();
  console.log(
    `reframe       product ${content.width}x${content.height}`
      + ` -> canvas ${framedMeta.width}x${framedMeta.height}`
      + ` on rgb(${background.r},${background.g},${background.b})`
  );

  const scaled = sharp(framed).resize({ width: OUT_WIDTH, withoutEnlargement: true });
  const out = await scaled.clone().png().toBuffer();
  const outMeta = await sharp(out).metadata();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const webp = path.join(OUT_DIR, `${OUT_BASE}.webp`);
  const jpg = path.join(OUT_DIR, `${OUT_BASE}.jpg`);
  await sharp(out).webp({ quality: QUALITY }).toFile(webp);
  // `mozjpeg` for the fallback: it is the one encoder sharp ships that gets a
  // large flat white seamless down without the blocking that shows up against
  // a light card. Chroma subsampling left at the default.
  await sharp(out).jpeg({ quality: QUALITY, mozjpeg: true }).toFile(jpg);

  for (const file of [webp, jpg]) {
    console.log(
      `wrote         ${path.relative(ROOT, file)} ${outMeta.width}x${outMeta.height}`
        + ` ${(fs.statSync(file).size / 1024).toFixed(1)} KB`
    );
  }

  console.log(
    `\nDIMENSIONS FOR THE COMPONENT: width={${outMeta.width}} height={${outMeta.height}}`
  );

  if (proofDir) {
    fs.mkdirSync(proofDir, { recursive: true });
    // The join, at 8x, both before and after — the only way to see whether
    // the transplant left an edge.
    const zoom = {
      left: Math.max(0, PASTE.left - 170),
      top: Math.max(0, PASTE.top - 115),
      width: 420,
      height: 230,
    };
    await sharp(BASE)
      .extract(zoom)
      .resize({ width: zoom.width * 3, kernel: 'nearest' })
      .png()
      .toFile(path.join(proofDir, 'wordmark-before.png'));
    await sharp(composite)
      .extract(zoom)
      .resize({ width: zoom.width * 3, kernel: 'nearest' })
      .png()
      .toFile(path.join(proofDir, 'wordmark-after.png'));
    // And the same join as it survives the final encode, which is what a
    // visitor actually sees.
    const encoded = await sharp(webp).metadata();
    const scale = encoded.width / framedMeta.width;
    await sharp(webp)
      .extract({
        left: Math.round((zoom.left + offset.left) * scale),
        top: Math.round((zoom.top + offset.top) * scale),
        width: Math.round(zoom.width * scale),
        height: Math.round(zoom.height * scale),
      })
      .resize({ width: Math.round(zoom.width * scale) * 3, kernel: 'nearest' })
      .png()
      .toFile(path.join(proofDir, 'wordmark-encoded.png'));
    console.log(`proof         ${proofDir}`);
  }
}

main().catch((error) => {
  console.error(`\nbuild-hero-image: ${error.message}\n`);
  process.exit(1);
});

/**
 * Cut the projector out of its white studio seamless into a transparent PNG.
 *
 * WHY THIS IS SAFE HERE, when lib/iriz.js used to say it was not. The old
 * note read "there's no clean way to chroma-key them — the projector itself
 * is white plastic, so pixel-level cutout leaks straight through the
 * product". That is true of a GLOBAL THRESHOLD, and only of a global
 * threshold. Measured on hero-clean.png: the backdrop is pure #FFFFFF and
 * 59.4% of the frame, with only 0.3% of pixels in the 250-254 band — so the
 * backdrop is flat, and the white parts of the chassis that would be eaten by
 * a threshold are simply NOT CONNECTED to the border.
 *
 * So this is a flood fill from the edges, not a threshold: a pixel is
 * background only if it is near-white AND reachable from the frame edge
 * without crossing the product. The white top panel survives because the
 * dark lens barrel and the shadow stand between it and the edge.
 *
 * THE WHITE HALO is the thing that makes naive cutouts look cheap. Edge
 * pixels are a blend of product and backdrop, so setting their alpha to 0/255
 * leaves white contamination in the RGB that reads as a bright fringe against
 * a dark card. Two passes deal with it:
 *
 *   1. ERODE the mask by `erode` pixels, so the blended rim becomes
 *      transparent rather than being kept with white in it.
 *   2. FEATHER what is left with a small blur, so the edge is anti-aliased
 *      instead of stair-stepped.
 *
 * THE SHADOW SURVIVES because it is grey, not white — it never satisfies the
 * near-white test, so the fill stops at it. That is the natural contact
 * shadow the brief asked to keep.
 *
 * usage: node design-src/cutout.mjs <in> <out.png> [threshold] [erode] [feather] [holeMinPct]
 */
import sharp from 'sharp';
import path from 'node:path';

const [, , input, output, tRaw, eRaw, fRaw] = process.argv;
const THRESHOLD = Number(tRaw || 250); // min channel value to count as backdrop
const ERODE = Number(eRaw || 2);
const FEATHER = Number(fRaw || 0.8);
// Enclosed near-white regions at least this % of the frame are backdrop too.
const HOLE_MIN_PCT = Number(process.argv[7] || 1);
const holes = [];

const src = sharp(input).ensureAlpha();
const { data, info } = await src.raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

const isNearWhite = (i) => data[i] >= THRESHOLD && data[i + 1] >= THRESHOLD && data[i + 2] >= THRESHOLD;

// ---- Flood fill from every border pixel ----------------------------
const bg = new Uint8Array(W * H);
const stack = [];

for (let x = 0; x < W; x++) {
  stack.push(x, 0, x, H - 1);
}
for (let y = 0; y < H; y++) {
  stack.push(0, y, W - 1, y);
}

while (stack.length) {
  const y = stack.pop();
  const x = stack.pop();
  if (x < 0 || y < 0 || x >= W || y >= H) continue;
  const p = y * W + x;
  if (bg[p]) continue;
  if (!isNearWhite(p * C)) continue;
  bg[p] = 1;
  stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
}

/*
 * ---- ENCLOSED BACKDROP, which the border fill cannot reach -------
 *
 * The stand is a U. The seamless shows THROUGH it, but that patch of white
 * is walled in by the chassis above and the stand's own legs and base, so a
 * fill starting at the frame edge never arrives. Left alone it stays opaque
 * and paints a white slab inside the stand on a dark card — measured at
 * 115,108px, 7.5% of the trimmed frame.
 *
 * So: find the remaining near-white connected regions and treat the LARGE
 * ones as backdrop too. The size gate is what keeps this safe — the next
 * largest enclosed region here is 0.21% (a specular highlight on the body),
 * and a 1% floor separates the two by an order of magnitude. A highlight on
 * white plastic is part of the product; a hole you can see the studio
 * through is not.
 */
const holeMin = HOLE_MIN_PCT * 0.01 * W * H;
const seen = new Uint8Array(W * H);

for (let y0 = 0; y0 < H; y0++) {
  for (let x0 = 0; x0 < W; x0++) {
    const start = y0 * W + x0;
    if (seen[start] || bg[start] || !isNearWhite(start * C)) continue;

    const region = [];
    const st = [x0, y0];
    while (st.length) {
      const y = st.pop();
      const x = st.pop();
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const p = y * W + x;
      if (seen[p] || bg[p] || !isNearWhite(p * C)) continue;
      seen[p] = 1;
      region.push(p);
      st.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }

    if (region.length >= holeMin) {
      for (const p of region) bg[p] = 1;
      holes.push(region.length);
    }
  }
}

const bgCount = bg.reduce((n, v) => n + v, 0);

// ---- Erode the kept region, so the blended rim goes with the backdrop
let mask = new Uint8Array(W * H);
for (let i = 0; i < mask.length; i++) mask[i] = bg[i] ? 0 : 255;

for (let pass = 0; pass < ERODE; pass++) {
  const next = new Uint8Array(mask);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (!mask[p]) continue;
      const left = x > 0 && !mask[p - 1];
      const right = x < W - 1 && !mask[p + 1];
      const up = y > 0 && !mask[p - W];
      const down = y < H - 1 && !mask[p + W];
      if (left || right || up || down) next[p] = 0;
    }
  }
  mask = next;
}

// ---- Feather, then apply as alpha ----------------------------------
const alphaRaw = Buffer.from(mask);

/*
 * `.toColourspace('b-w')` IS LOAD-BEARING, not tidiness.
 *
 * `.blur()` on a 1-channel raw buffer PROMOTES IT TO 3 CHANNELS on the way
 * out — sharp returns 7,680,000 bytes for a 1600x1600 mask instead of
 * 2,560,000. Indexing that as if it were single-channel reads one byte in
 * three and walks off the end of each row, which rendered the cutout as a
 * sheared, striped smear. Forcing the colourspace back keeps one byte per
 * pixel, and the assertion below means this can never fail silently again.
 */
const alphaImg = await sharp(alphaRaw, { raw: { width: W, height: H, channels: 1 } })
  .blur(FEATHER)
  .toColourspace('b-w')
  .raw()
  .toBuffer({ resolveWithObject: true });

if (alphaImg.data.length !== W * H) {
  throw new Error(
    `alpha mask is ${alphaImg.data.length} bytes, expected ${W * H} (channels=${alphaImg.info.channels})`
  );
}
const alpha = alphaImg.data;

const out = Buffer.alloc(W * H * 4);
for (let p = 0; p < W * H; p++) {
  out[p * 4] = data[p * C];
  out[p * 4 + 1] = data[p * C + 1];
  out[p * 4 + 2] = data[p * C + 2];
  out[p * 4 + 3] = alpha[p];
}

// ---- Trim the now-transparent margin so the asset is mostly product
//
// Encoded to PNG FIRST, then re-opened to trim. Trimming straight off the
// raw pipeline produced a sheared, striped image: `.trim()` re-reads the
// buffer and the raw metadata does not survive the chain, so the stride was
// being guessed. One extra encode, and it is correct.
const rgbaPng = await sharp(out, { raw: { width: W, height: H, channels: 4 } })
  .png()
  .toBuffer();

const trimmed = await sharp(rgbaPng).trim({ threshold: 1 }).toBuffer();

await sharp(trimmed).png({ compressionLevel: 9, effort: 10 }).toFile(output);

const webp = output.replace(/\.png$/, '.webp');
await sharp(trimmed).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(webp);

const meta = await sharp(output).metadata();
console.log(path.basename(output));
console.log(`  backdrop keyed : ${((bgCount / (W * H)) * 100).toFixed(1)}% of the frame`);
console.log(
  `  enclosed holes : ${holes.length}` +
    (holes.length ? ` (${holes.map((n) => ((n / (W * H)) * 100).toFixed(1) + '%').join(', ')})` : '')
);
console.log(`  erode/feather  : ${ERODE}px / ${FEATHER}`);
console.log(`  trimmed to     : ${meta.width}x${meta.height} (from ${W}x${H})`);
console.log(`  wrote          : ${output} + ${path.basename(webp)}`);

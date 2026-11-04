#!/usr/bin/env node
/**
 * SWAP THE HOMEPAGE HERO PHOTOGRAPH, in one command.
 *
 *     npm run hero:image -- "C:\path\to\the-new-photo.jpg"
 *
 * It builds every file the hero serves, measures them, finds the projector's
 * lens, rewrites the one config block that describes all of that
 * (lib/hero-image.js), and writes a before/after preview PNG for a human to
 * look at. Nothing else in the repository needs editing afterwards.
 *
 * ---------------------------------------------------------------------------
 * WHY IT IS ONE COMMAND AND NOT A CHECKLIST
 * ---------------------------------------------------------------------------
 * Swapping the hero used to be: run a build script whose inputs were hard
 * coded at the top of itself, read the dimensions it printed, type them into
 * lib/iriz.js, measure the lens by eye in an image editor, type that in too,
 * and remember that there were four files and not two. Every one of those
 * steps is a place for the config and the pixels to disagree, and a config
 * that disagrees with the pixels is a hero with the wrong aspect box (CLS) or
 * a glow sitting on the casing instead of the glass.
 *
 * So the script measures what it just wrote and writes down what it measured.
 *
 * ---------------------------------------------------------------------------
 * OPTIONS
 * ---------------------------------------------------------------------------
 *   --add-iriz-wordmark    Transplant the `IRIZ` wordmark onto the front
 *                          panel, lifted from our own studio photograph.
 *                          OFF BY DEFAULT — see the long note on
 *                          wordmarkLayer() for why that default flipped.
 *   --wordmark-at X%,Y%    Where the wordmark's top-left corner goes on the
 *                          new frame. Only read with --add-iriz-wordmark.
 *   --lens X%,Y%           State the lens centre yourself. Always wins over
 *                          detection.
 *   --no-lens              No glow. Also always wins.
 *   --alt "…"              New alt text. Carried forward from the existing
 *                          config when not given.
 *   --preview <file>       Where the before/after PNG goes.
 *                          Default: screenshots/hero-image/preview.png
 *   --dry-run              Measure, detect and write the preview. Touch
 *                          nothing else — no assets, no config.
 *   --yes                  Never prompt. An undetectable lens becomes `null`
 *                          (no glow) instead of a question. This is already
 *                          what happens when stdin is not a terminal, so it
 *                          is only needed to force it in one.
 *
 * ---------------------------------------------------------------------------
 * THE LENS, AND WHY IT IS ALLOWED TO GIVE UP
 * ---------------------------------------------------------------------------
 * The hero paints a soft blue glow over the lens (`.hero-lens` in
 * app/globals.css), positioned from a percentage pair in the config. A glow a
 * few percent off the glass does not read as "approximately right" — it reads
 * as a bug in the page, a blue smudge on the casing. No glow at all reads as
 * a design decision nobody will query.
 *
 * So detection FAILS CLOSED. It looks for one specific thing — the bright
 * chrome bezel ring around a darker core, on the dark front panel — scores
 * it, and only writes a position when the score clears every gate in
 * LENS_GATES below AND beats the best rival elsewhere in the frame by a
 * clear margin. Otherwise it asks, if there is somebody at a terminal to
 * ask, and failing that writes `null` and says so loudly.
 *
 * The preview PNG marks whatever it decided, so the claim is checkable in
 * one look rather than taken on trust.
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_FILE = path.join(ROOT, 'lib/hero-image.js');
const OUT_DIR = path.join(ROOT, 'public/media/iriz/product');
const OUT_STEM = 'iriz-hero';
const DEFAULT_PREVIEW = path.join(ROOT, 'screenshots/hero-image/preview.png');

/* ------------------------------------------------------------------ *
 * THE NUMBERS. Everything a new source photograph can move.
 * ------------------------------------------------------------------ */

/**
 * THE TWO OUTPUT WIDTHS, and why there are two.
 *
 * The card never renders wider than ~560 CSS px, so 1400 covers a 2x display
 * at full desktop size. It is also about four times more pixels than a 390px
 * phone can use, and Lighthouse said so out loud: "properly size images, est.
 * savings 44 KiB" — on the LCP element.
 *
 * 700 is the second candidate, and between them they cover everything the
 * `sizes` attribute in lib/hero-image.js asks for: a phone at 2x wants ~610px
 * and takes the 700; a 1440 desktop at 1x wants ~560px and takes the 700 as
 * well; only a 2x desktop reaches for the 1400.
 *
 * Add a width here and the script writes the files AND the list in the
 * config, so the two cannot disagree.
 */
const OUT_WIDTHS = [1400, 700];

const QUALITY = 85;

/** White margin around the product, as a fraction of the product's width. */
const MARGIN_RATIO = 0.055;

/**
 * The background threshold for the trim.
 *
 * 240, not 250: a studio "white" seamless photographs at ~254 with grain that
 * dips to ~245, and a 250 threshold calls that grain product and trims
 * nothing at all.
 */
const BACKGROUND_CUT = 240;

/** The photograph the wordmark is lifted FROM. Read-only; never written. */
const WORDMARK_SOURCE = path.join(ROOT, 'public/media/iriz/product/iriz-product-shot.jpg');

/** The `IRIZ` glyphs on WORDMARK_SOURCE, in its own pixels (1536x1024). */
const WORDMARK_CROP = { left: 292, top: 503, width: 78, height: 34 };

/**
 * Where those glyphs landed on the frame this was first measured against —
 * our Flipkart listing's main photo, 1664x1093 — as a FRACTION of it, so the
 * same placement can be scaled onto a differently sized source. It is still
 * only a starting point on a frame that is not that one: see the warning
 * printed when it is used.
 */
const WORDMARK_REFERENCE = { width: 1664, height: 1093, left: 200, top: 444 };

/**
 * Softens the transplanted glyphs by half a pixel, so their edges match the
 * base frame's own focus instead of arriving a touch crisper than the
 * `bluneuron` directly above them.
 */
const WORDMARK_BLUR = 0.5;

/**
 * THE GATES A LENS DETECTION HAS TO CLEAR, all of them, or there is no glow.
 *
 * Tuned on the three photographs of this product that exist in the
 * repository (the Flipkart listing frame, the built hero, and our own studio
 * shot). On all three the true bezel scores `votes` >= 0.81 with a contrast
 * of 133-157 and beats its best rival elsewhere in the frame by 3.5x or
 * more, so these thresholds sit well below what a real detection produces
 * and well above what the runners-up — brand lettering, the vent grille, the
 * stand's own highlights — manage.
 */
const LENS_GATES = {
  /** Fraction of the 48 angles where the ring is brighter than BOTH sides. */
  votes: 0.7,
  /** Ring brightness above the brighter of (core, surround), in luma. */
  contrast: 60,
  /** How far ahead of the best candidate elsewhere in the frame it must be. */
  rivalRatio: 2.0,
};

/** The working resolution for detection. Enough detail, cheap to sweep. */
const DETECT_WIDTH = 420;

/* ------------------------------------------------------------------ *
 * ARGUMENTS
 * ------------------------------------------------------------------ */

function parseArgs(argv) {
  const args = {
    source: null,
    wordmark: false,
    wordmarkAt: null,
    lens: undefined, // undefined = detect; null = off; {x,y} = stated
    alt: null,
    preview: DEFAULT_PREVIEW,
    dryRun: false,
    yes: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error(`${arg} needs a value`);
      }
      i += 1;
      return value;
    };

    switch (arg) {
      case '--add-iriz-wordmark':
        args.wordmark = true;
        break;
      case '--wordmark-at':
        args.wordmarkAt = parsePercentPair(next(), '--wordmark-at');
        break;
      case '--lens':
        args.lens = parsePercentPair(next(), '--lens');
        break;
      case '--no-lens':
        args.lens = null;
        break;
      case '--alt':
        args.alt = next();
        break;
      case '--preview':
        args.preview = path.resolve(next());
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--yes':
      case '-y':
        args.yes = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        if (arg.startsWith('--')) throw new Error(`unknown option ${arg}`);
        if (args.source) throw new Error(`two source files given: ${args.source} and ${arg}`);
        args.source = arg;
    }
  }
  return args;
}

/** "34.2%,46.5%" or "34.2,46.5" -> { x: 34.2, y: 46.5 }. */
function parsePercentPair(value, flag) {
  const parts = value.split(',').map((p) => p.trim().replace(/%$/, ''));
  if (parts.length !== 2) throw new Error(`${flag} wants two numbers, like 34.2%,46.5%`);
  const [x, y] = parts.map(Number);
  for (const n of [x, y]) {
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      throw new Error(`${flag} wants two percentages between 0 and 100, like 34.2%,46.5%`);
    }
  }
  return { x, y };
}

const USAGE = `
SWAP THE HOMEPAGE HERO PHOTOGRAPH

  npm run hero:image -- "<path to the new photo>" [options]

  --add-iriz-wordmark    paste the IRIZ wordmark onto the front panel
  --wordmark-at X%,Y%    where to paste it (only with the flag above)
  --lens X%,Y%           state the lens centre instead of detecting it
  --no-lens              no lens glow at all
  --alt "…"              new alt text (kept from the config when omitted)
  --preview <file>       where the before/after PNG goes
  --dry-run              measure and preview, write nothing else
  --yes                  never prompt; an undetected lens becomes no glow

WHERE THE CONFIG IS
  lib/hero-image.js — look for "WHERE TO CHANGE THE HERO IMAGE".
`;

/* ------------------------------------------------------------------ *
 * THE WORDMARK TRANSPLANT
 * ------------------------------------------------------------------ */

/**
 * The transplant, and why it is a `lighten` over a LIFTED crop rather than a
 * straight paste.
 *
 * A straight paste puts a rectangle of one photograph's black panel on top of
 * another's. The two panels are not the same black — measured, the crop's
 * panel sits at luma ~34 and the original base's at ~25 — so the rectangle
 * reads as a faintly lighter patch with four visible edges.
 *
 * `lighten` takes max(base, overlay) per channel, so a crop whose background
 * is DARKER than the destination contributes nothing outside the glyphs and
 * leaves no rectangle at all. The crop's background is not darker, so it is
 * made so first: a linear lift maps the measured panel level to 0 while
 * leaving the glyph whites at 255. The floor is MEASURED from the crop each
 * run (p90 of its sub-midpoint pixels — the panel and its grain, stopping
 * below the glyph antialiasing ramp) rather than typed in, so a differently
 * exposed source re-derives its own.
 *
 * ---------------------------------------------------------------------------
 * WHY THE DEFAULT IS NOW OFF
 * ---------------------------------------------------------------------------
 * This existed because the one frame with the stand drawn correctly — our
 * Flipkart listing's main photo — was shot before the `IRIZ` wordmark was
 * printed on the front panel, or had it retouched out. The unit that ships
 * has it. A typeset one would be the wrong face, the wrong perspective and
 * the wrong specular behaviour, and it would be a claim about the product
 * made in a font rather than a photograph of the product. So it is lifted
 * from a photograph of the real thing.
 *
 * That is a fix for ONE FRAME. Any new photograph of a shipping unit already
 * carries the wordmark, and pasting a second one onto it is a visible
 * defect. Hence the flag, and hence off.
 */
async function wordmarkLayer(scale) {
  const crop = sharp(WORDMARK_SOURCE).extract(WORDMARK_CROP);

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

  const width = Math.max(1, Math.round(WORDMARK_CROP.width * scale));
  const height = Math.max(1, Math.round(WORDMARK_CROP.height * scale));

  // NO RESIZE AT 1:1. sharp's resize is a resample even when the target size
  // equals the source, and lanczos3 over 78x34 of fine glyph antialiasing
  // moves pixels by up to ~25 levels — enough to change the encoded file for
  // no reason, which makes "did the hero actually change?" unanswerable from
  // a diff. Scaling only happens when the frame is genuinely a different
  // size from the one the crop was measured against.
  let pipeline = crop.linear(gain, -floor * gain);
  if (width !== WORDMARK_CROP.width || height !== WORDMARK_CROP.height) {
    pipeline = pipeline.resize({ width, height });
  }

  return {
    floor,
    width,
    height,
    buffer: await pipeline.blur(WORDMARK_BLUR).png().toBuffer(),
  };
}

/* ------------------------------------------------------------------ *
 * RE-FRAMING
 * ------------------------------------------------------------------ */

/**
 * Re-frames the photograph so the product sits centred in an even margin.
 *
 * Product photography arrives cropped to whatever the photographer framed,
 * which is routinely tight on one edge and loose on another — the frame this
 * was written for has the lid logo grazing y=0 and 100px of empty white on
 * the right. Inside a rounded card that reads as a mistake rather than as a
 * tight crop. So the background is trimmed off and put back evenly.
 *
 * It MEASURES the frame it is given rather than assuming any particular one,
 * which is what lets a new photograph through this unchanged.
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
      if (Math.min(data[i], data[i + 1], data[i + 2]) < BACKGROUND_CUT) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    throw new Error(
      'the whole frame reads as background — is this a photograph of the product '
        + 'on a light seamless? Nothing was written.'
    );
  }

  // The seamless's own colour, read out of a corner rather than typed as
  // #FFFFFF — the padding has to be the photograph's white, not ours, or the
  // join shows.
  const corner = { r: data[0], g: data[1], b: data[2] };

  const content = { width: maxX - minX + 1, height: maxY - minY + 1 };
  const margin = Math.round(content.width * MARGIN_RATIO);

  return {
    content,
    background: corner,
    // Where a pixel of the INPUT frame ends up in the output, so a crop can
    // be expressed in the source photograph's coordinates.
    offset: { left: margin - minX, top: margin - minY },
    buffer: await sharp(buffer)
      .extract({ left: minX, top: minY, ...content })
      .extend({ top: margin, bottom: margin, left: margin, right: margin, background: corner })
      .toBuffer(),
  };
}

/* ------------------------------------------------------------------ *
 * LENS DETECTION
 * ------------------------------------------------------------------ */

/**
 * Finds the projector's lens: a BRIGHT RING around a DARKER CORE, sitting on
 * a DARK surround.
 *
 * That three-part signature is the whole method, and it is chosen because it
 * is what the part actually looks like — a chrome bezel on a black front
 * panel — rather than because it is easy to compute. The naive alternatives
 * both fail on this product: "the darkest blob" finds the entire front
 * panel, which is as dark as the glass and a hundred times larger; "the
 * brightest spot" finds the white casing.
 *
 * For every centre on a coarse grid and every plausible radius, 48 angles
 * are sampled on the ring and again at 1.5x the radius. A ring sample VOTES
 * when it is clearly brighter than both the core's median and the surround
 * at its own angle. Requiring agreement around the whole circle is what
 * rejects a bright edge or a specular streak: those win at a few angles and
 * lose at the rest.
 *
 * Returns the best candidate with its score, plus the best candidate CENTRED
 * ELSEWHERE — more than 1.5 radii away — because "did it win" matters less
 * than "did it win by a distance".
 */
async function detectLens(buffer) {
  const { data, info } = await sharp(buffer)
    .greyscale()
    .resize({ width: DETECT_WIDTH })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const at = (x, y) => data[Math.round(y) * w + Math.round(x)];

  // The product's own bounds, so the sweep does not spend its time in the
  // seamless. Background is read from the corners, as in reframe().
  const corners = [at(1, 1), at(w - 2, 1), at(1, h - 2), at(w - 2, h - 2)].sort((a, b) => a - b);
  const background = (corners[1] + corners[2]) / 2;
  const cut = background - 12;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (data[y * w + x] < cut) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const productWidth = maxX - minX + 1;

  const ANGLES = 48;
  const cos = [];
  const sin = [];
  for (let i = 0; i < ANGLES; i += 1) {
    const a = (i * 2 * Math.PI) / ANGLES;
    cos.push(Math.cos(a));
    sin.push(Math.sin(a));
  }

  // The lens on this product measures ~19% of the frame across the bezel, so
  // a radius band of 3.5%-20% of the PRODUCT's width is generous either way
  // without admitting candidates the size of the whole casing.
  const rMin = Math.max(5, Math.round(0.035 * productWidth));
  const rMax = Math.round(0.2 * productWidth);
  const stride = Math.max(2, Math.round(0.01 * productWidth));
  const rStep = Math.max(1, Math.round(rMin * 0.25));

  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };

  function score(cx, cy, r) {
    // 1.6r of headroom, so the surround ring is never sampled off-canvas —
    // a clamped sample would read as the frame edge and score as contrast.
    if (cx - 1.6 * r < 0 || cy - 1.6 * r < 0 || cx + 1.6 * r >= w || cy + 1.6 * r >= h) return null;

    const ring = [];
    const surround = [];
    for (let i = 0; i < ANGLES; i += 1) {
      ring.push(at(cx + r * cos[i], cy + r * sin[i]));
      surround.push(at(cx + 1.5 * r * cos[i], cy + 1.5 * r * sin[i]));
    }

    const coreR = Math.max(1, Math.round(0.5 * r));
    const core = [];
    for (let dy = -coreR; dy <= coreR; dy += 1) {
      for (let dx = -coreR; dx <= coreR; dx += 1) {
        if (dx * dx + dy * dy <= coreR * coreR) core.push(at(cx + dx, cy + dy));
      }
    }

    const coreMedian = median(core);
    const surroundMedian = median(surround);
    const ringMedian = median(ring);

    let votes = 0;
    for (let i = 0; i < ANGLES; i += 1) {
      if (ring[i] > coreMedian + 35 && ring[i] > surround[i] + 35) votes += 1;
    }

    const contrast = ringMedian - Math.max(coreMedian, surroundMedian);
    return {
      cx,
      cy,
      r,
      votes: votes / ANGLES,
      contrast,
      score: (votes / ANGLES) * Math.max(0, contrast),
    };
  }

  let best = null;
  const candidates = [];
  for (let cy = minY; cy <= maxY; cy += stride) {
    for (let cx = minX; cx <= maxX; cx += stride) {
      for (let r = rMin; r <= rMax; r += rStep) {
        const candidate = score(cx, cy, r);
        if (!candidate) continue;
        candidates.push(candidate);
        if (!best || candidate.score > best.score) best = candidate;
      }
    }
  }
  if (!best) return null;

  // One pixel-level pass around the winner, because the sweep's stride is
  // ~1% of the product and the glow is placed to a tenth of a percent.
  for (let dy = -stride; dy <= stride; dy += 1) {
    for (let dx = -stride; dx <= stride; dx += 1) {
      for (let r = Math.max(3, best.r - 3); r <= best.r + 3; r += 1) {
        const candidate = score(best.cx + dx, best.cy + dy, r);
        if (candidate && candidate.score > best.score) best = candidate;
      }
    }
  }

  let rival = null;
  for (const candidate of candidates) {
    const distance = Math.hypot(candidate.cx - best.cx, candidate.cy - best.cy);
    if (distance > 1.5 * best.r && (!rival || candidate.score > rival.score)) rival = candidate;
  }

  const rivalRatio = rival ? best.score / Math.max(1, rival.score) : Infinity;
  const confident =
    best.votes >= LENS_GATES.votes
    && best.contrast >= LENS_GATES.contrast
    && rivalRatio >= LENS_GATES.rivalRatio;

  // Why each gate did or did not pass, so a refusal is explainable rather
  // than just disappointing.
  const reasons = [];
  if (best.votes < LENS_GATES.votes) {
    reasons.push(`ring agreement ${best.votes.toFixed(2)} < ${LENS_GATES.votes}`);
  }
  if (best.contrast < LENS_GATES.contrast) {
    reasons.push(`ring contrast ${best.contrast} < ${LENS_GATES.contrast}`);
  }
  if (rivalRatio < LENS_GATES.rivalRatio) {
    reasons.push(`only ${rivalRatio.toFixed(2)}x ahead of the next candidate (want ${LENS_GATES.rivalRatio}x)`);
  }

  return {
    confident,
    reasons,
    rivalRatio,
    votes: best.votes,
    contrast: best.contrast,
    radiusPct: (best.r / w) * 100,
    position: { x: (best.cx / w) * 100, y: (best.cy / h) * 100 },
  };
}

/* ------------------------------------------------------------------ *
 * THE PREVIEW
 * ------------------------------------------------------------------ */

const PANEL_WIDTH = 760;
const GUTTER = 28;
const LABEL_BAND = 46;

/**
 * BEFORE on the left, AFTER on the right, on one PNG, with the lens marked.
 *
 * The point is not decoration. Three things go wrong in a hero swap and all
 * three are invisible in a terminal: the trim eats part of the product, the
 * new frame has a different aspect so the card changes shape, and the glow
 * lands somewhere that is not the glass. Side by side at the same width,
 * with a ring drawn where the config will put the light, all three are one
 * glance.
 *
 * The BEFORE panel is the hero currently on disk — read into memory before
 * anything is overwritten, which is the only reason the ordering in main()
 * matters.
 */
async function writePreview({ file, beforeBuffer, afterBuffer, lens, lensRadiusPct, note }) {
  const panels = [];

  for (const [label, buffer] of [
    ['BEFORE — the hero on the site now', beforeBuffer],
    ['AFTER — what this run built', afterBuffer],
  ]) {
    if (!buffer) {
      panels.push({ label, image: null, width: PANEL_WIDTH, height: 0 });
      continue;
    }
    const resized = await sharp(buffer)
      .resize({ width: PANEL_WIDTH, withoutEnlargement: false })
      .flatten({ background: '#ffffff' })
      .toBuffer();
    const meta = await sharp(resized).metadata();
    panels.push({ label, image: resized, width: meta.width, height: meta.height });
  }

  const bodyHeight = Math.max(...panels.map((p) => p.height), 1);
  const width = PANEL_WIDTH * 2 + GUTTER * 3;
  const height = LABEL_BAND + bodyHeight + GUTTER + (note ? LABEL_BAND : 0);

  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const composites = [];
  panels.forEach((panel, i) => {
    if (!panel.image) return;
    composites.push({
      input: panel.image,
      left: GUTTER + i * (PANEL_WIDTH + GUTTER),
      top: LABEL_BAND,
    });
  });

  // The labels, the lens ring and the note are one SVG laid over the whole
  // canvas, so their coordinates are canvas coordinates and nothing has to be
  // translated twice.
  const afterPanel = panels[1];
  const afterLeft = GUTTER + PANEL_WIDTH + GUTTER;
  let lensSvg = '';
  if (lens && afterPanel.image) {
    const cx = afterLeft + (lens.x / 100) * afterPanel.width;
    const cy = LABEL_BAND + (lens.y / 100) * afterPanel.height;
    const r = Math.max(10, ((lensRadiusPct ?? 8) / 100) * afterPanel.width);
    lensSvg = `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#00b3ff" stroke-width="3"/>
      <line x1="${cx - 18}" y1="${cy}" x2="${cx + 18}" y2="${cy}" stroke="#00b3ff" stroke-width="3"/>
      <line x1="${cx}" y1="${cy - 18}" x2="${cx}" y2="${cy + 18}" stroke="#00b3ff" stroke-width="3"/>
      <text x="${cx}" y="${cy + r + 26}" text-anchor="middle"
            font-family="Segoe UI, Arial, sans-serif" font-size="19" font-weight="600"
            fill="#00b3ff">lens ${lens.x.toFixed(1)}%, ${lens.y.toFixed(1)}%</text>`;
  }

  // NO BACKGROUND RECT IN HERE. This SVG is composited ON TOP of the two
  // photographs, so a full-canvas `<rect>` — even the same colour as the
  // ground — paints them out completely and leaves a preview of two labels
  // on an empty field. The ground comes from the `create` below instead.
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${panels
      .map(
        (panel, i) => `<text x="${GUTTER + i * (PANEL_WIDTH + GUTTER)}" y="30"
          font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="600"
          fill="#18181b">${escape(panel.label)}</text>`
      )
      .join('\n')}
    ${lensSvg}
    ${
      note
        ? `<text x="${GUTTER}" y="${LABEL_BAND + bodyHeight + GUTTER + 24}"
             font-family="Segoe UI, Arial, sans-serif" font-size="20"
             fill="#3f3f46">${escape(note)}</text>`
        : ''
    }
  </svg>`;

  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp({
    create: { width, height, channels: 3, background: '#f4f4f5' },
  })
    .composite([...composites, { input: Buffer.from(svg), left: 0, top: 0 }])
    .png()
    .toFile(file);

  return file;
}

/* ------------------------------------------------------------------ *
 * THE CONFIG REWRITE
 * ------------------------------------------------------------------ */

const BEGIN = '/* --------------------------------------------------------------------- *\n'
  + ' * BEGIN GENERATED';
const END_MARK = ' * END GENERATED';

/** The current `alt`, so a run that does not pass --alt does not lose it. */
function currentAlt(source) {
  const match = source.match(/\n\s*alt:\s*'((?:[^'\\]|\\.)*)'/);
  return match ? match[1].replace(/\\'/g, "'") : null;
}

function jsString(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/**
 * Rewrites ONLY the region between the two markers in lib/hero-image.js.
 *
 * A marked region rather than a whole generated file, because the file also
 * holds things the script has no business deciding: `sizes`, which describes
 * the page layout, and the prose explaining why the hero is a <picture> at
 * all. Those stay hand-written and survive every run.
 */
function renderGeneratedBlock({ source, files, width, height, lens, alt, wordmark }) {
  const fileEntries = files
    .map(
      (file) => `    {
      width: ${file.width},
      webp: ${jsString(file.webp)},
      jpg: ${jsString(file.jpg)},
    },`
    )
    .join('\n');

  const lensValue = lens
    ? `{ x: '${lens.x.toFixed(1)}%', y: '${lens.y.toFixed(1)}%' }`
    : 'null';

  return `export const HERO_IMAGE_BUILD = {
  /** The photograph this was built from, relative to the repo root. */
  source: ${jsString(source)},
  /** When, so a stale asset can be told apart from a stale config. */
  builtAt: ${jsString(new Date().toISOString().slice(0, 10))},
  /** Was the \`IRIZ\` wordmark transplanted on? ('pasted' | 'none') */
  wordmark: ${jsString(wordmark)},
  /**
   * THE FILES ON DISK, widest first, written as LITERAL PATHS.
   *
   * Literal, not built from a stem and a width, and that is deliberate:
   * scripts/check-media.js finds asset paths with a regex over the source and
   * cannot follow a path assembled at runtime, so a template here would
   * quietly drop the hero out of the "every /media/ path exists" check. The
   * script writes these strings and the files they name in the same run, so
   * there is nothing for them to drift against.
   *
   * The widest keeps the bare name, so the <img>'s own \`src\` — the candidate
   * a browser with no \`srcset\` support falls back to — is a stable path that
   * does not move when another width is added.
   */
  files: [
${fileEntries}
  ],
  /**
   * The real pixel size of the WIDEST file, passed to the <img> so the
   * browser reserves the right box before any bytes arrive. It is the
   * intrinsic RATIO as far as \`srcset\` is concerned, so every narrower
   * candidate reserves exactly the same box — which is what holds CLS at
   * zero whichever one the browser picks.
   */
  width: ${width},
  height: ${height},
  /**
   * Where the projector's lens centre sits IN THIS FRAME, as a percentage of
   * the image box, so the glow in the hero can be placed without anyone
   * measuring the photograph again.
   *
   * \`null\` MEANS NO GLOW, and that is a supported state, not a failure. A
   * glow 8% off the glass looks like a bug in the page; no glow looks like a
   * design choice. So when \`npm run hero:image\` cannot find the lens with
   * confidence and nobody tells it where the lens is, it writes null here
   * and components/Hero.jsx renders no glow element at all.
   */
  lens: ${lensValue},
  /**
   * NOT the same alt text as PRODUCT_SHOT, deliberately. The hero's <h1>
   * already announces "IRIZ mini projector for home" immediately before this
   * image, so repeating the product name here would have a screen reader say
   * it twice in a row. This describes what the PICTURE shows that the
   * heading does not.
   */
  alt: ${jsString(alt)},
};`;
}

function rewriteConfig(facts) {
  const text = fs.readFileSync(CONFIG_FILE, 'utf8');

  const beginAt = text.indexOf(BEGIN);
  const endAt = text.indexOf(END_MARK, beginAt);
  if (beginAt === -1 || endAt === -1) {
    throw new Error(
      `could not find the BEGIN/END GENERATED markers in ${path.relative(ROOT, CONFIG_FILE)}. `
        + 'Nothing was written to it — restore the markers and run again.'
    );
  }

  // Keep the two marker comments themselves; replace what is between them.
  const beginEnds = text.indexOf('*/', beginAt) + 2;
  const endStarts = text.lastIndexOf('/* -', endAt);

  const alt = facts.alt ?? currentAlt(text);
  const block = renderGeneratedBlock({ ...facts, alt });

  const next = `${text.slice(0, beginEnds)}\n${block}\n${text.slice(endStarts)}`;
  fs.writeFileSync(CONFIG_FILE, next);
  return alt;
}

/* ------------------------------------------------------------------ *
 * RUN
 * ------------------------------------------------------------------ */

async function askLens(preview) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log(`\n  Open the preview and read the lens centre off it:\n    ${preview}`);
    const answer = (
      await rl.question('  Lens centre as X%,Y%  (press Enter for NO GLOW): ')
    ).trim();
    if (!answer) return null;
    return parsePercentPair(answer, 'the lens position');
  } finally {
    rl.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.source) {
    console.log(USAGE);
    process.exit(args.source || args.help ? 0 : 1);
  }

  const sourcePath = path.resolve(args.source);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`no such file: ${args.source}`);
  }
  if (!fs.statSync(sourcePath).isFile()) {
    throw new Error(`not a file: ${args.source}`);
  }

  const base = sharp(sourcePath);
  let meta;
  try {
    meta = await base.metadata();
  } catch {
    throw new Error(`sharp cannot read ${args.source} as an image`);
  }
  console.log(`source        ${args.source}  ${meta.width}x${meta.height} ${meta.format}`);

  const widest = Math.max(...OUT_WIDTHS);
  if (meta.width < widest) {
    console.log(
      `\n  NOTE: this photo is ${meta.width}px wide and the hero's widest output is ${widest}px.\n`
        + '        It will NOT be enlarged — the built files will be narrower than usual,\n'
        + '        and the config records what was actually written.\n'
    );
  }

  /*
   * THE OLD HERO, READ FIRST. Everything below may overwrite those files, and
   * the preview's BEFORE panel is the only record of what was there. Read
   * before write is the entire reason this is up here and not next to the
   * preview call.
   */
  const previousWebp = path.join(OUT_DIR, `${OUT_STEM}.webp`);
  const beforeBuffer = fs.existsSync(previousWebp) ? fs.readFileSync(previousWebp) : null;
  if (!beforeBuffer) console.log('before        (no existing hero on disk — first run)');

  /*
   * --- 1. The optional wordmark transplant. ---
   *
   * THE SOURCE'S OWN BYTES, not `await base.toBuffer()`. sharp's toBuffer()
   * with no format set re-encodes to the INPUT's format, so calling it on a
   * JPEG decodes and re-compresses the whole frame before anything has been
   * done to it — a generation of loss spent on nothing. Handing the file's
   * bytes straight to the next stage costs one decode and no encode, and
   * when --add-iriz-wordmark is off (the default) the original pixels reach
   * the resize untouched.
   */
  let composite = fs.readFileSync(sourcePath);
  let wordmark = 'none';
  if (args.wordmark) {
    const scale = meta.width / WORDMARK_REFERENCE.width;
    const layer = await wordmarkLayer(scale);
    const left = args.wordmarkAt
      ? Math.round((args.wordmarkAt.x / 100) * meta.width)
      : Math.round((WORDMARK_REFERENCE.left / WORDMARK_REFERENCE.width) * meta.width);
    const top = args.wordmarkAt
      ? Math.round((args.wordmarkAt.y / 100) * meta.height)
      : Math.round((WORDMARK_REFERENCE.top / WORDMARK_REFERENCE.height) * meta.height);

    if (!args.wordmarkAt && meta.width !== WORDMARK_REFERENCE.width) {
      console.log(
        `\n  WARNING: --add-iriz-wordmark is placing the glyphs by SCALING the position\n`
          + `           measured on a ${WORDMARK_REFERENCE.width}x${WORDMARK_REFERENCE.height} frame onto this `
          + `${meta.width}x${meta.height} one.\n`
          + '           That is a guess about where the front panel is. CHECK THE PREVIEW,\n'
          + '           and pass --wordmark-at X%,Y% if it has landed in the wrong place.\n'
      );
    }

    // `.png()` — a LOSSLESS intermediate. `.toBuffer()` on its own would
    // re-encode to the source's own format, which for a JPEG means the whole
    // frame is quantised again on its way to a resize that is about to
    // quantise it once more. The script this replaced did exactly that, and
    // twice; the pixels that reach the encoder here have been through one
    // lossy generation (the photographer's) rather than three.
    composite = await sharp(composite)
      .composite([{ input: layer.buffer, left, top, blend: 'lighten' }])
      .png()
      .toBuffer();
    wordmark = 'pasted';
    console.log(
      `wordmark      ${layer.width}x${layer.height} from ${path.relative(ROOT, WORDMARK_SOURCE)}`
        + ` -> (${left},${top}), panel floor ${layer.floor}, blend lighten`
    );
  }

  /* --- 2. Trim and re-centre. --- */
  const { buffer: framed, content, background } = await reframe(composite);
  const framedMeta = await sharp(framed).metadata();
  console.log(
    `reframe       product ${content.width}x${content.height}`
      + ` -> canvas ${framedMeta.width}x${framedMeta.height}`
      + ` on rgb(${background.r},${background.g},${background.b})`
  );

  /* --- 3. The lens. --- */
  let lens = args.lens === undefined ? undefined : args.lens;
  let lensRadiusPct = null;
  let lensNote = '';
  /*
   * A detection that was REJECTED but is still worth drawing. The preview
   * marks it so a human can see what the script nearly chose and read the
   * real position off the same picture — but it is never written to the
   * config, which is what "fails closed" means here.
   */
  let rejectedGuess = null;
  /** Did detection run and decline? Only then is there anything to ask about. */
  let mayAsk = false;

  if (lens === undefined) {
    const found = await detectLens(framed);
    if (found && found.confident) {
      lens = found.position;
      lensRadiusPct = found.radiusPct;
      console.log(
        `lens          FOUND at ${found.position.x.toFixed(1)}%, ${found.position.y.toFixed(1)}%`
          + ` — ring agreement ${found.votes.toFixed(2)}, contrast ${found.contrast},`
          + ` ${Number.isFinite(found.rivalRatio) ? `${found.rivalRatio.toFixed(1)}x` : 'no'} ahead of the next candidate`
      );
      lensNote = 'Lens found automatically. If the ring is not on the glass, re-run with --lens X%,Y%.';
    } else {
      const why = found ? found.reasons.join('; ') : 'no candidate at all';
      console.log(`lens          NOT FOUND — ${why}`);
      if (found) {
        lensRadiusPct = found.radiusPct;
        rejectedGuess = found.position;
        console.log(
          `              best guess was ${found.position.x.toFixed(1)}%, ${found.position.y.toFixed(1)}%`
            + ' — shown on the preview, NOT written to the config.'
        );
      }
      lens = null;
      mayAsk = true;
      lensNote = found
        ? 'Lens NOT confirmed — the ring above is the rejected guess. The glow is OFF.'
        : 'No lens found. The glow is OFF.';
    }
  } else if (lens === null) {
    console.log('lens          OFF (--no-lens)');
    lensNote = 'Lens glow switched off by --no-lens.';
  } else {
    console.log(`lens          STATED as ${lens.x}%, ${lens.y}% (--lens)`);
    lensNote = 'Lens position given on the command line.';
  }

  /* --- 4. Encode. --- */
  const builtFiles = [];
  const encoded = [];
  for (const width of [...OUT_WIDTHS].sort((a, b) => b - a)) {
    const stem = width === widest ? OUT_STEM : `${OUT_STEM}-${width}`;
    const resized = await sharp(framed)
      .resize({ width, withoutEnlargement: true })
      .png()
      .toBuffer();
    const resizedMeta = await sharp(resized).metadata();

    const webpBuffer = await sharp(resized).webp({ quality: QUALITY }).toBuffer();
    // `mozjpeg` for the fallback: it is the one encoder sharp ships that gets
    // a large flat white seamless down without the blocking that shows up
    // against a light card. Chroma subsampling left at the default.
    const jpgBuffer = await sharp(resized).jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();

    encoded.push({
      width: resizedMeta.width,
      height: resizedMeta.height,
      isWidest: width === widest,
      webpPath: path.join(OUT_DIR, `${stem}.webp`),
      jpgPath: path.join(OUT_DIR, `${stem}.jpg`),
      webpBuffer,
      jpgBuffer,
    });

    builtFiles.push({
      width: resizedMeta.width,
      webp: `/media/iriz/product/${stem}.webp`,
      jpg: `/media/iriz/product/${stem}.jpg`,
    });
  }

  const widestFile = encoded.find((f) => f.isWidest);

  /* --- 5. The preview, before anything is committed to disk. --- */
  const preview = await writePreview({
    file: args.preview,
    beforeBuffer,
    afterBuffer: widestFile.webpBuffer,
    lens: lens ?? rejectedGuess,
    lensRadiusPct,
    note: lensNote,
  });
  console.log(`preview       ${path.relative(ROOT, preview)}`);

  /* --- 6. Ask about the lens, now that there is something to look at. --- */
  if (mayAsk && !args.yes && process.stdin.isTTY) {
    lens = await askLens(preview);
    if (lens) {
      console.log(`lens          SET to ${lens.x}%, ${lens.y}% by hand`);
    } else {
      console.log('lens          OFF — nothing given, so no glow is written.');
    }
  }

  if (args.dryRun) {
    console.log('\nDRY RUN — no files and no config were written.');
    summary({ widest: widestFile, lens, preview });
    return;
  }

  /* --- 7. Write the assets. --- */
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const file of encoded) {
    fs.writeFileSync(file.webpPath, file.webpBuffer);
    fs.writeFileSync(file.jpgPath, file.jpgBuffer);
    for (const p of [file.webpPath, file.jpgPath]) {
      console.log(
        `wrote         ${path.relative(ROOT, p)} ${file.width}x${file.height}`
          + ` ${(fs.statSync(p).size / 1024).toFixed(1)} KB`
      );
    }
  }

  /* --- 8. Write the config. --- */
  const alt = rewriteConfig({
    source: path.relative(ROOT, sourcePath).split(path.sep).join('/'),
    files: builtFiles,
    width: widestFile.width,
    height: widestFile.height,
    lens,
    alt: args.alt,
    wordmark,
  });
  console.log(`wrote         ${path.relative(ROOT, CONFIG_FILE)} (generated block)`);

  summary({ widest: widestFile, lens, preview, alt });
}

function summary({ widest, lens, preview, alt }) {
  console.log(`
DONE.
  box           width={${widest.width}} height={${widest.height}}
  lens          ${lens ? `${lens.x.toFixed(1)}%, ${lens.y.toFixed(1)}%` : 'none — the glow is OFF'}${
    alt ? `\n  alt           ${alt}` : ''
  }

NEXT
  1. Look at the preview:  ${path.relative(ROOT, preview)}
  2. npm run check:media && npm run validate:seo
  3. npm run dev   — and look at the real page.
`);
}

main().catch((error) => {
  console.error(`\nhero:image — ${error.message}\n`);
  process.exit(1);
});

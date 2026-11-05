/**
 * A short screen recording of the hero animating.
 *
 *   node scripts/hero-record.mjs <url> [outDir] [seconds]
 *
 * Playwright's own video capture, so there is nothing to install and no
 * screen-capture permission involved — the frames come out of the browser.
 * The output is .webm, which is what Chromium records.
 *
 * WHAT THE TAKE IS CHOREOGRAPHED TO SHOW, in order: the chips popping in one
 * by one, the network fading up and drifting, signals arriving at the lens,
 * and then the cursor sweeping the hero so the node glow and the card's 3D
 * tilt are both visible. The pointer path is scripted rather than left to a
 * single move, because a tilt that only ever goes one way looks like a
 * rendering bug rather than like tracking.
 *
 * It waits for `.hero-network.is-live` before it starts counting, so the take
 * always contains the network rather than however much of it happened to fit
 * in a fixed timeout.
 *
 * Local tooling, like scripts/shot.mjs. Nothing in the app or any host loads
 * it.
 */
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const [url, outDir = 'screenshots/hero-neuron', secondsArg] = process.argv.slice(2);
if (!url) {
  console.error('usage: node scripts/hero-record.mjs <url> [outDir] [seconds]');
  process.exit(2);
}
const SECONDS = Number(secondsArg || 6);
const WIDTH = 1440;
const HEIGHT = 820;

mkdirSync(outDir, { recursive: true });
const raw = join(outDir, '_video');
rmSync(raw, { recursive: true, force: true });
mkdirSync(raw, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  // DPR 1 for the take: the recorder encodes every frame, and a 2x buffer
  // costs frame rate on a laptop — which is the one thing a recording of an
  // animation cannot afford to lose.
  deviceScaleFactor: 1,
  recordVideo: { dir: raw, size: { width: WIDTH, height: HEIGHT } },
  // A real pointer, so `(hover: hover) and (pointer: fine)` matches and the
  // tilt and node glow are actually armed.
  hasTouch: false,
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

/* The take. Roughly: a beat to let the chips land and the field come up,
   then a slow sweep across the hero and back, then a beat at rest. */
const steps = Math.round((SECONDS * 1000 - 1400) / 60);
await page.waitForTimeout(1400);

const path = [
  [1180, 300], [1000, 420], [760, 520], [430, 600],
  [300, 380], [620, 260], [980, 340], [1230, 470],
];
let from = [1300, 220];
await page.mouse.move(from[0], from[1]);
for (const to of path) {
  const legs = Math.max(1, Math.round(steps / path.length));
  for (let i = 1; i <= legs; i += 1) {
    const t = i / legs;
    await page.mouse.move(
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
    );
    await page.waitForTimeout(60);
  }
  from = to;
}
await page.waitForTimeout(500);

await ctx.close();
await browser.close();

const file = readdirSync(raw).find((f) => f.endsWith('.webm'));
const dest = join(outDir, 'hero-animating.webm');
rmSync(dest, { force: true });
renameSync(join(raw, file), dest);
rmSync(raw, { recursive: true, force: true });
console.log(`wrote ${dest}  (~${SECONDS}s, ${WIDTH}x${HEIGHT})`);

/** Viewport-sized slices of one route, for visual review at readable scale. */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const [, , route = '/', wArg = '1440', outDir = 'screenshots/ui-before/folds', maxFolds = '8'] = process.argv;
const W = Number(wArg), H = W < 500 ? 844 : 900;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, reducedMotion: 'reduce', isMobile: W < 500, hasTouch: W < 500 });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:4311' + route, { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.8);
  for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
  window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 200));
});
const slug = route === '/' ? 'home' : route.replace(/\//g, '-').replace(/^-/, '');
const dir = path.join(outDir, `${slug}-${W}`);
await mkdir(dir, { recursive: true });
const total = await page.evaluate(() => document.documentElement.scrollHeight);
const n = Math.min(Number(maxFolds), Math.ceil(total / H));
const stride = Math.floor(total / n);
for (let i = 0; i < n; i++) {
  const y = i * stride;
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(dir, `fold-${String(i).padStart(2, '0')}-y${y}.png`) });
}
console.log(`${dir}: ${n} folds of ${total}px`);
await browser.close();

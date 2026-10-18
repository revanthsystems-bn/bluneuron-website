import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const b = await chromium.launch();
await mkdir('screenshots/ui-after/buy-flow', { recursive: true });
for (const [name, w, h, mobile] of [['mobile-sheet', 390, 844, true], ['desktop-dialog', 1440, 900, false]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:4311/', { waitUntil: 'networkidle' });
  // The masthead Buy is `hidden sm:inline-flex`, so at 390 the first
  // match is invisible. Take the first VISIBLE one (the hero's).
  await p.locator('button[aria-haspopup="dialog"]:visible').first().click();
  await p.waitForSelector('[role="dialog"]');
  await p.waitForTimeout(900);
  await p.screenshot({ path: `screenshots/ui-after/buy-flow/${name}.png` });
  // And the pending state, after pressing a store.
  await p.locator('[role="dialog"] button', { hasText: /Buy on Amazon/ }).first().click();
  await p.waitForTimeout(700);
  await p.screenshot({ path: `screenshots/ui-after/buy-flow/${name}-pending.png` });
  await ctx.close();
  console.log('shot', name);
}
await b.close();

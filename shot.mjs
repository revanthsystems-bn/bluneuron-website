/**
 * Screenshot helper for this branch's UI work.
 *
 *   node shot.mjs <url> <selector|-> <name> <WxH> [WxH ...]
 *
 * `-` as the selector captures the whole page; anything else captures that
 * element.
 *
 * TWO THINGS IT HAS TO DO THAT A NAIVE `fullPage: true` DOES NOT:
 *
 *   1. Scroll the page first. Reveals are IntersectionObserver-driven and
 *      fire once, so a full-page capture taken without scrolling renders
 *      everything below the fold at opacity 0 — which looks exactly like an
 *      empty section and has already caused one misdiagnosis.
 *   2. Dismiss the cookie notice. It is position:fixed and would otherwise
 *      sit over whatever is being captured.
 */
import { chromium } from 'playwright';

const [url, sel, name, ...sizes] = process.argv.slice(2);

const browser = await chromium.launch();

for (const size of sizes) {
  const [width, height] = size.split('x').map(Number);
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('bluneuron-consent-ack', '1'); } catch (e) { /* private mode */ }
  });

  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });

  // Walk the page so every reveal fires, then come back.
  await page.evaluate(async () => {
    // 160ms per step, not 90. Lenis smooths the scroll, so the viewport is
    // still travelling when the next scrollTo lands — at 90ms the observers
    // for the last section had not fired by capture time and a full-page shot
    // came back with an empty band where the spec board should have been.
    const step = innerHeight * 0.6;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 160));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 1200));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
  });
  await page.waitForTimeout(900);

  if (sel !== '-') {
    await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 40);
    }, sel);
    await page.waitForTimeout(600);
  }

  const target = sel === '-' ? page : await page.$(sel);
  await target.screenshot({
    path: `screenshots/ui-round3/${name}-${width}.png`,
    ...(sel === '-' ? { fullPage: true } : {}),
  });

  const hs = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  console.log(`  ${name} ${width}: hScroll ${hs}`);
  await ctx.close();
}

await browser.close();

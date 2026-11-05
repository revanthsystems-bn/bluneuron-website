/**
 * Hero captures for this branch, and a few measurements that a screenshot
 * cannot show.
 *
 *   node scripts/hero-shot.mjs http://127.0.0.1:3100 screenshots/hero-neuron
 *
 * WHY NOT scripts/shot.mjs. That one scrolls the whole page to fire the
 * IntersectionObserver reveals before it captures. This hero must be captured
 * WITHOUT scrolling — the network pauses the moment the section leaves the
 * viewport (by design) and a round trip to the footer and back would be a
 * capture of a field that had just restarted. It also has to wait for the
 * canvas to actually be live, which is an event no fixed timeout can stand in
 * for: the component starts on `load` and then on an idle callback.
 *
 * It is a local tool, like scripts/shot.mjs, and is not wired into the build.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = (process.argv[2] || 'http://127.0.0.1:3100').replace(/\/+$/, '');
const outDir = process.argv[3] || 'screenshots/hero-neuron';
mkdirSync(outDir, { recursive: true });

const SIZES = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1280', width: 1280, height: 860 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-375', width: 375, height: 667 },
];

const browser = await chromium.launch();
const report = [];

for (const size of SIZES) {
  const ctx = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 2,
  });
  // The cookie notice is position:fixed and would sit over the capture.
  await ctx.addInitScript(() => {
    try { localStorage.setItem('bluneuron-consent-ack', '1'); } catch (e) { /* private mode */ }
  });
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'load' });

  // The canvas adds `.is-live` from its own idle callback. Waiting for the
  // class is the only honest signal that the network has started.
  await page.waitForFunction(
    () => document.querySelector('.hero-network')?.classList.contains('is-live'),
    null,
    { timeout: 8000 },
  ).catch(() => report.push(`${size.name}: canvas never went live`));
  // Long enough for the ring pulse and the chips to have landed, and for a
  // signal or two to be in flight.
  await page.waitForTimeout(2600);

  await page.screenshot({ path: `${outDir}/${size.name}.png` });
  const hero = await page.locator('#showcase').first();
  await hero.screenshot({ path: `${outDir}/${size.name}-hero.png` });

  /* ------------------------------------------------------------------ *
   * THE MEASUREMENTS. Each one is a thing that has actually gone wrong
   * on this hero before, or a constraint the rebuild was given.
   * ------------------------------------------------------------------ */
  const m = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const rect = (s) => {
      const el = q(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height),
      };
    };
    const img = q('#showcase .hero-photo img');
    const buy = [...document.querySelectorAll('#showcase a, #showcase button')]
      .find((el) => /buy/i.test(el.textContent || ''));
    const chips = [...document.querySelectorAll('.hero-chip')].map((el) => ({
      text: el.textContent,
      shown: getComputedStyle(el).display !== 'none',
      opacity: getComputedStyle(el).opacity,
      box: (() => {
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), right: Math.round(r.right) };
      })(),
    }));
    return {
      horizontalScroll:
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      // The blend-mode trap: a photograph that has gone invisible or come
      // back as a white rectangle both show up as the wrong average colour,
      // so the image's own paint is checked rather than eyeballed.
      imgComplete: img ? img.complete && img.naturalWidth > 0 : null,
      imgOpacity: img ? getComputedStyle(img).opacity : null,
      photoBlend: q('.hero-photo') ? getComputedStyle(q('.hero-photo')).mixBlendMode : null,
      cardIsolation: q('.hero-card') ? getComputedStyle(q('.hero-card')).isolation : null,
      cardTransform: q('.hero-card') ? getComputedStyle(q('.hero-card')).transform : null,
      canvasLive: q('.hero-network')?.classList.contains('is-live') ?? null,
      canvasPointerEvents: q('.hero-network')
        ? getComputedStyle(q('.hero-network')).pointerEvents : null,
      canvasAriaHidden: q('.hero-network')?.getAttribute('aria-hidden') ?? null,
      // The buy button has to be above the fold at 375x667 and has to be a
      // real, hit-testable element from the first frame.
      buyBottom: buy ? Math.round(buy.getBoundingClientRect().bottom) : null,
      buyLabel: buy ? buy.textContent.replace(/\s+/g, ' ').trim() : null,
      buyPointerEvents: buy ? getComputedStyle(buy).pointerEvents : null,
      viewportHeight: window.innerHeight,
      wordmark: rect('#showcase h1'),
      wordmarkFont: q('#showcase h1')
        ? getComputedStyle(q('#showcase h1')).font : null,
      card: rect('.hero-card'),
      chips,
      lens: rect('[data-hero-lens]'),
    };
  });

  report.push(`\n--- ${size.name} (${size.width}x${size.height}) ---`);
  report.push(JSON.stringify(m, null, 2));
  await ctx.close();
}

await browser.close();
writeFileSync(`${outDir}/measurements.txt`, report.join('\n'));
console.log(report.join('\n'));
console.log(`\nwrote ${outDir}`);

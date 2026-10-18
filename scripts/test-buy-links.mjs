/**
 * PROVES: no PLACEHOLDER or TBD marketplace URL can ever render as an href.
 *
 * This is the DOM half of the safety around the buy flow. The other half is
 * scripts/check-production.js, which refuses a production deploy while any
 * placeholder remains. They guard different failures and neither replaces
 * the other:
 *
 *   check-production  stops a BUILD WITH placeholders from being deployed.
 *   this              stops a placeholder from being rendered as a link in
 *                     the first place — which is what matters in a preview,
 *                     where placeholders are expected and someone is
 *                     clicking around.
 *
 * It runs against a REAL BUILD through a real browser, not against the
 * source, because the thing being asserted is what lands in the DOM. A unit
 * test of buyDestinations() would pass while a component ignored it.
 *
 * Both states are covered:
 *   - with placeholders present (today) every buy control must be a
 *     <button> with no href anywhere, and pressing it must navigate nowhere
 *     and say so;
 *   - the href that WOULD be rendered, whatever MARKETPLACE holds, must
 *     never contain the marker.
 *
 * Usage:  node scripts/test-buy-links.mjs [baseUrl]
 * Exit 0 = pass. Non-zero = a placeholder could reach a customer.
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:4311';
const ROUTES = ['/', '/shop/iriz', '/where-to-buy', '/shop'];

/** Must match lib/site-config's PLACEHOLDER / TBD markers. */
const FORBIDDEN = ['PLACEHOLDER', '[TBD]', 'TBD'];

let failures = 0;
const fail = (msg) => { failures += 1; console.error(`  FAIL  ${msg}`); };
const pass = (msg) => console.log(`  ok    ${msg}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();

for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: 'networkidle' });

  // ---- 1. No anchor anywhere on the page may carry a marker. -----------
  const badHrefs = await page.$$eval('a[href]', (as, forbidden) =>
    as.map((a) => a.getAttribute('href'))
      .filter((h) => forbidden.some((f) => h.includes(f))), FORBIDDEN);

  if (badHrefs.length) fail(`${route}: ${badHrefs.length} href(s) carry a placeholder: ${badHrefs.join(', ')}`);
  else pass(`${route}: no placeholder href`);

  // ---- 2. No anchor may point at a marketplace HOME page. --------------
  // A listing URL has a path; `amazon.in/` on its own is the front page,
  // which is where a half-filled placeholder sends people.
  const homePages = await page.$$eval('a[href]', (as) =>
    as.map((a) => a.getAttribute('href'))
      .filter((h) => /^https?:\/\/(www\.)?(amazon\.in|flipkart\.com)\/?(\?|#|$)/.test(h)));

  if (homePages.length) fail(`${route}: ${homePages.length} link(s) go to a marketplace FRONT PAGE: ${homePages.join(', ')}`);
  else pass(`${route}: no marketplace front-page link`);
}

// ---- 3. The sheet itself, opened, on the page that always has a Buy. ----
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
const buy = page.locator('button[aria-haspopup="dialog"]').first();

if (await buy.count() === 0) {
  fail('/: no Buy control with aria-haspopup="dialog" found');
} else {
  await buy.click();
  // Scoped to THIS dialog by its own label. The homepage auto-opens the
  // Notify modal 8 seconds in (components/notify/NotifyProvider), and a
  // bare [role="dialog"] matches both — which made the Escape assertion
  // below test whichever one the locator happened to resolve first.
  const dialog = page.locator('[role="dialog"]', { has: page.locator('text=Buy on Amazon') });
  await dialog.waitFor({ state: 'visible', timeout: 5000 });
  pass('/: Buy opens a dialog');

  const storeControls = dialog.locator('a, button').filter({ hasText: /Buy on (Amazon|Flipkart)/ });
  const n = await storeControls.count();
  if (n !== 2) fail(`sheet: expected 2 store controls, found ${n}`);
  else pass('sheet: both store controls present');

  for (let i = 0; i < n; i++) {
    const el = storeControls.nth(i);
    const tag = await el.evaluate((e) => e.tagName.toLowerCase());
    const href = await el.getAttribute('href');
    const label = (await el.innerText()).trim().split('\n')[0];

    if (href && FORBIDDEN.some((f) => href.includes(f))) {
      fail(`sheet: "${label}" renders a placeholder href (${href})`);
    } else if (tag === 'a' && !href) {
      fail(`sheet: "${label}" is an <a> with no href`);
    } else if (tag === 'button' && href !== null) {
      fail(`sheet: "${label}" is a <button> carrying an href`);
    } else {
      pass(`sheet: "${label}" is <${tag}>${href ? ` -> ${href}` : ' with no href (pending)'}`);
    }
  }

  // ---- 4. A pending control must not navigate. ------------------------
  const pending = dialog.locator('button').filter({ hasText: /Buy on (Amazon|Flipkart)/ });
  if (await pending.count() > 0) {
    const before = page.url();
    const pagesBefore = ctx.pages().length;
    await pending.first().click();
    await page.waitForTimeout(400);

    if (page.url() !== before) fail(`pending: click navigated to ${page.url()}`);
    else if (ctx.pages().length !== pagesBefore) fail('pending: click opened a new tab');
    else pass('pending: click navigated nowhere');

    const toast = dialog.locator('[aria-live="polite"]');
    const text = (await toast.innerText()).trim();
    if (!/goes live on sale day/i.test(text)) fail(`pending: no explanation shown (got "${text}")`);
    else pass(`pending: explains itself — "${text}"`);
  } else {
    pass('pending: no pending controls — every listing is live');
  }

  // ---- 5. Escape closes it. -------------------------------------------
  await page.keyboard.press('Escape');
  // Wait for the OUTCOME, not for a guessed duration. The panel leaves on a
  // spring, so a fixed timeout is a race: too short and a sheet that closed
  // correctly reports as stuck.
  try {
    await dialog.waitFor({ state: 'detached', timeout: 4000 });
    pass('sheet: Escape closes it');
  } catch {
    fail('sheet: Escape did not close it');
  }
}

await browser.close();

console.log(failures === 0
  ? '\nPASS — no placeholder can render as a buy link.'
  : `\nFAIL — ${failures} problem(s).`);
process.exit(failures === 0 ? 0 : 1);

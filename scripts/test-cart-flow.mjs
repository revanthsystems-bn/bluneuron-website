#!/usr/bin/env node
/**
 * THE CART FLOW, in a real browser, at three widths.
 *
 * WHY THIS EXISTS. "Add to cart" on /shop/iriz once dimmed the page and added
 * nothing: no drawer, no storage, an empty /cart. The cause was not the cart
 * at all — the launch-list modal (components/NewsletterPopup) auto-opened on
 * every route eight seconds after load, and its full-screen dimming overlay
 * swallowed the click. Anyone who spent a few seconds reading the page before
 * buying hit it; anyone who clicked immediately did not, which is why it
 * survived every scripted check. The first version of those checks clicked
 * within a second of load and passed cleanly against the broken build.
 *
 * So this test IDLES FIRST. The ten-second wait is the whole point of it —
 * remove that and it stops testing the thing it was written for.
 *
 * It also runs WITHOUT `reducedMotion: 'reduce'`. The earlier screenshot
 * tooling set it, which drops framer-motion's transforms and hides any bug
 * that lives in an animated mount — the cart drawer is an animated mount.
 *
 * Usage:  node scripts/test-cart-flow.mjs [baseUrl]
 * Exits non-zero on the first failed assertion, naming the width.
 */

import { chromium } from 'playwright';

const BASE = process.argv[2] || process.env.BASE_URL || 'http://127.0.0.1:3000';
const WIDTHS = [390, 770, 1440];
const IDLE_MS = 10_000;

const failures = [];
let checks = 0;

function check(width, name, condition, detail = '') {
  checks += 1;
  if (!condition) failures.push(`[${width}px] ${name}${detail ? ` — ${detail}` : ''}`);
}

const browser = await chromium.launch();

for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const jsErrors = [];
  page.on('pageerror', (e) => jsErrors.push(e.message));

  /* --- 1. Land on the product page and WAIT, as a reader would. --- */
  await page.goto(`${BASE}/shop/iriz`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('bluneuron-cart-v1'));
  await page.reload({ waitUntil: 'networkidle' });
  try {
    const consent = page.getByRole('button', { name: /got it/i }).first();
    if (await consent.isVisible({ timeout: 1000 })) await consent.click();
  } catch {
    /* no consent bar on this run */
  }

  await page.waitForTimeout(IDLE_MS);

  // Nothing may be covering the buy button after an idle period.
  //
  // SCROLL TO IT FIRST. `elementFromPoint` is viewport-relative and returns
  // null for coordinates outside the viewport, so testing the button where
  // it happens to sit on load reports "covered by undefined" at 390 and 770
  // — where the buy panel is below the fold — and says nothing about
  // overlays. Scrolling is also what a person does before clicking, which
  // makes this the honest version of the check.
  await page
    .getByRole('button', { name: 'Add to cart', exact: true })
    .first()
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  const covering = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) => b.textContent.trim() === 'Add to cart'
    );
    if (!btn) return 'no Add to cart button';
    const r = btn.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (!top) return 'button is outside the viewport';
    return top === btn || btn.contains(top)
      ? null
      : `${top.tagName}.${String(top.className).slice(0, 70)}`;
  });
  check(width, 'buy button is not covered after idling', covering === null, covering ?? '');

  /* --- 2. Add to cart. --- */
  let clickFailed = null;
  try {
    await page.getByRole('button', { name: 'Add to cart', exact: true }).first().click({ timeout: 5000 });
  } catch (e) {
    clickFailed = e.message.split('\n')[0];
  }
  check(width, 'Add to cart is clickable', clickFailed === null, clickFailed ?? '');
  await page.waitForTimeout(1200);

  const afterAdd = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-label="Your cart"]');
    const rect = dialog?.getBoundingClientRect();
    return {
      drawerOpen: Boolean(dialog),
      drawerOnScreen: rect ? rect.left < window.innerWidth - 10 && rect.width > 0 : false,
      storage: localStorage.getItem('bluneuron-cart-v1'),
      badge: document.querySelector('header button[aria-label*="Open cart"]')?.getAttribute('aria-label') ?? '',
    };
  });
  check(width, 'cart drawer opens', afterAdd.drawerOpen);
  check(width, 'cart drawer is actually on screen', afterAdd.drawerOnScreen);
  check(width, 'quantity is persisted', afterAdd.storage === '{"qty":1}', `storage=${afterAdd.storage}`);
  check(width, 'masthead badge updates', /1 item/.test(afterAdd.badge), `aria-label="${afterAdd.badge}"`);

  /* --- 3. Survive a reload. A basket that forgets is not a basket. --- */
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const afterReload = await page.evaluate(
    () => document.querySelector('header button[aria-label*="Open cart"]')?.getAttribute('aria-label') ?? ''
  );
  check(width, 'cart survives a reload', /1 item/.test(afterReload), `aria-label="${afterReload}"`);

  /* --- 4. /cart shows it, and the quantity can be changed there. --- */
  await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);

  // Guarded rather than assumed. When the earlier bug was present the cart
  // was empty here, /cart rendered its empty state, and clicking a stepper
  // that does not exist threw a raw Playwright timeout — a stack trace
  // instead of a diagnosis. The failure this test is FOR should read as a
  // failed check, so the absence of the control is itself the assertion.
  const plus = page.getByRole('button', { name: 'Increase quantity' }).first();
  const hasStepper = await plus.isVisible({ timeout: 3000 }).catch(() => false);
  check(width, '/cart shows the item it was given', hasStepper, hasStepper ? '' : '/cart is empty');

  if (hasStepper) {
    await plus.click();
    await page.waitForTimeout(700);

    const afterQty = await page.evaluate(() => ({
      storage: localStorage.getItem('bluneuron-cart-v1'),
      bodyText: document.body.innerText,
    }));
    check(width, 'quantity can be increased on /cart', afterQty.storage === '{"qty":2}', `storage=${afterQty.storage}`);
    check(width, 'subtotal reflects 2 units', afterQty.bodyText.includes('27,998'));
  }

  /* --- 5. Both checkout links are real and carry the quantity. --- */
  const links = await page.evaluate(() =>
    [...document.querySelectorAll('a')]
      .filter((a) => /Checkout on/.test(a.textContent))
      .map((a) => ({ label: a.textContent.replace(/\s+/g, ' ').trim(), href: a.href }))
  );
  check(width, 'two checkout links are present', links.length === 2, `found ${links.length}`);
  check(
    width,
    'checkout links point at a marketplace',
    links.every((l) => /^https:\/\/(www\.)?(amazon\.in|flipkart\.com)/.test(l.href)),
    links.map((l) => l.href).join(' , ')
  );

  check(width, 'no uncaught JS errors', jsErrors.length === 0, jsErrors[0] ?? '');

  await ctx.close();
}

await browser.close();

console.log(`\ncart flow: ${checks} checks at ${WIDTHS.join('/')}px\n`);
if (failures.length) {
  console.error('FAILED:');
  for (const f of failures) console.error(`  x ${f}`);
  console.error('');
  process.exit(1);
}
console.log('All cart flow checks passed.\n');

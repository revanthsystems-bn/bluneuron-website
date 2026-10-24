/**
 * Loads every route and collects the Content-Security-Policy-Report-Only
 * violations the browser logs.
 *
 *   node scripts/csp-report.mjs http://localhost:3000
 *
 * The policy in next.config.js is report-only, so nothing it names is
 * actually blocked — the browser evaluates it and writes what WOULD have
 * been blocked to the console and to a `securitypolicyviolation` event. This
 * reads the event, which is the structured version, and groups the result by
 * (directive, blocked source) so one noisy page does not bury a real finding.
 *
 * Run it before ever switching the header to the enforcing
 * `Content-Security-Policy`. Anything still listed here would break.
 */

import { chromium } from 'playwright';

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');

const ROUTES = [
  '/', '/about', '/specs', '/compare', '/shop', '/shop/iriz', '/where-to-buy',
  '/support', '/support/contact', '/support/faq',
  '/support/warranty-registration', '/support/warranty-claim',
  '/legal/privacy', '/legal/terms', '/legal/returns', '/legal/shipping',
  '/legal/warranty', '/legal/grievance',
  '/sign-in', '/account', '/cart',
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

/** Map of "directive | blocked-uri" -> { count, routes:Set }. */
const findings = new Map();
const pageErrors = [];

for (const route of ROUTES) {
  const page = await ctx.newPage();
  page.on('pageerror', (e) => pageErrors.push(`${route}: ${String(e).slice(0, 120)}`));

  // The violation event fires on the document, so the listener has to be
  // installed before any script runs — addInitScript is the only hook early
  // enough. It stashes them on window for collection after load.
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__csp.push({
        directive: e.effectiveDirective || e.violatedDirective,
        blocked: e.blockedURI,
        sample: (e.sample || '').slice(0, 60),
      });
    });
  });

  const res = await page.goto(base + route, { waitUntil: 'load' }).catch(() => null);
  if (!res) { await page.close(); continue; }

  // Scroll the page so lazy images, the pixel and GA all actually fire.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await page.waitForTimeout(1500);

  const found = await page.evaluate(() => window.__csp || []);
  for (const v of found) {
    const key = `${v.directive} | ${v.blocked}${v.sample ? ` | ${v.sample}` : ''}`;
    const entry = findings.get(key) || { count: 0, routes: new Set() };
    entry.count += 1;
    entry.routes.add(route);
    findings.set(key, entry);
  }
  await page.close();
}

await browser.close();

console.log(`CSP report-only violations across ${ROUTES.length} routes\n`);
if (!findings.size) {
  console.log('  none — the policy is ready to enforce.');
} else {
  const rows = [...findings.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [key, { count, routes }] of rows) {
    console.log(`  ${String(count).padStart(4)}x  ${key}`);
    console.log(`        on ${routes.size}/${ROUTES.length} routes`);
  }
}

if (pageErrors.length) {
  console.log(`\nJavaScript errors seen while collecting (${pageErrors.length}):`);
  pageErrors.slice(0, 10).forEach((e) => console.log('  ' + e));
}

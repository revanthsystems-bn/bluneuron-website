/**
 * Asserts that NO FOOTER LINK APPEARS TWICE in the rendered HTML.
 *
 *   node scripts/assert-footer-links.mjs http://localhost:3000
 *   node scripts/assert-footer-links.mjs https://www.bluneuron.com
 *
 * Why this exists: the footer this replaced offered the same page under two
 * labels in three separate places — "Privacy Policy" in the Policies column
 * and again beside the copyright, "Contact us" in Support and "Contact" in
 * Company, the wordmark in the brand row and again in a middle row. None of
 * those were visible as a bug in any one screenshot; you only see them by
 * reading the whole footer at once, which is exactly the thing nobody does
 * twice. A reader does meet them, and has to work out which copy is the real
 * one.
 *
 * So the one-link-one-place rule is checked rather than remembered. It is a
 * rule about the RENDERED output, not about lib/routes.js: a duplicate can
 * arrive from the data (two columns naming the same ROUTES key) or from the
 * markup (a hand-written anchor beside a generated one), and only the HTML
 * sees both. Hence a fetch rather than a unit test on the module.
 *
 * It also prints the full href inventory with `--list`, which is the quickest
 * way to confirm a restructure kept every destination it was supposed to.
 *
 * NOT wired into `next build` — like scripts/assert-visible-html.mjs it needs
 * a server to fetch from, so it stays a deliberate step.
 */

const args = process.argv.slice(2);
const list = args.includes('--list');
const base = (args.find((a) => !a.startsWith('--')) || 'http://localhost:3000').replace(
  /\/+$/,
  '',
);

/**
 * Every route that renders a footer. The footer is sitewide, so a duplicate
 * on one page is a duplicate on all of them — but the columns are filtered by
 * draft state at render time, and /club and the account pages are rendered by
 * different shells, so each one is checked rather than assumed.
 */
const ROUTES = [
  '/',
  '/about',
  '/specs',
  '/compare',
  '/shop',
  '/shop/iriz',
  '/where-to-buy',
  '/support',
  '/support/contact',
  '/support/faq',
  '/support/warranty-registration',
  '/support/warranty-claim',
  '/legal/warranty',
  '/legal/returns',
  '/legal/shipping',
  '/legal/terms',
  '/legal/grievance',
  '/legal/privacy',
  // The Club's door only. /club/home needs a member cookie —
  // scripts/test-club-flow.mjs covers it.
  '/club',
];

/**
 * The <footer> element's inner HTML, or null.
 *
 * A plain regex between the open and close tags, which is safe here for one
 * reason: the footer is the LAST element in the body and contains no nested
 * <footer>. A real parser would be the right tool if either of those ever
 * stopped being true — and if the markup changes so much that this returns
 * null, that is reported as a failure rather than silently passing a page
 * with no footer found in it.
 */
function extractFooter(html) {
  const match = html.match(/<footer[\s>][\s\S]*<\/footer>/i);
  return match ? match[0] : null;
}

/** Every `href` in a chunk of HTML, in document order. */
function hrefs(fragment) {
  return [...fragment.matchAll(/<a\b[^>]*\bhref="([^"]*)"/gi)].map((m) => m[1]);
}

let failures = 0;

for (const route of ROUTES) {
  const url = `${base}${route}`;
  let res;
  try {
    res = await fetch(url, { headers: { 'user-agent': 'assert-footer-links' } });
  } catch (err) {
    console.log(`FAIL  ${route}  (fetch failed: ${err.message})`);
    failures += 1;
    continue;
  }

  if (!res.ok) {
    console.log(`FAIL  ${route}  (HTTP ${res.status})`);
    failures += 1;
    continue;
  }

  const footer = extractFooter(await res.text());
  if (!footer) {
    console.log(`FAIL  ${route}  (no <footer> element in the server HTML)`);
    failures += 1;
    continue;
  }

  const found = hrefs(footer);

  // Counted rather than de-duplicated, so the message can say how many copies
  // there are and not merely that there is more than one.
  const counts = new Map();
  for (const href of found) counts.set(href, (counts.get(href) || 0) + 1);
  const repeats = [...counts.entries()].filter(([, n]) => n > 1);

  if (repeats.length) {
    failures += 1;
    console.log(`FAIL  ${route}`);
    for (const [href, n] of repeats) {
      console.log(`        ${href}  x${n}`);
    }
  } else {
    console.log(`ok    ${route}  (${found.length} footer links, all distinct)`);
  }

  if (list) {
    for (const href of found) console.log(`        ${href}`);
  }
}

console.log(
  failures
    ? `\n${failures} of ${ROUTES.length} routes have a duplicated footer link.`
    : `\nAll ${ROUTES.length} routes: every footer href appears exactly once.`,
);
process.exit(failures ? 1 : 0);

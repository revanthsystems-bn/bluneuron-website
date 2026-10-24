/**
 * Asserts that no page ships content hidden in its SERVER-RENDERED HTML.
 *
 *   node scripts/assert-visible-html.mjs http://localhost:3000
 *   node scripts/assert-visible-html.mjs https://www.bluneuron.com
 *
 * Why this exists: the site's scroll reveals used framer-motion
 * `initial={{ opacity: 0, y: 28 }}`, which React serialises into the markup
 * as `style="opacity:0;transform:translateY(28px)"`. A browser that runs the
 * bundle fades it in; one that does not shows an empty page. That is not a
 * hypothetical — the warranty pages are reached by scanning a QR code on the
 * carton, which opens in whatever in-app browser WhatsApp, Instagram or
 * Google Lens happens to provide.
 *
 * components/Reveal.jsx now keeps the hidden state in css behind
 * `html.js-anim`, so nothing is hidden until a script says it may be. This
 * script is the regression test for that: it fetches each route and fails on
 * an inline style that would hide an element.
 *
 * NOT wired into `next build`. The build already has one env guard
 * (scripts/assert-build-env.js) and that one can run offline; this one needs
 * a server to fetch from, so it stays a deliberate step.
 */

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');

const ROUTES = [
  '/',
  // The Club's door. Reached by scanning the card in the carton, so it meets
  // exactly the in-app browsers these checks exist for. /club/home is absent
  // because it needs a member cookie — scripts/test-club-flow.mjs covers it.
  '/club',
  '/support',
  '/support/warranty-registration',
  '/support/warranty-claim',
  '/legal/warranty',
  '/legal/privacy',
  '/legal/terms',
  '/legal/returns',
  '/legal/shipping',
  '/about',
  '/specs',
  '/compare',
];

/**
 * Inline styles that leave an element invisible, or offset from where the
 * layout put it. Whitespace-tolerant, because React's serialiser is not the
 * only thing that can produce these and a future one may space it differently.
 *
 * The boundaries matter as much as the patterns:
 *
 *   opacity:0          the actual bug. `opacity:0.5` and `opacity:1` pass.
 *   visibility:hidden  the same effect by another route.
 *   translateY(Npx)    the slide half of the old reveal. A NONZERO vertical
 *                      offset only: `translateY(0px)` is a finished reveal,
 *                      and `translateX(-50%)` is the centring idiom, which
 *                      components/ThrowRange puts on a graphic that is
 *                      perfectly visible where it sits.
 *   scale(0)           collapsed to nothing. Exactly zero -- ThrowRange ships
 *                      `scale(0.22)` on that same graphic, the small end of a
 *                      scroll-tied zoom on a drawn illustration. Small, and
 *                      on screen.
 */
const BAD = [
  { label: 'opacity:0', re: /style="[^"]*opacity:\s*0(?![.\d])/gi },
  { label: 'visibility:hidden', re: /style="[^"]*visibility:\s*hidden/gi },
  {
    label: 'hiding transform',
    re: /style="[^"]*transform:[^";]*(?:translateY\(\s*-?(?!0[a-z%]*\s*\))[.\d]|scale\(\s*0\s*\))/gi,
  },
];

let failures = 0;

for (const route of ROUTES) {
  const url = `${base}${route}`;
  let res;
  try {
    res = await fetch(url, { headers: { 'user-agent': 'assert-visible-html' } });
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

  const html = await res.text();
  const hits = [];
  for (const { label, re } of BAD) {
    const found = html.match(re);
    if (found) hits.push(`${label} x${found.length}: ${found[0].slice(0, 90)}`);
  }

  if (hits.length) {
    failures += 1;
    console.log(`FAIL  ${route}`);
    hits.forEach((h) => console.log(`        ${h}`));
  } else {
    console.log(`ok    ${route}  (${html.length} bytes)`);
  }
}

console.log(
  failures
    ? `\n${failures} of ${ROUTES.length} routes ship hidden content.`
    : `\nAll ${ROUTES.length} routes are visible in their server HTML.`,
);
process.exit(failures ? 1 : 0);

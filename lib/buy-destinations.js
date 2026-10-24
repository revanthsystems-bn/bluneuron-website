import { MARKETPLACES, isPlaceholder, isTBD } from '@/lib/site-config';

/**
 * THE ONE PLACE THAT DECIDES WHETHER A STORE LINK MAY RENDER.
 *
 * Every buy surface reads this and nothing else. The rule it enforces is
 * narrow and absolute: a URL still carrying the PLACEHOLDER marker, or
 * still TBD, must never reach the DOM as an `href`. Not disabled-but-
 * present, not `href="#"` — absent.
 *
 * WHY THE BUTTON STILL LOOKS LIVE. The site ships on sale day with real
 * listing URLs, so the live button is the DEFAULT and the only state worth
 * designing. A preview built before the URLs land would otherwise show a
 * row of greyed-out buttons that look nothing like what ships, and reviews
 * would be of the wrong thing. So a pending destination renders the same
 * button, and the CLICK is what differs: it opens a small toast saying the
 * link goes live on sale day, and navigates nowhere.
 *
 * WHY THAT IS SAFE. `scripts/check-production.js` refuses a production
 * deploy while any PLACEHOLDER remains, so the pending state is reachable
 * in a preview and unreachable in production. The guard is the safety; this
 * module is the behaviour. `scripts/test-buy-links.mjs` proves the DOM half
 * of it over a real build.
 */

/**
 * @typedef {object} BuyDestination
 * @property {string}  id       'amazon' | 'flipkart' — the analytics value
 * @property {string}  name     'Amazon' | 'Flipkart' — the label
 * @property {string}  label    the full button label
 * @property {boolean} ready    is there a real listing behind this
 * @property {string|null} href the URL, or NULL when not ready. Never a
 *                              placeholder, never '#'.
 */

/** Every marketplace, with its link resolved — or explicitly withheld. */
export function buyDestinations() {
  return MARKETPLACES.map((m) => {
    const ready = !isTBD(m.url) && !isPlaceholder(m.url);
    return {
      id: m.id,
      name: m.name,
      label: `Buy on ${m.name}`,
      ready,
      // The null is the whole contract. A caller that spreads this onto an
      // anchor gets no href at all rather than a broken one.
      href: ready ? m.url : null,
    };
  });
}

/** Are all listings live? Drives nothing visual — used by the test. */
export function allDestinationsReady() {
  return buyDestinations().every((d) => d.ready);
}

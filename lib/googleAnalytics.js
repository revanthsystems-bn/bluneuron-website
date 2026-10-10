/**
 * Google Analytics 4 — the measurement ID, the "may this run at all" rule,
 * and the one guarded way to send an event.
 *
 * Deliberately shaped like lib/metaPixel.js, down to the names, because the
 * two do the same job and a reader who knows one should not have to learn a
 * second set of conventions. components/GoogleAnalytics renders the tag;
 * lib/commerce sends the buy event. Neither re-states the rule below.
 *
 * WHY GA4 EXISTS HERE AT ALL. @vercel/analytics only reports from a Vercel
 * deployment — on GoDaddy Node.js hosting it loads a script that has nothing
 * to talk to. GA4 is the host-independent replacement, so the site has traffic
 * numbers wherever it is served from. Both are rendered from app/layout.jsx;
 * the Vercel one is gated on `process.env.VERCEL`.
 *
 * ---------------------------------------------------------------------------
 * OPTIONAL, ON PURPOSE
 * ---------------------------------------------------------------------------
 * Unlike the Meta Pixel ID and the Web3Forms key, which a production build
 * REFUSES to ship without (see scripts/assert-build-env.js), an absent
 * measurement ID is a supported state: no ID, no script, no events, no
 * warning. The GA4 property had not been created when GoDaddy hosting was
 * set up, and a missing analytics number is a reporting gap — not a broken
 * pixel or a signup form that silently drops leads, which is what the strict
 * check exists to prevent.
 *
 * TODO(analytics): put the real GA4 Measurement ID in NEXT_PUBLIC_GA_ID —
 * the `G-XXXXXXXXXX` value from Google Analytics → Admin → Data streams →
 * (your web stream) → Measurement ID. Set it in .env.production for the
 * GoDaddy build and in Vercel → Settings → Environment Variables; there is
 * nothing else to change in the code.
 */

import { isLocalHostname } from './localhost';

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || '';

/**
 * THE GATE. Same two reasons as the pixel's, for the same reasons:
 *
 * 1. No measurement ID — nothing to configure. A `gtag('config', '')` is a
 *    tag that loads and reports to no property.
 * 2. Running on localhost — `next dev`, or a production build served locally
 *    (which is exactly how the GoDaddy build is verified, so this matters
 *    more here than it looks). Development page loads would otherwise land in
 *    the same property as real visitors.
 *
 * Returns false during server rendering as well: the hostname is only knowable
 * in the browser, so the decision is made after mount. See
 * components/GoogleAnalytics.
 *
 * To test GA locally, temporarily `return Boolean(GA_MEASUREMENT_ID)` here —
 * this one function is the whole switch.
 */
export function isGaEnabled() {
  if (!GA_MEASUREMENT_ID) return false;
  if (typeof window === 'undefined') return false;
  return !isLocalHostname(window.location.hostname);
}

/**
 * Send an event, or do nothing at all.
 *
 * `gtag` is missing far more often than people expect — an ad blocker, a
 * tracking-protection default, a corporate proxy, or simply the gate above
 * having kept the script off the page. Analytics must never be able to break
 * a buy button, so every call goes through here and a missing `gtag` is a
 * no-op, not a thrown ReferenceError inside a click handler.
 *
 * NEVER pass personal data through this. No email, no phone number, no name,
 * no order contents — see the `page_view` note in components/GoogleAnalytics
 * and the `marketplace`-only payload in lib/commerce. The visitor's contact
 * details go to Web3Forms and nowhere else.
 */
export function trackGaEvent(name, params) {
  if (typeof window === 'undefined') return;

  const gtag = window.gtag;
  if (typeof gtag !== 'function') return;

  try {
    if (params) gtag('event', name, params);
    else gtag('event', name);
  } catch (err) {
    // A third-party script throwing is not this site's problem to surface.
    // eslint-disable-next-line no-console
    console.warn('[BluNeuron] Google Analytics event failed:', err);
  }
}

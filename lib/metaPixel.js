/**
 * Meta Pixel — the ID, the "may this run at all" rule, and the one guarded
 * way to send an event.
 *
 * Everything about the pixel that is not markup lives here, so the rule that
 * decides whether it loads is written ONCE. components/MetaPixel renders the
 * base code; components/notify/NotifyFields sends the Lead. Neither re-states
 * the rule.
 *
 * The ID comes from `NEXT_PUBLIC_META_PIXEL_ID`. It is a NEXT_PUBLIC_ var
 * because the pixel is a client-side script — the ID is in the page source on
 * every site that uses one and is not a secret. Reading it from the
 * environment rather than from source still matters: a preview deployment can
 * be pointed at a different pixel, or at none, without a code change.
 */

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

const LOCAL_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
]);

/**
 * `.local` covers Bonjour/mDNS names; `.localhost` is reserved for loopback by
 * RFC 6761. A LAN IP (192.168.x.x, for testing on a phone) is deliberately NOT
 * treated as local — that is a real device loading the real site, and the
 * hostname alone cannot tell it apart from production.
 */
export function isLocalHostname(hostname) {
  const host = String(hostname || '').toLowerCase();
  return (
    LOCAL_HOSTNAMES.has(host) ||
    host.endsWith('.local') ||
    host.endsWith('.localhost')
  );
}

/**
 * THE GATE. Two reasons to stay off, and both are deliberate:
 *
 * 1. No ID — nothing to init. A `fbq('init', '')` is a broken pixel that still
 *    loads 70KB of script and reports to no one.
 * 2. Running on localhost — `next dev`, or a production build served locally.
 *    Development page loads would otherwise land in the same dataset as real
 *    visitors and quietly corrupt every number built on it.
 *
 * Returns false during server rendering as well: the hostname is only knowable
 * in the browser, so the decision is made after mount. See components/MetaPixel.
 *
 * To test the pixel locally, temporarily `return Boolean(META_PIXEL_ID)` here —
 * this one function is the whole switch.
 */
export function isMetaPixelEnabled() {
  if (!META_PIXEL_ID) return false;
  if (typeof window === 'undefined') return false;
  return !isLocalHostname(window.location.hostname);
}

/**
 * Send a standard event, or do nothing at all.
 *
 * `fbq` is missing far more often than people expect — an ad blocker, a
 * tracking-protection default, a corporate proxy, or simply the gate above
 * having kept the script off the page. Analytics must never be able to break a
 * signup, so every call goes through here and a missing `fbq` is a no-op, not
 * a thrown ReferenceError inside a form submit handler.
 *
 * NEVER pass personal data through this. Meta's standard events take no email
 * or phone number, and advanced matching (which does) is not enabled — the
 * visitor's contact details go to Web3Forms and nowhere else.
 */
export function trackMetaPixel(event, params) {
  if (typeof window === 'undefined') return;

  const fbq = window.fbq;
  if (typeof fbq !== 'function') return;

  try {
    if (params) fbq('track', event, params);
    else fbq('track', event);
  } catch (err) {
    // A third-party script throwing is not this site's problem to surface.
    // eslint-disable-next-line no-console
    console.warn('[BluNeuron] Meta Pixel event failed:', err);
  }
}

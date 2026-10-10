/**
 * "Is this hostname a local development machine?" — the one rule, in one
 * place, because every analytics script on the site has to answer it and they
 * must all answer it the same way.
 *
 * Extracted from lib/metaPixel.js when Google Analytics was added
 * (lib/googleAnalytics.js). Both load from the browser and both must stay off
 * during local work, so duplicating the rule would mean two lists of
 * hostnames that drift apart — and the failure mode of a drift is development
 * page loads quietly landing in a production dataset, which is invisible
 * until someone trusts a number built on it.
 *
 * lib/metaPixel.js still re-exports this so its public API is unchanged.
 */

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

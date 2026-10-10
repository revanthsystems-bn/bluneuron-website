/**
 * The production origin, and the single source of truth for every absolute URL
 * the site emits — metadataBase, canonicals, Open Graph, robots.txt, sitemap.xml
 * and JSON-LD all resolve through here.
 *
 * `www` is the host that serves the site, so `www` is what ships. The apex
 * (bluneuron.com) redirects to it; naming the apex here would make every
 * canonical point at a URL that 301s, which is the one thing a canonical must
 * never do.
 *
 * Deliberately a plain constant and not `process.env.NEXT_PUBLIC_SITE_URL`.
 * These URLs are public, permanent claims — a canonical that silently differs
 * between a preview deploy and production is how a site ends up telling Google
 * its real pages are duplicates of a preview. Same reasoning as
 * COMMERCE_ENABLED in lib/launch.js: a domain change is a deploy, not a
 * runtime toggle, so it belongs in the diff.
 *
 * No trailing slash — `absoluteUrl` relies on that.
 */
export const SITE_URL = 'https://www.bluneuron.com';

/**
 * Join a root-relative path onto SITE_URL.
 *
 * `new URL(path, SITE_URL)` is the obvious spelling and the wrong one: it
 * resolves against the origin, so a caller who passes a path without a leading
 * slash loses it silently. This asserts the leading slash instead, and strips
 * the trailing one from '/' so the homepage canonical is the bare origin rather
 * than `https://www.bluneuron.com/`.
 */
export function absoluteUrl(path = '/') {
  const rel = path.startsWith('/') ? path : `/${path}`;
  return rel === '/' ? SITE_URL : `${SITE_URL}${rel}`;
}

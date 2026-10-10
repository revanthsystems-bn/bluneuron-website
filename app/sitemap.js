import { SITEMAP } from '@/lib/routes';
import { absoluteUrl } from '@/lib/site';

/**
 * The route list used to live here. It now comes from lib/routes.js, which is
 * also where the footer columns and the support tiles get their paths — so the
 * sitemap cannot advertise a URL that no page serves, and a renamed route
 * updates all three at once.
 *
 * SITEMAP is pre-filtered to the pages that are INDEXABLE, on two counts:
 *
 *   - a page still showing [TBD] placeholders sends `noindex` (routeRobots in
 *     lib/routes.js), and listing it here would ask a crawler to index a page
 *     that asks not to be. Those reappear on their own once their details are
 *     filled into lib/site-config.js.
 *   - /checkout and /order-confirmation are absent because they are not in the
 *     registry's candidate list at all. Both are `noindex` in their own layouts
 *     and both are disallowed in robots.txt (app/robots.js), and a sitemap
 *     entry for either is a contradiction Search Console reports as an error.
 *
 * URLs go through absoluteUrl() rather than `new URL(path, SITE_URL)` so the
 * homepage is listed as the bare origin — the same string the homepage's own
 * canonical resolves to, and one spelling of every absolute URL site-wide.
 */
export default function sitemap() {
  const lastModified = new Date();
  return SITEMAP.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

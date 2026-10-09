import { SITEMAP } from '@/lib/routes';
import { SITE_URL } from '@/lib/site';

/**
 * The route list used to live here. It now comes from lib/routes.js, which is
 * also where the footer columns and the support tiles get their paths — so the
 * sitemap cannot advertise a URL that no page serves, and a renamed route
 * updates all three at once.
 *
 * SITEMAP is pre-filtered to the pages that are INDEXABLE: a page still
 * showing [TBD] placeholders sends `noindex` (see routeRobots in
 * lib/routes.js), and listing it here would ask a crawler to index a page that
 * asks not to be. Those pages reappear on their own once their details are
 * filled into lib/site-config.js.
 */
export default function sitemap() {
  const lastModified = new Date();
  return SITEMAP.map((route) => ({
    url: new URL(route.path, SITE_URL).toString(),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

import { absoluteUrl } from '@/lib/site';
import { SHOW_PRIVACY } from '@/lib/iriz';

/**
 * Every indexable route, and only those.
 *
 * /checkout and /order-confirmation are deliberately absent — both are
 * `noindex` (see their layouts) and listing a noindex URL in a sitemap is a
 * contradiction Search Console reports as an error.
 *
 * `priority` is relative within this file only; search engines treat it as a
 * hint at best. The ordering that matters is the homepage first.
 */
const ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/specs', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/compare', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/support', priority: 0.6, changeFrequency: 'monthly' },
  // The warranty pages. All three are indexable and all three are listed:
  // these are pages people search for by name ("bluneuron warranty
  // registration") rather than browse to, and the two forms carry no
  // personal data in their URLs — nothing is passed as a query parameter,
  // so there is no variant of either URL that could leak a name, an order
  // ID or a serial number into a sitemap or a search result.
  //
  // /warranty, the short address printed on the carton, is deliberately
  // ABSENT: it is a 308 redirect, and listing a redirect in a sitemap is a
  // contradiction Search Console reports as an error. The page it lands on
  // is listed instead, which is the URL that should be indexed.
  { path: '/support/warranty-registration', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/support/warranty-claim', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/legal/warranty', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  // Gated on the same flag the footer link uses. A sitemap entry for a page
  // the site refuses to link is a crawl invitation to an orphan.
  ...(SHOW_PRIVACY ? [{ path: '/legal/privacy', priority: 0.2, changeFrequency: 'yearly' }] : []),
  { path: '/legal/terms', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/legal/shipping', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/legal/returns', priority: 0.2, changeFrequency: 'yearly' },
];

export default function sitemap() {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

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

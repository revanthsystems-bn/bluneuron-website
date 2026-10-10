import { absoluteUrl } from '@/lib/site';

/**
 * robots.txt.
 *
 * Everything is crawlable except the two transactional routes, which are
 * `noindex` in their own layouts (app/checkout/layout.jsx,
 * app/order-confirmation/layout.jsx) and disallowed here as well. The two are
 * not redundant: `Disallow` stops the crawl, `noindex` stops the indexing of a
 * URL that was reached some other way, such as an inbound link.
 */
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/checkout', '/order-confirmation'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}

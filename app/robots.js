import { absoluteUrl } from '@/lib/site';

/**
 * robots.txt.
 *
 * EVERYTHING IS CRAWLABLE, and there is no `disallow` list any more. It used
 * to hold /checkout and /order-confirmation — the in-site dummy purchase
 * flow — which were `noindex` in their own layouts and disallowed here as
 * well, belt and braces for two routes that must never reach a search
 * result. Both routes are deleted: the IRIZ sells on Amazon and Flipkart,
 * and a `Disallow` for a path that 404s is noise in a file whose only job is
 * to be unambiguous.
 *
 * Draft pages are NOT listed here either, and that is deliberate rather than
 * an omission. A draft sends `noindex` (routeRobots in lib/routes.js) and
 * stays out of the sitemap — which is the correct pair. Adding `Disallow`
 * on top would stop the crawl that is needed to SEE the `noindex`, so a page
 * already indexed from an inbound link would stay indexed. Disallow and
 * noindex are not additive; using both on the same URL is the standard way
 * to get neither.
 */
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}

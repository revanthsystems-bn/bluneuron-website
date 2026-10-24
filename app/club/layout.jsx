/**
 * THE CLUB AREA'S LAYOUT — and the one thing it exists to guarantee.
 *
 * ===========================================================================
 * NOTHING UNDER /club IS EVER INDEXED.
 * ===========================================================================
 * `robots` set here applies to /club and /club/home together, so a page added
 * to this folder later is noindex by default rather than by someone
 * remembering. That is the opposite of how the rest of the site works
 * (routeRobots in lib/routes.js, keyed per route) and it is deliberate: the
 * registry is for public pages, and the Club is not one.
 *
 * `noindex, nofollow` — both halves:
 *   noindex   the page must never appear in a search result
 *   nofollow  a crawler that reaches /club anyway must not treat the links
 *             out of it as endorsements, and must not wander into
 *             /club/home and log a redirect
 *
 * `nocache` and the Google-specific `noarchive` / `nosnippet` stop a cached
 * copy or a text snippet of a member page being shown even if one is somehow
 * fetched. A members-only page quoted in a search result is the failure this
 * is guarding against, and `noindex` alone does not cover a snippet served
 * from an older crawl.
 *
 * THE OTHER THREE HALVES OF "UNDISCOVERABLE", none of which are here:
 *   - /club is absent from SITEMAP_CANDIDATES (lib/routes.js). It is not in
 *     ROUTES at all; lib/club.js owns the path, because a route in the
 *     registry is a route that ends up in a footer column one day.
 *   - nothing on the public site links to it. The masthead tab is served by
 *     /api/club/me only to a request that already carries a member cookie,
 *     so the string "/club" is in neither the HTML nor the JS bundle of a
 *     non-member's page.
 *   - robots.txt does NOT disallow it, on purpose. A Disallow line publishes
 *     the path to everyone who reads robots.txt — which is precisely the
 *     people who would then go and look — and it would also block the crawl
 *     that is needed to SEE the noindex above. Same reasoning as the note at
 *     the top of app/robots.js.
 *
 * ---------------------------------------------------------------------------
 * ANALYTICS: a page view, and nothing else, ever.
 * ---------------------------------------------------------------------------
 * GA4 and the Meta Pixel are mounted globally in app/layout.jsx and they
 * record a page_view here like anywhere else. That is the whole of it. No
 * `club_join`, no `club_error`, no member number, no serial, no email — not
 * as an event parameter, not in a page title, not in a URL.
 *
 * It matters more here than elsewhere because the data is more sensitive: a
 * serial number identifies a specific physical unit and therefore its owner,
 * and GA4's own terms forbid sending it. The URLs under /club carry no
 * identifiers for the same reason — the member number lives in a signed
 * cookie, never in a path or a query string, so nothing identifying can leak
 * through a Referer header or an analytics page path either.
 */
export const metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true,
    },
  },
};

export default function ClubLayout({ children }) {
  return children;
}

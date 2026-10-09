import Image from 'next/image';
import { REGION, SHOW_PRIVACY, SOCIAL_LINKS } from '@/lib/iriz';

/**
 * A deliberately minimal footer: wordmark, market, socials, copyright.
 *
 * The four link columns (Product / Support / Company / Legal) are GONE. Every
 * route they pointed at still exists and is still reachable — /specs and
 * /compare from the masthead nav, /support and /about by URL, the legal pages
 * from the consent bar and the signup forms — they are simply not restated at
 * the bottom of every page.
 *
 * The Privacy Policy link is BACK in the bottom row, beside the copyright.
 * It had been removed on the reasoning that the notice only has to be visible
 * where the collection happens — which it still is, in components/ConsentNotice
 * and in both signup forms' fine print. That reasoning covers consent; it does
 * not cover someone who has already signed up and simply wants to re-read the
 * policy, and the footer is the first place anyone looks for it. Both now.
 *
 * It is gated on SHOW_PRIVACY (lib/iriz.js) like every other privacy surface,
 * so the four of them can be turned off together.
 *
 * NOT a client component any more. The only thing that ever needed state here
 * was the region <select>, and a static label needs none. Both consumers
 * (app/page.jsx, components/PageShell) are server components, so dropping
 * 'use client' keeps the footer out of every page's JS bundle.
 */

/**
 * Brand marks as inline SVG — Simple Icons paths, one 24x24 path each.
 *
 * Inline rather than an icon package: this is three glyphs, and pulling a
 * library in to render them would ship an entire icon set's worth of module
 * graph to put three shapes in a footer. `currentColor` lets the link's own
 * hover state drive the fill, so there is no separate colour to keep in sync.
 */
const ICONS = {
  linkedin: {
    label: 'LinkedIn',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  instagram: {
    label: 'Instagram',
    path: 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z',
  },
  youtube: {
    label: 'YouTube',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
};

// Render order. Driven by this list rather than Object.keys(SOCIAL_LINKS), so
// the order is a decision in one place and cannot be changed by reordering the
// config object.
const SOCIAL_ORDER = ['linkedin', 'instagram', 'youtube'];

export default function Footer() {
  // An icon renders only when its URL is non-empty, so no icon can ever link
  // to "#". All three are set today; this is what keeps that true when one is
  // cleared. See SOCIAL_LINKS in lib/iriz.js.
  const socials = SOCIAL_ORDER.filter((key) => SOCIAL_LINKS[key]).map((key) => ({
    key,
    href: SOCIAL_LINKS[key],
    ...ICONS[key],
  }));

  return (
    <footer className="border-t border-border-subtle bg-black">
      {/* `pb-28` below lg, not plain `py`: StickyBuyBar is `fixed bottom-0
          lg:hidden`, so on a phone it sits over whatever the footer puts last —
          which is now the copyright line. Same offset-for-the-bar precedent as
          components/ConsentNotice. Pages without the buy bar just get a little
          extra air under the footer, which costs nothing. */}
      <div className="section-container pb-28 pt-10 sm:pt-12 lg:pb-12">
        {/* One compact row. The columns that used to sit above this are gone,
            so the old `mt-14 ... border-t pt-8` that separated them from it
            went with them — kept, it would hold open the exact gap removing
            them was meant to close. */}
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Image
            src="/brand/wordmark-white.png"
            alt="BluNeuron"
            width={1715}
            height={327}
            className="h-4 w-auto"
          />

          <div className="flex items-center gap-5">
            {/* Static label, not a one-option <select>. See REGION in
                lib/iriz.js for why the picker is gone rather than disabled. */}
            <p className="flex items-center gap-1.5 text-xs text-white/60">
              {/* A drawn globe, not a flag emoji — see REGION in lib/iriz.js.
                  Stroked at 1.5 to match the masthead's icons. */}
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18" />
                <path d="M12 3c2.5 2.4 3.9 5.6 3.9 9S14.5 18.6 12 21c-2.5-2.4-3.9-5.6-3.9-9S9.5 5.4 12 3Z" />
              </svg>
              {REGION.label}
            </p>

            {/* The whole row goes when there are no handles to show, not just
                its contents: an empty <ul> still counts as a flex child, so the
                parent's `gap-5` would hold open a gap to the right of the
                region label with nothing in it. See SOCIAL_LINKS in
                lib/iriz.js. */}
            {socials.length > 0 && (
            <ul className="flex items-center gap-2">
              {socials.map((social) => (
                <li key={social.key}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`BluNeuron on ${social.label}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-[15px] w-[15px]"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d={social.path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
            )}
          </div>
        </div>

        {/* The row machinery is back with the link: stacked below sm so the
            two never crowd on a phone, side by side above it. With
            SHOW_PRIVACY off there is a single child again, and `gap` on a
            one-child flex row reserves nothing — so this lays out identically
            either way. */}
        <div className="mt-8 flex flex-col gap-2 border-t border-border-subtle pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <p>© {new Date().getFullYear()} BluNeuron. All rights reserved.</p>
          {SHOW_PRIVACY && (
            <a
              href="/legal/privacy"
              className="underline underline-offset-2 transition-colors hover:text-white"
            >
              Privacy Policy
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}

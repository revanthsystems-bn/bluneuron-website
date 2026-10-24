import Image from 'next/image';
import { REGION, SHOW_PRIVACY, SOCIAL_LINKS } from '@/lib/iriz';
import { FOOTER_COLUMNS, ROUTES, isDraftRoute } from '@/lib/routes';
import { COMPANY, allKnown } from '@/lib/site-config';

/**
 * THE LINK COLUMNS ARE BACK — Product, Support, Policies, Company.
 *
 * They were removed once, on the reasoning that every route they pointed at
 * was reachable some other way: /specs and /compare from the masthead,
 * /support and /about by URL, the legal pages from the consent bar and the
 * signup forms. That held while the site was a pre-launch teaser with four
 * destinations.
 *
 * It stops holding the moment the product sells on Amazon and Flipkart. A
 * marketplace buyer does not arrive at the homepage and browse down — they
 * arrive at a policy page from a search, or at this site from a link on an
 * invoice, already owning the thing, looking for a warranty claim or a return
 * window. The masthead nav is about choosing the product; it has nothing for
 * someone who already has one. The footer is where that person looks, on every
 * page, and sixteen routes cannot be reached from a masthead with four.
 *
 * Column content and order come from FOOTER_COLUMNS in lib/routes.js, which is
 * also where the paths themselves are defined — so a footer link cannot point
 * at a page that does not exist, and a renamed route updates here for free.
 *
 * THE IDENTITY LINE at the bottom (legal name, GSTIN, registered address) is a
 * disclosure, not decoration: India's Consumer Protection (E-Commerce) Rules
 * expect a seller's legal identity and address to be discoverable, and the
 * footer of every page is where that belongs. It renders only once all three
 * are real — a footer reading "GSTIN: [TBD]" looks like a broken site rather
 * than an unfinished one, and a half-filled disclosure is worse than none.
 * See lib/site-config.js.
 *
 * Still NOT a client component. Nothing here has state — the region is a
 * static label, and both consumers (app/page.jsx, components/PageShell) are
 * server components, so the whole footer stays out of every page's JS bundle.
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

/*
 * ===========================================================================
 * THE BOTTOM ROW IS PRIVACY POLICY ONLY ON THIS BRANCH. Do not add Warranty,
 * Warranty claim or Warranty registration to it here.
 * ===========================================================================
 *
 * Those three links are real, and they belong to the CLOUDFLARE branch's
 * footer. That footer has no link columns at all — the live site is a
 * single-product launch page, so its bottom row is the only place a warranty
 * link can live, and a visitor with a dead projector or a carton in hand has
 * nowhere else to look.
 *
 * This branch is the opposite case. FOOTER_COLUMNS (lib/routes.js) already
 * carries all three, a few centimetres above this row:
 *
 *   Support   -> Warranty registration, Warranty claim
 *   Policies  -> Warranty
 *
 * so repeating them here renders each one twice in the same footer. That is
 * exactly what the 2026-10-16 cloudflare -> launch-site merge did, and this
 * comment exists because the merge will happen again.
 *
 * MERGING, IN BOTH DIRECTIONS:
 *
 *   cloudflare -> launch-site   The bottom-row links will conflict here
 *                               again. Keep THIS version (`--ours` on
 *                               launch-site). Do not take the cloudflare
 *                               footer wholesale; it has no columns, so the
 *                               warranty links would be the only copy there
 *                               and the only copy here would be duplicated.
 *
 *   launch-site -> cloudflare   Take CLOUDFLARE's footer (`--ours` on
 *                               cloudflare), not this one. Resolving that
 *                               conflict in launch-site's favour would strip
 *                               the warranty links off the live site
 *                               entirely — this branch's columns, which are
 *                               where they would have gone, do not exist
 *                               there. /warranty is printed on the carton,
 *                               so a live footer with no warranty link is
 *                               not a cosmetic regression.
 *
 * In short: the two footers are deliberately different and neither is the
 * merge winner in both directions. Resolve per branch, never by taking
 * whichever side the tool offers first.
 */

export default function Footer() {
  // An icon renders only when its URL is non-empty, so no icon can ever link
  // to "#". All three are set today; this is what keeps that true when one is
  // cleared. See SOCIAL_LINKS in lib/iriz.js.
  const socials = SOCIAL_ORDER.filter((key) => SOCIAL_LINKS[key]).map((key) => ({
    key,
    href: SOCIAL_LINKS[key],
    ...ICONS[key],
  }));

  /**
   * A DRAFT page is not linked from the footer of every page on the site.
   *
   * The three things draft state already drives — the banner, the `noindex`
   * and the sitemap — all keep a crawler and a reader from treating an
   * unfinished page as finished. A sitewide footer link is the fourth, and
   * the most prominent of them: it puts "Grievance redressal" in front of
   * every visitor and lands the ones who need it most on a page that cannot
   * yet name its officer. The link returns on its own the moment the page
   * stops being a draft, from the same table (lib/routes.js) the other three
   * read. Columns that empty out entirely are dropped with it, so no heading
   * is left standing over nothing.
   */
  const columns = FOOTER_COLUMNS.map((column) => ({
    ...column,
    links: column.links.filter((link) => !isDraftRoute(link.href)),
  })).filter((column) => column.links.length > 0);

  // GSTIN is NOT part of this test. The disclosure that matters under the
  // Consumer Protection (E-Commerce) Rules is who the seller is and where
  // they are; the GSTIN is an extra line that renders when we have one and
  // is simply absent when we do not (COMPANY.gstin is '' — see the note on
  // it in lib/site-config.js). Requiring all three meant one unset field
  // suppressed the legal name and the address as well, which is the opposite
  // of what the test is for.
  const showIdentity = allKnown(COMPANY.legalName, COMPANY.registeredAddress);

  return (
    <footer className="border-t border-border-subtle bg-black">
      {/* `pb-28` below lg, not plain `py`: StickyBuyBar is `fixed bottom-0
          lg:hidden`, so on a phone it sits over whatever the footer puts last.
          Same offset-for-the-bar precedent as components/ConsentNotice. Pages
          without the buy bar just get a little extra air under the footer,
          which costs nothing. */}
      <div className="section-container pb-28 pt-14 sm:pt-16 lg:pb-12">
        {/*
          Two columns at 390px rather than four or one: four is unreadable at
          that width, and one turns a 17-link footer into a very long scroll
          past the end of the content.

          CSS MULTI-COLUMN below lg, not a 2-up grid. In a grid every row is as
          tall as its tallest cell, so "Product" (4 links) beside "Support" (6)
          leaves two links' worth of dead space before the next row starts —
          about 200px of empty black in the middle of the footer on a phone.
          Multi-column flows the four blocks into two balanced columns instead
          and packs them with no gaps. `break-inside-avoid` is what keeps a
          column's own links from being split across the fold.

          At lg it goes back to a real four-column grid, where each heading
          gets its own column and the balancing multi-column does is not wanted.
        */}
        <nav
          aria-label="Footer"
          className="columns-2 gap-x-6 lg:grid lg:grid-cols-4 lg:gap-x-6 lg:[column-count:auto]"
        >
          {columns.map((column) => (
            <div key={column.title} className="mb-10 break-inside-avoid lg:mb-0">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                {column.title}
              </h2>
              {/*
                THE TARGET IS 44px TALL; THE TEXT STILL LOOKS THE SAME SIZE.

                These rows were ~20px high — the smallest tap targets on the
                site, and there are 19 of them on every page. The fix is
                `inline-flex` + `min-h-[44px]` on the ANCHOR with the vertical
                space taken out of the list's own `space-y`, so each link grows
                into padding it already had around it rather than pushing the
                column taller. Measured at 390: the footer's height is within
                a few pixels of what it was.

                `w-fit` matters — a block-level anchor would make the whole
                column width clickable, which is a different bug.
              */}
              <ul className="mt-2 space-y-0">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.href}-${link.label}`}>
                    <a
                      href={link.href}
                      className="inline-flex min-h-[44px] w-fit min-w-[44px] items-center text-sm text-white/60 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* `mt-4` not `mt-14`: each column block already carries `mb-10` for
            the multi-column flow, so the gap below the last one is mostly
            there already. */}
        <div className="mt-4 flex flex-col items-start justify-between gap-6 border-t border-border-subtle pt-10 sm:flex-row sm:items-center lg:mt-14">
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
                      // The RING stays 32px — `before:` draws the 44px target
                      // around it. Growing the circle itself would have made
                      // three small marks into three heavy buttons; growing
                      // the hit area leaves the design alone.
                      className="group flex h-11 w-11 items-center justify-center rounded-full text-white/50 transition-colors duration-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
                    >
                      {/* The RING is 32px and the TARGET is 44px. Growing
                          the ring itself would turn three small marks into
                          three heavy buttons; this keeps the design and
                          gives the thumb something to hit. */}
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-white/20 group-hover:bg-white/5">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-[15px] w-[15px]"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d={social.path} />
                        </svg>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/*
          THE LEGAL BLOCK: identity and copyright as ONE unit.

          These used to be two sibling rows with their own spacing, which
          read as two unrelated afterthoughts — the registered entity, a
          gap, then the copyright. They are the same statement ("who
          publishes this site"), so they are now three lines of one block:
          legal name, registered address, copyright.

          `items-end` on the row, not `items-center`: the left column is
          three lines tall and the right is one, and the requirement is that
          the privacy link sits on the COPYRIGHT's line — the last one — not
          floating halfway up the address. Aligning the bottom edges puts
          the two single-line boxes on the same baseline, because both end
          with the same `leading-relaxed` text.

          Below sm it stacks and the link simply follows the copyright,
          where `items-end` has no effect on a one-column flex.
        */}
        <div className="mt-8 flex flex-col gap-3 border-t border-border-subtle pt-6 text-xs leading-relaxed text-white/55 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0">
            {showIdentity && (
              <>
                <p className="font-medium text-white/55">{COMPANY.legalName}</p>
                <p className="mt-1">{COMPANY.registeredAddress}</p>
                {allKnown(COMPANY.gstin) && <p className="mt-1">GSTIN: {COMPANY.gstin}</p>}
              </>
            )}
            <p className={showIdentity ? 'mt-1 text-white/55' : 'text-white/55'}>
              © {new Date().getFullYear()} BluNeuron. All rights reserved.
            </p>
            {/*
              THE ANDROID TRADEMARK ATTRIBUTION.

              The site states "Android 14" as a spec and the chipset board
              carries the Android robot, so the mark is used here and the
              attribution has to appear with it. The wording is copied from
              the printed IRIZ carton rather than written fresh, so the site
              and the box say the same sentence.

              It sits in the legal block, muted and last, because that is
              what an attribution is — not a claim about the product, and
              not something to give the weight of a feature line.
            */}
            <p className="mt-1 text-white/55">
              Android is a trademark of Google LLC.
            </p>
          </div>

          {/* Privacy Policy, right-aligned, on the copyright's line. It is
              the one link down here: the warranty links belong to the
              cloudflare footer — see "THE BOTTOM ROW IS PRIVACY POLICY ONLY
              ON THIS BRANCH" above — and everything else is in the columns.
              This repeats the Policies column entry on purpose; a privacy
              link beside the copyright is where people look for it. */}
          {SHOW_PRIVACY && (
            <a
              href={ROUTES.privacy}
              className="inline-flex min-h-[44px] w-fit shrink-0 items-center text-white/55 underline underline-offset-2 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft sm:text-right"
            >
              Privacy Policy
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}

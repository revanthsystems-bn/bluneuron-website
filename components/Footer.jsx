import BrandWordmark from './BrandWordmark';
import FooterSubscribe from './notify/FooterSubscribe';
import { REGION, SOCIAL_LINKS } from '@/lib/iriz';
import { FOOTER_ABOUT_LINK, FOOTER_COLUMNS, isDraftRoute } from '@/lib/routes';
import { COMPANY, allKnown } from '@/lib/site-config';

/**
 * LAYOUT A3 — a brand column and three lists, and every link exactly once.
 *
 * What this replaced, and why each piece went:
 *
 *   FOUR LIST COLUMNS, one of them half empty. "Company" held two links, and
 *   one of those ("Contact") pointed at the same page as Support's "Contact
 *   us". A heading over two items, one a duplicate, is a column that exists
 *   because the grid had a fourth slot. About moved into the brand column's
 *   tagline, where a sentence that already says where we are can carry the
 *   link to the page about us, and Contact lost its second label.
 *
 *   A MIDDLE ROW holding a SECOND copy of the wordmark, the region label and
 *   the social icons. The wordmark was already going to be at the top of the
 *   brand column; the socials belong beside the brand they are handles for;
 *   and the region is one word, which does not need a row of its own. The row
 *   is gone, the socials are in the brand column, and "India" sits in the
 *   bottom bar.
 *
 *   PRIVACY POLICY TWICE — once in the Policies column and again beside the
 *   copyright, on the convention that people look for it next to the year.
 *   The bottom-right copy is gone. Which copy survived is argued in
 *   lib/routes.js; the rule it serves is the next paragraph.
 *
 * EVERY FOOTER HREF IS DISTINCT. The columns, the brand column's About link
 * and the three social marks between them may not name a URL twice — a footer
 * that offers the same page under two labels makes the reader work out which
 * copy is the real one, and that is the defect this layout was drawn to fix.
 * It is asserted rather than trusted: scripts/assert-footer-links.mjs fetches
 * the rendered HTML of every route and fails on a repeated footer href. The
 * one visible consequence is in the subscribe box, whose consent line names
 * the Privacy policy without linking it a second time — see
 * components/notify/FooterSubscribe.
 *
 * Column content and order come from FOOTER_COLUMNS in lib/routes.js, which
 * is also where the paths themselves are defined — so a footer link cannot
 * point at a page that does not exist, and a renamed route updates here for
 * free.
 *
 * THE IDENTITY LINE in the bottom bar (legal name, registered address) is a
 * disclosure, not decoration: India's Consumer Protection (E-Commerce) Rules
 * expect a seller's legal identity and address to be discoverable, and the
 * footer of every page is where that belongs. It is now joined onto the
 * copyright as one sentence rather than stacked as its own block — same
 * statement, one line of it.
 *
 * STILL NOT A CLIENT COMPONENT. The subscribe box is the only interactive
 * part and it is its own `'use client'` island, so the columns, the identity
 * line and the social marks are all server-rendered and the footer's own
 * markup stays out of every page's JS bundle.
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

/**
 * The tagline. Two facts the site already states elsewhere — what IRIZ is for
 * (components/WhyIriz: "made for Indian homes") and where the company is
 * (COMPANY.registeredAddress, printed in full a few lines below this) — and
 * no third one. A footer is not the place to introduce a claim; it is the
 * place to repeat the settled ones in one short sentence.
 */
const TAGLINE = 'Home projectors made for Indian homes. Based in Coimbatore.';

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
   * the most prominent of them. The link returns on its own the moment the
   * page stops being a draft, from the same table (lib/routes.js) the other
   * three read. Columns that empty out entirely are dropped with it, so no
   * heading is left standing over nothing.
   */
  const columns = FOOTER_COLUMNS.map((column) => ({
    ...column,
    links: column.links.filter((link) => !isDraftRoute(link.href)),
  })).filter((column) => column.links.length > 0);

  // The registered address is appended to the copyright only once it is real.
  // GSTIN is not part of this test: the disclosure that matters under the
  // Consumer Protection (E-Commerce) Rules is who the seller is and where they
  // are, and COMPANY.gstin is '' today — an extra segment that renders when we
  // have one and is simply absent when we do not. Requiring both meant one
  // unset field suppressed the address as well.
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
          THE GRID, AND THE THREE SHAPES IT TAKES.

          One `grid`, three breakpoints, and the brand block always first in
          the DOM — so the reading order a screen reader and a keyboard get is
          the reading order every width shows, with no `order-*` anywhere.

            < 700px   2 columns. Brand spans both, then Shop beside Support,
                      then Policies spanning both with its own list split into
                      two text columns. Six policy links in a single column
                      under a full-width heading is a narrow ribbon of text
                      with half the width empty beside it.
            700-1023  3 columns. Brand spans all three on top; the three lists
                      sit in one row, which is what a tablet has the width for
                      and a phone does not.
            >= 1024   `1.4fr` for the brand and three equal list columns. The
                      brand column carries a logo, a sentence, a 52px pill
                      and a row of buttons, so an equal quarter squeezes the
                      pill. The gap tightens to 32px below xl, which is what
                      keeps the list columns at 182px rather than 176 — the
                      width "FAQ & troubleshooting" needs to stay on one line
                      at exactly 1024. Measure that link's height before
                      changing either figure; it is the first thing to wrap.

                      THE BRAND TRACK IS `minmax(0,1.4fr)`, NOT `1.4fr`.
                      A bare `1.4fr` is `minmax(auto,1.4fr)`, so the track
                      cannot go below its content's min-content size — and
                      the subscribe pill reports a min-content of 334px even
                      though its input is `flex-1 min-w-0` and shrinks
                      perfectly well in practice (it does, at 360). At 1024
                      that froze the brand column at 334px and left the three
                      lists 155px each: the declared ratio silently ignored,
                      and every list column 27px narrower than it asked for.
                      `minmax(0,…)` is what makes the ratio the ratio.

          700px IS NOT A TAILWIND BREAKPOINT, hence `min-[700px]:` and
          `max-[699px]:` rather than `sm:`/`md:`. The real boundary is where
          three headings stop fitting across the viewport, and 640 and 768 both
          sit on the wrong side of it.

          `gap-y-10` and nothing larger: the old footer's rows each carried
          their own `mb-10` plus a `mt-14` between blocks, which is where the
          empty black bands came from. One gap, declared once.
        */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 min-[700px]:grid-cols-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:gap-x-8 xl:gap-x-10">
          {/* ---- The brand column ---------------------------------- */}
          <div className="col-span-2 min-[700px]:col-span-3 lg:col-span-1">
            {/* The SAME mark as the masthead, from the same component — see
                components/BrandWordmark. Not a link: this is the footer of
                the page you are already on, and "/" is reached from the
                masthead logo on every one of them. One fewer href down here
                is also one fewer chance of a duplicate. */}
            <BrandWordmark variant="white" className="h-4 w-auto" />

            {/* The About link finishes the sentence rather than sitting under
                it — white and arrowed so it reads as the one thing to click
                in a paragraph of grey, and inline so it costs no row of its
                own. The arrow is `aria-hidden`: "About us →" is announced as
                "About us".

                `min-h-[44px] -my-2.5` — THE TARGET IS 44px TALL AND THE LINE
                IS NOT. An inline-flex child contributes its MARGIN box to the
                line box, so a bare `min-h-[44px]` here stretched the line the
                link sits on to 44px and left a visible step between the
                tagline's two lines. The negative margin pulls 10px off each
                side of that contribution — back to the paragraph's own
                ~24px leading — while the element's own box, which is what a
                thumb hits, stays 44px. Same trick as the column links, which
                grow into padding the list already had.

                WCAG 2.2 exempts a link inside a sentence from the target-size
                minimum, so this is more than the criterion asks for; it costs
                nothing now that the line box is not paying for it. */}
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/50">
              {TAGLINE}{' '}
              <a
                href={FOOTER_ABOUT_LINK.href}
                className="-my-2.5 inline-flex min-h-[44px] items-center whitespace-nowrap font-medium text-white underline-offset-4 transition-colors hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
              >
                {FOOTER_ABOUT_LINK.label}&nbsp;<span aria-hidden="true">→</span>
              </a>
            </p>

            {/* The launch list, the same one as the modal and the homepage
                form. `max-w-sm` so the pill does not stretch the full width
                of a tablet. */}
            <div className="mt-1 max-w-sm">
              <FooterSubscribe />
            </div>

            {/* The whole row goes when there are no handles to show, not just
                its contents: an empty <ul> still reserves its margin. See
                SOCIAL_LINKS in lib/iriz.js. */}
            {socials.length > 0 && (
              <ul className="mt-6 flex items-center gap-2">
                {socials.map((social) => (
                  <li key={social.key}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`BluNeuron on ${social.label}`}
                      className="group flex h-11 w-11 items-center justify-center rounded-full text-white/55 transition-colors duration-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
                    >
                      {/* The RING is 36px and the TARGET is 44px. Growing the
                          ring itself would turn three small marks into three
                          heavy buttons; the anchor carries the thumb-sized
                          box and the ring keeps the design. */}
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-white/20 group-hover:bg-white/5">
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

          {/* ---- The three lists ----------------------------------- */}
          {/*
            A <nav> PER LIST, each with its own `aria-label` and its own
            heading — not one <nav aria-label="Footer"> around all of them.
            Three labelled landmarks are three entries in a screen reader's
            landmark list, so "Policies" is reachable directly instead of by
            walking a 16-link block; `aria-label` and the visible <h2> carry
            the same word, so what is announced is what is on screen.

            The heading is a real <h2> and not a styled <p>: the uppercase and
            the letter-spacing are CSS (`.footer-heading`), so the data in
            lib/routes.js stays readable prose and nothing is announced as an
            acronym.
          */}
          {columns.map((column) => {
            // Policies is the long list, and the only one that spans on a
            // phone. Keyed off the column's own length rather than its title
            // so re-ordering lib/routes.js cannot leave the span on the wrong
            // one — the widest list is the one that needs the width.
            const wide = column.links.length >= 6;

            return (
              <nav
                key={column.title}
                aria-label={column.title}
                className={wide ? 'col-span-2 min-[700px]:col-span-1' : undefined}
              >
                <h2 className="footer-heading">{column.title}</h2>
                {/* `space-y-0`: the 44px anchors already carry the rhythm,
                    and adding gaps between them would stretch the column to
                    twice the height it needs. */}
                <ul
                  className={`mt-2 space-y-0 ${
                    wide ? 'max-[699px]:columns-2 max-[699px]:gap-x-6' : ''
                  }`}
                >
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.href}`} className="break-inside-avoid">
                      <a
                        href={link.href}
                        {...(link.external
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : null)}
                        className="footer-link"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            );
          })}
        </div>

        {/*
          THE BOTTOM BAR — a thin rule, the legal statement on the left, the
          market on the right.

          ONE BLOCK, not the three it used to be. The legal name, the address
          and the copyright were separate stacked rows reading as three
          unrelated afterthoughts; they are one statement ("who publishes this
          site") and are now one sentence, with the trademark attribution as
          the quiet second line under it.

          `items-center` on the row and `shrink-0` on the market label: the
          left column is two lines and the right is one, and the one-liner
          sits in the middle of them rather than pinned to either edge.

          `text-white/55` and not quieter, for the same measured reason as
          `.footer-heading` — see the note on it in app/globals.css. At 12px
          on black, white/45 is 4.42:1 and fails AA; this is 6.2:1. A legal
          disclosure is the last text on the site that should be hard to
          read, so it does not get to be the dimmest.
        */}
        <div className="mt-12 flex flex-col gap-4 border-t border-border-subtle pt-6 text-xs leading-relaxed text-white/55 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p>
              © {new Date().getFullYear()} {showIdentity ? COMPANY.legalName : 'BluNeuron'}
              {showIdentity && <> · {COMPANY.registeredAddress}</>}
              {showIdentity && allKnown(COMPANY.gstin) && <> · GSTIN: {COMPANY.gstin}</>}
            </p>
            {/*
              THE ANDROID TRADEMARK ATTRIBUTION.

              The site states "Android 14" as a spec and the chipset board
              carries the Android robot, so the mark is used here and the
              attribution has to appear with it. The wording is copied from
              the printed IRIZ carton rather than written fresh, so the site
              and the box say the same sentence.

              It sits last and muted because that is what an attribution is —
              not a claim about the product, and not something to give the
              weight of a feature line.
            */}
            <p className="mt-1">Android is a trademark of Google LLC.</p>
          </div>

          {/* The market, and the only thing on the right. A static label, not
              a one-option <select> — see REGION in lib/iriz.js for why the
              picker is gone rather than disabled. The bottom-right Privacy
              Policy link that used to sit here is gone; see the note at the
              top of this file. */}
          <p className="flex shrink-0 items-center gap-1.5">
            {/* A drawn globe, not a flag or a globe emoji. Chrome on Windows
                ships no flag glyphs, and emoji globes render at whatever size
                and colour the platform font decides; this one is stroked at
                1.5 to match the masthead's icons and is identical
                everywhere. See REGION in lib/iriz.js. */}
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
        </div>
      </div>
    </footer>
  );
}

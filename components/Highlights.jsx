import Reveal from './Reveal';
import HighlightBoard from './boards/HighlightBoard';
import HighlightBanner from './boards/HighlightBanner';
import { HIGHLIGHT_BANNERS, HIGHLIGHT_BOARDS } from '@/lib/iriz';

/**
 * "What You Get" — three typeset boards, then the two wide banners.
 *
 * THIS SECTION USED TO BE SIX IMAGES. Four detail boards (one of them 1.8MB)
 * and two banners (1.8MB and 1.9MB), each a PNG with its headline, figures
 * and callout strip burned into the pixels — about 7.3MB of artwork to say
 * what is now a few hundred bytes of markup. lib/iriz.js records what was
 * re-typeset, which three figures were corrected against the retail box, and
 * why the "Access to 10,000+ Apps" board was deleted rather than redrawn.
 *
 * WHAT WENT WITH THE IMAGES:
 *
 *   - components/HighlightCarousel, and with it the only client component
 *     this section had. The carousel existed because the artwork could not
 *     be read at 390px; type can, so below `md` the boards simply stack.
 *     A swipe carousel that hides two of three claims behind a gesture is a
 *     worse way to read three short panels than scrolling past them.
 *   - The `img-tile` / `img-field-*` / `hl-frame` / `hl-glow` machinery in
 *     app/globals.css, which existed to dissolve each PNG's hard rectangular
 *     edge into the page. Type has no edge to dissolve.
 *   - The `--hl-chrome` one-screen height computation. It was there to fit
 *     four fixed-aspect images into a 1440x900 viewport without scrolling;
 *     three re-flowing boards do not need their height solved for them, and
 *     pinning a section to the viewport is what made the artwork small in
 *     the first place.
 *
 * ENTIRELY SERVER-RENDERED now, images and client JavaScript both gone.
 */
export default function Highlights() {
  return (
    <section id="highlights" className="scroll-mt-20 border-b border-border-subtle bg-[#080808] section-y">
      <div className="section-container">
        <Reveal className="max-w-prose-wide">
          <p className="eyebrow mb-3">What You Get</p>
          <h2 className="h2">The things that actually change the picture.</h2>
        </Reveal>

        {/* Three equal columns at lg, two at md, stacked below. `items-stretch`
            is the default and is what lets the boards' figure wells absorb
            the difference in copy length so the callout strips line up. */}
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:mt-12 lg:grid-cols-3">
          {HIGHLIGHT_BOARDS.map((board, i) => (
            <Reveal key={board.id} y={20} delay={Math.min(i, 3) * 0.08} className="h-full">
              <HighlightBoard board={board} />
            </Reveal>
          ))}
        </div>

        {/* The two wide banners. Equal columns now, not the aspect-ratio
            fractions the images needed — these are text blocks and have no
            aspect to preserve. */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {HIGHLIGHT_BANNERS.map((banner, i) => (
            <Reveal key={banner.id} y={20} delay={i * 0.08} className="h-full">
              <HighlightBanner banner={banner} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

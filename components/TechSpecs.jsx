import Image from 'next/image';
import Reveal from './Reveal';
import CountUp from './CountUp';
import { MEDIA } from '@/lib/iriz';

/**
 * Under the Hood — two spec boards over three stat tiles.
 *
 * WHY THE NUMBER TILES WENT. This section used to restate Resolution, Chipset,
 * Throw Ratio and Low-Latency as four small number tiles beside a chipset
 * render. The two boards below already state every one of those, in the
 * manufacturer's own artwork and in more detail than a three-word tile could:
 * 02-spec-sheet carries native 1080P, 3.5" LTPS LCD, Allwinner H723, auto
 * focus, 0.9-5m, 35-200", and 1:1; 07-latency carries the 0.004s lockup. The
 * tiles were the same claims a second time, smaller.
 *
 * THE "AUTO FOCUS" IN THAT LIST AND IN THE ALT TEXT BELOW IS CORRECT, and was
 * once thought not to be. A sweep (dc45c7a) removed auto focus from the whole
 * site because the carton prints 4-point auto KEYSTONE and names no focus
 * behaviour, and these two mentions were recorded as leftovers that had
 * escaped it. They had not: the product owner CONFIRMED AUTO FOCUS ON
 * 30 Oct 2026, so the board's pixels were right all along. FULL_SPEC_SHEET
 * now carries a Focus row, and the alt text below needs no change.
 *
 * `SPECS` in lib/iriz.js is UNTOUCHED — /specs and the comparison table still
 * read it. This component simply no longer maps over it, which is why it takes
 * no `specs` prop any more. The two surviving numbers are written out here
 * rather than indexed out of `SPECS`, because they are a chosen pair with
 * bespoke copy, not the first two rows of a list: pulling `SPECS[0]` and
 * `SPECS[5]` would silently change what this section shows the next time
 * someone reorders that array.
 *
 * LAYOUT. Top row is two tiles, each locked to its artwork's CONTENT ratio
 * and filled edge to edge by it — no padding, no letterbox, no baked-in black
 * margin, no tile background on show. They still finish level, because the
 * columns carry the ratio that makes that true (758fr/644fr; the arithmetic
 * is on the grid below). Below lg it is one column in DOM order: spec board,
 * latency board, then the three stat tiles, each board still at its own
 * ratio.
 *
 * THE SECOND BOARD IS LOAD-BEARING FOR THIS LAYOUT. Every number here — both
 * tile ratios, the column ratio, both object-positions — is derived from
 * having exactly these two images side by side. Replace either one and all of
 * them have to be re-measured from the new file; drop one and the survivor
 * becomes a full-width tile that would render the 750px artwork far above
 * native. Either way, re-derive — do not just delete a column.
 */

const STATS = [
  {
    eyebrow: 'Brightness',
    // CountUp animates the leading digits and leaves the rest; "500" counts,
    // "ANSI lm" is the static suffix beside it.
    value: '500',
    suffix: 'ANSI lm',
    line: 'Measured on the wall, not at the bulb.',
  },
  {
    eyebrow: 'Audio',
    value: '5W',
    suffix: 'mono',
    line: 'Built-in speaker. No soundbar needed to start.',
  },
];

/*
 * THE TILE RATIOS ARE THE ARTWORK'S *CONTENT* BOX, NOT THE FILE'S.
 *
 * Both PNGs carry black padding baked in, which rendered as empty space at
 * the foot of each card once the tiles were sized to the files. The tiles are
 * sized to the content instead and `object-cover` takes the padding off.
 * Measured per row as max luminance across the row, so one lit pixel keeps
 * the row:
 *
 *   02-spec-sheet.png  750x698   bottom 54px at luminance 0 — pure black at
 *                                every threshold tried, and nothing at the
 *                                other three edges (row 0 peaks at 221).
 *                                Content box 750x644.
 *   07-latency.png     750x889   top 56px and bottom 75px. NOT pure black:
 *                                these peak at 7-10, a faint vignette rather
 *                                than true padding, which is why the trim is
 *                                taken at a threshold of 16 and not lower.
 *                                Invisible on a black card either way.
 *                                Content box 750x758, offset 56 from the top.
 *
 * The 22px of near-black down the latency board's right edge is left alone.
 * A single `object-cover` crops on one axis only — the one its tile is
 * "short" on — and the vertical trim is the one that shows.
 *
 * Re-measure both if either file is replaced: these numbers set the tile
 * ratios, the column ratio and the object-position below.
 */
const BOARDS = [
  {
    src: MEDIA.detail.specSheet,
    // 750x644 — the content box. `object-top` anchors the crop so all 54px
    // comes off the BOTTOM, which is where the padding is; the artwork runs
    // to row 0 at the top and a centred crop would eat 27px of it.
    className: 'board-spec aspect-[750/644]',
    imgClass: 'object-top',
    alt:
      'IRIZ specification board: native 1080P (1920×1080) resolution, 3.5-inch LTPS LCD display '
      + 'technology, Allwinner H723 chipset, auto focus, 0.9m–5m projection distance, 35–200 inch '
      + 'projection size, and a 1:1 throw ratio.',
  },
  {
    src: MEDIA.detail.latency,
    // 750x758 — the content box. The crop is 889-758 = 131px, and it has to
    // land as 56 off the top and 75 off the bottom, so the vertical
    // object-position is 56/131 = 42.75% rather than the default 50%.
    className: 'board-latency aspect-[750/758]',
    imgClass: 'object-[50%_42.75%]',
    alt:
      'High definition, low latency: a 0.004s response time shown against a 2-second lag, '
      + 'illustrated by a sharp game frame beside a blurred, still-loading one.',
  },
];

export default function TechSpecs({
  eyebrow = 'Under the Hood',
  heading = 'Engineered for real rooms, not spec sheets.',
}) {
  return (
    <section id="specs" className="border-b border-border-subtle bg-black-soft py-20 scroll-mt-20">
      <div className="section-container">
        <Reveal className="max-w-lg">
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">{heading}</h2>
        </Reveal>

        {/* TOP ROW — the two boards.
            `758fr 644fr`, and those are not arbitrary: they are the two
            CONTENT heights from the table above. Each tile is locked to its
            own content ratio, so tile height is column width x (its content
            height / 750). Giving the columns the ratio 758:644 makes the two
            products identical —
              left  = W x 758/1402 x 644/750
              right = W x 644/1402 x 758/750
            — so the boards finish exactly level while each is filled edge to
            edge by its own artwork with the padding cropped off. That is the
            pair of constraints the original `1.3fr 1fr` plus a shared
            min-height could not satisfy at once.

            Trimming the spec sheet ALONE would want 889fr/644fr, which at the
            1440 container takes the left column to 751.6px — past the 750px
            source, by a hair, but past it. Trimming both keeps it at 700px.
            That is the reason the latency board's near-black edges are
            cropped too and not left as they were.

            `items-stretch` (the default) holds the two to a common height
            against sub-pixel rounding. */}
        <div className="mt-12 grid grid-cols-1 items-stretch gap-3 sm:gap-4 lg:grid-cols-[758fr_644fr]">
          {BOARDS.map((board) => (
            <Reveal
              key={board.src}
              y={0}
              scale={1.04}
              amount={0.25}
              className={`bento-tile relative overflow-hidden ${board.className}`}
            >
              {/* `object-cover` with a per-board anchor. The tile is the
                  artwork's CONTENT ratio, so cover scales to the tile width
                  and takes the overflow off the top and bottom — which is
                  exactly the baked-in padding, provided the anchor puts it
                  where the padding actually is. That is what `imgClass`
                  carries, and why neither board can use the default centre.

                  NOT upscaled past the source. Both files are 750px wide; the
                  container caps at 1440 and the left column takes
                  1296 x 758/1402 = 700px of it, so neither board is ever
                  asked to render above native.

                  No padding and no edge feather. Both existed to dress the
                  bare tile the artwork used to float in — there isn't any
                  now, and on these files the outer band is where the baked-in
                  type runs closest to the edge. The tile's own radius and
                  hairline finish the boundary, exactly as on every other
                  card. */}
              <Image
                src={board.src}
                alt={board.alt}
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className={`object-cover ${board.imgClass}`}
                preload={false}
                loading="lazy"
              />
            </Reveal>
          ))}
        </div>

        {/* BOTTOM ROW — three stat tiles. */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
          {STATS.map((stat, i) => (
            <Reveal
              key={stat.eyebrow}
              y={20}
              delay={i * 0.06}
              // Content anchored to the BOTTOM, label at the top: the eyebrow
              // sits in normal flow and `mt-auto` pushes everything after it
              // down, so all three tiles share a baseline whatever their
              // line lengths do.
              className="bento-tile stat-tile flex min-h-[220px] flex-col p-6 sm:min-h-[260px] sm:p-7"
            >
              <p className="eyebrow">{stat.eyebrow}</p>
              <div className="mt-auto pt-8">
                <p className="flex items-baseline gap-2.5">
                  <CountUp value={stat.value} className="stat-number" />
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/55">
                    {stat.suffix}
                  </span>
                </p>
                <p className="mt-3 text-sm text-white/55">{stat.line}</p>
              </div>
            </Reveal>
          ))}

          <Reveal
            y={20}
            delay={0.12}
            className="bento-tile stat-tile flex min-h-[220px] flex-col p-6 sm:min-h-[260px] sm:p-7"
          >
            <p className="eyebrow">Everything else</p>
            <div className="mt-auto pt-8">
              <p className="text-lg font-semibold tracking-tight text-white">Want the full sheet?</p>
              <a
                href="/specs"
                className="mt-2 inline-flex min-h-[44px] items-center text-sm font-semibold text-accent-soft underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
              >
                See full specs →
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

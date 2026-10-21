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
 * `SPECS` in lib/iriz.js is UNTOUCHED — /specs and the comparison table still
 * read it. This component simply no longer maps over it, which is why it takes
 * no `specs` prop any more. The two surviving numbers are written out here
 * rather than indexed out of `SPECS`, because they are a chosen pair with
 * bespoke copy, not the first two rows of a list: pulling `SPECS[0]` and
 * `SPECS[5]` would silently change what this section shows the next time
 * someone reorders that array.
 *
 * LAYOUT. Top row is two tiles, each locked to its own artwork's aspect ratio
 * and each filled edge to edge by it — no padding, no letterbox, no tile
 * background on show. They still finish level, because the columns carry the
 * ratio that makes that true (889fr/698fr; the arithmetic is on the grid
 * below). Below lg it is one column in DOM order: spec board, latency board,
 * then the three stat tiles, each board still at its own ratio.
 *
 * THE SECOND BOARD IS LOAD-BEARING FOR THIS LAYOUT. The column ratio is
 * derived from having exactly these two images side by side. Replace either
 * one and 889/698 has to be recomputed from the new dimensions; drop one and
 * the survivor becomes a full-width tile whose aspect ratio would render the
 * 750px artwork far above native. Either way, re-derive — do not just delete
 * a column.
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

const BOARDS = [
  {
    src: MEDIA.detail.specSheet,
    // Image is 750x698, and the tile takes that ratio at EVERY breakpoint.
    //
    // It used to drop to `lg:aspect-auto` and inherit a 560px min-height
    // shared with the taller latency board. The board is wider than it is
    // tall, so `object-contain` inside that box left the artwork floating:
    // the tile's own gradient showed as a light grey band across the top and
    // a dead black area under the image. Matching the tile to the art is
    // what removes both — there is no leftover box for a background to show
    // through. The two tiles still finish level; see the grid below.
    className: 'board-spec aspect-[750/698]',
    alt:
      'IRIZ specification board: native 1080P (1920×1080) resolution, 3.5-inch LTPS LCD display '
      + 'technology, Allwinner H723 chipset, auto focus, 0.9m–5m projection distance, 35–200 inch '
      + 'projection size, and a 1:1 throw ratio.',
  },
  {
    src: MEDIA.detail.latency,
    // Image is 750x889, and the same rule applies.
    className: 'board-latency aspect-[750/889]',
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
            `889fr 698fr`, and those are not arbitrary: they are the two
            images' heights. Each tile is locked to its own art's aspect
            ratio, so tile height is column width x (its own height / 750).
            Giving the columns the ratio 889:698 makes the two products
            identical —
              left  = W x 889/1587 x 698/750
              right = W x 698/1587 x 889/750
            — so the boards finish exactly level while each one is still
            filled edge to edge by its own artwork. That is the pair of
            constraints the old `1.3fr 1fr` plus a shared min-height could
            not satisfy at once; 1.3 was close to 889/698 = 1.274, which is
            why it nearly worked and still letterboxed.
            `items-stretch` (the default) holds the two to a common height
            against sub-pixel rounding. */}
        <div className="mt-12 grid grid-cols-1 items-stretch gap-3 sm:gap-4 lg:grid-cols-[889fr_698fr]">
          {BOARDS.map((board) => (
            <Reveal
              key={board.src}
              y={0}
              scale={1.04}
              amount={0.25}
              className={`bento-tile relative overflow-hidden ${board.className}`}
            >
              {/* `object-cover`, and it crops nothing: the tile is locked to
                  this image's own aspect ratio, so cover and contain resolve
                  to the same box. Cover is the one of the two that cannot
                  leave a sliver of tile showing when sub-pixel rounding puts
                  the two a fraction apart, which is the whole point here.

                  NOT upscaled past the source. Both files are 750px wide; the
                  container caps at 1440 and the left column takes
                  1296 x 889/1587 = 726px of it, so neither board is ever
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
                className="object-cover"
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

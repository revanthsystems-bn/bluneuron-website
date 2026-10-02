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
 * LAYOUT. Top row 1.3fr/1fr, equal height — grid items stretch, so both tiles
 * take the taller of the two and each image centres in its own box. Below lg
 * everything is one column in DOM order: spec board, latency board, then the
 * three stat tiles.
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
    suffix: '4Ω',
    line: 'Built-in speaker. No soundbar needed to start.',
  },
];

const BOARDS = [
  {
    src: MEDIA.detail.specSheet,
    // 1.3fr side. Image is 750x698.
    // Below lg the tile takes the IMAGE's own aspect ratio, so the board
    // renders the full width of the column instead of being letterboxed
    // inside a fixed-height box. At lg the shared `min-h` takes over, because
    // there the two tiles must match each other's height, not their own art.
    className: 'board-spec aspect-[750/698] lg:aspect-auto',
    alt:
      'IRIZ specification board: native 1080P (1920×1080) resolution, 3.5-inch LTPS LCD display '
      + 'technology, Allwinner H723 chipset, auto focus, 0.9m–5m projection distance, 35–200 inch '
      + 'projection size, and a 1:1 throw ratio.',
  },
  {
    src: MEDIA.detail.latency,
    // 1fr side. Image is 750x889.
    className: 'board-latency aspect-[750/889] lg:aspect-auto',
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

        {/* TOP ROW — the two boards. `lg:grid-cols-[1.3fr_1fr]` rather than
            column spans: 1.3/1 is not expressible on a 12-track grid without
            rounding it to 7/5, which is a different ratio. `items-stretch` is
            the default and is what gives them a common height. */}
        <div className="mt-12 grid grid-cols-1 items-stretch gap-3 sm:gap-4 lg:grid-cols-[1.3fr_1fr]">
          {BOARDS.map((board) => (
            <Reveal
              key={board.src}
              y={0}
              scale={1.04}
              amount={0.25}
              className={`bento-tile relative overflow-hidden lg:min-h-[560px] ${board.className}`}
            >
              {/* object-contain, centred, and NOT upscaled past the source.
                  Both files are 750px wide; at 1440 the left box is ~733 and
                  the right ~563, and the tile's min-height keeps each image
                  height-constrained below that — so neither is ever asked to
                  render above native. The matched tile background fills the
                  rest, and `.board-media` feathers the last hard edge. */}
              <Image
                src={board.src}
                alt={board.alt}
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                // No padding below lg: the tile already matches the image's
                // aspect ratio there, so any inset shrinks the board instead of
                // framing it — and these are the breakpoints where the baked-in
                // type has the least room to spare.
                className="board-media object-contain lg:p-5"
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
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">
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
                className="mt-3 inline-block text-sm font-semibold text-accent-soft underline-offset-4 hover:underline"
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

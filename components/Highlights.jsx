import Image from 'next/image';
import Reveal from './Reveal';
import HighlightCarousel from './HighlightCarousel';
import { HIGHLIGHT_BANNERS, HIGHLIGHT_BOARDS } from '@/lib/iriz';

/**
 * "What You Get" — four detail boards that fit on one screen, then the two
 * framed banners.
 *
 * Each of the four images carries its own headline in the pixels, which is why
 * there is no tile copy anywhere in here: an eyebrow and a headline beside a
 * board that already says "Access to 10,000+ Apps" is the same sentence twice.
 * `HIGHLIGHTS` in lib/iriz.js is untouched and still on disk; it is simply no
 * longer read here.
 *
 * ONE SCREEN. The first block is `min-h-svh` with its content vertically
 * centred, and the tile height is computed so the heading plus all four boards
 * land inside a 1440x900 viewport with nothing to scroll. The chrome figures
 * that computation subtracts are MEASURED at that viewport, not guessed — see
 * `--hl-chrome` in app/globals.css.
 *
 * THREE LAYOUTS, one data set:
 *   <md   a swipe carousel (components/HighlightCarousel)
 *   md    2x2, tile height capped so the block still fits a screen
 *   lg+   a single row of four
 *
 * MOTION. The once-only reveal (fade + scale 1.04 -> 1) lives on the grid item;
 * the hover lift and the image's 1.03 scale live on an inner, non-animated
 * element. They are deliberately on different nodes: framer writes `transform`
 * inline, so a CSS `:hover` transform on the same element would be overridden
 * by the reveal's own final transform.
 */

/**
 * Per-board presentation: the aspect-ratio class for the box sized to the
 * artwork, and the tile background built in app/globals.css from that image's
 * own sampled edge colours. Index-aligned with HIGHLIGHT_BOARDS.
 *
 * These live HERE, not in the data object, because tailwind.config.js only
 * scans ./app and ./components — and Tailwind TREE-SHAKES `@layer components`
 * rules whose class names it cannot find in that content, hand-written ones
 * included. A `.img-field-*` rule referenced only from lib/iriz.js is silently
 * dropped from the build: the class stays on the element, the rule does not
 * exist, and every tile renders on transparent black with a hard rectangle
 * where the artwork ends. That is exactly what happened on an earlier pass.
 */
const TILE = [
  { ratio: 'aspect-[1014/1551]', field: 'img-field-apps' },     // 11-apps-10000
  { ratio: 'aspect-[750/1240]', field: 'img-field-chipset' },   // 06-chipset
  { ratio: 'aspect-[750/1065]', field: 'img-field-screen' },    // 09-screen-size
  { ratio: 'aspect-[750/967]', field: 'img-field-keystone' },   // 08-keystone
];

export default function Highlights() {
  return (
    <section id="highlights" className="scroll-mt-20 border-b border-border-subtle bg-[#080808]">
      {/* --- ONE SCREEN: heading + four boards ------------------------- */}
      {/* `pt-16` is the fixed masthead's own height. The centring has to happen
          in the space BELOW the bar, not in the whole viewport, or the heading
          ends up underneath it. */}
      <div className="flex min-h-svh flex-col justify-center pt-16">
        <div className="section-container">
          <Reveal className="max-w-2xl">
            <p className="eyebrow mb-3">What You Get</p>
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
              The things that actually change the picture.
            </h2>
          </Reveal>
        </div>

        {/* md and up. Below md this is replaced by the carousel, which has to
            bleed past the container, so the two are siblings rather than one
            grid that reflows. */}
        <div className="section-container">
          <div className="mt-10 hidden gap-4 md:grid md:grid-cols-2 lg:mt-12 lg:grid-cols-4">
            {HIGHLIGHT_BOARDS.map((board, i) => (
              <Reveal
                key={board.image}
                y={0}
                scale={1.04}
                amount={0.2}
                delay={i * 0.1}
                className="hl-tile-h"
              >
                {/* The <img> IS the artwork box. next/image with intrinsic
                    width/height plus `max-h/max-w` lets the browser do the
                    contain fit itself, in whichever direction binds — width at
                    lg, height at md — while the flex tile centres it.

                    An aspect-ratio wrapper cannot do this: give it `w-full`
                    and a ratio and it overflows at md; add `max-h-full` and
                    the max-height wins and silently breaks the ratio it was
                    added to preserve.

                    The field gradient is painted on the IMAGE as well as the
                    tile. The artwork is opaque and exactly fills its own box,
                    so that background shows only through the feathered edges —
                    where it has to match the pixels being faded out, which is
                    precisely where it was sampled from. */}
                <div className="img-tile">
                  <Image
                    src={board.image}
                    alt={board.alt}
                    width={board.width}
                    height={board.height}
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 78vw"
                    className={`img-tile-media ${TILE[i].field} h-auto max-h-full w-auto max-w-full object-contain`}
                    preload={false}
                    loading="lazy"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <HighlightCarousel />
        </div>
      </div>

      {/* --- THE TWO FRAMED BANNERS ----------------------------------- */}
      <div className="section-container pb-24 pt-20 sm:pb-28 sm:pt-24">
        {/* Column fractions EQUAL to each image's aspect ratio, so `fr` hands
            each one a width proportional to its aspect and the two heights come
            out identical with neither cropped. See HIGHLIGHT_BANNERS. */}
        <div className="grid grid-cols-1 gap-9 lg:grid-cols-[1.5fr_1.77683fr] lg:gap-7">
          {HIGHLIGHT_BANNERS.map((banner, i) => (
            <figure key={banner.image}>
              {/* `isolate` is load-bearing. The glow sits behind the frame, and the
                  obvious way to say that — `-z-10` — puts it behind the SECTION
                  background too whenever this wrapper is not forming a stacking
                  context of its own, which is most of the time once framer has
                  settled to `transform: none`. The glow then renders perfectly
                  and is invisible. `isolate` forces the context; the two
                  children then order with positive indices inside it. */}
              <Reveal y={0} scale={1.04} amount={0.3} delay={i * 0.08} className="relative isolate">
                {/* The ambient glow: a 64px copy of the same image, scaled up
                    and blurred, sitting behind the frame and inset so the light
                    reads as spill rather than an outline.

                    A plain <img>, not next/image — the source is ~1.3KB, so an
                    optimizer round trip would cost more than it could ever
                    save. Purely decorative: empty alt and aria-hidden.

                    Its own Reveal, so it can arrive just after its banner. */}
                <Reveal
                  y={0}
                  amount={0.3}
                  delay={i * 0.08 + 0.25}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-[6%] z-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={banner.glow} alt="" aria-hidden="true" className="hl-glow" />
                </Reveal>

                <div className="hl-frame z-10">
                  <Image
                    src={banner.image}
                    alt={banner.alt}
                    width={banner.width}
                    height={banner.height}
                    // Intrinsic width/height reserve the box from the aspect
                    // ratio before the image loads, so this row contributes no
                    // layout shift.
                    className="h-auto w-full"
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    preload={false}
                    loading="lazy"
                  />
                </div>
              </Reveal>
              <figcaption className="eyebrow mt-5">{banner.eyebrow}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

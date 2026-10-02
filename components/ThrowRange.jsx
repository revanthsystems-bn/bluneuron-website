'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Reveal from './Reveal';
import { THROW_RANGE } from '@/lib/iriz';

/**
 * The projected image growing from 35" to 200" as you scroll — the hard-number
 * beat between the lens tunnel and the spec table, and the thing the table's
 * "Throw Ratio 1:1 · 0.9m–5m" row only states in the abstract.
 *
 * Ported from the teaser's ScreenScale. The LOGIC is the part worth keeping:
 *
 *   - One tall section with a sticky frame inside it, so scroll distance
 *     becomes animation time without hijacking the scroll itself.
 *   - The beam and the image live in ONE wrapper whose transform origin is
 *     the lens, so scaling that wrapper opens the beam and grows the image
 *     together. One value, nothing to keep in sync.
 *   - Both counters are MotionValues rendered straight into the DOM, so
 *     scrolling never re-renders React.
 *   - The scroll value is mapped with no spring in between. A spring here
 *     overshoots 200" and drifts back after the wheel stops, which is exactly
 *     the snap a scroll-tied dial must not have; Lenis already smooths the
 *     input (components/SmoothScroll), so the output is smooth without one.
 *
 * The styling is NOT ported. The teaser drew this in its own `bg-night` /
 * `rgba(2,109,254)` palette; here it is rebuilt on this project's tokens —
 * `black-obsidian` ground, `border-subtle` hairlines, `accent`/`accent-soft`
 * for the light, and the same `.eyebrow` + `.section-container` + glass-panel
 * conventions the rest of the page uses. The readout panel is deliberately
 * the same material as `.bento-chip` (white/[0.06] over a hairline border,
 * blurred) so it reads as a member of this page, not an import.
 *
 * Drawn, not photographed: there is no footage of the IRIZ throwing a
 * 200-inch image, and a stock living room would be a claim about a product
 * that hasn't shipped.
 *
 * LAYOUT: the sticky frame is a flex column — copy block first at its natural
 * height, then the scene taking whatever is left (`flex-1`), with the image
 * sized as a fraction of THAT rather than of the viewport. Sizing the image in
 * `vh` is what lets it climb over the readout on a short laptop window: the
 * two are siblings dividing one height, so they cannot overlap.
 */
export default function ThrowRange() {
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Hold at each end for a beat, so the section opens and closes on a
  // readable frame instead of mid-zoom.
  const eased = useTransform(scrollYProgress, [0, 0.14, 0.86, 1], [0, 0, 1, 1]);

  const scale = useTransform(eased, [0, 1], [0.22, 1]);
  const beamOpacity = useTransform(eased, [0, 0.4, 1], [0.3, 0.55, 0.8]);
  const roomGlow = useTransform(eased, [0, 1], [0.12, 0.5]);

  const inches = useTransform(eased, [0, 1], [THROW_RANGE.min.size, THROW_RANGE.max.size]);
  const inchLabel = useTransform(inches, (v) => Math.round(v));
  const metres = useTransform(eased, [0, 1], [THROW_RANGE.min.distance, THROW_RANGE.max.distance]);
  const metreLabel = useTransform(metres, (v) => v.toFixed(1));

  return (
    <section
      ref={sectionRef}
      id="throw"
      className="relative h-[280vh] scroll-mt-20 border-b border-border-subtle bg-black-obsidian"
    >
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden">
        {/* Light thrown back into the room by the image itself. */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: roomGlow }}
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_44%,rgba(59,130,246,0.32),transparent_70%)]"
        />
        {/* Vignette, so the frame falls off at the edges like a real room. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.82)_100%)]"
        />
        <div aria-hidden="true" className="bg-noise pointer-events-none absolute inset-0" />

        <div className="section-container relative z-20 flex shrink-0 flex-col gap-6 pt-20 sm:flex-row sm:items-end sm:justify-between sm:pt-24">
          <div>
            <Reveal>
              <p className="eyebrow mb-3">{THROW_RANGE.eyebrow}</p>
              <h2 className="max-w-md text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
                From {THROW_RANGE.min.size} inches to{' '}
                <span className="text-accent-soft">{THROW_RANGE.max.size}</span>.
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55 sm:text-base">
                {THROW_RANGE.line}
              </p>
            </Reveal>
          </div>

          {/* Live readout. It sits in the copy row, above the scene's own band,
              so it cannot be reached by the image at any zoom. */}
          <Reveal delay={0.3}>
            <div className="inline-flex shrink-0 items-center gap-4 rounded-full border border-white/10 bg-white/[0.06] px-6 py-4 backdrop-blur-glass">
              <p className="flex items-baseline gap-1 text-3xl font-bold tracking-tighter text-white">
                <motion.span>{inchLabel}</motion.span>
                <span className="text-base font-medium text-white/45">in</span>
              </p>
              <span aria-hidden="true" className="h-8 w-px bg-white/15" />
              <p className="flex items-baseline gap-1 text-3xl font-bold tracking-tighter text-white">
                <motion.span>{metreLabel}</motion.span>
                <span className="text-base font-medium text-white/45">m</span>
              </p>
              <span className="sr-only">
                Screen size against projection distance, from{' '}
                {THROW_RANGE.min.size} inches at {THROW_RANGE.min.distance} metres to{' '}
                {THROW_RANGE.max.size} inches at {THROW_RANGE.max.distance} metres.
              </span>
            </div>
          </Reveal>
        </div>

        {/* ---- The scene: everything the copy block didn't take ---- */}
        <div className="relative z-10 min-h-0 flex-1">
          <motion.div
            style={{ x: '-50%', scale, transformOrigin: '50% 100%' }}
            className="absolute bottom-[8%] left-1/2 flex h-[88%] max-h-[540px] w-[min(82vw,1020px)] flex-col justify-end"
          >
            {/* The projected image. Not pure white: projected white is a warm
                grey carrying the room's own blue.

                Never taller than 16:9 of its own width — without that cap a
                phone gives the scene a tall, narrow box and the "projected
                image" comes out nearly square, which is not a shape any
                projector throws. `justify-end` then keeps the beam's tip
                pinned to the wrapper's bottom edge, which is both the scale
                origin and where the lens flare is drawn. */}
            <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-[3px] bg-[linear-gradient(135deg,#FFFFFF_0%,#E8F1FF_45%,#CFE0FF_100%)] shadow-[0_0_140px_36px_rgba(59,130,246,0.3)] [max-height:min(46vw,574px)]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(255,255,255,0.95),transparent_78%)]" />
            </div>

            {/* The beam, from the lens up to the bottom edge of the image. */}
            <motion.div
              aria-hidden="true"
              style={{ opacity: beamOpacity }}
              className="h-[22%] w-full shrink-0 bg-[linear-gradient(to_top,rgba(96,165,250,0.04),rgba(205,228,255,0.6))] blur-[2px] [clip-path:polygon(50%_100%,0%_0%,100%_0%)]"
            />
          </motion.div>

          {/* The lens flare at the beam's origin. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[7%] left-1/2 h-10 w-10 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95),rgba(96,165,250,0.35)_45%,transparent_70%)] blur-[3px]"
          />

          {/* Dust in the beam. Three motes on offset loops — enough to read as
              air, not enough to read as snow. Ambient autoplay rather than
              scroll-driven, so it follows the same rule as LensZoom's idle
              ring spin and is dropped under prefers-reduced-motion. */}
          {!reduceMotion &&
            [
              'bottom-[26%] left-[46%] h-1 w-1 [animation-delay:-2s]',
              'bottom-[44%] left-[53%] h-[3px] w-[3px] [animation-delay:-5s]',
              'bottom-[62%] left-[49%] h-[2px] w-[2px] [animation-delay:-8s]',
            ].map((mote) => (
              <span
                key={mote}
                aria-hidden="true"
                className={`beam-mote pointer-events-none absolute rounded-full bg-white/50 blur-[1px] ${mote}`}
              />
            ))}
        </div>
      </div>
    </section>
  );
}

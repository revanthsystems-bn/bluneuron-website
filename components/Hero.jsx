import HeroBackdrop from './HeroBackdrop';
import Reveal from './Reveal';
import { HERO } from '@/lib/iriz';

/**
 * The one section that breaks the page grid: a full-bleed 100svh cinematic
 * frame with the product loop running edge to edge behind it.
 *
 * `min-h-svh`, not `h-screen` — 100vh jumps by the height of the browser
 * chrome the moment a mobile browser hides its address bar, which shunts the
 * headline mid-scroll.
 *
 * No purchase CTA here. The only forward affordance is the scroll cue; the
 * masthead "Buy Now" and the mobile StickyBuyBar carry buying intent without
 * competing with the headline.
 *
 * Stacking is DOM order only — every layer is positioned and they paint in
 * source order. Deliberately no z-index inside this section; mixing the two
 * is how these stacks rot.
 *
 * ---------------------------------------------------------------------
 * THEMES (lib/heroTheme.js). `theme` is 'dark' (the committed default) or
 * 'light' (the test). The two share this component's structure and nothing
 * else: the dark path renders the veil + two black scrims it has always had,
 * the light path renders a text-local white wash, a header wash, and the tall
 * bottom blend into the dark section below. Each layer is rendered or not —
 * none of them is restyled in place — so neither path can silently inherit a
 * value meant for the other.
 *
 * Only the hero changes. The rest of the page is dark in both.
 */
export default function Hero({ theme = 'dark' }) {
  const light = theme === 'light';

  // Ink is `black-obsidian` (#030303), the project's existing dark text
  // token — the same value the dark hero's scrims are built from.
  //
  // The two LABEL layers run at 75%, not the dark path's 60%. That is a
  // measured change, not a taste one: ink at 60% over the lightest ground the
  // scrim can produce composites to about #505050, which lands at 3.7:1 and
  // fails AA. 75% takes the same ground to 6.3:1. White-on-dark tolerates a
  // low alpha far better than dark-on-light, because the composite moves
  // toward the bright background rather than away from it.
  const eyebrowClass = light ? 'text-black-obsidian/75' : 'text-white/60';
  const displayClass = light ? 'text-black-obsidian' : 'text-white';
  const taglineClass = light ? 'text-black-obsidian/90' : 'text-white/85';
  const cueClass = light
    ? 'text-black-obsidian/75 group-hover:text-black-obsidian'
    : 'text-white/60 group-hover:text-white';

  return (
    <section
      id="showcase"
      data-hero-theme={theme}
      className={`relative flex min-h-svh flex-col justify-end overflow-hidden ${
        light ? 'bg-white' : 'bg-black-obsidian'
      }`}
    >
      {/* The loop, edge to edge.

          DARK: no grade on this wrapper — the loop is a white-studio shot and
          brightening it only pushes more of the frame to 255 behind the copy.
          LIGHT: `.hero-light-media` is a contrast/saturation nudge only, no
          brightness term. The point of the light test is to show the footage
          near its own exposure, so nothing here may darken it. */}
      <div className={`absolute inset-0 ${light ? 'hero-light-media' : ''}`}>
        <HeroBackdrop />
      </div>

      {light ? (
        <>
          {/* Soft light scrim behind the TEXT BLOCK only — the brief's
              fallback for frames where ink would otherwise fail. Sized to the
              bottom band, not the frame, so the rest of the loop keeps its
              natural exposure. */}
          <span
            aria-hidden
            className="hero-light-scrim pointer-events-none absolute inset-x-0 bottom-0 h-[62%]"
          />
          {/* A lighter wash under the floating masthead, same reasoning. */}
          <span
            aria-hidden
            className="hero-light-scrim-top pointer-events-none absolute inset-x-0 top-0 h-40"
          />
          {/* The seam into the dark section below. Tall (22svh) and painted
              last, so it sits over the scrim as well as the footage. */}
          <span
            aria-hidden
            className="hero-light-blend pointer-events-none absolute inset-x-0 bottom-0 h-[19svh]"
          />
        </>
      ) : (
        <>
          {/* Scrims. The loop is a white-studio shot, so a bottom gradient
              alone leaves the headline at ~2:1 — it needs the flat veil
              underneath as well, at 0.42. The contrast maths is in
              app/globals.css. */}
          <span aria-hidden className="hero-veil pointer-events-none absolute inset-0" />
          <span aria-hidden className="hero-scrim-top pointer-events-none absolute inset-x-0 top-0 h-52" />
          <span
            aria-hidden
            className="hero-scrim-bottom pointer-events-none absolute inset-x-0 bottom-0 h-[78%]"
          />
        </>
      )}

      {/* Headline block, bottom-left, inside the page's normal container so
          it lines up with every section below it.

          In light mode the bottom padding clears the 22svh blend — otherwise
          the tagline's descenders sit in the part of the ramp that has already
          gone grey, which is where ink loses its contrast. */}
      <div
        className={`section-container relative ${
          light ? 'pb-[32svh] sm:pb-[30svh]' : 'pb-32 sm:pb-36'
        }`}
      >
        {/* An inner wrapper that hugs the TYPE, so the plate can be sized to
            the text and not to the container's bottom padding — anchored to
            the padded box, the radial's hotspot lands below the copy and the
            eyebrow ends up outside it, which measured worse than no plate. */}
        <div className="relative">
          {/* The text plate. Bled well past the type on every side so its
              feathered edge lands off-screen left and well clear of the copy
              elsewhere — a plate whose falloff is visible behind the text
              reads as a box. */}
          {light && (
            <span
              aria-hidden
              className="hero-light-plate pointer-events-none absolute -inset-y-28 -left-[50vw] -right-[6vw] sm:-right-[12vw]"
            />
          )}
          <Reveal amount={0.2}>
            <p className={`type-label relative ${eyebrowClass}`}>{HERO.eyebrow}</p>
          </Reveal>
          <Reveal amount={0.2} delay={0.08}>
            <h1 className={`type-display relative mt-5 ${displayClass}`}>{HERO.display}</h1>
          </Reveal>
          <Reveal amount={0.2} delay={0.16}>
            <p className={`type-lede relative mt-5 max-w-xl ${taglineClass}`}>{HERO.tagline}</p>
          </Reveal>
        </div>
      </div>

      {/* Scroll cue — the hero's only call to action. A real link, so it is
          focusable and keyboard-operable, not a decorative div.

          In light mode it moves up out of the blend ramp for the same reason
          the headline block does: at `bottom-8` it would sit on the near-black
          end of the gradient, where dark ink disappears entirely. */}
      <a
        href={HERO.scrollTo}
        className={`group absolute inset-x-0 mx-auto flex w-fit flex-col items-center gap-2.5 rounded-full px-4 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
          light ? 'bottom-[21svh] focus-visible:outline-accent' : 'bottom-8 focus-visible:outline-accent-soft'
        }`}
      >
        <span className={`type-label transition-colors ${cueClass}`}>Scroll</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 22"
          className={`scroll-cue h-5 w-4 transition-colors ${cueClass}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 1v14" />
          <path d="m3.5 11.5 4.5 4.5 4.5-4.5" />
        </svg>
        <span className="sr-only">Skip to why shop BluNeuron</span>
      </a>
    </section>
  );
}

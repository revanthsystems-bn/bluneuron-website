import HeroBackdrop from './HeroBackdrop';
import BuyButton from '@/components/buy/BuyButton';
import { HERO } from '@/lib/iriz';
import { SHOW_BUY } from '@/lib/site-config';

/**
 * The one section that breaks the page grid: a full-bleed 100svh frame with
 * the product lit on a dark stage behind the headline.
 *
 * `min-h-svh`, not `h-screen` — 100vh jumps by the height of the browser
 * chrome the moment a mobile browser hides its address bar, which shunts the
 * headline mid-scroll.
 *
 * Stacking is DOM order only — every layer is positioned and they paint in
 * source order. Deliberately no z-index inside this section; mixing the two
 * is how these stacks rot.
 *
 * ---------------------------------------------------------------------
 * THE LIGHT-HERO TEST IS GONE, and with it lib/heroTheme.js, the `theme`
 * prop, the `[data-hero-theme='light']` CSS block and the `?hero=light`
 * override. It was built for a backdrop of bright white studio footage;
 * components/HeroBackdrop now renders a product on a DARK stage, over which
 * dark ink cannot reach AA at any alpha. Removing it also took `searchParams`
 * out of app/page.jsx, which put the homepage back to being statically
 * prerendered.
 *
 * ---------------------------------------------------------------------
 * THE ENTRANCE IS CSS, NOT FRAMER-MOTION, and that is the whole reason this
 * is a server component.
 *
 * The three type blocks used to be <Reveal>s — framer-motion elements
 * rendered at `opacity: 0` on the server and faded in by an
 * IntersectionObserver once the bundle had hydrated. Above the fold that is a
 * guarantee that the headline is INVISIBLE until JavaScript arrives, and it
 * is what Lighthouse was measuring: 4.9s LCP on this page, 90% of it render
 * delay, with Chrome eventually timing a 53px "SCROLL" label because
 * everything larger was still transparent.
 *
 * `.hero-rise` animates the same fade-and-lift with a CSS keyframe that
 * starts at the first paint, needs no observer and no hydration, and is
 * dropped entirely under `prefers-reduced-motion` (app/globals.css). The
 * stagger is four `--rise-delay` values rather than four components.
 */
export default function Hero() {
  return (
    <section
      id="showcase"
      className="relative flex min-h-svh flex-col justify-end overflow-hidden bg-black-obsidian"
    >
      <HeroBackdrop />

      {/* Scrims — LOCAL ONLY. A short fade behind the text block and a light
          one under the masthead. Both are sized in app/globals.css rather
          than with utilities here, because each gradient's stops are
          positions INSIDE its own box — split the height from the stops
          across two files and they drift apart on the next edit. */}
      <span aria-hidden className="hero-scrim-top pointer-events-none absolute inset-x-0 top-0" />
      <span aria-hidden className="hero-scrim-bottom pointer-events-none absolute inset-x-0 bottom-0" />

      {/* Headline block, bottom-left, inside the page's normal container so
          it lines up with every section below it. */}
      <div className="section-container relative pb-32 sm:pb-36">
        {/* An inner wrapper that hugs the TYPE, so the plate can be sized to
            the text and not to the container's bottom padding — anchored to
            the padded box, the radial's hotspot lands below the copy and the
            eyebrow ends up outside it, which measured worse than no plate. */}
        <div className="relative max-w-2xl">
          {/* The text plate: the layer that carries the copy. Anchored to this
              wrapper, which hugs the TYPE. Bled half a viewport to the left so
              the gradient's dark end is always off-screen.

              Its right-hand falloff is narrower than it was. The stage light
              behind the product is now the brightest thing in the frame and it
              sits to the RIGHT at md and up (`.hero-stage`), so the plate no
              longer has to reach across the whole width to hold the eyebrow —
              it has to cover the type and stop. Re-check with
              scripts/ui/hero-contrast.mjs after touching any of it. */}
          <span
            aria-hidden
            className="hero-text-plate pointer-events-none absolute -inset-y-28 -left-[50vw] -right-[18vw] sm:-right-[8vw]"
          />

          <p className="type-label hero-rise relative text-white">{HERO.eyebrow}</p>

          {/* TWO CHILDREN, one for each audience.

              The name the machines read is a real text node in an `sr-only`
              span — not an `aria-label`. An aria-label would have worked for
              the accessible name, but it OVERRIDES the contents rather than
              supplementing them, which is how this element ended up
              announcing "iriz" in the first place.

              That text node is HERO.accessibleName ("IRIZ mini projector for
              home"), not HERO.display. The h1 is the single strongest on-page
              heading signal a crawler reads, and "IRIZ" alone names the
              product without saying what it is. The visual span below still
              draws HERO.display, so the two cannot drift: the sentence is
              read, the four letters are seen.

              The glyphs the eye reads are the dotless U+0131 wordmark, in an
              `aria-hidden` span so it is pruned from the accessibility tree
              and cannot be announced as "ırız". */}
          <h1
            className="type-display font-iriz hero-rise relative mt-5 text-white"
            style={{ textTransform: 'none', '--rise-delay': '90ms' }}
          >
            <span className="sr-only">{HERO.accessibleName}</span>
            <span aria-hidden="true">{WORDMARK}</span>
          </h1>

          <p
            className="type-lede hero-rise relative mt-5 max-w-prose text-ink-2"
            style={{ '--rise-delay': '180ms' }}
          >
            {HERO.tagline}
          </p>

          {/* THE HERO'S OWN BUY. The hero used to offer only a scroll cue,
              which meant the first screen of the site — the one with the
              product on it — had no way to act on it, and the nearest Buy
              was in the masthead above the fold's own eyeline. */}
          {SHOW_BUY && (
            <div className="hero-rise relative mt-8" style={{ '--rise-delay': '270ms' }}>
              <BuyButton className="btn-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Scroll cue — a real link, so it is focusable and keyboard-operable,
          not a decorative div. */}
      <a
        href={HERO.scrollTo}
        className="group absolute inset-x-0 bottom-8 mx-auto flex w-fit flex-col items-center gap-2.5 rounded-full px-4 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
      >
        <span className="type-label text-white hero-cue transition-colors">Scroll</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 22"
          className="scroll-cue hero-cue h-5 w-4 text-white transition-colors"
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

/*
 * The wordmark's glyphs, computed once at module scope rather than on every
 * render: the dotted 'i' is swapped for the dotless 'ı' (U+0131) so its
 * x-height aligns with the 'r' and the 'z' in Zen Dots.
 *
 * HERO.display must stay exactly the four letters of the model name — this is
 * the string the glyphs are drawn from, so anything else changes what is on
 * screen.
 */
const WORDMARK = (HERO.display || 'iriz').toLowerCase().replace(/i/g, 'ı');

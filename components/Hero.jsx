import HeroBackdrop from './HeroBackdrop';
import Reveal from './Reveal';
import BuyButton from '@/components/buy/BuyButton';
import { HERO } from '@/lib/iriz';
import { SHOW_BUY } from '@/lib/site-config';

/**
 * The one section that breaks the page grid: a full-bleed 100svh cinematic
 * frame with the product loop running edge to edge behind it.
 *
 * `min-h-svh`, not `h-screen` — 100vh jumps by the height of the browser
 * chrome the moment a mobile browser hides its address bar, which shunts the
 * headline mid-scroll.
 *
 * Stacking is DOM order only — every layer is positioned and they paint in
 * source order. Deliberately no z-index inside this section; mixing the two
 * is how these stacks rot.
 *
 * A 218-LINE COMMENTED-OUT COPY of this component used to sit above these
 * imports. It was an older revision kept "just in case", and it had already
 * started collecting live code by accident — two imports landed inside it
 * during this pass and were valid JavaScript at module scope, interleaved
 * with the comments, which is exactly the hazard a commented-out file
 * creates. Git has the old revision; the file does not need to.
 */
export default function Hero({ theme = 'dark' }) {
  const light = theme === 'light';

  const eyebrowClass = light ? 'text-black-obsidian/75' : 'text-white';
  const displayClass = light ? 'text-black-obsidian' : 'text-white';
  const taglineClass = light ? 'text-black-obsidian/90' : 'text-white/85';
  const cueClass = light
    ? 'text-black-obsidian/75 group-hover:text-black-obsidian'
    : 'text-white hero-cue';

  // Replace dotted 'i' with dotless 'ı' (U+0131) so height aligns perfectly with 'r' and 'z'
  const rawText = HERO.display || 'iriz';
  const wordmarkText = rawText.toLowerCase().replace(/i/g, 'ı');

  return (
    <section
      id="showcase"
      data-hero-theme={theme}
      className={`relative flex min-h-svh flex-col justify-end overflow-hidden ${
        light ? 'bg-white' : 'bg-black-obsidian'
      }`}
    >
      <div className={`absolute inset-0 ${light ? 'hero-light-media' : 'hero-media'}`}>
        <HeroBackdrop />
      </div>

      {light ? (
        <>
          <span aria-hidden className="hero-light-scrim pointer-events-none absolute inset-x-0 bottom-0 h-[62%]" />
          <span aria-hidden className="hero-light-scrim-top pointer-events-none absolute inset-x-0 top-0 h-40" />
          <span aria-hidden className="hero-light-blend pointer-events-none absolute inset-x-0 bottom-0 h-[19svh]" />
        </>
      ) : (
        <>
          <span aria-hidden className="hero-scrim-top pointer-events-none absolute inset-x-0 top-0" />
          <span aria-hidden className="hero-scrim-bottom pointer-events-none absolute inset-x-0 bottom-0" />
        </>
      )}

      <div
        className={`section-container relative ${
          light ? 'pb-[32svh] sm:pb-[30svh]' : 'pb-32 sm:pb-36'
        }`}
      >
        <div className="relative">
          {light ? (
            <span aria-hidden className="hero-light-plate pointer-events-none absolute -inset-y-28 -left-[50vw] -right-[6vw] sm:-right-[12vw]" />
          ) : (
            // The plate's right-hand falloff reaches further on phones than it
            // used to: the eyebrow is now "Mini projector for home",
            // 265px of it at 390px wide, and at -6vw the gradient had already
            // decayed to ~0.08 alpha under its last third — which measured
            // 4.36:1 against the brightest frame of the loop and missed AA. At
            // -25vw the same text measures 5.58:1. Phones only (sm: restores
            // -6vw): desktop never had the problem, and a wider wash there
            // would do nothing but dim the footage.
            <span aria-hidden className="hero-text-plate pointer-events-none absolute -inset-y-20 -left-[50vw] -right-[25vw] sm:-right-[6vw]" />
          )}

          {/* `.rise-in`, NOT <Reveal>, for all three.

              Reveal is framer-motion with `initial={{opacity: 0}}`: it
              server-renders its children INVISIBLE and fades them in once the
              bundle has hydrated and an IntersectionObserver has fired. The
              hero is above the fold by definition, so that made the page's
              largest paint wait on its JavaScript — measured at 4.3s LCP with
              89% render delay, on a tagline that was in the HTML all along.

              A CSS keyframe starts at first paint instead, and the stagger is
              three `--rise-delay` values rather than three components. See
              `.rise-in` in app/globals.css; it collapses to the end state
              under prefers-reduced-motion. */}
          <p className={`type-label relative rise-in ${eyebrowClass}`}>{HERO.eyebrow}</p>

          <div className="rise-in" style={{ '--rise-delay': '80ms' }}>
            {/* TWO CHILDREN, one for each audience.

                The name the machines read is a real text node in an
                `sr-only` span — not an `aria-label`. An aria-label would have
                worked for the accessible name, but it OVERRIDES the contents
                rather than supplementing them, which is how this element ended
                up announcing "iriz" in the first place.

                That text node is HERO.accessibleName ("IRIZ mini projector for
                home"), not HERO.display. The h1 is the single strongest
                on-page heading signal a crawler reads, and "IRIZ" alone names
                the product without saying what it is. The visual span below
                still draws HERO.display, so the two cannot drift: the sentence
                is read, the four letters are seen.

                The glyphs the eye reads are the dotless U+0131 wordmark, in an
                `aria-hidden` span so it is pruned from the accessibility tree
                and cannot be announced as "ırız".

                The styling stays on the <h1> and the visual span INHERITS it —
                family, size, weight, tracking, leading, colour and the
                `text-transform: none` all cascade down. Restating the classes
                on the span would be a second place for them to drift, and the
                rendered box is identical either way: verified pixel-for-pixel
                against the previous build at 390 and 1440. */}
            <h1
              className={`type-display font-iriz relative mt-5 ${displayClass}`}
              style={{ textTransform: 'none' }}
            >
              <span className="sr-only">{HERO.accessibleName}</span>
              <span aria-hidden="true">{wordmarkText}</span>
            </h1>
          </div>

          <p
            className={`type-lede relative mt-5 max-w-xl rise-in ${taglineClass}`}
            style={{ '--rise-delay': '160ms' }}
          >
            {HERO.tagline}
          </p>

          {/* THE HERO'S OWN BUY.
              ====================================================
              The first screen had no way to act on the product it is
              showing. The masthead CTA is `hidden sm:inline-flex`, so on a
              phone it does not exist at all, and the sticky bar only
              appears once the hero has been scrolled past — which left a
              375x812 viewport with a product, a price nowhere, and nothing
              to press.

              The sticky bar is unchanged and still takes over on scroll;
              this is the one that is there on arrival. Both open the same
              sheet (components/buy/BuyProvider), so there is one buy
              surface however it is reached.

              `rise-in` rather than <Reveal> for the same reason as the
              three blocks above it: this is above the fold, and Reveal
              server-renders its children invisible until framer-motion has
              hydrated. */}
          {SHOW_BUY && (
            <div className="relative mt-7 rise-in" style={{ '--rise-delay': '240ms' }}>
              <BuyButton className="btn-primary" />
            </div>
          )}
        </div>
      </div>

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
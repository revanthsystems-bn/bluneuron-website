// import HeroBackdrop from './HeroBackdrop';
// import Reveal from './Reveal';
// import { HERO } from '@/lib/iriz';

// /**
//  * The one section that breaks the page grid: a full-bleed 100svh cinematic
//  * frame with the product loop running edge to edge behind it.
//  *
//  * `min-h-svh`, not `h-screen` — 100vh jumps by the height of the browser
//  * chrome the moment a mobile browser hides its address bar, which shunts the
//  * headline mid-scroll.
//  *
//  * No purchase CTA here. The only forward affordance is the scroll cue; the
//  * masthead "Buy Now" and the mobile StickyBuyBar carry buying intent without
//  * competing with the headline.
//  *
//  * Stacking is DOM order only — every layer is positioned and they paint in
//  * source order. Deliberately no z-index inside this section; mixing the two
//  * is how these stacks rot.
//  *
//  * ---------------------------------------------------------------------
//  * THEMES (lib/heroTheme.js). `theme` is 'dark' (the committed default) or
//  * 'light' (the test). The two share this component's structure and nothing
//  * else: the dark path renders a graded loop under two LOCAL black fades (the
//  * flat full-frame veil it used to carry is gone — see app/globals.css), the
//  * light path renders a text-local white wash, a header wash, and the tall
//  * bottom blend into the dark section below. Each layer is rendered or not —
//  * none of them is restyled in place — so neither path can silently inherit a
//  * value meant for the other.
//  *
//  * Only the hero changes. The rest of the page is dark in both.
//  */
// export default function Hero({ theme = 'dark' }) {
//   const light = theme === 'light';

//   // Ink is `black-obsidian` (#030303), the project's existing dark text
//   // token — the same value the dark hero's scrims are built from.
//   //
//   // The two LABEL layers run at 75%, not the dark path's 60%. That is a
//   // measured change, not a taste one: ink at 60% over the lightest ground the
//   // scrim can produce composites to about #505050, which lands at 3.7:1 and
//   // fails AA. 75% takes the same ground to 6.3:1. White-on-dark tolerates a
//   // low alpha far better than dark-on-light, because the composite moves
//   // toward the bright background rather than away from it.
//   // Full white on the dark path, not the 60% it ran at under the veil.
//   // Measured: at white/60 the eyebrow reaches only 1.47:1 at 1280 over this
//   // loop, and no plate gentle enough to keep the picture bright can lift a
//   // 60%-alpha label to AA. At full white the same spot measures 5.65:1.
//   const eyebrowClass = light ? 'text-black-obsidian/75' : 'text-white';
//   const displayClass = light ? 'text-black-obsidian' : 'text-white';
//   const taglineClass = light ? 'text-black-obsidian/90' : 'text-white/85';
//   // On the dark path the cue sits mid-frame on footage nothing darkens any
//   // more, so it is full white and carries its own shadow (`.hero-cue` /
//   // `.scroll-cue`, app/globals.css) rather than leaning on a scrim. It was
//   // white/60 when the veil was there to hold it up.
//   const cueClass = light
//     ? 'text-black-obsidian/75 group-hover:text-black-obsidian'
//     : 'text-white hero-cue';

//   return (
//     <section
//       id="showcase"
//       data-hero-theme={theme}
//       className={`relative flex min-h-svh flex-col justify-end overflow-hidden ${
//         light ? 'bg-white' : 'bg-black-obsidian'
//       }`}
//     >
//       {/* The loop, edge to edge.

//           DARK: `.hero-media` is the bright grade — brightness(1.08)
//           contrast(1.04). It sits on this WRAPPER and not on the <video> so
//           that the poster frame the video paints before playback and the
//           reduced-motion still that renders with no video at all are graded
//           identically; app/globals.css has the reasoning.
//           LIGHT: `.hero-light-media` is a contrast/saturation nudge only, no
//           brightness term. The point of the light test is to show the footage
//           near its own exposure, so nothing here may darken it. */}
//       <div className={`absolute inset-0 ${light ? 'hero-light-media' : 'hero-media'}`}>
//         <HeroBackdrop />
//       </div>

//       {light ? (
//         <>
//           {/* Soft light scrim behind the TEXT BLOCK only — the brief's
//               fallback for frames where ink would otherwise fail. Sized to the
//               bottom band, not the frame, so the rest of the loop keeps its
//               natural exposure. */}
//           <span
//             aria-hidden
//             className="hero-light-scrim pointer-events-none absolute inset-x-0 bottom-0 h-[62%]"
//           />
//           {/* A lighter wash under the floating masthead, same reasoning. */}
//           <span
//             aria-hidden
//             className="hero-light-scrim-top pointer-events-none absolute inset-x-0 top-0 h-40"
//           />
//           {/* The seam into the dark section below. Tall (22svh) and painted
//               last, so it sits over the scrim as well as the footage. */}
//           <span
//             aria-hidden
//             className="hero-light-blend pointer-events-none absolute inset-x-0 bottom-0 h-[19svh]"
//           />
//         </>
//       ) : (
//         <>
//           {/* Scrims — LOCAL ONLY. The flat full-frame veil that used to sit
//               here is gone: it was 0.42 black over every pixel of a shot that
//               was filmed on a lit white seamless, and it is where the darkness
//               came from. What is left is a short fade behind the text block and
//               a light one under the masthead.

//               Both are sized in app/globals.css (45%/50% tall and 7rem/6rem)
//               rather than with utilities here, because each gradient's stops
//               are positions INSIDE its own box — split the height from the
//               stops across two files and they drift apart on the next edit. */}
//           <span aria-hidden className="hero-scrim-top pointer-events-none absolute inset-x-0 top-0" />
//           <span aria-hidden className="hero-scrim-bottom pointer-events-none absolute inset-x-0 bottom-0" />
//         </>
//       )}

//       {/* Headline block, bottom-left, inside the page's normal container so
//           it lines up with every section below it.

//           In light mode the bottom padding clears the 22svh blend — otherwise
//           the tagline's descenders sit in the part of the ramp that has already
//           gone grey, which is where ink loses its contrast. */}
//       <div
//         className={`section-container relative ${
//           light ? 'pb-[32svh] sm:pb-[30svh]' : 'pb-32 sm:pb-36'
//         }`}
//       >
//         {/* An inner wrapper that hugs the TYPE, so the plate can be sized to
//             the text and not to the container's bottom padding — anchored to
//             the padded box, the radial's hotspot lands below the copy and the
//             eyebrow ends up outside it, which measured worse than no plate. */}
//         <div className="relative">
//           {/* The text plate. Bled well past the type on every side so its
//               feathered edge lands off-screen left and well clear of the copy
//               elsewhere — a plate whose falloff is visible behind the text
//               reads as a box. */}
//           {light ? (
//             <span
//               aria-hidden
//               className="hero-light-plate pointer-events-none absolute -inset-y-28 -left-[50vw] -right-[6vw] sm:-right-[12vw]"
//             />
//           ) : (
//             /* The dark path's equivalent, and the layer that carries the copy
//                now that the full-frame veil is gone. Anchored to this wrapper,
//                which hugs the TYPE — anchored to the padded container instead,
//                its feathered top lands mid-headline and the eyebrow falls
//                outside it entirely. Bled half a viewport to the left so the
//                gradient's dark end is always off-screen; app/globals.css has
//                the measurements that set its strength. */
//             <span
//               aria-hidden
//               className="hero-text-plate pointer-events-none absolute -inset-y-20 -left-[50vw] -right-[6vw]"
//             />
//           )}
//           <Reveal amount={0.2}>
//             <p className={`type-label relative ${eyebrowClass}`}>{HERO.eyebrow}</p>
//           </Reveal>
//           {/* The wordmark — the ONLY string on the site set in Zen Dots
//               (`.font-iriz`, app/globals.css). `.type-display` still supplies
//               the size ramp; the utility overrides family, weight, tracking and
//               leading over the top of it. Same text node as before, so the h1's
//               accessible name is still exactly "IRIZ".

//               `lowercase` is a presentation-only transform: the hero sets the
//               wordmark as "iriz" in Zen Dots, while the text node — and so the
//               h1's accessible name and every other IRIZ on the site — stays
//               uppercase. */}
//           <Reveal amount={0.2} delay={0.08}>
//             <h1 className={`type-display font-iriz relative mt-5 lowercase ${displayClass}`}>
//               {HERO.display}
//             </h1>
//           </Reveal>
//           <Reveal amount={0.2} delay={0.16}>
//             <p className={`type-lede relative mt-5 max-w-xl ${taglineClass}`}>{HERO.tagline}</p>
//           </Reveal>
//         </div>
//       </div>

//       {/* Scroll cue — the hero's only call to action. A real link, so it is
//           focusable and keyboard-operable, not a decorative div.

//           In light mode it moves up out of the blend ramp for the same reason
//           the headline block does: at `bottom-8` it would sit on the near-black
//           end of the gradient, where dark ink disappears entirely. */}
//       <a
//         href={HERO.scrollTo}
//         className={`group absolute inset-x-0 mx-auto flex w-fit flex-col items-center gap-2.5 rounded-full px-4 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
//           light ? 'bottom-[21svh] focus-visible:outline-accent' : 'bottom-8 focus-visible:outline-accent-soft'
//         }`}
//       >
//         <span className={`type-label transition-colors ${cueClass}`}>Scroll</span>
//         <svg
//           aria-hidden="true"
//           viewBox="0 0 16 22"
//           className={`scroll-cue h-5 w-4 transition-colors ${cueClass}`}
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="1.5"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//         >
//           <path d="M8 1v14" />
//           <path d="m3.5 11.5 4.5 4.5 4.5-4.5" />
//         </svg>
//         <span className="sr-only">Skip to why shop BluNeuron</span>
//       </a>
//     </section>
//   );
// }



import HeroBackdrop from './HeroBackdrop';
import Reveal from './Reveal';
import { HERO } from '@/lib/iriz';

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
            // used to: the eyebrow is now "Mini portable projector for home",
            // 265px of it at 390px wide, and at -6vw the gradient had already
            // decayed to ~0.08 alpha under its last third — which measured
            // 4.36:1 against the brightest frame of the loop and missed AA. At
            // -25vw the same text measures 5.58:1. Phones only (sm: restores
            // -6vw): desktop never had the problem, and a wider wash there
            // would do nothing but dim the footage.
            <span aria-hidden className="hero-text-plate pointer-events-none absolute -inset-y-20 -left-[50vw] -right-[25vw] sm:-right-[6vw]" />
          )}

          <Reveal amount={0.2}>
            <p className={`type-label relative ${eyebrowClass}`}>{HERO.eyebrow}</p>
          </Reveal>

          <Reveal amount={0.2} delay={0.08}>
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
          </Reveal>

          <Reveal amount={0.2} delay={0.16}>
            <p className={`type-lede relative mt-5 max-w-xl ${taglineClass}`}>{HERO.tagline}</p>
          </Reveal>
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
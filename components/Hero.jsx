import Link from 'next/link';
import { preload } from 'react-dom';
import HeroBuyButton from '@/components/hero/HeroBuyButton';
import { HERO, HERO_IMAGE, HERO_STATS } from '@/lib/iriz';
import { ROUTES } from '@/lib/routes';
import { SHOW_BUY } from '@/lib/site-config';

/**
 * The homepage hero: a dark two-column frame with the product photographed on
 * a light card.
 *
 * ---------------------------------------------------------------------------
 * WHAT REPLACED WHAT
 * ---------------------------------------------------------------------------
 * This used to be a full-bleed 100svh <video> loop with the type stacked over
 * it (components/HeroBackdrop, still on disk and no longer mounted anywhere).
 * Three things came with that arrangement and none of them is here any more:
 *
 *   - 1.4 MB of mp4 + webm + poster fetched before anything could be read,
 *     for four seconds of motion nobody asked for;
 *   - white type held over WHITE STUDIO FOOTAGE, which needed a veil, two
 *     scrims and a text plate to stay legible, and still measured differently
 *     on different frames of the loop;
 *   - an LCP that was whatever frame happened to decode first.
 *
 * The photograph is a static asset with known pixels, so the type sits on a
 * flat #030303 that cannot change behind it, and the largest paint is one
 * 53 KB WebP that is preloaded and sized in the markup.
 *
 * ---------------------------------------------------------------------------
 * DOM ORDER IS THE MOBILE ORDER
 * ---------------------------------------------------------------------------
 * Copy first, card second — eyebrow, wordmark, tagline, buttons, stats, then
 * the product. That is the reading order on a phone and it is the source
 * order, with no `order:` anywhere: the two-column desktop layout is a grid
 * that puts the second child in the second column, which leaves the
 * accessibility tree and the visual order identical at every width.
 *
 * ---------------------------------------------------------------------------
 * THE ENTRANCE IS CSS, NOT HYDRATED
 * ---------------------------------------------------------------------------
 * `.hero-in-text` / `.hero-in-card` are keyframes that start at first paint
 * (app/globals.css), carrying the brief's own numbers. The previous version
 * of this file already recorded why a keyframe and not a component:
 * components/Reveal is framer-motion with `initial={{opacity: 0}}`, which
 * SERVER-RENDERS its children invisible and waits for the bundle — measured
 * at 4.3s LCP with 89% render delay on a tagline that was in the HTML all
 * along. Nothing above the fold on this page may use it.
 *
 * Everything is on screen inside 0.6s, the buy button is a real focusable,
 * clickable element from the first paint, and the whole thing collapses to
 * its end state under `prefers-reduced-motion`.
 */
export default function Hero() {
  /*
   * THE PRELOAD, and it lives here rather than in app/page.jsx on purpose:
   * next to the <picture> it belongs to, so the two cannot drift apart when
   * the asset is replaced.
   *
   * WHY IT IS NEEDED AT ALL. `fetchPriority="high"` on the <img> raises the
   * priority of a request the parser has already reached; it does not start
   * it any earlier. This hint goes in the <head>, so the bytes are in flight
   * before the body is parsed — which is the whole point for an LCP element.
   *
   * `type: 'image/webp'` is the token that keeps a browser WITHOUT WebP
   * support from preloading a file it would then throw away and fetch the
   * JPEG instead. Same reason the <source> carries it.
   *
   * React's own resource API rather than a hand-written <link>: it
   * de-duplicates, and it emits into the document head from a server
   * component without the tag having to be rendered somewhere it would be
   * illegal.
   */
  preload(HERO_IMAGE.src, {
    as: 'image',
    type: 'image/webp',
    fetchPriority: 'high',
    // The SET and the SIZES, not the bare src. Preloading one fixed file
    // while the <img> resolves `sizes` to the other candidate downloads both
    // — which is worse than not preloading at all. These two strings are the
    // same ones the <picture> below uses, read from the same constant.
    imageSrcSet: HERO_IMAGE.srcSet,
    imageSizes: HERO_IMAGE.sizes,
  });

  // Replace dotted 'i' with dotless 'ı' (U+0131) so height aligns perfectly
  // with 'r' and 'z'. Unchanged from the previous hero — this is the same
  // wordmark, drawn by the same two classes from the same string.
  const rawText = HERO.display || 'iriz';
  const wordmarkText = rawText.toLowerCase().replace(/i/g, 'ı');

  return (
    <section
      id="showcase"
      className="relative isolate overflow-hidden bg-black-obsidian"
    >
      {/* THE PAGE GROUND, and the only colour behind the type: a very soft
          blue wash sitting behind the RIGHT column, where the card is. It
          never reaches the text, which keeps the left column measuring
          against a flat #030303 rather than against a gradient. */}
      <span aria-hidden="true" className="hero-aura pointer-events-none absolute inset-0" />

      <div className="section-container relative grid items-center gap-12 pb-20 pt-28 sm:gap-14 lg:min-h-svh lg:grid-cols-2 lg:gap-16 lg:pb-28 lg:pt-32">
        {/* ONE animated block for the whole left column, which is what makes
            the buttons and the stats "come in with" the text rather than
            needing a stagger of their own. */}
        <div className="hero-in-text">
          <p className="type-label text-white/70">{HERO.eyebrow}</p>

          {/* TWO CHILDREN, one for each audience — unchanged, and
              deliberately so: this is the page's only <h1> and the strongest
              on-page heading signal a crawler reads.

              The name the machines read is a real text node in an `sr-only`
              span, not an `aria-label`: an aria-label would have worked for
              the accessible name, but it OVERRIDES the contents rather than
              supplementing them, which is how this element once ended up
              announcing "iriz".

              That text node is HERO.accessibleName ("IRIZ mini projector for
              home"), not HERO.display — "IRIZ" alone names the product
              without saying what it is. The visual span draws HERO.display,
              so the two cannot drift: the sentence is read, the four letters
              are seen. The glyphs are the dotless U+0131 wordmark in an
              `aria-hidden` span, so it is pruned from the accessibility tree
              and cannot be announced as "ırız".

              The styling stays on the <h1> and the visual span INHERITS it —
              family, size, weight, tracking, leading, colour and the
              `text-transform: none` all cascade down. */}
          <h1
            className="type-display font-iriz mt-5 text-white"
            style={{ textTransform: 'none' }}
          >
            <span className="sr-only">{HERO.accessibleName}</span>
            <span aria-hidden="true">{wordmarkText}</span>
          </h1>

          <p className="type-lede mt-5 max-w-md text-white/85">{HERO.tagline}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {/* SHOW_BUY gates the buy button and nothing else. With it off the
                row is "See specs" alone, which still fills a row and still
                gives the first screen something to do — see lib/site-config. */}
            {SHOW_BUY && <HeroBuyButton className="btn-primary" />}
            <Link href={ROUTES.specs} className="btn-secondary">
              See specs
            </Link>
          </div>

          {/* A <dl>, because each one of these IS a term and its value. Four
              <p>s would read as eight unrelated fragments; this announces
              "Native Full HD, 1080P" as one pair.

              The VALUE is first visually and second in the DOM, because a
              description list has to be term-then-description to be valid —
              `flex-col-reverse` paints the big number above its label without
              reordering the markup. */}
          <dl className="mt-10 grid max-w-md grid-cols-2 gap-x-6 gap-y-6 sm:gap-x-10 lg:max-w-none lg:grid-cols-4 lg:gap-x-6">
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse gap-1.5">
                <dt className="type-label text-white/60">{stat.label}</dt>
                <dd className="hero-stat text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* THE CARD. `isolation: isolate` on it is load-bearing, not tidiness
            — see `.hero-card` in app/globals.css: it is what the photograph's
            `mix-blend-mode: multiply` blends against, and without it the
            white seamless would multiply against the black page the moment
            the entrance animation's transform expired. */}
        <div className="hero-in-card hero-card">
          {/* THE BLEND WRAPPER. The photograph's ground is the studio's own
              near-white (rgb 254,254,254), and multiplying it against the
              card's white-to-grey gradient leaves the gradient untouched —
              so the seamless disappears into the card instead of sitting on
              it as a rectangle, with no cutout and no keying. */}
          <div className="hero-photo">
            <picture>
              <source
                type="image/webp"
                srcSet={HERO_IMAGE.srcSet}
                sizes={HERO_IMAGE.sizes}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HERO_IMAGE.fallback}
                srcSet={HERO_IMAGE.fallbackSrcSet}
                sizes={HERO_IMAGE.sizes}
                alt={HERO_IMAGE.alt}
                // The WIDEST file's pixels, which is the intrinsic ratio for
                // every candidate in the set — so the box is reserved before
                // any bytes arrive and is the same box whichever width the
                // browser picks. That is what holds CLS at zero.
                width={HERO_IMAGE.width}
                height={HERO_IMAGE.height}
                // The LCP element: fetched at high priority and never lazy.
                // The matching <head> preload is at the top of this
                // component — `fetchPriority` alone does not start the
                // request any earlier than the parser reaches this tag.
                fetchPriority="high"
                decoding="async"
                className="h-auto w-full"
              />
            </picture>
          </div>

          {/* The lens glow. Positioned from HERO_IMAGE.lens, which is where
              the glass actually is in this frame, so re-running the image
              script moves the light with the photograph. A sibling of the
              blend wrapper rather than a child, because `multiply` over a
              light card would turn a blue glow into a blue stain — and it
              carries the same float animation, so it travels with the lens
              instead of drifting across it. */}
          <span
            aria-hidden="true"
            className="hero-lens pointer-events-none"
            style={{ '--lens-x': HERO_IMAGE.lens.x, '--lens-y': HERO_IMAGE.lens.y }}
          />
        </div>
      </div>
    </section>
  );
}

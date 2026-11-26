import Link from 'next/link';
import { preload } from 'react-dom';
import HeroBuyButton from '@/components/hero/HeroBuyButton';
import NeuronNetwork from '@/components/hero/NeuronNetwork';
import { HERO, HERO_CHIPS, HERO_STATS } from '@/lib/iriz';
// The hero photograph's own config — the file `npm run hero:image` rewrites.
// See the WHERE TO CHANGE THE HERO IMAGE banner at the top of it.
import { HERO_IMAGE } from '@/lib/hero-image';
import { ROUTES } from '@/lib/routes';
import { SHOW_BUY } from '@/lib/site-config';

/**
 * The homepage hero — the NEURON NETWORK treatment: a dark two-column frame
 * with the product photographed on a light card, over a canvas field of blue
 * nodes that fire signals into the projector's lens.
 *
 * ---------------------------------------------------------------------------
 * WHAT CHANGED FROM THE PREVIOUS HERO, AND WHAT DELIBERATELY DID NOT
 * ---------------------------------------------------------------------------
 * ADDED: components/hero/NeuronNetwork (the canvas), a visual headline built
 * from HERO.tagline with its last word in a shimmering blue gradient, three
 * glass chips around the card from HERO_CHIPS, and a pulsing blue ring on the
 * card. The eyebrow is set in light blue instead of white/70.
 *
 * UNCHANGED, and each one for a reason already paid for once:
 *
 *   THE WORDMARK. The <h1> below is byte-for-byte the element the previous
 *   hero shipped — same two children, same `type-display font-iriz` pair,
 *   same `textTransform: none`, same dotless-ı substitution off HERO.display.
 *   There is NO wordmark asset on this site: the four letters are live text
 *   in Zen Dots (next/font/google, wired up in app/layout.jsx as
 *   `--font-iriz`) dressed by the `.font-iriz` utility in app/globals.css,
 *   which owns the size ramp, the 400 weight and the 0.02em tracking. So
 *   "the same wordmark" means the same string through the same two classes —
 *   nothing here retypes it, re-draws it, re-weights it or re-colours it, and
 *   the only thing this rebuild may change about it is its size, which it
 *   does not.
 *
 *   THE <picture> AND ITS PRELOAD. Still the LCP element, still four
 *   pre-built static files out of lib/hero-image, still preloaded in the
 *   <head> with `imageSrcSet`/`imageSizes` that agree with the <img>.
 *
 *   THE BUY BUTTONS. components/hero/HeroBuyButton, which renders one per
 *   listed marketplace out of the store registry — no label, href or store
 *   name is typed here or there — and every click still calls
 *   `trackBuyClick`. It was `buyDestinations()[0]` alone until Amazon went
 *   live; "See specs" moved below the row to make space and is now a text
 *   link rather than a third pill.
 *
 *   DOM ORDER IS STILL THE MOBILE ORDER. Copy first, card second — eyebrow,
 *   wordmark, headline, buttons, stats, then the product and its chips. No
 *   `order:` anywhere, so the accessibility tree and the visual order stay
 *   identical at every width.
 *
 *   THE ENTRANCE IS STILL CSS AND STILL NEVER TRANSPARENT. `.hero-in-text` /
 *   `.hero-in-card` are a 12px rise and nothing else (app/globals.css). An
 *   element at `opacity: 0` is not a candidate for Largest Contentful Paint,
 *   so a fade on this card once had the photograph's LCP timestamped at the
 *   end of an animation it had nothing to do with. Nothing above the fold may
 *   use components/Reveal either — it server-renders its children invisible
 *   and waits for the bundle.
 *
 * ---------------------------------------------------------------------------
 * THE CANVAS IS THE ONLY CLIENT COMPONENT HERE
 * ---------------------------------------------------------------------------
 * Everything else on this screen is server-rendered: the chips are real text
 * in the HTML, the ring and the glow are CSS, the shimmer is a keyframe. The
 * network is the one thing that genuinely needs a main thread, and it does
 * not touch it until after the `load` event — see the long note in
 * components/hero/NeuronNetwork.
 *
 * It also owns the CURSOR TILT on the card, by writing `--tilt-x` / `--tilt-y`
 * onto the `[data-hero-card]` element below. The data attribute, not a ref,
 * because the card has to stay server-rendered markup: handing it to a client
 * component as children would work, but a selector costs nothing and keeps
 * the LCP image out of any client module's tree.
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

  /*
   * THE HEADLINE, SPLIT RATHER THAN RETYPED.
   *
   * The visual headline is HERO.tagline ("Your home cinema awaits.") with its
   * LAST WORD in the shimmering blue gradient. Both halves are sliced off the
   * one string at render time instead of being two fields in lib/iriz, for
   * the same reason HERO_STATS reads its figures back out of SPECS: a second
   * copy of a sentence is a second place for it to go stale. Re-word the
   * tagline and the gradient follows whatever its last word becomes.
   *
   * A one-word tagline degrades to the whole thing shimmering, which is the
   * sensible reading of "the last word" rather than an edge case to guard.
   */
  const taglineWords = HERO.tagline.trim().split(/\s+/);
  const taglineAccent = taglineWords.pop();
  const taglineLead = taglineWords.join(' ');

  return (
    <section
      id="showcase"
      className="relative isolate overflow-hidden bg-black-obsidian"
    >
      {/* THE PAGE GROUND: a soft navy radial wash centred on the product, at
          72% across and 55% down. It never reaches far enough left to sit
          under the copy, which keeps the left column measuring against a
          flat #030303 rather than against a gradient. */}
      <span aria-hidden="true" className="hero-aura pointer-events-none absolute inset-0" />

      {/* THE NETWORK. A sibling of the aura and of the grid, so it paints
          between them: over the wash, under every word. Empty in the
          server HTML and transparent until its own script starts it after
          `load` — see components/hero/NeuronNetwork. */}
      <NeuronNetwork />

      <div className="section-container relative grid items-center gap-12 pb-20 pt-28 sm:gap-14 lg:min-h-svh lg:grid-cols-2 lg:gap-16 lg:pb-28 lg:pt-32">
        {/* ONE animated block for the whole left column, which is what makes
            the buttons and the stats "come in with" the text rather than
            needing a stagger of their own. */}
        <div className="hero-in-text">
          {/* Light blue, where this used to be white/70. Measured at 11.6:1
              on #030303 — comfortably past AA at `.type-label`'s 11px, which
              is the size that made the check worth doing. */}
          <p className="type-label hero-eyebrow">{HERO.eyebrow}</p>

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

          {/* THE VISUAL HEADLINE, and it is a <p> rather than an <h2>: the
              page's heading outline is unchanged by this rebuild, and
              promoting a tagline to a second-level heading would put a
              sentence that states no section into the document structure.
              `.hero-headline` carries the size; `.hero-shimmer` carries the
              gradient and the 4s pass. */}
          <p className="hero-headline mt-5 max-w-md text-white">
            {taglineLead}
            {taglineLead ? ' ' : null}
            <span className="hero-shimmer">{taglineAccent}</span>
          </p>

          {/* THE BUY ROW IS THE STORES, AND ONLY THE STORES.
              components/hero/HeroBuyButton renders one button per listed
              marketplace — "Buy on Flipkart" primary, "Buy on Amazon"
              secondary. On a phone they are full width and `flex-wrap` puts
              one per row; from `sm` they sit side by side at their label
              widths. The geometry is all in that component.

              `gap-2.5` is the 10px between the stacked buttons. It stays
              `sm:gap-3` above, because that is the gap the row already had
              and nothing about the wider layout asked for it to change. */}
          <div className="mt-8 flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* SHOW_BUY gates the store buttons and nothing else. With it off
                this row is empty and "See specs" below is the first screen's
                only action — see lib/site-config. */}
            {SHOW_BUY && <HeroBuyButton />}
          </div>

          {/* "SEE SPECS" IS A TEXT LINK NOW, NOT A THIRD PILL.
              Two store buttons and a third button do not fit on one row at
              375px, and three pills of equal weight is three primary actions
              — which is none. Demoting it keeps it on the first screen and
              out of the buy decision. It keeps a 44px box because it is a
              standalone link rather than one inside a sentence, so the WCAG
              2.2 target-size exemption for inline links does not apply. */}
          <Link
            href={ROUTES.specs}
            className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium text-white/70 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white hover:decoration-white/60"
          >
            See specs
          </Link>

          {/* A <dl>, because each one of these IS a term and its value. Four
              <p>s would read as eight unrelated fragments; this announces
              "Native Full HD, 1080p" as one pair.

              THE FIGURES ARE NOT TRANSFORMED. `.hero-stat` sets size, weight,
              leading and tracking and deliberately no `text-transform` — the
              casing and the inch mark are decided in the data (lib/iriz.js,
              HERO_STATS), where a screen reader and a copy-paste see the same
              characters the page draws. The LABELS are uppercased, by
              `.type-label`, and they are the only thing here that is.

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

        {/* THE STAGE. It exists for exactly two reasons and holds no styling
            of its own beyond them: it is the `perspective` the card's 3D tilt
            is read through, and it is the positioning context the chips hang
            off. The ENTRANCE lives here too, so the rise and the tilt are on
            two different elements and cannot overwrite each other's
            `transform`. */}
        <div className="hero-in-card hero-stage">
          {/* THE CARD. `isolation: isolate` on it is load-bearing, not
              tidiness — see `.hero-card` in app/globals.css: it is what the
              photograph's `mix-blend-mode: multiply` blends against, and it
              is also what makes the tilt safe. A transform on an element
              that does NOT declare its own isolation turns the blend's
              backdrop transparent and the seamless comes back as a white
              rectangle; declared here, the blend group is rooted on this
              element and stays rooted whatever the transform is doing. */}
          <div className="hero-card" data-hero-card>
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

            {/* The lens glow, and now also THE SIGNALS' DESTINATION.
                Positioned from HERO_IMAGE.lens, which is where the glass
                actually is in this frame, so re-running the image script
                moves the light — and every signal the canvas fires — with the
                photograph. `data-hero-lens` is the hook
                components/hero/NeuronNetwork measures; nothing else reads it,
                and there is no second copy of the coordinate anywhere.

                A sibling of the blend wrapper rather than a child, because
                `multiply` over a light card would turn a blue glow into a
                blue stain — and it carries the same float animation, so it
                travels with the lens instead of drifting across it.

                `lens: null` RENDERS NOTHING, and that is a supported state
                rather than a missing value to paper over. `npm run
                hero:image` writes null when it cannot find the glass with
                confidence and nobody told it where the glass is — because a
                glow a few percent off the lens reads as a bug in the page,
                while no glow reads as a design decision. So the element is
                absent, not present at a guessed position and not present at
                (50%, 50%); the canvas then aims its signals at the card's
                centre instead. */}
            {HERO_IMAGE.lens ? (
              <span
                aria-hidden="true"
                data-hero-lens
                className="hero-lens pointer-events-none"
                style={{ '--lens-x': HERO_IMAGE.lens.x, '--lens-y': HERO_IMAGE.lens.y }}
              />
            ) : null}

            {/* THE RING, and it is the LAST child on purpose. A blend mode
                composites against whatever has already been painted beneath
                it, so a ring drawn BEFORE the photograph would end up inside
                the photograph's backdrop and be multiplied into it. Drawn
                after, it sits cleanly on top. It animates `opacity` only —
                the one property that pulses without a repaint of the card's
                gradient underneath. */}
            <span aria-hidden="true" className="hero-ring pointer-events-none" />
          </div>

          {/* THE CHIPS. Real text in the server HTML, not decoration: each
              one states a fact the hero does not otherwise carry, and every
              one of those facts is read back out of the spec sheet in
              lib/iriz.js (see the note on HERO_CHIPS) rather than written
              here. A <ul>, because three parallel facts are a list.

              The THIRD is hidden under 700px by `.hero-chip` — `display:
              none` takes it out of the accessibility tree with it, so a
              phone never announces a chip it does not draw. */}
          <ul className="hero-chips" aria-label="At a glance">
            {HERO_CHIPS.map((chip) => (
              <li key={chip.lead} className="hero-chip">
                <span className="hero-chip-lead">{chip.lead}</span>
                {/* The separator is punctuation, not content: a screen reader
                    announcing "middle dot" between every chip's two halves is
                    noise, so it is pruned and the two spans read as one
                    phrase. */}
                <span aria-hidden="true" className="hero-chip-sep">·</span>
                <span className="hero-chip-text">{chip.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

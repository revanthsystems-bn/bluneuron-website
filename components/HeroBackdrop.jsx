import Image from 'next/image';
import { MEDIA, HERO } from '@/lib/iriz';

/**
 * The hero's backdrop: the IRIZ on a dark stage, lens forward.
 *
 * ---------------------------------------------------------------------
 * WHY THIS IS NO LONGER THE VIDEO LOOP.
 *
 * `iriz-loop.mp4` / `.webm` show the REAR of the unit — the power socket, the
 * vent stack and the I/O row — held in one hand, for the whole four seconds.
 * Both encodings were sampled frame by frame across the full duration to
 * check: there is no frame anywhere in that clip with the lens in it. The
 * poster still (`iriz-loop-poster.jpg`) is frame 0 and is the same rear view,
 * which is why the first thing a visitor saw was a close-up of a mains inlet.
 *
 * `MEDIA.heroLoop.description` claimed the camera "pushes in on the lens".
 * It does not. That string has been corrected rather than relied on.
 *
 * So the hero is a STILL, and specifically `heroClean` — the only front
 * three-quarter view of the product this repository has. The video files stay
 * in public/ untouched, along with the byte-range handling in
 * custom-worker.js that exists for them (see CLAUDE.md): nothing here is a
 * reason to remove either, and the clip is still the right asset the day a
 * front-facing one is shot to go with it.
 *
 * ---------------------------------------------------------------------
 * WHAT THIS BUYS, BEYOND SHOWING THE RIGHT SIDE OF THE PRODUCT.
 *
 * The hero was the page's LCP problem. The old backdrop rendered the poster
 * <img> on the server and then REPLACED it with a <video> on the client once
 * the reduced-motion query had been read — so the image that would have been
 * the LCP candidate was removed from the DOM at hydration, and Chrome fell
 * back to timing a 53px "SCROLL" label instead. Measured: 4.9s LCP, 90% of it
 * render delay.
 *
 * One `priority` image that is never swapped is both the honest LCP element
 * and the fast one. It also makes this a SERVER component: no `use client`,
 * no `matchMedia`, no IntersectionObserver, no three-state render, and no
 * 740KB of video on the critical path.
 *
 * ---------------------------------------------------------------------
 * THE WHITE GROUND. `heroClean` is a white-on-white studio render, and this
 * hero is near-black. `.hero-product` masks its rectangular bounds away and
 * `.hero-stage` paints the ambient light it is standing in — the same pairing
 * `.product-fade` / `.product-glow` use elsewhere on the site, tuned here for
 * a full-bleed box. Nothing is keyed out of the pixels: the projector is
 * white plastic, so a cutout would eat the product along with its backdrop.
 */
export default function HeroBackdrop() {
  return (
    <>
      {/* Ambient stage light. Decorative, and painted under the product. */}
      <div aria-hidden="true" className="hero-stage" />

      {/*
        `priority` + `fetchPriority="high"`: this is the LCP element on the
        homepage and should be discovered in the initial HTML and fetched
        ahead of everything else. `priority` already emits the preload link —
        a hand-written <link rel="preload"> in the layout would be a second,
        competing hint for the same bytes.

        `sizes` is deliberately generous. The image is `object-contain` in a
        full-bleed box, so on a tall phone it is width-bound and on a wide
        desktop it is height-bound; asking for 100vw costs an AVIF of a few
        tens of KB at the widths Next generates and removes any chance of the
        hero rendering a blurry upscale.
      */}
      <Image
        src={MEDIA.product.heroClean}
        alt={HERO.backdropAlt}
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        className="hero-product"
      />
    </>
  );
}

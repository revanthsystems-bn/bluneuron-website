'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * The product gallery: one large frame, a row of thumbnails under it.
 *
 * WHY THUMBNAILS AND NOT A CAROUSEL. A carousel hides how many images there
 * are and makes reaching the fourth one three gestures. Thumbnails state the
 * count, allow any order, and give a keyboard user a real tab stop per
 * image. The large frame is still swipeable in the sense that it scrolls
 * with the page — nothing here traps a gesture.
 *
 * THE FRAME IS A FIXED SQUARE and the images are `object-contain`, because
 * the shots are a mix: white-studio renders of the bare unit and a
 * photograph on a grey ground. Cropping to fill would cut the unit out of
 * one and leave the other floating. A declared aspect ratio also means
 * nothing reflows when a different image decodes.
 *
 * `shot.fade` marks the white-on-white renders that need the site's
 * `product-fade` mask to dissolve their backdrop into the page. The retail
 * photograph must NOT get it — its grey ground and its reflection are what
 * make it read as a photograph — which is exactly the distinction the MEDIA
 * block in lib/iriz.js documents.
 *
 * Only the first image is `priority`. It is what a visitor sees before any
 * interaction and is usually the page's largest paint; the others load when
 * their thumbnail does.
 */
export default function ProductGallery({ shots }) {
  const [active, setActive] = useState(0);
  const current = shots[active];

  return (
    <div>
      {/* HEIGHT IS CAPPED ON MOBILE, and this is a conversion fix rather than
          a cosmetic one. A square frame at 390px is ~358px tall, which pushed
          the price and "Add to cart" below the fold on every phone — the two
          things the page exists for were a scroll away from a visitor who had
          already arrived intending to buy. 4:3 plus a 55svh ceiling keeps the
          product large while leaving the price on screen. Measured, not
          guessed: at 390x844 a square frame put the price 866px down the
          page, 4:3 moved it to ~838, and 3:2 with a 42svh ceiling — together
          with a tighter column gap and 56px thumbnails — brings it inside
          the first screen with the buy button a short flick below.

          `svh`, not `vh`: on iOS Safari `vh` is the LARGEST viewport height
          (chrome hidden), so a `max-h-[55vh]` box is taller than 55% of what
          you can actually see when the address bar is showing — which is
          exactly the state the page loads in.

          Square again from `sm` up, where there is height to spare and the
          square matches the thumbnails and the rest of the site's product
          frames. */}
      <div
        className={`product-stage relative aspect-[3/2] max-h-[42svh] w-full overflow-hidden rounded-3xl border border-border-subtle sm:aspect-square sm:max-h-none ${
          current.fade ? 'product-glow bg-black' : ''
        }`}
      >
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt}
          fill
          sizes="(min-width: 1024px) 560px, 92vw"
          priority={active === 0}
          // `p-6` so a cut-out product has air around it inside the card
          // rather than touching the hairline.
          className={`object-contain p-6 sm:p-10 ${current.fade ? 'product-fade' : ''}`}
        />
      </div>

      {/* `role="tablist"` is deliberately NOT used. These are not tabs — they
          do not reveal panels of different content, they change one image —
          and claiming the tab pattern would promise arrow-key navigation
          between them that this does not implement. A row of buttons with
          `aria-pressed` describes what this actually is.

          ONE SCROLLING ROW, NOT A WRAPPING ONE. Six thumbnails at 64px wrap
          to two rows inside a 390px viewport, and those two rows were enough
          to push the price and "Add to cart" below the fold — which is the
          whole thing the gallery height cap was meant to prevent. A single
          row that scrolls keeps the buy panel up; `-mx-6 px-6` lets it bleed
          to the screen edge inside the padded container so the cut-off
          thumbnail is visible, which is what tells a thumb there is more.

          The images are FIXED-SIZE, not `fill`. With `fill` two of the six
          reliably rendered blank: the server HTML carried a correct srcSet,
          but after hydration those two `<img>` elements ended up with no
          `currentSrc` at all and painted nothing. `fill` exists for boxes
          whose size is only known at layout time, which is not this — these
          are 64 or 80 CSS pixels square, stated right here — so giving the
          image real `width`/`height` is both the fix and the more correct
          spelling. */}
      <ul className="-mx-6 mt-4 flex gap-3 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {shots.map((shot, i) => (
          <li key={shot.src} className="shrink-0">
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              aria-label={`Show image ${i + 1}: ${shot.label}`}
              className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border p-1.5 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft sm:h-20 sm:w-20 ${
                i === active
                  ? 'border-accent/60 bg-white/[0.06]'
                  : 'border-border-subtle bg-black-soft hover:border-white/20'
              }`}
            >
              <Image
                src={shot.src}
                alt=""
                width={80}
                height={80}
                sizes="80px"
                className={`h-full w-full object-contain p-1 ${shot.fade ? 'product-fade' : ''}`}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

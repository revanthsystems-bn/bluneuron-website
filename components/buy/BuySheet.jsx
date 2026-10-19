'use client';

import { useCallback, useId, useRef } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import useDialogBehaviour from '@/lib/useDialogBehaviour';
import StoreButtons from './StoreButtons';
import { BRAND, HERO, PRODUCT } from '@/lib/iriz';
import { MARKETPLACE, formatInr } from '@/lib/site-config';

/**
 * "Choose where to buy" — one surface behind every Buy button on the site.
 *
 * WHY A SHEET AND NOT A LINK. There are two places to buy and no reason to
 * prefer one, so a "Buy" button cannot simply navigate: it has to ask. The
 * old flow scrolled the homepage to a card further down, which works on the
 * homepage and is meaningless from the masthead of a policy page. This
 * answers the question wherever it is asked.
 *
 * ONE COMPONENT, TWO SHAPES. A bottom sheet under `sm`, a centred dialog
 * above it. Not two components: the content, the focus handling, the
 * analytics and the pending-link rule are identical, and the only real
 * difference is which edge it is anchored to. Tailwind's `sm:` handles the
 * geometry; `useReducedMotion` is not needed because <MotionConfig
 * reducedMotion="user"> in app/layout.jsx already drops the transform and
 * leaves the fade.
 *
 * NO PRICE IS RESTATED HERE FROM MEMORY. `MARKETPLACE.priceInr` is the
 * single source (lib/site-config) and `formatInr` the single formatter, so
 * the sheet cannot disagree with the product page about what the thing
 * costs.
 *
 * ANALYTICS and the never-render-a-placeholder-href rule both live in
 * components/buy/StoreButtons, which this shares with the inline
 * marketplace row elsewhere on the site.
 */
export default function BuySheet({ open, onClose }) {
  const panelRef = useRef(null);
  const titleId = useId();

  // Stable identity: useDialogBehaviour lists onClose in its dependencies,
  // and an inline arrow would re-run the whole effect — re-trapping focus —
  // on every parent render.
  const handleClose = useCallback(() => onClose(), [onClose]);

  useDialogBehaviour({ open, onClose: handleClose, panelRef });


  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6"
          role="presentation"
        >
          {/* Scrim. A real button so a pointer-less user can dismiss, but
              aria-hidden: Escape is the keyboard route and the trap keeps
              focus off it, so announcing a nameless control would be noise. */}
          <motion.button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={[
              // CENTRED BY THE FLEX PARENT, never by a transform utility.
              // `sm:-translate-y-1/2` was the obvious way to centre this
              // and it silently did nothing: framer-motion writes the `y`
              // animation above as an inline `transform`, which beats a
              // class every time, so the dialog sat half a panel too low.
              // The parent's `items-center` owns position; the spring owns
              // transform; neither touches the other.
              'relative w-full border-t border-border bg-black-surface',
              'rounded-t-sheet px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 shadow-sheet',
              'sm:max-w-[26rem] sm:rounded-sheet sm:border sm:p-6 sm:shadow-dialog',
            ].join(' ')}
          >
            {/* Grab handle: mobile affordance only. */}
            <div
              aria-hidden="true"
              className="mx-auto mb-5 h-1 w-9 rounded-full bg-white/20 sm:hidden"
            />

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-3 top-3 hidden h-11 w-11 items-center justify-center rounded-full border border-border text-ink-2 transition-colors duration-base ease-brand hover:bg-white/5 hover:text-ink sm:flex"
            >
              <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </button>

            {/* `sm:pr-12` keeps the eyebrow clear of the close button,
                which is absolutely positioned in the same corner. Without
                it "Mini projector for home" ran underneath the X at desktop
                widths. */}
            <div className="flex items-start gap-4 sm:pr-12">
              <div className="relative h-20 w-20 flex-none overflow-hidden rounded-ctl border border-border bg-black-elevated">
                {/* CONTAIN, NOT COVER, and sized for retina.

                    This tile rendered as an unreadable dark square. Three
                    things were wrong at once and all three are fixed here:

                      - It pointed at the old retail-carton photograph. The
                        source is now PRODUCT.image = the bare unit, front
                        three-quarter (lib/iriz.js has the full note).
                      - `object-cover` centre-cropped a 1.66:1 photo into a
                        1:1 box, which discarded the product and kept a patch
                        of background. `object-contain` + `p-1.5` keeps the
                        whole unit in frame with a little air around it.
                      - `sizes="80px"` asked the optimiser for an 80px-wide
                        source, so a 2x phone got a 96px file scaled up and
                        a 1x one got 80x48 of actual pixels. `sizes="160px"`
                        buys the 2x variant; it is a ~6KB AVIF either way.

                    `.product-fade-tight` dissolves the render's white studio
                    ground into the dark panel. Without it a white-on-white
                    shot on `bg-black-elevated` is a white rectangle, which
                    is the original reason this was a photograph. */}
                <Image
                  src={PRODUCT.image}
                  alt=""
                  fill
                  sizes="160px"
                  className="product-fade-tight object-contain p-1.5"
                />
              </div>

              <div className="min-w-0">
                <p className="eyebrow">{HERO.eyebrow}</p>
                <h2 id={titleId} className="mt-1.5 text-step-4 font-semibold text-ink">
                  {BRAND.fullName}
                </h2>
                <p className="mt-2 text-step-5 font-bold tracking-tight text-ink">
                  {formatInr(MARKETPLACE.priceInr)}
                </p>
                <p className="mt-1 text-step-1 text-ink-3">{MARKETPLACE.priceNote}</p>
              </div>
            </div>

            {/* The store row, its pending rule and its analytics all live
                in components/buy/StoreButtons — shared with the inline
                marketplace row on /where-to-buy and the homepage buy card,
                so there is one implementation of "never render a
                placeholder href" rather than two that can drift. */}
            <div className="mt-6">
              <StoreButtons />
            </div>

            <p className="mt-4 text-center text-step-1 leading-relaxed text-ink-3">
              You&rsquo;ll complete your purchase securely on Amazon&nbsp;/&nbsp;Flipkart.{' '}
              <span className="text-ink-2">Warranty is the same either way.</span>
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

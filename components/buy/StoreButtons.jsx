'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { track } from '@vercel/analytics';
import { buyDestinations } from '@/lib/buy-destinations';
import { trackGaEvent } from '@/lib/googleAnalytics';
import { trackMetaPixelCustom } from '@/lib/metaPixel';

/**
 * The two store buttons, and the one rule about them.
 *
 * Shared by the buy sheet (components/buy/BuySheet) and the inline
 * marketplace row (components/MarketplaceButtons) so that BOTH obey the
 * same rule and there is one place to check it:
 *
 *   A URL still carrying the PLACEHOLDER marker never reaches the DOM as an
 *   href. The button looks identical — the live state is what ships, so it
 *   is the state worth reviewing — and the CLICK is what differs: a short
 *   note saying the link goes live on sale day, and no navigation.
 *
 * It replaces the previous arrangement, where a placeholder rendered as a
 * REAL clickable link to the marketplace's front page so the flow could be
 * exercised in a preview. That was defensible while the site was not for
 * sale and indefensible now: the same build is what goes live, and a
 * visitor sent to amazon.in's homepage is a visitor shopping for someone
 * else's projector.
 *
 * `scripts/test-buy-links.mjs` asserts all of this against a real build.
 */
export default function StoreButtons({
  className = 'flex flex-col gap-2.5',
  buttonClassName = 'w-full',
  /** Primary tone for the first store, secondary for the rest. */
  tones = ['btn-primary', 'btn-secondary'],
}) {
  const [pendingNote, setPendingNote] = useState(null);
  const destinations = buyDestinations();

  /**
   * ONE EVENT, ONE PROPERTY.
   *
   * `store` is the marketplace id ('amazon' / 'flipkart'), and it is the
   * only thing sent. No email, no name, no address, no order identifier —
   * nothing that is or could become personal data goes to GA4 or the Meta
   * Pixel from this site.
   *
   * It fires for a pending destination too: the intent to buy is real
   * whether or not the listing is live yet, and a hole in the funnel on
   * launch day would read as a conversion problem rather than a missing URL.
   */
  const fire = (store) => {
    trackGaEvent('buy_click', { store });
    track('buy_click', { store });
    trackMetaPixelCustom('ClickToBuy', { store });
  };

  return (
    <div>
      <div className={className}>
        {destinations.map((d, i) => {
          const tone = tones[Math.min(i, tones.length - 1)];
          const cls = `${tone} ${buttonClassName}`;

          if (d.ready) {
            return (
              <a
                key={d.id}
                href={d.href}
                target="_blank"
                // `noopener` stops the marketplace tab reaching back through
                // window.opener; `noreferrer` keeps our URL out of their
                // referrer log.
                rel="noopener noreferrer"
                onClick={() => fire(d.id)}
                className={cls}
              >
                {d.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            );
          }

          // A <button>, not an <a>: there is no URL, so there is nothing to
          // put in an href, and `href="#"` is a lie that a crawler and a
          // middle-click would both believe.
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                fire(d.id);
                setPendingNote(d.name);
              }}
              className={cls}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {/* aria-live, so the note is announced without stealing focus — the
          button that was just pressed is still the right place to be. */}
      <div aria-live="polite">
        <AnimatePresence>
          {pendingNote && (
            <motion.p
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden rounded-xl border border-accent/40 bg-accent/10 px-3.5 py-2.5 text-[13px] text-white/85"
            >
              {pendingNote} link goes live on sale day.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

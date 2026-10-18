'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PriceTag from './PriceTag';
import BuyButtons from './BuyButtons';
import NotifyButton from './NotifyButton';
import { NOTIFY_SOURCES } from '@/lib/web3forms';
import { COMMERCE_ENABLED } from '@/lib/launch';
import { BRAND } from '@/lib/iriz';
import BuyButton from '@/components/buy/BuyButton';
import { MARKETPLACE, SHOW_BUY, formatInr } from '@/lib/site-config';

// Mobile-only sticky bottom bar, shown once the user scrolls past the hero —
// the same pattern most consumer-hardware product pages use. Desktop already
// has a persistent "Buy Now" in the header, so this stays hidden at lg+.
export default function StickyBuyBar() {
  const [visible, setVisible] = useState(false);

  /*
   * VISIBILITY IS AN INTERSECTION, NOT A SCROLL HANDLER.
   *
   * The old version read `window.scrollY` and `window.innerHeight` on
   * every scroll event and called setState with the result. Both reads
   * force style and layout, and Lenis emits a scroll event per animation
   * frame — so this ran a forced reflow 60 times a second for the whole
   * length of a 13,000px page, and set state on every one of them.
   *
   * A zero-height sentinel at 80svh and one IntersectionObserver does the
   * same job off the main thread, and fires twice: once going down, once
   * coming back up.
   */
  const sentinelRef = useRef(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        // Left through the TOP, not merely off screen: on a short page
        // the sentinel starts below the fold, and `!isIntersecting`
        // alone would show the bar before it had been scrolled past.
        setVisible(entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* The trigger line. Zero height, in NORMAL FLOW, and this component
          renders immediately after <Hero> — so it sits exactly at the
          bottom of the hero and needs no viewport arithmetic to say so.
          An absolutely-positioned 80svh version would measure the same
          thing today and break silently the day <main> gains a
          `position`. */}
      <div ref={sentinelRef} aria-hidden="true" className="h-0 w-full" />

      <AnimatePresence>
        {visible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle bg-black/95 px-4 py-3 backdrop-blur-glass lg:hidden"
        >
          {SHOW_BUY ? (
            /* Marketplace selling: the bar carries the price and ONE action,
               which scrolls to the buy card. Not the two marketplace buttons
               themselves — a 390px bar cannot hold a price plus two labelled
               buttons without truncating all three, and choosing a marketplace
               is a decision that needs the fulfilment note next to it. See
               components/BuySection. */
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-step-2 font-semibold text-white">
                  {formatInr(MARKETPLACE.priceInr)}
                </p>
                <p className="truncate text-step-1 text-ink-3">{MARKETPLACE.priceNote}</p>
              </div>
              <BuyButton className="btn-primary shrink-0 whitespace-nowrap px-5" />
            </div>
          ) : COMMERCE_ENABLED ? (
            <div className="flex items-center justify-between gap-3">
              <PriceTag size="sm" />
              <BuyButtons
                className="flex shrink-0 gap-2"
                primaryClassName="btn-primary px-4 py-2.5 text-step-1 whitespace-nowrap"
                secondaryClassName="btn-secondary px-4 py-2.5 text-step-1 whitespace-nowrap"
                strength={0}
              />
            </div>
          ) : (
            /* Pre-launch the bar keeps its job — a persistent action once the
               hero is behind you — but the action is the launch list, and the
               price goes with the buy pair. See lib/launch.js. */
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-step-2 font-semibold text-white">{BRAND.fullName}</p>
                <p className="text-step-1 text-ink-3">Launching soon</p>
              </div>
              <NotifyButton
                source={NOTIFY_SOURCES.stickyBar}
                className="btn-primary shrink-0 whitespace-nowrap px-5 py-2.5 text-step-1"
                strength={0}
              />
            </div>
          )}
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

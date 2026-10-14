'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PriceTag from './PriceTag';
import BuyButtons from './BuyButtons';
import NotifyButton from './NotifyButton';
import { NOTIFY_SOURCES } from '@/lib/web3forms';
import { COMMERCE_ENABLED } from '@/lib/launch';
import { BRAND } from '@/lib/iriz';
import { BUY_HREF } from '@/lib/routes';
import { MARKETPLACE, SHOW_BUY, formatInr } from '@/lib/site-config';

// Mobile-only sticky bottom bar, shown once the user scrolls past the hero —
// the same pattern most consumer-hardware product pages use. Desktop already
// has a persistent "Buy Now" in the header, so this stays hidden at lg+.
export default function StickyBuyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
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
                <p className="truncate text-sm font-semibold text-white">
                  {formatInr(MARKETPLACE.priceInr)}
                </p>
                <p className="truncate text-xs text-white/50">{MARKETPLACE.priceNote}</p>
              </div>
              <a
                href={BUY_HREF}
                className="btn-primary shrink-0 whitespace-nowrap px-5 py-2.5 text-xs"
              >
                Buy
              </a>
            </div>
          ) : COMMERCE_ENABLED ? (
            <div className="flex items-center justify-between gap-3">
              <PriceTag size="sm" />
              <BuyButtons
                className="flex shrink-0 gap-2"
                primaryClassName="btn-primary px-4 py-2.5 text-xs whitespace-nowrap"
                secondaryClassName="btn-secondary px-4 py-2.5 text-xs whitespace-nowrap"
                strength={0}
              />
            </div>
          ) : (
            /* Pre-launch the bar keeps its job — a persistent action once the
               hero is behind you — but the action is the launch list, and the
               price goes with the buy pair. See lib/launch.js. */
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{BRAND.fullName}</p>
                <p className="text-xs text-white/50">Launching soon</p>
              </div>
              <NotifyButton
                source={NOTIFY_SOURCES.stickyBar}
                className="btn-primary shrink-0 whitespace-nowrap px-5 py-2.5 text-xs"
                strength={0}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

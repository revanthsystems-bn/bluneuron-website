'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '@/components/cart/CartContext';
import { trackAddToCart } from '@/lib/shop-analytics';
import { BRAND } from '@/lib/iriz';
import { MARKETPLACE, formatInr } from '@/lib/site-config';
import BuyButton from '@/components/buy/BuyButton';

/**
 * The product page's sticky buy bar.
 *
 * WHEN IT APPEARS: only once the real buy panel has scrolled out of view,
 * and that is measured with an IntersectionObserver on the panel itself
 * rather than against a scroll threshold. A hardcoded "after 600px" is wrong
 * at the first breakpoint change and wrong again on a phone whose browser
 * chrome resizes the viewport mid-scroll. Observing the element means the
 * bar appears exactly when the thing it duplicates is no longer usable —
 * which is the only moment a duplicate CTA is justified.
 *
 * DESKTOP TOO, not just mobile. The site's older StickyBuyBar is
 * `lg:hidden`, on the reasoning that the masthead already carries a buy CTA.
 * That holds on the homepage; it does not hold here, where the page is long,
 * the decision is quantity-and-marketplace, and the masthead's CTA is a
 * generic one. So this one spans all widths and carries the price and the
 * action together.
 *
 * It renders ABOVE the page's own content but is `hidden` to the
 * accessibility tree while invisible, so a screen reader never meets two
 * "Add to cart" buttons at once.
 */
export default function StickyProductBar({ watchId = 'buy-panel' }) {
  const [visible, setVisible] = useState(false);
  const { addItem, openCart, unitPrice } = useCart();

  useEffect(() => {
    const panel = document.getElementById(watchId);
    if (!panel) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      // A little margin at the bottom so the bar does not flicker in and out
      // while the panel sits exactly on the viewport edge.
      { rootMargin: '0px 0px -80px 0px', threshold: 0 }
    );
    observer.observe(panel);
    return () => observer.disconnect();
  }, [watchId]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle bg-black/95 backdrop-blur-glass"
        >
          <div className="section-container flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              {/* `truncate` matters at 390: the full name plus the price in
                  one row is wider than the viewport, and the price is the
                  half that must survive. */}
              <p className="truncate text-step-2 font-semibold text-white">{BRAND.fullName}</p>
              <p className="text-step-1 text-ink-3">
                {formatInr(MARKETPLACE.priceInr)}{' '}
                <span className="hidden sm:inline">· {MARKETPLACE.priceNote}</span>
              </p>
            </div>

            {/* "Add to cart" here would be a dead end: the basket is off
                (CART_ENABLED) and buying happens on a marketplace. Same
                sheet as every other Buy on the site. */}
            <BuyButton className="btn-primary shrink-0 px-6" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

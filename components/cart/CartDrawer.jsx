'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import QuantityStepper from '../shop/QuantityStepper';
import { useCart } from './CartContext';
import { BRAND, PRODUCT } from '@/lib/iriz';
import { ROUTES } from '@/lib/routes';
import { CART_ENABLED, MARKETPLACE, formatInr } from '@/lib/site-config';

/**
 * The cart drawer — a right-hand slide-over, and the basket's quick view.
 *
 * IT IS NOT THE CHECKOUT. The two marketplace buttons live on /cart, one
 * click away, and this panel's job is to confirm what was added and offer
 * the way forward. Putting the full checkout here would mean maintaining it
 * twice, and a slide-over is the wrong place for the paragraph explaining
 * that payment happens on Amazon or Flipkart.
 *
 * NO LONGER GATED ON COMMERCE_ENABLED. That flag meant "the in-site checkout
 * works", and while it was false this component did not mount at all. The
 * basket now ends at a marketplace, which is a path that exists regardless.
 *
 * MODAL BEHAVIOUR, done properly, because a slide-over that traps nothing is
 * a keyboard trap in reverse — tab out of it and you are silently browsing
 * the page behind an opaque panel:
 *   - Escape closes it.
 *   - Focus moves into the panel on open and returns to whatever opened it
 *     on close.
 *   - Focus is kept inside while open.
 *   - The page behind does not scroll.
 *
 * `prefers-reduced-motion` is handled globally by <MotionConfig
 * reducedMotion="user"> in app/layout.jsx, which drops the transform and
 * leaves the fade.
 */
/**
 * The gate — see the note on components/cart/CartButton. The drawer can only
 * be opened by a control that is itself hidden while CART_ENABLED is false,
 * but it is gated anyway: a modal that cannot be reached is still a focus
 * trap and a scroll lock sitting in the document.
 */
export default function CartDrawer() {
  if (!CART_ENABLED) return null;
  return <CartDrawerPanel />;
}

function CartDrawerPanel() {
  const { isOpen, closeCart, qty, unitPrice, subtotal, setItemQty, removeItem } = useCart();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const restoreRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    restoreRef.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeCart();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      // The element that opened the drawer may have unmounted while it was
      // open, so this is guarded rather than assumed.
      if (restoreRef.current instanceof HTMLElement) restoreRef.current.focus();
    };
  }, [isOpen, closeCart]);

  const empty = qty === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="cart-backdrop"
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            aria-hidden="true"
          />

          <motion.aside
            key="cart-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Your cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col border-l border-border-subtle bg-black"
          >
            <header className="flex items-center justify-between border-b border-border-subtle px-6 py-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                Your cart
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            {empty ? (
              /* An empty state with a way out of it. A panel that just says
                 "your cart is empty" makes closing it the only move. */
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border-subtle text-white/35">
                  <ShoppingBag size={22} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Your cart is empty</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">
                    The {BRAND.model} is the only thing we make — and it is one tap away.
                  </p>
                </div>
                <a href={ROUTES.product} onClick={closeCart} className="btn-primary">
                  View the {BRAND.model}
                </a>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <div className="flex gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-black-soft">
                      <Image
                        src={PRODUCT.image}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{BRAND.fullName}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {unitPrice === null ? '—' : formatInr(unitPrice)} each
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <QuantityStepper value={qty} onChange={setItemQty} idPrefix="drawer" />
                        <button
                          type="button"
                          onClick={removeItem}
                          aria-label="Remove from cart"
                          className="flex h-10 w-10 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <footer className="border-t border-border-subtle px-6 py-6">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-white/60">Subtotal</span>
                    <span className="text-lg font-bold text-white">
                      {subtotal === null ? '—' : formatInr(subtotal)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/40">{MARKETPLACE.priceNote}</p>

                  <a href={ROUTES.cart} onClick={closeCart} className="btn-primary mt-5 w-full justify-center">
                    Go to cart
                  </a>
                  <button
                    type="button"
                    onClick={closeCart}
                    className="mt-3 w-full text-center text-xs text-white/45 transition-colors hover:text-white/70"
                  >
                    Continue browsing
                  </button>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/*
 * The thumbnail is PRODUCT.image (lib/iriz.js) — the retail-box PHOTOGRAPH,
 * not the white-on-white render. At 80px on a dark panel a white unit on a
 * white ground is nearly invisible and says nothing about what ships, which
 * is the same reasoning that picked that file for PRODUCT.image in the first
 * place. Imported rather than re-spelled here, so there is one answer to
 * "which picture represents this product in a list".
 */

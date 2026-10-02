'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from './CartContext';
import { formatPrice, PRICING } from '@/lib/iriz';
import { COMMERCE_ENABLED } from '@/lib/launch';

export default function CartDrawer() {
  const { isOpen, closeCart, product, qty, subtotal, setItemQty, removeItem } = useCart();
  const router = useRouter();

  const goToCheckout = () => {
    closeCart();
    router.push('/checkout');
  };

  // Pre-launch this drawer is the site's only route to /checkout, so it does
  // not mount at all. The cart state behind it is untouched. See lib/launch.js.
  if (!COMMERCE_ENABLED) return null;

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
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="fixed inset-y-0 right-0 z-[70] flex h-full w-full max-w-md flex-col border-l border-border-subtle bg-black-surface"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-6 py-5">
              <h2 className="text-lg font-semibold text-white">Your Cart{qty > 0 ? ` (${qty})` : ''}</h2>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="rounded-full p-2 text-white/60 hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {qty === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-white/50">
                  <ShoppingBag size={36} className="text-white/25" aria-hidden="true" />
                  <p className="text-sm">Your cart is empty.</p>
                  <button onClick={closeCart} className="btn-secondary mt-2 px-5 py-2.5 text-xs">
                    Continue Browsing
                  </button>
                </div>
              ) : (
                <div className="glass-panel flex gap-4 p-4">
                  <div className="product-photo-frame relative h-24 w-24 shrink-0">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="96px"
                      className="product-photo"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{product.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{formatPrice(PRICING.offerPrice)}</span>
                        <span className="text-xs text-white/40 line-through">{formatPrice(PRICING.mrp)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full border border-border-subtle">
                        <button
                          onClick={() => setItemQty(qty - 1)}
                          disabled={qty <= 1}
                          aria-label="Decrease quantity"
                          className="p-2 text-white/70 hover:text-white disabled:opacity-30"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm text-white" aria-live="polite">
                          {qty}
                        </span>
                        <button
                          onClick={() => setItemQty(qty + 1)}
                          disabled={qty >= 10}
                          aria-label="Increase quantity"
                          className="p-2 text-white/70 hover:text-white disabled:opacity-30"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={removeItem}
                        aria-label="Remove item"
                        className="rounded-full p-2 text-white/40 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {qty > 0 && (
              <div className="border-t border-border-subtle px-6 py-5">
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-white/60">Subtotal</span>
                  <span className="text-lg font-bold text-white">{formatPrice(subtotal)}</span>
                </div>
                <button onClick={goToCheckout} className="btn-primary w-full">
                  Checkout
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

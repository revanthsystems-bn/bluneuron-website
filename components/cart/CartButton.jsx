'use client';

import { ShoppingCart } from 'lucide-react';
import { useCart } from './CartContext';
import { CART_ENABLED } from '@/lib/site-config';

/**
 * The masthead's basket.
 *
 * NO LONGER GATED ON COMMERCE_ENABLED, and the reason is that the basket
 * means something different now. That flag says "the in-site checkout
 * works", and while it was false there was genuinely nothing a cart could
 * lead to — so the icon was hidden entirely. The cart now ends at Amazon or
 * Flipkart (components/cart/CartDrawer), which is a path that exists whether
 * or not this site ever takes a payment. Hiding the basket would hide the
 * only place the quantity a visitor chose is remembered.
 *
 * `ink` is the light-hero test (lib/heroTheme.js): while the masthead floats
 * over the white hero the icon has to be dark.
 *
 * The count is rendered only once `hydrated` is true. The server has no
 * access to localStorage, so it always renders zero; painting a count before
 * the stored cart is read is a hydration mismatch, and the badge would pop
 * in anyway. Suppressing it until then costs nothing — the badge is
 * absolutely positioned and reserves no layout.
 */
/**
 * The gate. No hooks of its own, so the early return cannot reorder the
 * ones below. Gating HERE rather than at the call sites keeps every
 * masthead variant — desktop, mobile menu, ink mode — consistent from one
 * decision. See CART_ENABLED in lib/site-config.
 */
export default function CartButton(props) {
  if (!CART_ENABLED) return null;
  return <CartButtonControl {...props} />;
}

function CartButtonControl({ className = '', ink = false }) {
  const { itemCount, openCart, hydrated } = useCart();
  const count = hydrated ? itemCount : 0;

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={count > 0 ? `Open cart, ${count} item${count > 1 ? 's' : ''}` : 'Open cart'}
      className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft ${
        ink
          ? 'text-black-obsidian/75 hover:bg-black/5 hover:text-black-obsidian'
          : 'text-ink-2 hover:bg-white/5 hover:text-white'
      } ${className}`}
    >
      <ShoppingCart size={20} aria-hidden="true" />
      {count > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-step-0 font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}

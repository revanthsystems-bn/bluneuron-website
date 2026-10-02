'use client';

import { ShoppingCart } from 'lucide-react';
import { useCart } from './CartContext';
import { COMMERCE_ENABLED } from '@/lib/launch';

// `ink` is the light-hero test (lib/heroTheme.js): while the masthead floats
// over the white hero the icon has to be dark. Inert while COMMERCE_ENABLED is
// false, since this renders nothing at all pre-launch.
export default function CartButton({ className = '', ink = false }) {
  const { itemCount, openCart } = useCart();

  // Pre-launch there is nothing to put in a cart, so the masthead shows no
  // cart icon at all. See lib/launch.js.
  if (!COMMERCE_ENABLED) return null;

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={itemCount > 0 ? `Open cart, ${itemCount} item${itemCount > 1 ? 's' : ''}` : 'Open cart'}
      className={`relative rounded-full p-2 transition-colors duration-500 ${
        ink
          ? 'text-black-obsidian/75 hover:bg-black/5 hover:text-black-obsidian'
          : 'text-white/80 hover:bg-white/5 hover:text-white'
      } ${className}`}
    >
      <ShoppingCart size={20} aria-hidden="true" />
      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
          {itemCount}
        </span>
      )}
    </button>
  );
}

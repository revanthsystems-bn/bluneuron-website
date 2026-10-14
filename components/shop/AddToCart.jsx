'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import QuantityStepper from './QuantityStepper';
import { useCart } from '@/components/cart/CartContext';

/**
 * Quantity + "Add to cart", as one unit.
 *
 * They are one component because they are one decision: the quantity is
 * meaningless until it is added, and an "Add to cart" that ignores the
 * stepper beside it is the oldest bug on a product page. This owns both,
 * so the number that is added is always the number on screen.
 *
 * THE CONFIRMATION IS IN THE BUTTON, not a toast. A toast in the corner is
 * missed on a phone, and it competes with the cart drawer that is about to
 * open anyway. The label swaps to "Added" with a tick for a moment and then
 * returns — long enough to register, short enough that a second add does not
 * find a button saying the wrong thing. `aria-live="polite"` on the status
 * line is what tells a screen reader the same thing.
 *
 * `openDrawer` is a prop rather than a hardcoded behaviour: adding from the
 * PRODUCT page should open the drawer (the visitor is choosing, and wants to
 * see the basket), while adding from the shop CARD should not pull a panel
 * over the page they are still scanning.
 */
export default function AddToCart({
  openDrawer = true,
  className = '',
  buttonClassName = 'btn-primary w-full justify-center',
  idPrefix = 'pdp',
}) {
  const { addItem, openCart } = useCart();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    addItem(qty);
    setJustAdded(true);
    // Phase 2 fires GA4 `add_to_cart` and the Pixel's `AddToCart` here —
    // value and currency only, never anything about the person.
    if (openDrawer) openCart();
    window.setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <QuantityStepper value={qty} onChange={setQty} idPrefix={idPrefix} />

        <button type="button" onClick={handleAdd} className={`${buttonClassName} sm:flex-1`}>
          {justAdded ? (
            <>
              <Check size={16} className="mr-2" aria-hidden="true" />
              Added
            </>
          ) : (
            'Add to cart'
          )}
        </button>
      </div>

      {/* The live region is a separate, always-present node. Announcing by
          swapping the BUTTON's own text is unreliable — a screen reader may
          read a focused button's new label as a rename rather than an
          update. */}
      <p aria-live="polite" className="sr-only">
        {justAdded ? `${qty} added to your cart` : ''}
      </p>
    </div>
  );
}

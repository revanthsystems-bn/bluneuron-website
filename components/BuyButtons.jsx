'use client';

import { useRouter } from 'next/navigation';
import Magnetic from './Magnetic';
import { useCart } from './cart/CartContext';
import NotifyButton from './NotifyButton';
import { runAddToCart, runBuyNow } from '@/lib/commerce';
import { COMMERCE_ENABLED } from '@/lib/launch';

export default function BuyButtons({
  className = 'flex flex-wrap items-center gap-3',
  primaryClassName = 'btn-primary',
  secondaryClassName = 'btn-secondary',
  primaryLabel = 'Buy Now',
  secondaryLabel = 'Add to Cart',
  strength = 0.15,
}) {
  const { addItem, openCart } = useCart();
  const router = useRouter();

  // Pre-launch the whole pair collapses to one "Notify Me". Guarded here as
  // well as at each call site so a future caller cannot reintroduce a buy
  // path by rendering this component. See lib/launch.js.
  if (!COMMERCE_ENABLED) {
    return (
      <div className={className}>
        <NotifyButton className={primaryClassName} strength={strength} />
      </div>
    );
  }

  return (
    <div className={className}>
      <Magnetic
        as="button"
        type="button"
        onClick={() => runBuyNow({ addItem, router })}
        className={primaryClassName}
        strength={strength}
      >
        {primaryLabel}
      </Magnetic>
      <Magnetic
        as="button"
        type="button"
        onClick={() => runAddToCart({ addItem, openCart })}
        className={secondaryClassName}
        strength={strength}
      >
        {secondaryLabel}
      </Magnetic>
    </div>
  );
}

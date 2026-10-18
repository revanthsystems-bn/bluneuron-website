import { DISCOUNT_PERCENT, formatPrice, PRICING } from '@/lib/iriz';
import { COMMERCE_ENABLED } from '@/lib/launch';

const SIZES = {
  sm: { price: 'text-step-4', mrp: 'text-step-1', badge: 'text-step-0 px-2 py-0.5' },
  md: { price: 'text-step-5', mrp: 'text-step-2', badge: 'text-step-1 px-2.5 py-1' },
  lg: { price: 'text-step-6', mrp: 'text-step-3', badge: 'text-step-2 px-3 py-1' },
};

export default function PriceTag({ size = 'md', align = 'left', className = '' }) {
  const s = SIZES[size] ?? SIZES.md;

  // Price only ever appears as part of a buy affordance, so it goes with them.
  // See lib/launch.js.
  if (!COMMERCE_ENABLED) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${align === 'center' ? 'justify-center' : ''} ${className}`}
    >
      <span className={`font-bold tracking-tight text-white ${s.price}`}>{formatPrice(PRICING.offerPrice)}</span>
      <span className={`text-ink-3 line-through ${s.mrp}`}>{formatPrice(PRICING.mrp)}</span>
      <span className={`rounded-full bg-[#a3e635] font-bold text-black ${s.badge}`}>{DISCOUNT_PERCENT}% OFF</span>
    </div>
  );
}

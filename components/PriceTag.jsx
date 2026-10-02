import { DISCOUNT_PERCENT, formatPrice, PRICING } from '@/lib/iriz';
import { COMMERCE_ENABLED } from '@/lib/launch';

const SIZES = {
  sm: { price: 'text-lg', mrp: 'text-xs', badge: 'text-[10px] px-2 py-0.5' },
  md: { price: 'text-3xl sm:text-4xl', mrp: 'text-sm', badge: 'text-xs px-2.5 py-1' },
  lg: { price: 'text-5xl sm:text-6xl', mrp: 'text-base', badge: 'text-sm px-3 py-1' },
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
      <span className={`text-white/40 line-through ${s.mrp}`}>{formatPrice(PRICING.mrp)}</span>
      <span className={`rounded-full bg-[#a3e635] font-bold text-black ${s.badge}`}>{DISCOUNT_PERCENT}% OFF</span>
    </div>
  );
}

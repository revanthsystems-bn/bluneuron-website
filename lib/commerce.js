/**
 * Purchase mode — the ONE thing to change to switch how "Buy Now" / "Add to
 * Cart" behave across the whole site. Every entry point (Header, hero,
 * sticky mobile bar, cart drawer) imports PURCHASE_MODE from here rather
 * than deciding behavior on its own.
 *
 *   "dummy"    → in-site fake checkout flow (app/checkout, app/order-confirmation)
 *   "amazon"   → redirect straight to AMAZON_PRODUCT_URL below
 *   "razorpay" → open Razorpay checkout (stubbed — see the TODO in
 *                app/checkout/page.jsx; falls back to the dummy flow until
 *                that's wired up)
 *
 * Override at build/deploy time with NEXT_PUBLIC_PURCHASE_MODE; defaults to
 * "dummy" for local development.
 */
export const PURCHASE_MODE = process.env.NEXT_PUBLIC_PURCHASE_MODE || 'dummy';

// Placeholder until the real Amazon listing exists.
export const AMAZON_PRODUCT_URL = 'https://amazon.in/dp/PLACEHOLDER';

/**
 * The CONFIRMED, PUBLISHABLE marketplace listing — the only price this site is
 * allowed to state as fact in public structured data.
 *
 * ---------------------------------------------------------------------------
 * THIS IS NOT PRICING IN lib/iriz.js. The distinction is the whole point.
 * ---------------------------------------------------------------------------
 *   PRICING.offerPrice (lib/iriz.js)  the price we INTEND to sell at. A
 *                                     business decision, rendered in the UI
 *                                     and gated off entirely by
 *                                     COMMERCE_ENABLED. It is a plan.
 *   MARKETPLACE.priceInr (here)       the price a live listing ACTUALLY
 *                                     charges. A fact, and the only thing
 *                                     that may appear in a schema.org Offer.
 *
 * Structured data is a machine-readable public claim: a price in an Offer puts
 * a number and a buy prompt into a search result. Asserting one we have not
 * committed to is worse than asserting none, which is why these are two fields
 * and not one, and why this one starts at 'TBD'.
 *
 * TODO(launch): set `priceInr` to the live listing price as a number (no
 * currency symbol, no separators) and `listingUrl` to the real Amazon product
 * URL. Until then the Product schema is not emitted at all — see
 * productJsonLd() in lib/seo.js.
 */
export const MARKETPLACE = {
  // 'TBD' until a price is committed. A number enables the Product schema.
  priceInr: 'TBD',
  currency: 'INR',
  // Where an Offer should point. Empty falls back to our own product page,
  // because AMAZON_PRODUCT_URL above is still a /dp/PLACEHOLDER that 404s, and
  // an Offer URL that 404s is a worse claim than no marketplace link at all.
  listingUrl: '',
};

/**
 * The confirmed price as a positive number, or `null` when there isn't one.
 *
 * Deliberately strict, because every caller uses `null` to mean "emit no
 * price claim" and a loose check is how 'TBD' ends up rendered as a price.
 * Rejected: '', null, undefined, any casing of 'TBD', zero, negatives, and
 * anything non-numeric. Accepted: a number, or a numeric string (tolerating
 * separators and a currency symbol, so a hand-pasted "13,999" still works).
 */
export function confirmedPriceInr() {
  const raw = MARKETPLACE.priceInr;
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed.toUpperCase() === 'TBD') return null;
    const parsed = Number(trimmed.replace(/[,\s₹]/g, ''));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : null;
}

// Public key only — safe to expose client-side. The key secret stays
// server-only, used wherever the order-creation API route ends up living.
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

/**
 * Single seam for every "Add to Cart" button in the app.
 * `addItem`/`openCart` come from useCart() (components/cart/CartContext).
 */
export function runAddToCart({ addItem, openCart }) {
  if (PURCHASE_MODE === 'amazon') {
    window.location.href = AMAZON_PRODUCT_URL;
    return;
  }
  // "dummy" and "razorpay" both use the in-site cart — razorpay only changes
  // behavior later, at the checkout page's final "Place Order" step.
  addItem();
  openCart();
}

/**
 * Single seam for every "Buy Now" button in the app.
 * `addItem` comes from useCart(); `router` from next/navigation's useRouter().
 */
export function runBuyNow({ addItem, router }) {
  if (PURCHASE_MODE === 'amazon') {
    window.location.href = AMAZON_PRODUCT_URL;
    return;
  }
  addItem();
  router.push('/checkout');
}

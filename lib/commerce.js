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

/*
 * THE MARKETPLACE PRICE IS NOT HERE. It is MARKETPLACE.priceInr in
 * lib/site-config.js, with confirmedPriceInr() beside it.
 *
 * This file used to carry its own MARKETPLACE block and its own copy of that
 * function, added so the schema.org Offer in lib/seo.js had a price it was
 * allowed to state as fact. lib/site-config.js then grew the same field for the
 * buy card, /where-to-buy and the sticky bar to render — and two constants both
 * meaning "what a live listing actually charges" is a guarantee that one day
 * the page and the search result quote different numbers.
 *
 * So there is one, in the file with the rest of the business facts and the TBD
 * machinery that gates them. PRICING in lib/iriz.js is still separate and
 * still different: that is the price we INTEND to sell at, it belongs to the
 * switched-off in-site cart, and it must never reach structured data.
 *
 * What stays here is the in-site CHECKOUT seam — purchase mode, and the two
 * functions every buy button routes through.
 */

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

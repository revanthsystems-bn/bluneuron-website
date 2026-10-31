import { trackGaEvent } from './googleAnalytics';
import { trackGoogleAdsBuyClick } from './googleAds';
import { BUY_HREF } from './routes';

/**
 * Purchase mode — how "Buy Now" / "Add to Cart" behave, for the in-site cart
 * that is currently switched off (COMMERCE_ENABLED in lib/launch.js).
 *
 *   "amazon"   → redirect straight to AMAZON_PRODUCT_URL below
 *   "dummy"    → add to the in-site cart and send the visitor to the buy card
 *   "razorpay" → reserved; behaves as "dummy" until a gateway is wired up
 *
 * THE IN-SITE CHECKOUT IS GONE. app/checkout and app/order-confirmation —
 * the fake order form and its confirmation screen — are deleted, not
 * disabled. The product sells on Amazon and Flipkart, that is the purchase
 * path the site is built around (SHOW_BUY in lib/site-config.js), and a
 * dummy checkout kept "in case" is a route that can be reached by accident
 * and take an order we cannot fulfil. What is left here is the analytics
 * seam and the cart plumbing; both buy functions now end at the marketplace
 * buy card rather than at a form.
 *
 * Override at build/deploy time with NEXT_PUBLIC_PURCHASE_MODE; defaults to
 * "dummy" for local development.
 */
export const PURCHASE_MODE = process.env.NEXT_PUBLIC_PURCHASE_MODE || 'dummy';

// Placeholder until the real Amazon listing exists. The REAL listing URLs are
// MARKETPLACE.amazonUrl / flipkartUrl in lib/site-config.js — this constant
// belongs to the switched-off cart path and is not what the site links to.
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
 * Where a buy click actually sends the visitor, as a name GA4 can group by.
 *
 * MARKETPLACE NAME ONLY — this is the entire payload, and the restriction is
 * the point. The question analytics has to answer is "which checkout are
 * people choosing", and PURCHASE_MODE answers it: 'amazon' leaves the site
 * for the marketplace listing, 'dummy' and 'razorpay' both stay on
 * bluneuron.com (razorpay only diverges later, at "Place Order"). Nothing
 * about the cart, the price, the quantity or the person goes with it — see
 * the warning in lib/googleAnalytics.
 */
function marketplaceName() {
  return PURCHASE_MODE === 'amazon' ? 'amazon' : 'bluneuron.com';
}

/**
 * The buy click, reported once, from the two seams below rather than from the
 * six components that render a buy button — so a new button cannot ship
 * without being counted, and the event name cannot be spelled two ways.
 *
 * `trackGaEvent` is a no-op when GA is not loaded (no measurement ID, an ad
 * blocker, localhost), so this can never stand between a visitor and the
 * checkout they just clicked.
 *
 * NOTE: nothing calls these while COMMERCE_ENABLED is false (lib/launch.js) —
 * every buy affordance renders "Notify Me" instead, and that signup reports
 * its own `Lead` to the Meta Pixel in components/notify/NotifyFields. This
 * fires from launch day onward, with no further change.
 */
function reportBuyClick(action) {
  trackGaEvent('buy_click', { action, marketplace: marketplaceName() });
  // Google Ads gets the same click, with `send_to` and nothing else — no
  // action, no marketplace, no cart. A no-op until GOOGLE_ADS_BUY_LABEL is
  // filled in (lib/site-config.js), and a no-op in practice regardless while
  // COMMERCE_ENABLED is false and nothing calls the two functions below. It
  // is here so that turning the in-site cart back on cannot quietly leave Ads
  // as the one tool with a hole in its funnel.
  trackGoogleAdsBuyClick();
}

/**
 * Single seam for every "Add to Cart" button in the app.
 * `addItem`/`openCart` come from useCart() (components/cart/CartContext).
 */
export function runAddToCart({ addItem, openCart }) {
  reportBuyClick('add_to_cart');

  if (PURCHASE_MODE === 'amazon') {
    window.location.href = AMAZON_PRODUCT_URL;
    return;
  }
  // "dummy" and "razorpay" both use the in-site cart.
  addItem();
  openCart();
}

/**
 * Single seam for every "Buy Now" button in the app.
 * `addItem` comes from useCart(); `router` from next/navigation's useRouter().
 *
 * It lands on the homepage buy card (BUY_HREF) rather than on /checkout,
 * because /checkout no longer exists — see the note at the top of this file.
 * That card is the site's actual purchase path in both states: the two
 * marketplace buttons once SHOW_BUY is on, the launch-list signup before
 * then, under one anchor either way (lib/routes.js).
 */
export function runBuyNow({ addItem, router }) {
  reportBuyClick('buy_now');

  if (PURCHASE_MODE === 'amazon') {
    window.location.href = AMAZON_PRODUCT_URL;
    return;
  }
  addItem();
  router.push(BUY_HREF);
}

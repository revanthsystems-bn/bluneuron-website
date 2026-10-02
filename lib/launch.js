/**
 * Launch mode — the single seam between "pre-launch" and "selling".
 *
 * The product is not on sale yet, so nothing rendered on the site may offer a
 * path to purchase. Flip this one constant to `true` on launch day and every
 * purchase affordance comes back exactly as it was; nothing below has been
 * deleted or commented out.
 *
 * What this gates, and where:
 *
 *   components/cart/CartButton   the masthead cart icon + item count
 *   components/cart/CartDrawer   the slide-over cart, and its only link to
 *                                /checkout
 *   components/Header            masthead + mobile-menu "Buy Now"
 *   components/BuyButtons        "Buy Now" / "Add to Cart" pair
 *   components/PriceTag          the ₹13,999 / ₹39,999 / 65% OFF block
 *   components/StickyBuyBar      the mobile bottom bar's price + buy pair
 *
 * In every one of those places the pre-launch branch renders the project's
 * "Notify Me" affordance instead (components/NotifyButton), which routes to
 * the existing newsletter signup in components/Newsletter — the same
 * `submitNotifySignup` endpoint, already labelled "Notify Me". There is no
 * second signup system.
 *
 * NOT gated, on purpose:
 *   - app/checkout and the cart state in components/cart/CartContext still
 *     exist and still work. The route is simply unreachable from anything the
 *     site renders, which is what pre-launch requires; deleting it would make
 *     relaunching a rebuild rather than a flag flip.
 *   - Factual price-free product content (specs, the comparison table) is
 *     untouched. It is information, not a purchase path.
 *
 * Kept a plain constant rather than an env var so the state is visible in the
 * diff and cannot drift between environments — a launch is a deploy, not a
 * runtime toggle.
 */
export const COMMERCE_ENABLED = false;

/**
 * Where every pre-launch CTA sends the visitor: the newsletter section's own
 * signup field. `#buy` is that section's id, which predates launch mode and
 * is also the second entry in ConsentNotice's landmark list — it is a
 * newsletter anchor, not a purchase one, so it survives commerce being off.
 */
export const NOTIFY_TARGET = '#buy';
export const NOTIFY_FIELD_ID = 'newsletter-email';

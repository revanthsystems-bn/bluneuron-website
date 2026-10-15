import { trackGaEvent } from './googleAnalytics';
import { trackMetaPixel } from './metaPixel';
import { MARKETPLACE } from './site-config';

/**
 * The three commerce events, defined once.
 *
 * WHY ONE MODULE RATHER THAN A CALL AT EACH BUTTON. There are five places a
 * commerce event can fire — the product page's add-to-cart, the shop card's,
 * the sticky bar's, the cart page view, and the two checkout buttons — and
 * each has to send the SAME event name with the SAME payload shape to two
 * different vendors with two different APIs. Written at the call sites, that
 * is five chances to spell `add_to_cart` differently, and five places a
 * `currency` could go missing and quietly break every revenue number
 * downstream.
 *
 * WHAT IS SENT, and this is the whole payload:
 *
 *     value      a number of rupees
 *     currency   'INR', always
 *     quantity   how many units
 *     marketplace  'Amazon' | 'Flipkart', on begin_checkout only
 *
 * WHAT IS NEVER SENT: anything about the person. No email, no phone number,
 * no name, no order ID, no serial number, no user id, no hashed identifier
 * of any kind. The Meta Pixel's advanced matching is not enabled and must
 * not be — the contact details this site collects go to Web3Forms and to
 * Supabase, and nowhere else. GA4's advertising features are off for the
 * same reason (see lib/googleAnalytics).
 *
 * That restriction is not caution for its own sake. Under the DPDP Act a
 * marketing pixel receiving a customer's identifiers is a disclosure to a
 * third party that our privacy policy would have to describe and the person
 * would have to have consented to. Sending a count and a rupee value needs
 * neither, and answers every question the dashboard is actually asked.
 *
 * Every call here is a no-op when its script is absent — ad blocker, consent
 * tooling, localhost, or simply no measurement ID configured — and none is
 * awaited, so analytics can never delay or block a checkout.
 */

const CURRENCY = MARKETPLACE.currency;

/** Rupee value of `quantity` units, or null when there is no confirmed price. */
function lineValue(unitPrice, quantity) {
  if (typeof unitPrice !== 'number' || !Number.isFinite(unitPrice)) return null;
  return unitPrice * Math.max(1, quantity);
}

/**
 * GA4 and the Pixel disagree about the shape of a commerce event: GA4 wants
 * `value`/`currency` with an `items` array, the Pixel wants `value`/`currency`
 * with `content_ids`. Both get what they want from one call, built here, so a
 * caller never constructs either.
 */
function send({ gaEvent, pixelEvent, unitPrice, quantity, marketplace }) {
  const value = lineValue(unitPrice, quantity);

  const gaParams = {
    currency: CURRENCY,
    ...(value === null ? {} : { value }),
    quantity,
    ...(marketplace ? { marketplace } : {}),
  };
  trackGaEvent(gaEvent, gaParams);

  if (pixelEvent) {
    trackMetaPixel(pixelEvent, {
      currency: CURRENCY,
      ...(value === null ? {} : { value }),
      // `content_ids` is Meta's product identifier field. The SKU slug is the
      // only identifier here and it describes the PRODUCT, not the person.
      content_ids: ['iriz'],
      content_type: 'product',
    });
  }
}

/** Something was added to the basket. */
export function trackAddToCart({ unitPrice, quantity }) {
  send({ gaEvent: 'add_to_cart', pixelEvent: 'AddToCart', unitPrice, quantity });
}

/**
 * The basket was opened — the drawer or /cart.
 *
 * GA4 only. `view_cart` has no Meta standard-event equivalent, and inventing
 * a custom one would put a second, differently-named event in the Pixel's
 * funnel for no gain: Meta's funnel starts at AddToCart and continues at
 * InitiateCheckout.
 */
export function trackViewCart({ unitPrice, quantity }) {
  send({ gaEvent: 'view_cart', unitPrice, quantity });
}

/** A marketplace checkout button was clicked. */
export function trackBeginCheckout({ unitPrice, quantity, marketplace }) {
  send({
    gaEvent: 'begin_checkout',
    pixelEvent: 'InitiateCheckout',
    unitPrice,
    quantity,
    marketplace,
  });
}

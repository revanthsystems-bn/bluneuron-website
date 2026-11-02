import { track } from '@vercel/analytics';
import { trackGaEvent } from './googleAnalytics';
import { trackGoogleAdsBuyClick } from './googleAds';
import { trackMetaPixelCustom } from './metaPixel';

/**
 * "Someone pressed a buy button." The four calls, in one place.
 *
 * WHY IT MOVED HERE. These four lines were written out at each buy surface,
 * and there are now three of them — the buy sheet and the inline marketplace
 * row (both through components/buy/StoreButtons) and the homepage hero
 * (components/hero/HeroBuyButton). A fourth copy is a fourth chance for one
 * vendor to be forgotten, and the single most valuable event on this site is
 * precisely "a visitor left for a marketplace". Nothing about WHAT is sent
 * changed in the move: same four calls, same order, same payload.
 *
 * ONE EVENT, ONE PROPERTY. `store` is the marketplace id ('amazon' /
 * 'flipkart') and it is the only thing sent. No email, no name, no address,
 * no order identifier — nothing that is or could become personal data goes to
 * GA4 or the Meta Pixel from this site.
 *
 * It fires for a PENDING destination too: the intent to buy is real whether
 * or not the listing is live yet, and a hole in the funnel on launch day
 * would read as a conversion problem rather than as a missing URL.
 *
 * Every call is a no-op when its script is absent — ad blocker, consent
 * tooling, localhost, or simply no measurement ID configured — and none is
 * awaited, so analytics can never delay or block the navigation.
 */
export function trackBuyClick(store) {
  trackGaEvent('buy_click', { store });
  track('buy_click', { store });
  trackMetaPixelCustom('ClickToBuy', { store });
  // The Google Ads conversion, which is a NO-OP until a conversion label is
  // filled in (GOOGLE_ADS_BUY_LABEL in lib/site-config.js). It is called
  // here, beside the other three, so a buy click cannot be counted by GA4
  // and Meta but missed by Ads. It sends `send_to` and nothing else — not
  // even `store`, which would be a custom parameter on a conversion action
  // that has not asked for one.
  trackGoogleAdsBuyClick();
}

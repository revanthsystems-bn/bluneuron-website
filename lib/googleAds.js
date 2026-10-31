/**
 * Google Ads — the second `config` on the one Google tag, and the one guarded
 * way to report a conversion.
 *
 * Shaped like lib/googleAnalytics.js and lib/metaPixel.js, down to the names,
 * because all three do the same job and a reader who knows one should not
 * have to learn a third set of conventions. components/GoogleAnalytics
 * renders the tag; the buy seams call trackGoogleAdsBuyClick below.
 *
 * ---------------------------------------------------------------------------
 * ONE gtag.js, TWO DESTINATIONS
 * ---------------------------------------------------------------------------
 * Google's own Ads snippet ships its own `googletagmanager.com/gtag/js?id=AW-`
 * script tag. Pasting it alongside the GA4 one would load gtag.js TWICE —
 * which is not merely wasteful: the second load re-runs the bootstrap, and
 * duplicated page views and double-counted conversions are the documented
 * symptom. gtag.js is explicitly multi-destination, so the supported shape is
 * ONE script and one `config` call per destination ID. That is what
 * components/GoogleAnalytics emits, and scripts/check-google-tag.js fails the
 * build if a second gtag.js ever appears in the source.
 *
 * THE CONSEQUENCE WORTH KNOWING: Ads measurement rides on the GA4 tag, so it
 * is gated on GA4's own rule (lib/googleAnalytics.js) as well as its own.
 * No NEXT_PUBLIC_GA_ID, or a localhost hostname, means no gtag.js at all and
 * therefore no Ads config either. That is the right trade for a site running
 * both — but it means "the Ads tag stopped reporting" is a question to ask of
 * the GA4 measurement ID first.
 *
 * ---------------------------------------------------------------------------
 * PRIVACY: THE FLAGS ARE PER-DESTINATION, AND THAT IS WHY THEY ARE REPEATED
 * ---------------------------------------------------------------------------
 * `allow_google_signals` and `allow_ad_personalization_signals` are set in
 * GA4's `gtag('config', 'G-...')` call, and a flag passed to `config` applies
 * to THAT destination only — it is not a tag-wide setting. So the Ads `config`
 * does NOT inherit them: left off, Google Ads would default to personalised
 * advertising signals on a site whose GA4 stream has them switched off, and
 * whose privacy policy says they are off.
 *
 * They are therefore restated below, verbatim, plus one that is specific to
 * Ads:
 *
 *   allow_google_signals: false              no cross-device identity graph,
 *                                            nothing joined to a signed-in
 *                                            Google account.
 *   allow_ad_personalization_signals: false  non-personalised ads only. This
 *                                            is the flag that makes gtag send
 *                                            `npa=1` on its requests.
 *   allow_enhanced_conversions: false        ENHANCED CONVERSIONS OFF,
 *                                            explicitly. That feature works by
 *                                            sending hashed email addresses and
 *                                            phone numbers to Google, which is
 *                                            exactly what this site has
 *                                            committed never to do. It is an
 *                                            account-level setting in Google
 *                                            Ads as well — switching it on
 *                                            there and relying on this flag to
 *                                            hold it back is not a plan.
 *
 * NOTHING SENDS `user_data`. There is no `gtag('set', 'user_data', ...)` call
 * anywhere in this repository and there must never be one: that is the
 * transport for the email/phone/name payload enhanced conversions wants. The
 * visitor's contact details go to Web3Forms and nowhere else.
 */

import { GOOGLE_ADS_BUY_LABEL, GOOGLE_ADS_ID } from './site-config';

export { GOOGLE_ADS_ID };

/**
 * Is there an Ads destination to configure at all?
 *
 * Deliberately NOT a hostname check — unlike isGaEnabled(), this one is safe
 * to evaluate during server rendering, because components/GoogleAnalytics has
 * already made the localhost decision for the whole tag before it reaches
 * this. One gate, in one place.
 */
export function isGoogleAdsConfigured() {
  return Boolean(GOOGLE_ADS_ID);
}

/**
 * The extra `gtag('config', ...)` line, or an empty string.
 *
 * Returned as source text because components/GoogleAnalytics hands the whole
 * bootstrap to `next/script` as `dangerouslySetInnerHTML` — see that file.
 * Empty when no ID is set, which is what makes the Ads tag disappear
 * completely rather than configuring a destination of `''`.
 */
export function googleAdsConfigSnippet() {
  if (!isGoogleAdsConfigured()) return '';

  return `
gtag('config', '${GOOGLE_ADS_ID}', {
  allow_google_signals: false,
  allow_ad_personalization_signals: false,
  allow_enhanced_conversions: false
});`;
}

/**
 * The `send_to` value for the buy conversion, or null.
 *
 * Null unless BOTH halves are filled in — the ID and the label. A `send_to`
 * of `AW-123/` is a conversion reported against no conversion action, which
 * Google accepts and silently attributes to nothing: a reporting bug that
 * looks like low conversion volume rather than like a misconfiguration.
 */
export function googleAdsBuySendTo() {
  if (!GOOGLE_ADS_ID || !GOOGLE_ADS_BUY_LABEL) return null;
  return `${GOOGLE_ADS_ID}/${GOOGLE_ADS_BUY_LABEL}`;
}

/**
 * Report a buy click to Google Ads as a conversion — or do nothing at all.
 *
 * A no-op in four cases, all of them normal: no Ads ID, no conversion label
 * (the state today), gtag.js not on the page (no GA4 measurement ID, an ad
 * blocker, localhost), or gtag throwing. Advertising measurement must never
 * stand between a visitor and the checkout they just clicked, so this is
 * called for its effect and its return value is ignored.
 *
 * THE PAYLOAD IS `send_to` AND NOTHING ELSE. No value, no currency, no
 * transaction_id, no order contents, and nothing from any form on this site —
 * no email, no phone number, no name, no invoice number, no serial. The
 * question this answers is "did a buy click happen", and `send_to` answers
 * it. See the warning in lib/googleAnalytics.js, which this follows.
 */
export function trackGoogleAdsBuyClick() {
  const sendTo = googleAdsBuySendTo();
  if (!sendTo) return;

  if (typeof window === 'undefined') return;

  const gtag = window.gtag;
  if (typeof gtag !== 'function') return;

  try {
    gtag('event', 'conversion', { send_to: sendTo });
  } catch (err) {
    // A third-party script throwing is not this site's problem to surface.
    // eslint-disable-next-line no-console
    console.warn('[BluNeuron] Google Ads conversion failed:', err);
  }
}

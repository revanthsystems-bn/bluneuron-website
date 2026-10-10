'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { GA_MEASUREMENT_ID, isGaEnabled, trackGaEvent } from '@/lib/googleAnalytics';

/**
 * Google Analytics 4, rendered once from app/layout so it is present on every
 * page. The host-independent counterpart to components/MetaPixel, and built
 * the same way for the same reasons — read that file's header too; only the
 * differences are explained here.
 *
 * WHY THE SCRIPT IS MOUNTED FROM AN EFFECT AND NOT RENDERED DIRECTLY.
 * Whether the tag may load depends on the hostname (see lib/googleAnalytics),
 * and the hostname is only knowable in the browser. Deciding during render
 * would mean the server emits the script and the client removes it — a
 * hydration mismatch. So the first client render matches the server (no
 * script), an effect reads the hostname, and the <Script>s mount on the pass
 * after that. `afterInteractive` already waits for hydration, so this costs
 * nothing.
 *
 * NO <noscript> FALLBACK, unlike the pixel. GA4 has no documented no-JS
 * measurement endpoint — the pixel's `facebook.com/tr?...` image has no gtag
 * equivalent — so there is nothing to put in one.
 *
 * CONSENT. components/ConsentNotice is a NOTICE, not a gate: it informs and
 * takes an acknowledgement, and both @vercel/analytics and the Meta Pixel
 * load regardless of whether it has been dismissed. GA4 follows that existing
 * behaviour exactly rather than inventing a stricter rule for itself — the
 * bar's copy ("we use cookies and similar tools to measure visits and our
 * ads") already covers it, and the privacy policy now names GA. If that
 * posture ever becomes opt-in, all three have to change together and
 * lib/googleAnalytics's `isGaEnabled` is this one's seam.
 */

/**
 * `gtag` bootstrap, then `config`. Google's official snippet, verbatim apart
 * from the interpolated ID and the three flags below.
 *
 * It is a string rather than JSX because `next/script` needs the body as
 * `dangerouslySetInnerHTML`.
 *
 *   anonymize_ip                      GA4 drops the last IP octet regardless,
 *                                     but stating it keeps the intent in the
 *                                     diff rather than in a Google changelog.
 *   allow_google_signals: false       no cross-device identity graph, so no
 *                                     demographics/interests reporting and
 *                                     nothing joined to a signed-in Google
 *                                     account.
 *   allow_ad_personalization_signals  this property measures traffic; it does
 *                                     : false                not feed ad
 *                                     audiences. Meta's pixel is the ads
 *                                     tool and it is declared separately.
 *
 * Those last two are what "no personal data" means in practice here: GA4 sees
 * a page path, a referrer and a coarse location, and is given nothing that
 * identifies a person.
 *
 * `send_page_view` is left at its default (true) on purpose, so the `config`
 * call sends the first page view itself — exactly as the pixel's base code
 * fires its own first PageView. The effect below handles every navigation
 * after that.
 */
const BOOTSTRAP = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', {
  anonymize_ip: true,
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});`;

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [enabled, setEnabled] = useState(false);
  const lastTracked = useRef(null);

  useEffect(() => {
    setEnabled(isGaEnabled());
  }, []);

  // The query string is part of the identity of a page view: ?utm_source=... is
  // the whole point of running analytics on a launch site, and GA4 keeps those
  // as distinct page paths.
  const query = searchParams.toString();
  const viewKey = query ? `${pathname}?${query}` : pathname;

  useEffect(() => {
    const previous = lastTracked.current;
    lastTracked.current = viewKey;

    // First pass after mount (previous === null) is the load the `config` call
    // above already counted. The `previous === viewKey` case is the re-run
    // caused by `enabled` flipping true on that same URL — also already
    // counted. Without both guards the landing page is double-counted and
    // every bounce-rate number built on it is wrong.
    if (!enabled || previous === null || previous === viewKey) return;

    // App Router transitions never re-run the script, so a client-side
    // navigation has to be reported by hand. `page_location` is read from the
    // live URL rather than rebuilt from `viewKey` so GA4 records the origin it
    // was actually served from — www.bluneuron.com either way, but that should
    // come from the browser, not from a constant this component interpolates.
    //
    // No `user_id`, no email, nothing from the signup form: a page view here
    // is a path, a title and a referrer.
    trackGaEvent('page_view', {
      page_path: viewKey,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [enabled, viewKey]);

  // No measurement ID is the supported "GA is not set up yet" state — render
  // nothing at all rather than a tag pointed at no property. See the
  // TODO(analytics) in lib/googleAnalytics.
  if (!GA_MEASUREMENT_ID) return null;
  if (!enabled) return null;

  return (
    <>
      <Script
        id="ga4-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="ga4-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: BOOTSTRAP }}
      />
    </>
  );
}

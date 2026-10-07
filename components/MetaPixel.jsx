'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { META_PIXEL_ID, isMetaPixelEnabled, trackMetaPixel } from '@/lib/metaPixel';

/**
 * Meta Pixel base code, rendered once from app/layout so it is present on
 * every page.
 *
 * WHY THE SCRIPT IS MOUNTED FROM AN EFFECT AND NOT RENDERED DIRECTLY.
 * Whether the pixel may load depends on the hostname (see lib/metaPixel), and
 * the hostname is only knowable in the browser. Deciding during render would
 * mean the server emits the script and the client removes it — a hydration
 * mismatch. So the first client render matches the server (no script), an
 * effect reads the hostname, and the <Script> mounts on the pass after that.
 * `afterInteractive` already waits for hydration, so this costs nothing.
 *
 * PAGEVIEW, EXACTLY ONCE PER PAGE. The base code fires the first PageView
 * itself, as Meta's snippet does. The effect below fires one for every
 * subsequent client-side navigation — App Router transitions never re-run the
 * script — and skips the load it was already counted for. `useRef` rather than
 * state on purpose: changing it must not cause a render.
 */

/**
 * Meta's official base code, verbatim apart from the interpolated ID.
 *
 * It is a string rather than JSX because `next/script` needs the body as
 * `dangerouslySetInnerHTML`. The `id` is what lets Next de-duplicate it: the
 * snippet is also self-guarding (`if (f.fbq) return`), so even a double mount
 * cannot init twice.
 */
const BASE_CODE = `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`;

/**
 * The <noscript> fallback has to be in the server-rendered HTML to be worth
 * anything — a visitor with JavaScript off never runs the effect above, so it
 * cannot be gated on the hostname check. It is gated on the ID and on a
 * production build instead, which keeps it out of `next dev` entirely.
 *
 * Residual edge: a production build served from localhost WITH JavaScript
 * disabled would send one PageView. That combination does not occur in normal
 * local testing, and closing it would cost the fallback its reason to exist.
 */
const RENDER_NOSCRIPT = Boolean(META_PIXEL_ID) && process.env.NODE_ENV === 'production';

export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [enabled, setEnabled] = useState(false);
  const lastTracked = useRef(null);

  useEffect(() => {
    setEnabled(isMetaPixelEnabled());
  }, []);

  // The query string is part of the identity of a page view: ?utm_source=... is
  // the whole point of running a pixel, and Meta counts those as separate views.
  const query = searchParams.toString();
  const viewKey = query ? `${pathname}?${query}` : pathname;

  useEffect(() => {
    const previous = lastTracked.current;
    lastTracked.current = viewKey;

    // First pass after mount (previous === null) is the load the base code
    // already tracked. The `previous === viewKey` case is the re-run caused by
    // `enabled` flipping true on that same URL — also already tracked.
    if (!enabled || previous === null || previous === viewKey) return;

    trackMetaPixel('PageView');
  }, [enabled, viewKey]);

  if (!META_PIXEL_ID) return null;

  return (
    <>
      {enabled && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: BASE_CODE }}
        />
      )}

      {RENDER_NOSCRIPT && (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            alt=""
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
      )}
    </>
  );
}

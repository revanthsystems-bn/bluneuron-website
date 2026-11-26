'use client';

import { useState } from 'react';
import { trackBuyClick } from '@/lib/buy-click';
import { buyDestinations } from '@/lib/buy-destinations';

/**
 * The hero's buy row: every listed store, side by side.
 *
 * ---------------------------------------------------------------------------
 * EVERY DESTINATION, NOT JUST THE FIRST
 * ---------------------------------------------------------------------------
 * It used to render `buyDestinations()[0]` alone — one button, with "See
 * specs" beside it — on the reasoning that the sheet and /where-to-buy were
 * where every marketplace got offered. That reasoning held while there was
 * one store. With two listed, the hero was naming one of them and the buy
 * card below was naming both, so the first screen quietly understated where
 * the product is on sale.
 *
 * NO LABEL IS TYPED HERE. The buttons are `buyDestinations()`, in that
 * order, so the registry (MARKETPLACES in lib/site-config.js) decides both
 * what they say and which is primary — index 0 is Flipkart and gets
 * `.btn-primary`, the rest get `.btn-secondary`. Switching Amazon off
 * removes its button from this row with no edit here, exactly as it removes
 * it from the buy card.
 *
 * ---------------------------------------------------------------------------
 * STACKED ON PHONES, SIDE BY SIDE FROM sm
 * ---------------------------------------------------------------------------
 * A phone gets one button per row, each full width: Flipkart on top because
 * it is the primary, Amazon under it. That replaced an earlier arrangement
 * that kept them side by side at 375 by shrinking the padding to `px-5` and
 * splitting the row with `flex-1 basis-0` — which fit, but only by making
 * both buttons narrower than a button anywhere else on the site, in the one
 * place where the tap target matters most.
 *
 * Full width also removes the measurement the squeeze depended on. The old
 * note recorded that at 375 the column is 327px and the two labels want
 * 333px with the gap, so the pair missed by 6px; none of that signifies now,
 * because neither button has to share a row with anything.
 *
 * From `sm` up `w-auto` returns them to their label widths, side by side,
 * where the column has always been wide enough.
 *
 * ---------------------------------------------------------------------------
 * IT IS NEVER DISABLED AND NEVER HIDDEN
 * ---------------------------------------------------------------------------
 * The hero's entrance animation is a CSS keyframe on an ancestor (`.hero-in-text`
 * in app/globals.css) and these buttons are normal, hit-testable, focusable
 * elements from the first paint — there is no `pointer-events: none`, no
 * `disabled`, no gate waiting on hydration. The anchors are server-rendered
 * with their real `href`, so they work before any JavaScript arrives; the
 * click handler only adds the analytics.
 *
 * `trackBuyClick(d.id)` is unchanged and is the same call the buy card and
 * the sheet make — one event, `buy_click`, with `store` as its only property.
 * The hero does not get a tracking path of its own; see lib/buy-click.js.
 *
 * The PENDING branch below is the same contract StoreButtons enforces: a URL
 * still carrying the PLACEHOLDER marker never reaches the DOM as an `href`,
 * not as `#` and not disabled-but-present. It is unreachable in production
 * (scripts/check-production.js refuses a deploy while any placeholder
 * remains) and exists so a preview shows the buttons that actually ship.
 */

/**
 * Shared geometry. The tone (`.btn-primary` / `.btn-secondary`) is added per
 * button.
 *
 * `h-[52px]` and `text-base` apply at EVERY width — the hero's buttons are
 * deliberately a size up from the site's stock button, which is `min-h-44px`
 * and `text-sm`. `w-full` under `sm` is what puts one per row; `sm:w-auto`
 * hands sizing back to the label from tablet up. `px-8` overrides the `px-7`
 * on `.btn-primary` / `.btn-secondary`, and wins because Tailwind's utilities
 * layer is emitted after its components layer — not because of class order.
 *
 * The explicit height overrides nothing it should not: `min-h-[44px]` on the
 * tone classes is a floor, and 52 clears it, so the WCAG 2.2 target size is
 * still satisfied by a wider margin than before.
 */
const SHARED = 'h-[52px] w-full px-8 text-base sm:w-auto';

export default function HeroBuyButton() {
  const [pendingNote, setPendingNote] = useState(null);
  const destinations = buyDestinations();

  // No marketplace at all is a state the config can express and this surface
  // cannot usefully render. Nothing, rather than a button to nowhere.
  if (!destinations.length) return null;

  return (
    <>
      {destinations.map((d, i) => {
        const className = `${i === 0 ? 'btn-primary' : 'btn-secondary'} ${SHARED}`;

        // A placeholder destination renders the SAME button — the live state
        // is what ships, so it is the state worth reviewing — and the CLICK
        // is what differs: the note says when the link opens, and nothing
        // navigates. Announced through `aria-live` on the button itself
        // rather than a note beside it, so the row cannot reflow when it
        // fires.
        if (!d.ready) {
          return (
            <button
              key={d.id}
              type="button"
              aria-live="polite"
              onClick={() => {
                trackBuyClick(d.id);
                setPendingNote(d.id);
              }}
              className={className}
            >
              {pendingNote === d.id ? `${d.name} link goes live on sale day` : d.label}
            </button>
          );
        }

        return (
          <a
            key={d.id}
            href={d.href}
            target="_blank"
            // `noopener` stops the marketplace tab reaching back through
            // window.opener; `noreferrer` keeps our URL out of their
            // referrer log. Identical to every other buy link on the site.
            rel="noopener noreferrer"
            onClick={() => trackBuyClick(d.id)}
            className={className}
          >
            {d.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        );
      })}
    </>
  );
}

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
 * WHY THE PADDING IS NARROWER THAN A NORMAL BUTTON UNDER sm:
 * ---------------------------------------------------------------------------
 * MEASURED, not guessed. At a 375px viewport the hero's text column is
 * 327px wide, and at the stock `px-7` the two labels are 157px ("Buy on
 * Flipkart") and 164px ("Buy on Amazon") — 333px with the 12px gap, which is
 * 6px MORE than there is. The row is `flex-wrap`, so the overflow would not
 * have shown up as a horizontal scrollbar: Amazon would simply have dropped
 * onto a second line and nothing would have looked broken.
 *
 * `px-5` under `sm` buys back 16px a button and `flex-1 basis-0` then splits
 * the row evenly, so each is 157.5px against a 148px content width — side by
 * side at 375 with room to spare, and back to the stock `px-7` from `sm` up
 * where the column is wide enough not to care.
 *
 * `min-w-[136px]` is the floor, and it is what makes narrower phones degrade
 * instead of break: below ~352px the two cannot both clear it, `flex-wrap`
 * puts them on separate lines, and each is full width. A squeezed label is
 * worse than a stacked one.
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
 * THE EVEN SPLIT IS A SMALL-SCREEN MEASURE AND STOPS AT `sm`. `flex-1
 * basis-0` is what makes the pair fit a 327px column; left on at desktop it
 * also made each button 305px wide, stretching a compact pill into a slab
 * for no reason other than that the column was wide. From `sm` up they size
 * to their labels again, which is what every other button on the site does.
 */
const SHARED = 'flex-1 basis-0 min-w-[136px] px-5 sm:flex-none sm:basis-auto sm:px-7';

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

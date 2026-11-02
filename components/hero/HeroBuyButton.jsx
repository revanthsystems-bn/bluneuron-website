'use client';

import { useState } from 'react';
import { trackBuyClick } from '@/lib/buy-click';
import { buyDestinations } from '@/lib/buy-destinations';

/**
 * The hero's single primary buy button.
 *
 * ---------------------------------------------------------------------------
 * ONE BUTTON, AND IT NAMES ITSELF
 * ---------------------------------------------------------------------------
 * The label is NOT the string "Buy on Flipkart". It is
 * `buyDestinations()[0].label`, which today resolves to exactly that because
 * Flipkart is the only listed marketplace — and which becomes "Buy on Amazon"
 * by itself on the day `AMAZON.live` flips, because MARKETPLACES puts Amazon
 * first (lib/site-config.js). Nothing here has to be edited for that, and
 * nothing here can disagree with the buy sheet about where a visitor goes.
 *
 * THE FIRST DESTINATION, not all of them, and that is the one thing that
 * makes this different from components/buy/StoreButtons. The hero has room
 * for one primary action beside "See specs"; the sheet and /where-to-buy are
 * where every marketplace is offered. Both read the same registry, so the
 * hero can never offer a store the rest of the site has withdrawn.
 *
 * ---------------------------------------------------------------------------
 * IT IS NEVER DISABLED AND NEVER HIDDEN
 * ---------------------------------------------------------------------------
 * The hero's entrance animation is a CSS keyframe on an ancestor (`.hero-in-text`
 * in app/globals.css) and this button is a normal, hit-testable, focusable
 * element from the first paint — there is no `pointer-events: none`, no
 * `disabled`, no gate waiting on hydration. The anchor is server-rendered
 * with its real `href`, so it works before any JavaScript arrives; the click
 * handler only adds the analytics.
 *
 * The PENDING branch below is the same contract StoreButtons enforces: a URL
 * still carrying the PLACEHOLDER marker never reaches the DOM as an `href`,
 * not as `#` and not disabled-but-present. It is unreachable in production
 * (scripts/check-production.js refuses a deploy while any placeholder
 * remains) and exists so a preview shows the button that actually ships.
 */
export default function HeroBuyButton({ className = 'btn-primary' }) {
  const [pending, setPending] = useState(false);
  const destination = buyDestinations()[0];

  // No marketplace at all is a state the config can express and this surface
  // cannot usefully render. Nothing, rather than a button to nowhere.
  if (!destination) return null;

  // A placeholder destination renders the SAME button — the live state is
  // what ships, so it is the state worth reviewing — and the CLICK is what
  // differs: the label says when the link opens, and nothing navigates.
  // Announced through `aria-live` on the button itself rather than a note
  // beside it, so the hero's button row keeps exactly one child and cannot
  // reflow when this fires.
  if (!destination.ready) {
    return (
      <button
        type="button"
        aria-live="polite"
        onClick={() => {
          trackBuyClick(destination.id);
          setPending(true);
        }}
        className={className}
      >
        {pending ? `${destination.name} link goes live on sale day` : destination.label}
      </button>
    );
  }

  return (
    <a
      href={destination.href}
      target="_blank"
      // `noopener` stops the marketplace tab reaching back through
      // window.opener; `noreferrer` keeps our URL out of their referrer log.
      rel="noopener noreferrer"
      onClick={() => trackBuyClick(destination.id)}
      className={className}
    >
      {destination.label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

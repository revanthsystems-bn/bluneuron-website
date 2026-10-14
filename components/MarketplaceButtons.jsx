'use client';

import { track } from '@vercel/analytics';
import Magnetic from './Magnetic';
import { trackMetaPixelCustom } from '@/lib/metaPixel';
import { MARKETPLACE, MARKETPLACES, isTBD } from '@/lib/site-config';

/**
 * The two marketplace buttons — the only purchase path this site has.
 *
 * ONE component for both places that offers it (the homepage buy card and
 * /where-to-buy), so the labels, the link hygiene, the inert state and the
 * analytics are identical by construction. A second copy would be the obvious
 * place for `rel="noopener"` or a `buy_click` to quietly go missing.
 *
 * Amazon is `.btn-primary` and Flipkart `.btn-secondary` — a deliberate
 * hierarchy rather than two equal buttons, because a pair of identically
 * weighted CTAs makes the visitor choose before they can act. Both are a real
 * route to the product; the primary just removes the decision for anyone who
 * does not have a preference. The order comes from MARKETPLACES in
 * lib/site-config.js.
 *
 * WHAT HAPPENS ON CLICK, and what deliberately does not: the marketplace name
 * goes to Vercel Analytics as `buy_click` and to the Meta Pixel as the custom
 * `ClickToBuy`. Nothing else. No email, no phone number, no click id, no
 * referrer games — the card collects nothing, so there is nothing personal to
 * leak, and that must stay true. Both calls are no-ops when their script is
 * absent (ad blocker, consent tooling, localhost), and neither is awaited, so
 * analytics can never delay or block the navigation to Amazon.
 */

/** Opens-in-a-new-tab glyph. Drawn, aria-hidden, inherits the label's colour. */
function ExternalGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="ml-2 h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

export default function MarketplaceButtons({
  className = 'flex flex-col gap-3 sm:flex-row sm:flex-wrap',
  buttonClassName = 'w-full justify-center sm:w-auto',
  strength = 0.12,
}) {
  // A listing URL we do not have yet. Rendering the button as a dead link, or
  // pointing it at a marketplace search page, both end with a visitor on
  // someone else's product — so the button renders INERT instead, and the note
  // below says why. The layout, the hierarchy and the spacing are identical to
  // the live state, so nothing shifts when the URLs land.
  const pending = MARKETPLACES.filter((m) => isTBD(m.url)).map((m) => m.name);

  return (
    <div>
      <div className={className}>
        {MARKETPLACES.map((marketplace, i) => {
          const label = `Buy on ${marketplace.name}`;
          const tone = i === 0 ? 'btn-primary' : 'btn-secondary';

          if (isTBD(marketplace.url)) {
            return (
              <button
                key={marketplace.id}
                type="button"
                disabled
                className={`${tone} ${buttonClassName} cursor-not-allowed opacity-45`}
              >
                {label}
              </button>
            );
          }

          return (
            <Magnetic
              key={marketplace.id}
              as="a"
              href={marketplace.url}
              // `noopener` keeps the marketplace tab from reaching back into
              // this one through `window.opener`; `noreferrer` keeps our URL
              // out of their referrer log. Both, explicitly, on every one.
              target="_blank"
              rel="noopener noreferrer"
              className={`${tone} ${buttonClassName}`}
              strength={strength}
              onClick={() => {
                track('buy_click', { marketplace: marketplace.name });
                trackMetaPixelCustom('ClickToBuy', { marketplace: marketplace.name });
              }}
            >
              {label}
              <ExternalGlyph />
              {/* A link that replaces the page and one that opens a tab behave
                  differently, and the glyph only says so to people who can see
                  it. */}
              <span className="sr-only"> (opens in a new tab)</span>
            </Magnetic>
          );
        })}
      </div>

      {pending.length > 0 && (
        <p className="mt-4 text-xs leading-relaxed text-amber-300/80">
          {pending.join(' and ')} {pending.length > 1 ? 'listings go' : 'listing goes'} live at
          launch — the {pending.length > 1 ? 'buttons' : 'button'} will link straight to the
          product page then.
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-white/45">{MARKETPLACE.fulfilmentNote}</p>
    </div>
  );
}

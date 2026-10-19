'use client';

import { track } from '@vercel/analytics';
import Magnetic from './Magnetic';
import { trackGaEvent } from '@/lib/googleAnalytics';
import { trackMetaPixelCustom } from '@/lib/metaPixel';
import { trackBeginCheckout } from '@/lib/shop-analytics';
import {
  MARKETPLACE,
  MARKETPLACES,
  amazonCartUrl,
  flipkartCheckoutUrl,
  isPlaceholder,
  isTBD,
} from '@/lib/site-config';

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
 * goes to Google Analytics 4 and Vercel Analytics as `buy_click`, and to the
 * Meta Pixel as the custom `ClickToBuy`. Nothing else. No email, no phone
 * number, no click id, no referrer games — the card collects nothing, so
 * there is nothing personal to leak, and that must stay true. All three calls
 * are no-ops when their script is absent (ad blocker, consent tooling,
 * localhost), and none is awaited, so analytics can never delay or block the
 * navigation to Amazon.
 *
 * GA4 IS THE ONE THAT ACTUALLY REPORTS HERE. @vercel/analytics only reaches
 * the dashboard of a Vercel deployment, and this site is served from
 * Cloudflare Workers — app/layout.jsx does not even render <Analytics /> off
 * Vercel, so `track()` has nothing to send to and silently does nothing. It
 * is kept because the Vercel deploy still exists and still reports from it;
 * GA4 (lib/googleAnalytics.js) is the host-independent one, and without this
 * call the single most valuable event on the site — a click through to a
 * marketplace listing — was invisible on the host that serves the domain.
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

/*
 * SUPERSEDED BY components/buy/StoreButtons — do not add a new caller.
 *
 * The only thing still importing this is components/cart/CartPanel, which is
 * reachable only from /cart, which redirects while CART_ENABLED is false
 * (lib/site-config). So this code does not run today.
 *
 * It must not come back as-is. Its PLACEHOLDER branch renders a REAL,
 * CLICKABLE link to the marketplace's home page — so "Buy on Amazon" lands a
 * visitor on amazon.in with no IRIZ anywhere, which is a fake destination
 * wearing a real button. StoreButtons withholds the href entirely until a
 * genuine listing URL exists and shows a note instead.
 *
 * Switching the basket back on means pointing CartPanel at StoreButtons
 * first.
 */
export default function MarketplaceButtons({
  className = 'flex flex-col gap-3 sm:flex-row sm:flex-wrap',
  buttonClassName = 'w-full justify-center sm:w-auto',
  strength = 0.12,
  /**
   * "Buy" on a product surface, "Checkout" from the basket. One component
   * for both rather than a near-copy, so the inert state, the `rel` hygiene
   * and the three analytics calls cannot diverge between them — which is
   * precisely what a second copy would eventually do.
   */
  verb = 'Buy',
  /** Replaces the fulfilment line. The basket says more than a product card needs to. */
  note = MARKETPLACE.fulfilmentNote,
  /**
   * How many units to hand over, and what to report as the checkout value.
   *
   * The basket passes both; a product-page "Buy direct" button passes
   * quantity 1, because it bypasses the basket by definition. The quantity
   * is what makes Amazon's cart endpoint worth using at all — see
   * amazonCartUrl() in lib/site-config.js.
   */
  quantity = 1,
  unitPrice = null,
  /** `begin_checkout` from the basket, a plain click-through from a product surface. */
  isCheckout = false,
}) {
  // A listing URL we do not have yet. Rendering the button as a dead link, or
  // pointing it at a marketplace search page, both end with a visitor on
  // someone else's product — so the button renders INERT instead, and the note
  // below says why. The layout, the hierarchy and the spacing are identical to
  // the live state, so nothing shifts when the URLs land.
  const pending = MARKETPLACES.filter((m) => isTBD(m.url)).map((m) => m.name);

  // A PLACEHOLDER url is a different state from TBD, and renders differently:
  // it is a real, clickable link (so the whole flow can be reviewed in a
  // preview) that happens to land on the marketplace's home page instead of
  // the listing. The note below says so in as many words, and
  // scripts/check-production.js refuses a production deploy while any of
  // these are still here. See the PLACEHOLDER block in lib/site-config.js.
  const placeholders = MARKETPLACES.filter((m) => isPlaceholder(m.url)).map((m) => m.name);

  /** The real destination for one marketplace, with the quantity attached. */
  const destinationFor = (marketplace) =>
    marketplace.id === 'amazon' ? amazonCartUrl(quantity) : flipkartCheckoutUrl();

  return (
    <div>
      <div className={className}>
        {MARKETPLACES.map((marketplace, i) => {
          const label = `${verb} on ${marketplace.name}`;
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
              href={destinationFor(marketplace)}
              // `noopener` keeps the marketplace tab from reaching back into
              // this one through `window.opener`; `noreferrer` keeps our URL
              // out of their referrer log. Both, explicitly, on every one.
              target="_blank"
              rel="noopener noreferrer"
              className={`${tone} ${buttonClassName}`}
              strength={strength}
              onClick={() => {
                // `buy_click` / `ClickToBuy` are the long-standing
                // "someone left for a marketplace" counters and fire from
                // every surface. `begin_checkout` / `InitiateCheckout` are
                // the funnel step and fire ONLY from the basket — sending
                // them from a product page too would double-count the step
                // and make the cart look like it converts twice.
                trackGaEvent('buy_click', { marketplace: marketplace.name });
                track('buy_click', { marketplace: marketplace.name });
                trackMetaPixelCustom('ClickToBuy', { marketplace: marketplace.name });
                if (isCheckout) {
                  trackBeginCheckout({ unitPrice, quantity, marketplace: marketplace.name });
                }
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

      {placeholders.length > 0 && (
        <p className="mt-4 text-xs leading-relaxed text-amber-300/80">
          Preview build: the {placeholders.join(' and ')}{' '}
          {placeholders.length > 1 ? 'links go' : 'link goes'} to the marketplace home page, not
          to the IRIZ listing. The real listing {placeholders.length > 1 ? 'URLs' : 'URL'} replaces
          this before launch.
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-white/55">{note}</p>
    </div>
  );
}

'use client';

import StoreButtons from './buy/StoreButtons';
import { MARKETPLACE } from '@/lib/site-config';

/**
 * The two marketplace buttons, INLINE, with the fulfilment note under them.
 *
 * Used where the choice of store is the content of the page rather than a
 * question to interrupt someone with: the homepage buy card
 * (components/BuySection), /where-to-buy, and the basket panel. Everywhere
 * else — the masthead, the hero, the product page, the mobile sticky bar —
 * "Buy" opens the sheet instead (components/buy/BuySheet), which asks the
 * same question with the price beside it.
 *
 * ALL OF THE BEHAVIOUR IS IN components/buy/StoreButtons, which the sheet
 * shares: the labels, the `rel` hygiene, the single `buy_click` event, and
 * the rule that a PLACEHOLDER url never renders as an href. This component
 * is the row plus its note, and nothing else.
 *
 * Three things that used to live here are gone, and are worth naming so
 * they are not reinstated by accident:
 *
 *   - The "preview build: these links go to the marketplace home page"
 *     warning, because a placeholder is no longer rendered as a link at
 *     all. There is nothing left to warn about.
 *   - `quantity` / `isCheckout` / `unitPrice` and the `begin_checkout`
 *     event. Those existed to carry a basket quantity across to Amazon's
 *     cart endpoint; the basket is switched off (CART_ENABLED in
 *     lib/site-config) and every remaining caller passed the defaults.
 *   - `verb`. Only the basket passed anything but "Buy", and the basket no
 *     longer renders.
 *
 * All three are recoverable from git the day the basket comes back, and
 * none of them was doing anything in the build that ships.
 */
export default function MarketplaceButtons({
  className = 'flex flex-col gap-3 sm:flex-row sm:flex-wrap',
  buttonClassName = 'w-full justify-center sm:w-auto',
  /** Replaces the fulfilment line where a surface needs to say more. */
  note = MARKETPLACE.fulfilmentNote,
}) {
  return (
    <div>
      <StoreButtons className={className} buttonClassName={buttonClassName} />
      <p className="mt-4 text-step-1 leading-relaxed text-ink-3">{note}</p>
    </div>
  );
}

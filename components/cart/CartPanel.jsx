'use client';

import Image from 'next/image';
import { ShoppingBag, Trash2 } from 'lucide-react';
import QuantityStepper from '../shop/QuantityStepper';
import MarketplaceButtons from '../MarketplaceButtons';
import { useCart } from './CartContext';
import { BRAND, PRODUCT } from '@/lib/iriz';
import { ROUTES } from '@/lib/routes';
import { MARKETPLACE, WARRANTY, formatInr } from '@/lib/site-config';

/**
 * The basket, full width — items on the left, the summary and the two
 * checkout buttons on the right.
 *
 * WHY THE SUMMARY IS STICKY AT lg AND NOT BELOW IT. On a desktop the item
 * list can grow past the fold while the total stays relevant, so it is
 * pinned. On a phone the summary is simply the last block, because a pinned
 * panel in a 390px viewport is a panel covering the thing it summarises.
 *
 * THERE IS NO "CHECKOUT" BUTTON, singular. There are two, one per
 * marketplace, because this site takes no payment and never will on this
 * domain. Pretending otherwise with a single button that then asks you to
 * choose is a worse version of the same two clicks — and the sentence under
 * them, which says who takes the money, is the most important text on the
 * page. It must never be smaller than the buttons' own labels suggest.
 *
 * SUBTOTAL, NOT TOTAL. We do not know the delivery charge, the pincode, or
 * what a marketplace membership changes — so the figure here is the goods
 * and nothing else, and it says so.
 */
export default function CartPanel() {
  const { qty, unitPrice, subtotal, setItemQty, removeItem, hydrated } = useCart();

  // Before hydration localStorage has not been read, so the honest state is
  // "we do not know yet" — not "empty", which would flash an empty-cart
  // message at every returning visitor with something in their basket.
  if (!hydrated) {
    return <div className="h-64" aria-hidden="true" />;
  }

  if (qty === 0) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-border-subtle bg-black-soft px-6 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-border-subtle text-white/35">
          <ShoppingBag size={26} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-white">Your cart is empty</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/50">
            The {BRAND.model} is the only thing we make. Pick a quantity on the product page and
            it will show up here.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={ROUTES.product} className="btn-primary justify-center">
            View the {BRAND.model}
          </a>
          <a href={ROUTES.shop} className="btn-secondary justify-center">
            Back to shop
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-12 lg:items-start">
      {/* ITEMS */}
      <div className="rounded-3xl border border-border-subtle bg-black-soft p-6 sm:p-8">
        <h2 className="sr-only">Items in your cart</h2>

        <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
          <a
            href={ROUTES.product}
            className="relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl border border-border-subtle bg-black sm:h-32 sm:w-32"
          >
            <Image
              src={PRODUCT.image}
              alt={BRAND.fullName}
              fill
              sizes="(min-width: 640px) 128px, 92vw"
              className="object-cover"
            />
          </a>

          <div className="min-w-0 flex-1">
            <a
              href={ROUTES.product}
              className="text-base font-semibold text-white transition-colors hover:text-white/80"
            >
              {BRAND.fullName}
            </a>
            <p className="mt-1 text-sm text-white/50">
              {unitPrice === null ? '—' : formatInr(unitPrice)} each · {MARKETPLACE.priceNote}
            </p>
            <p className="mt-1 text-xs text-white/40">
              {WARRANTY.label} manufacturer warranty included
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <QuantityStepper value={qty} onChange={setItemQty} idPrefix="cart" />

              <button
                type="button"
                onClick={removeItem}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs text-white/45 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
              >
                <Trash2 size={14} aria-hidden="true" />
                Remove
              </button>
            </div>
          </div>

          {/* The line total, right-aligned on desktop where there is room for
              a third column, and inline under the controls on a phone. */}
          <div className="sm:text-right">
            <p className="text-lg font-bold text-white">
              {subtotal === null ? '—' : formatInr(subtotal)}
            </p>
          </div>
        </div>
      </div>

      {/* SUMMARY + CHECKOUT */}
      <div className="rounded-3xl border border-border-subtle bg-black-soft p-6 sm:p-8 lg:sticky lg:top-28">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
          Order summary
        </h2>

        <dl className="mt-6 space-y-3 border-b border-border-subtle pb-6 text-sm">
          <div className="flex items-baseline justify-between">
            <dt className="text-white/55">Subtotal</dt>
            <dd className="font-semibold text-white">
              {subtotal === null ? '—' : formatInr(subtotal)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="text-white/55">Delivery</dt>
            {/* NOT "Free". Amazon and Flipkart set delivery per order, per
                pincode and per membership, and we are not told which applies
                to you. "Shown at checkout" is the only true answer. */}
            <dd className="text-white/45">Shown at checkout</dd>
          </div>
        </dl>

        <p className="mt-5 text-xs leading-relaxed text-white/40">
          {MARKETPLACE.priceNote}. The marketplace price at the time you order is the one that
          applies.
        </p>

        <div className="mt-7">
          <MarketplaceButtons
            verb="Checkout"
            className="flex flex-col gap-3"
            buttonClassName="w-full justify-center"
            note="Payment and delivery are handled securely by the marketplace. Your card details never touch this site — we are not given them."
          />
        </div>

        <a
          href={ROUTES.shop}
          className="mt-6 block text-center text-xs text-white/45 transition-colors hover:text-white/70"
        >
          Continue shopping
        </a>
      </div>
    </div>
  );
}

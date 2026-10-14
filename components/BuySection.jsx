import Image from 'next/image';
import Reveal from './Reveal';
import MarketplaceButtons from './MarketplaceButtons';
import { BRAND, HERO, MEDIA } from '@/lib/iriz';
import { BUY_ANCHOR, ROUTES } from '@/lib/routes';
import { MARKETPLACE, formatInr } from '@/lib/site-config';

/**
 * The buy card — the closing section of the homepage once SHOW_BUY is on.
 *
 * It takes the slot components/Newsletter holds pre-launch, and inherits that
 * section's `id` (BUY_ANCHOR = "buy") rather than inventing one: `#buy` is
 * already the masthead CTA's target, the mobile sticky bar's target, and the
 * second entry in components/ConsentNotice's landmark list. Exactly one of the
 * two sections is ever mounted, so the anchor resolves in both states and
 * none of those three callers has to know which. See app/page.jsx.
 *
 * NOT a client component. The only thing here that needs the browser is the
 * click tracking on the two buttons, and that is sealed inside
 * components/MarketplaceButtons — so the photo, the price and the copy all
 * render on the server and ship no JavaScript.
 *
 * WHY THE PRICE IS STATED AT ALL, given the sale happens elsewhere: a visitor
 * deciding whether to click through needs to know roughly what this costs, and
 * sending them to Amazon to find out is the thing a brand site exists to
 * avoid. What it must not do is pretend to be the authority on a number
 * Amazon changes during a sale — hence the line under the buttons.
 *
 * The product name/tagline/photo come from lib/iriz.js, where the product's
 * copy already lives, so this card cannot drift from the hero. Only the price
 * and the listing URLs come from lib/site-config.js.
 */
export default function BuySection() {
  return (
    <section
      id={BUY_ANCHOR}
      className="relative scroll-mt-20 overflow-hidden border-b border-border-subtle bg-black py-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <div className="pointer-events-none absolute inset-0 bg-noise" />

      <div className="section-container relative">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* The render is a white-studio cutout with an opaque white ground,
              so it gets the same ambient stage glow + radial mask every other
              product shot on this site gets — without them it reads as a white
              card pasted onto the black. `product-glow` is on the frame,
              `product-fade` on the image.

              SQUARE frame, and no padding on the image. The source is 1600×1600
              and `product-fade` masks the IMG ELEMENT's box, so the mask only
              lines up with the picture when the two are the same shape — in a
              4:3 frame (or with padding inside a square one) the ellipse falls
              short of the artwork and leaves a hard white edge showing through
              at the corners. The aspect ratio is declared, so nothing reflows
              when it decodes. */}
          <Reveal className="product-glow relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden rounded-3xl">
            <Image
              src={MEDIA.product.heroClean}
              alt={`${BRAND.fullName} projector`}
              fill
              sizes="(min-width: 1024px) 520px, 92vw"
              className="product-fade object-contain"
            />
          </Reveal>

          <Reveal delay={0.08} className="max-w-xl">
            <p className="bento-chip">Available now</p>

            <h2 className="mt-5 text-3xl font-bold tracking-tighter text-white sm:text-4xl">
              {BRAND.fullName}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-base">{HERO.body}</p>

            {/* Price and tax line as one block: the note is part of the price,
                not a footnote, so it must never be separated from it by a
                responsive wrap. */}
            <div className="mt-7">
              <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {formatInr(MARKETPLACE.priceInr)}
              </p>
              <p className="mt-1.5 text-xs text-white/50">{MARKETPLACE.priceNote}</p>
            </div>

            <div className="mt-8">
              <MarketplaceButtons />
            </div>

            <p className="mt-6 text-xs leading-relaxed text-white/40">
              Prices on Amazon and Flipkart move with their own offers — the price shown on the
              listing is the one that applies to your order.{' '}
              <a
                href={ROUTES.whereToBuy}
                className="underline underline-offset-2 transition-colors hover:text-white/70"
              >
                More on where to buy
              </a>
              .
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

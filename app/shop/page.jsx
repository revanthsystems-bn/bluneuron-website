import Image from 'next/image';
import PageShell from '@/components/PageShell';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/Reveal';
import AddToCart from '@/components/shop/AddToCart';
import { BRAND, GALLERY, HERO, MEDIA } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { MARKETPLACE, WARRANTY, formatInr } from '@/lib/site-config';

/**
 * /shop — a shop landing page for a catalogue of one.
 *
 * THE DESIGN PROBLEM, stated plainly: a grid is the wrong shape for one
 * product. Three columns with one card in them reads as a shop that has sold
 * out, or as a page that failed to load. So this is not a grid. It is a
 * single wide card — image on one side, the buy decision on the other — that
 * uses the full measure rather than pretending to be the first cell of
 * something bigger.
 *
 * WHAT IS NOT HERE, deliberately:
 *   - No second product, no bundle, no "customers also bought". There is one
 *     SKU. Inventing a second one to balance the layout is inventing a
 *     product.
 *   - No star rating. No review data exists, and a row of empty stars is a
 *     rating of zero to anyone scanning.
 *   - No "Free delivery" badge. Amazon and Flipkart set delivery terms per
 *     order and per membership; we do not know them and cannot promise them.
 *   - No strike-through MRP or "% off". We do not set the marketplace price,
 *     so we cannot state what anyone is saving against.
 *
 * The accessories strip at the bottom is the honest version of the thing a
 * one-product shop usually fakes: it says "coming soon" and offers nothing
 * to click, rather than linking to an empty category.
 */

export const metadata = {
  ...pageMetadata({
    title: 'Shop — BluNeuron IRIZ Mini Projector',
    description:
      'Buy the BluNeuron IRIZ mini projector for home: native 1080p, true 500 ANSI lumens, built-in Android 14. ₹13,999 inclusive of all taxes.',
    path: ROUTES.shop,
  }),
  robots: routeRobots(ROUTES.shop),
};

/** The three things a shopper checks before the price. Facts, all sourced. */
const ASSURANCES = [
  { label: 'Warranty', value: `${WARRANTY.label} manufacturer cover` },
  { label: 'Sold by', value: 'Amazon and Flipkart' },
  { label: 'Ships to', value: 'India' },
];

export default function ShopPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Shop"
        title="One projector. Built properly."
        subtitle="The IRIZ is the only thing we make, and everything we know about it is on this site."
        image={MEDIA.product.heroClean}
        imagePosition="62% 50%"
      />

      <section className="border-b border-border-subtle bg-black py-14 sm:py-20">
        <div className="section-container">
          {/* THE CARD. `lg:grid-cols-2` with the image first in source order,
              so a screen reader and a narrow viewport both meet the product
              before the price — which is the order someone actually decides
              in. */}
          <Reveal className="overflow-hidden rounded-3xl border border-border-subtle bg-black-soft">
            <div className="grid items-stretch lg:grid-cols-2">
              {/* SQUARE, AND NO PADDING ON THE IMAGE. `product-fade` masks the
                  IMG ELEMENT's own box with an ellipse, so the mask only lines
                  up with the artwork when the two are the same shape. A
                  `lg:aspect-auto` frame (which stretches to the row height) or
                  padding inside a square one both leave the ellipse short of
                  the picture, and the white studio ground shows through as a
                  hard rectangular edge. components/BuySection documents the
                  same trap; this card fell into it and is fixed the same way.
                  `self-center` keeps the square from stretching when the buy
                  column beside it is taller. */}
              <div className="product-stage relative aspect-square w-full self-center border-b border-border-subtle lg:border-b-0 lg:border-r">
                <Image
                  src={GALLERY[0].src}
                  alt={GALLERY[0].alt}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  priority
                  className="object-contain p-8"
                />
              </div>

              <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
                <p className="bento-chip">Mini projector for home</p>

                <h2 className="mt-5 text-3xl font-bold tracking-tighter text-white sm:text-4xl">
                  {BRAND.fullName}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{HERO.body}</p>

                <div className="mt-7">
                  <p className="text-4xl font-bold tracking-tight text-white">
                    {formatInr(MARKETPLACE.priceInr)}
                  </p>
                  <p className="mt-1.5 text-xs text-white/50">{MARKETPLACE.priceNote}</p>
                </div>

                <dl className="mt-7 grid gap-x-6 gap-y-3 border-t border-border-subtle pt-6 sm:grid-cols-3">
                  {ASSURANCES.map((item) => (
                    <div key={item.label}>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                        {item.label}
                      </dt>
                      <dd className="mt-1 text-sm text-white/75">{item.value}</dd>
                    </div>
                  ))}
                </dl>

                {/* `openDrawer={false}`: adding from a card should not pull a
                    panel over the page. The cart badge in the masthead is the
                    feedback, plus the button's own "Added" state. */}
                <AddToCart
                  className="mt-8"
                  idPrefix="shop"
                  openDrawer={false}
                  buttonClassName="btn-primary w-full justify-center"
                />

                <a
                  href={ROUTES.product}
                  className="btn-secondary mt-3 w-full justify-center"
                >
                  View details
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ACCESSORIES. A strip, not a grid of empty cards: there is nothing to
          put in the cards, and an "coming soon" tile repeated three times is
          three times the disappointment. Nothing here is clickable, because
          there is nowhere for it to go. */}
      <section className="bg-black-soft py-14 sm:py-16">
        <div className="section-container">
          <Reveal className="flex flex-col gap-4 rounded-3xl border border-dashed border-white/10 px-7 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <div>
              <p className="eyebrow mb-2">Accessories</p>
              <h2 className="text-xl font-semibold tracking-tight text-white">Coming soon</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">
                Spare remotes, power adapters and mounts will be listed here once they are
                available to order. Until then, support can source a replacement part directly.
              </p>
            </div>
            <a href={ROUTES.contact} className="btn-secondary shrink-0 justify-center">
              Ask support
            </a>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}

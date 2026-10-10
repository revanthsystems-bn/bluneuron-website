import Image from 'next/image';
import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import DraftBanner from '@/components/DraftBanner';
import MarketplaceButtons from '@/components/MarketplaceButtons';
import Reveal from '@/components/Reveal';
import { BRAND, HERO, MEDIA } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { MARKETPLACE, SHOW_BUY, formatInr } from '@/lib/site-config';

export const metadata = {
  ...pageMetadata({
    title: 'Where to Buy — BluNeuron IRIZ',
    description:
      'The BluNeuron IRIZ is sold on Amazon and Flipkart. Price, what each marketplace handles, and what we handle directly.',
    path: ROUTES.whereToBuy,
  }),
  robots: routeRobots(ROUTES.whereToBuy),
};

/**
 * Who does what after the order. The single most useful thing this page can
 * say, because it is the question a marketplace purchase actually leaves open
 * — and answering it here is what stops a delivery problem arriving in the
 * warranty inbox and a hardware fault being argued with a courier.
 */
const SPLIT = [
  {
    title: 'Amazon and Flipkart handle',
    items: [
      'Payment, invoicing and GST billing',
      'Delivery, tracking and delivery problems',
      'Their own return window, replacements and refunds',
      'Order cancellation before dispatch',
    ],
  },
  {
    title: 'We handle',
    items: [
      'Warranty registration and warranty claims',
      'Setup help, troubleshooting and firmware questions',
      'Spare parts, remotes and accessories',
      'Anything the marketplace cannot answer about the product itself',
    ],
  },
];

export default function WhereToBuyPage() {
  return (
    <PageShell>
      <PageHeading
        eyebrow="Where to buy"
        title={`Buy the ${BRAND.model} on Amazon or Flipkart.`}
        subtitle="We do not sell direct. Both listings are the official BluNeuron store, and both ship the same unit with the same warranty."
      />

      <section className="border-b border-border-subtle bg-black py-16 sm:py-20">
        <div className="section-container">
          <DraftBanner path={ROUTES.whereToBuy} className="mb-10 max-w-[680px]" />

          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Square frame, no padding — see the comment in
                components/BuySection for why the mask needs the element box to
                match the 1600×1600 source. */}
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
              <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">
                {BRAND.fullName}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-base">{HERO.body}</p>

              <div className="mt-7">
                <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  {formatInr(MARKETPLACE.priceInr)}
                </p>
                <p className="mt-1.5 text-xs text-white/50">{MARKETPLACE.priceNote}</p>
              </div>

              <div className="mt-8">
                <MarketplaceButtons />
              </div>

              {/* The homepage says this beside its own buttons too. Said again
                  here because this is the page someone lands on from a search
                  for the price, and a stale number is exactly what they would
                  otherwise take away. */}
              <p className="mt-6 text-xs leading-relaxed text-white/40">
                Amazon and Flipkart set their own prices and run their own offers, so the listing
                price can differ from the one above. The price on the listing is the price that
                applies to your order.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-b border-border-subtle bg-black-soft py-16 sm:py-20">
        <div className="section-container">
          <Reveal className="mb-10 max-w-lg">
            <p className="eyebrow mb-3">After you order</p>
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">
              Who handles what
            </h2>
          </Reveal>

          <div className="bento-grid">
            {SPLIT.map((group, i) => (
              <Reveal
                key={group.title}
                delay={i * 0.06}
                y={20}
                className="bento-tile p-6 sm:p-8 lg:col-span-6"
              >
                <h3 className="mb-4 text-base font-semibold text-white">{group.title}</h3>
                <ul className="space-y-2.5 text-sm leading-relaxed text-white/60">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent-soft" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={ROUTES.warrantyRegistration} className="btn-primary justify-center">
              Register your warranty
            </a>
            <a href={ROUTES.warranty} className="btn-secondary justify-center">
              Read the warranty policy
            </a>
          </Reveal>
        </div>
      </section>

      {/* Pre-launch, the page still has to exist — it is linked from the
          footer of every page and from the sitemap once it is finished — but it
          would be dishonest to end on "buy now" while nothing is listed. So
          the closing block says where things stand instead, and disappears the
          moment SHOW_BUY goes true. See lib/site-config.js. */}
      {!SHOW_BUY && (
        <section className="bg-black py-16 text-center sm:py-20">
          <div className="section-container">
            <Reveal>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-white/50">
                The {BRAND.model} is not listed yet. Join the launch list on the homepage and we
                will send one message the day it goes on sale.
              </p>
              <a href={ROUTES.home} className="btn-secondary mt-5 inline-flex">
                Back to the homepage
              </a>
            </Reveal>
          </div>
        </section>
      )}
    </PageShell>
  );
}

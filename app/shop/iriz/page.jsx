import PageShell from '@/components/PageShell';
import Reveal from '@/components/Reveal';
import MarketplaceButtons from '@/components/MarketplaceButtons';
import AddToCart from '@/components/shop/AddToCart';
import ProductGallery from '@/components/shop/ProductGallery';
import StickyProductBar from '@/components/shop/StickyProductBar';
import {
  BOX_CONTENTS,
  BRAND,
  GALLERY,
  HERO,
  HIGHLIGHTS,
  SHOW_PENDING_SPECS,
  SPECS,
} from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata, productJsonLd } from '@/lib/seo';
import { MARKETPLACE, WARRANTY, formatInr } from '@/lib/site-config';

/**
 * /shop/iriz — the product page.
 *
 * THE LAYOUT. Gallery left, buy panel right, both inside one `lg:grid-cols-2`
 * that collapses to a single column below lg. The buy panel is `lg:sticky`,
 * so the price and the two actions stay on screen while the gallery is
 * scrolled — on a long page that is what stops a visitor having to scroll
 * back up to act. Below the fold the page is a single column again: the
 * supporting content is read, not interacted with, and a second column of it
 * would compete with the panel that is still pinned beside it.
 *
 * TWO WAYS TO BUY, and they are not the same decision. "Add to cart" builds
 * a quantity here and hands it to a marketplace at checkout; "Buy on Amazon"
 * / "Buy on Flipkart" goes straight to the listing. Both end on a
 * marketplace — this site takes no payment — so the panel states that once,
 * under the buttons, rather than implying an in-site checkout exists.
 *
 * WHAT IS DELIBERATELY ABSENT:
 *   - No delivery estimate or "free delivery" badge. Amazon and Flipkart set
 *     those per order, per pincode and per membership. We do not know them.
 *   - No stars, no review count, no "X people bought this". No review data
 *     exists; an empty five-star row reads as a zero rating.
 *   - No MRP strike-through or "% off". We do not set the marketplace price.
 *   - No FAQ and no long-form product story. Both live elsewhere already —
 *     /support/faq owns the questions and the FAQPage markup, the homepage
 *     owns the ~750-word case — and repeating either would put the same text
 *     on two indexable URLs, with this page competing against the pages it
 *     should be feeding from. FURTHER_READING links to all three instead.
 *   - "In the box" renders only when SHOW_PENDING_SPECS is on. BOX_CONTENTS
 *     is INFERRED from marketing copy rather than sourced from the
 *     manufacturer (see the note on it in lib/iriz.js), and a packing list is
 *     exactly the kind of claim a buyer holds you to.
 */

/**
 * Where the depth lives. Three links, each to a page that owns its subject,
 * so this page can stay a buying page.
 */
const FURTHER_READING = [
  {
    href: `${ROUTES.home}#why-iriz`,
    title: 'Why IRIZ',
    body: 'What ANSI lumens actually measure, what "native" 1080p means, and how throw distance decides your screen size.',
    cta: 'Read the case',
  },
  {
    href: ROUTES.specs,
    title: 'Full specifications',
    body: 'Every figure: optics, throw, platform, connectivity and audio, in one table.',
    cta: 'See the spec sheet',
  },
  {
    href: ROUTES.faq,
    title: 'FAQ & troubleshooting',
    body: 'Screens, distances, Wi-Fi, input lag, and what to do if the picture is not square.',
    cta: 'Read the answers',
  },
];

export const metadata = {
  ...pageMetadata({
    // BUYING INTENT. This page and the homepage must not chase the same
    // query: the homepage is the story ("iriz mini projector for home") and
    // this is the transaction ("buy iriz projector", "iriz price"). Two
    // pages competing for one phrase split their own authority and Google
    // picks whichever it likes — usually not the one with the buy button.
    title: 'Buy BluNeuron IRIZ Mini Projector — ₹13,999 | BluNeuron',
    description:
      'Buy the BluNeuron IRIZ mini projector: ₹13,999 inclusive of all taxes, 1 year warranty, on Amazon and Flipkart. Native 1080p and true 500 ANSI lumens.',
    path: ROUTES.product,
  }),
  robots: routeRobots(ROUTES.product),
};

/**
 * Product structured data now lives HERE rather than on the homepage.
 *
 * It was on `/` because `/` was the only page describing the product. With a
 * real product page, a Product block on the homepage describes something the
 * page is not primarily about, and its `url` pointed at the origin — so a
 * rich result led to the marketing page rather than to the thing being
 * offered. Organization stays on the homepage; it describes the site.
 *
 * Still null, and still emitting nothing, whenever there is no confirmed
 * price — see the reasoning in lib/seo.js.
 */
const PRODUCT_JSON_LD = productJsonLd();

export default function ProductPage() {
  return (
    <PageShell>
      {PRODUCT_JSON_LD && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PRODUCT_JSON_LD) }}
        />
      )}

      <section className="border-b border-border-subtle bg-black pb-16 pt-10 sm:pt-14">
        <div className="section-container">
          {/* A breadcrumb, not a back button: it states where this page sits
              rather than assuming where the visitor came from. */}
          <nav aria-label="Breadcrumb" className="mb-5 text-xs text-white/40 sm:mb-8">
            <a href={ROUTES.shop} className="transition-colors hover:text-white/70">
              Shop
            </a>
            <span className="px-2" aria-hidden="true">
              /
            </span>
            <span className="text-white/60">{BRAND.model}</span>
          </nav>

          {/* `gap-6` below lg, not `gap-10`: on a phone this gap sits
              between the gallery and the price, and every pixel of it pushes
              the buy decision further down the first screen. */}
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-14">
            <Reveal>
              <ProductGallery shots={GALLERY} />
            </Reveal>

            {/* `id` is what StickyProductBar observes — when this panel
                leaves the viewport, the bar takes over. `self-start` is
                required for `sticky` to have anywhere to stick inside a
                grid row. */}
            <Reveal id="buy-panel" delay={0.06} className="lg:sticky lg:top-28 lg:self-start">
              <p className="eyebrow mb-3">{HERO.eyebrow}</p>
              <h1 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">
                {BRAND.fullName}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-base">{HERO.body}</p>

              <div className="mt-7 border-t border-border-subtle pt-7">
                <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  {formatInr(MARKETPLACE.priceInr)}
                </p>
                <p className="mt-1.5 text-xs text-white/50">{MARKETPLACE.priceNote}</p>
              </div>

              <AddToCart className="mt-7" idPrefix="pdp" />

              <div className="mt-8 border-t border-border-subtle pt-7">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                  Or buy direct from a marketplace
                </p>
                <MarketplaceButtons
                  className="flex flex-col gap-3"
                  buttonClassName="w-full justify-center"
                  note="Payment, invoicing and delivery are handled by the marketplace. We provide the manufacturer warranty and support."
                />
              </div>

              {/* THE WARRANTY BADGE. A real, sourced fact with a link to the
                  policy behind it — a badge that cannot be checked is
                  decoration. */}
              <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border-subtle bg-white/[0.03] p-5">
                <ShieldGlyph />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {WARRANTY.label} manufacturer warranty
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    Carry-in service through an authorised centre, on every genuine unit.{' '}
                    <a
                      href={ROUTES.warranty}
                      className="underline underline-offset-2 transition-colors hover:text-white/80"
                    >
                      Warranty policy
                    </a>
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS — text only, no tile images. HIGHLIGHTS in lib/iriz.js
          carries an `image` per entry, and three of those six files are not
          in public/ (see the note on GALLERY). Rendering the copy alone is
          both honest and, on a page that already opens with a six-shot
          gallery, less repetitive than a second grid of pictures. */}
      <section className="border-b border-border-subtle bg-black-soft py-16 sm:py-20">
        <div className="section-container">
          <Reveal className="mb-10">
            <p className="eyebrow mb-3">Highlights</p>
            <h2 className="text-2xl font-bold tracking-tighter text-white sm:text-3xl">
              What you get for the money.
            </h2>
          </Reveal>

          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.map((item, i) => (
              <Reveal key={item.title} delay={Math.min(i, 3) * 0.05} y={20}>
                <h3 className="text-base font-semibold tracking-tight text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{item.subtitle}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SPECS — the six headline figures, with the full sheet one click
          away. The whole FULL_SPEC_SHEET here would be a 30-row table on a
          page whose job is a decision, not a reference. */}
      <section className="border-b border-border-subtle bg-black py-16 sm:py-20">
        <div className="section-container">
          <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3">Specifications</p>
              <h2 className="text-2xl font-bold tracking-tighter text-white sm:text-3xl">
                The numbers that matter.
              </h2>
            </div>
            <a href={ROUTES.specs} className="btn-secondary">
              Full spec sheet
            </a>
          </Reveal>

          <dl className="grid gap-px overflow-hidden rounded-2xl border border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-3">
            {SPECS.map((spec) => (
              <div key={spec.label} className="bg-black p-6">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  {spec.label}
                </dt>
                <dd className="mt-2 text-2xl font-bold tracking-tight text-white">{spec.value}</dd>
                <dd className="mt-1 text-xs text-white/45">{spec.unit}</dd>
              </div>
            ))}
          </dl>

          {SHOW_PENDING_SPECS && (
            <Reveal className="mt-10">
              <h3 className="text-base font-semibold tracking-tight text-white">In the box</h3>
              <ul className="mt-3 grid gap-2 text-sm text-white/60 sm:grid-cols-2">
                {BOX_CONTENTS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>
      </section>

      {/* NO FAQ ACCORDION HERE, and no long-form product story.
          Both exist already: the questions on /support/faq (which also owns
          the FAQPage structured data) and the ~750-word case on the homepage.
          Repeating either here would put the same text on two indexable URLs
          and make this page compete with the pages it should be feeding
          from. A buying page's job is the decision and the price; the depth
          is one link away, and the links are the point. */}
      <section className="bg-black-soft py-16 sm:py-20">
        <div className="section-container">
          <Reveal className="mb-8">
            <p className="eyebrow mb-3">Before you decide</p>
            <h2 className="text-2xl font-bold tracking-tighter text-white sm:text-3xl">
              Everything else about the {BRAND.model}.
            </h2>
          </Reveal>

          <ul className="grid gap-4 sm:grid-cols-3">
            {FURTHER_READING.map((item, i) => (
              <li key={item.href}>
                <Reveal delay={Math.min(i, 3) * 0.05} y={20}>
                  <a
                    href={item.href}
                    className="group flex h-full flex-col rounded-2xl border border-border-subtle bg-black p-6 transition-colors hover:border-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
                  >
                    <h3 className="text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">{item.body}</p>
                    <span className="mt-4 text-xs font-semibold text-accent-soft">
                      {item.cta} →
                    </span>
                  </a>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <StickyProductBar watchId="buy-panel" />
    </PageShell>
  );
}

/** Drawn, not an icon package import — one shape, inheriting currentColor. */
function ShieldGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-5 w-5 shrink-0 text-accent-soft"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 4.5 6v5.5c0 4.2 3.1 7.6 7.5 9 4.4-1.4 7.5-4.8 7.5-9V6Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

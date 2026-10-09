import Header from '@/components/Header';
import TrustBadges from '@/components/TrustBadges';
import Highlights from '@/components/Highlights';
import ThrowRange from '@/components/ThrowRange';
import TechSpecs from '@/components/TechSpecs';
import ProductShowcase from '@/components/ProductShowcase';
import ComparisonTable from '@/components/ComparisonTable';
import Hero from '@/components/Hero';
import Newsletter from '@/components/Newsletter';
import BuySection from '@/components/BuySection';
import Footer from '@/components/Footer';
import StickyBuyBar from '@/components/StickyBuyBar';
import { BRAND, MEDIA, PRICING, SPECS } from '@/lib/iriz';
import { COMMERCE_ENABLED } from '@/lib/launch';
import { resolveHeroTheme } from '@/lib/heroTheme';
import { SITE_URL } from '@/lib/site';
import { MARKETPLACE, SHOW_BUY, isTBD } from '@/lib/site-config';

const PRODUCT_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: BRAND.fullName,
  brand: { '@type': 'Brand', name: BRAND.name },
  description:
    'True 500 ANSI Lumens, native 1080P, Allwinner H723 chipset, and built-in Google TV with 10,000+ apps.',
  image: [new URL(MEDIA.product.heroClean, SITE_URL).toString()],
  url: SITE_URL,
  additionalProperty: SPECS.map((spec) => ({
    '@type': 'PropertyValue',
    name: spec.label,
    value: `${spec.value} (${spec.unit})`,
  })),
  // No `offers` block unless the product can actually be bought AND we know
  // the price. Structured data is a public claim: an Offer with a price and
  // `InStock` tells Google the IRIZ can be bought right now for that amount,
  // which would put a price and a buy prompt in search results for a product
  // with no purchase path — or, worse, quote "[TBD]" as a price. Price-free
  // product markup is still valid and still earns a rich result.
  //
  // Two ways to be buyable, and they carry different prices: marketplace
  // selling (SHOW_BUY, the real path — the marketplace price) and the
  // switched-off in-site cart (COMMERCE_ENABLED — PRICING in lib/iriz.js).
  // SHOW_BUY is checked first for the same reason the masthead CTA checks it
  // first: it is the path a buyer would actually take.
  ...(SHOW_BUY && !isTBD(MARKETPLACE.priceInr)
    ? {
        offers: {
          '@type': 'Offer',
          // The buy card, not a marketplace URL. This page is where both
          // listings are offered, and naming one of them here would make the
          // other invisible to a rich result.
          url: new URL('/where-to-buy', SITE_URL).toString(),
          price: MARKETPLACE.priceInr,
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
      }
    : COMMERCE_ENABLED
      ? {
          offers: {
            '@type': 'Offer',
            url: SITE_URL,
            price: PRICING.offerPrice,
            priceCurrency: PRICING.currency,
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition',
          },
        }
      : {}),
};

/**
 * `searchParams` is a Promise in Next 16 and is a request-time API, so reading
 * it here opts this page into DYNAMIC RENDERING — the homepage is server-
 * rendered per request instead of being prerendered at build.
 *
 * That cost is accepted deliberately and temporarily: `?hero=light` exists so
 * both hero treatments can be opened side by side without a rebuild, which is
 * the entire point of the test. When the test is settled, delete the
 * `searchParams` prop and read `HERO_THEME` directly — the page goes back to
 * static with no other change. See lib/heroTheme.js.
 */
export default async function Home({ searchParams }) {
  const heroTheme = resolveHeroTheme((await searchParams)?.hero);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRODUCT_JSON_LD) }}
      />
      {/* No AnnouncementBar here: the cinematic hero has to be the first
          visible thing on the page, and its eyebrow + tagline already carry
          the line the bar was running. The header floats over the video. */}
      <Header overlay heroTheme={heroTheme} />
      <main>
        <Hero theme={heroTheme} />
        <StickyBuyBar />
        {/* Every one of the four trust tiles is a commerce promise — a 30-day
            return, 24h dispatch, encrypted checkout, and the concierge that
            supports them. Three of the four describe a purchase flow that is
            currently switched off, and the bento board needs four tiles to
            fill its 12-column rows, so the section goes as a unit rather than
            being reworded down to one surviving claim. See lib/launch.js. */}
        {COMMERCE_ENABLED && <TrustBadges />}
        <Highlights />
        {/* ThrowRange follows Highlights directly. The WebGL ring tunnel
            (components/LensZoom) used to sit between them restating "Native
            1080p, projected up to 200 inches" over a spinning graphic — a
            claim this page already makes in Highlights ("Go big and go
            home"), in the dial below, and in TechSpecs' Resolution and Throw
            Ratio rows. The later build of this site dropped the section
            rather than re-skinning it; the component is left on disk. */}
        <ThrowRange />
        <TechSpecs />
        <ProductShowcase />
        <ComparisonTable />
        {/* The closing section is EITHER the marketplace buy card or the
            launch-list signup — never both, and never neither. They share the
            `#buy` id (BUY_ANCHOR in lib/routes.js), which is what the masthead
            CTA, the mobile sticky bar and ConsentNotice's landmark list all
            point at, so that anchor resolves in both states and none of those
            three has to know which one is mounted.
            See SHOW_BUY in lib/site-config.js. */}
        {SHOW_BUY ? <BuySection /> : <Newsletter />}
      </main>
      <Footer />
    </>
  );
}

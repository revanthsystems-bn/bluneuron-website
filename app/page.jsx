import Header from '@/components/Header';
import TrustBadges from '@/components/TrustBadges';
import Highlights from '@/components/Highlights';
import ThrowRange from '@/components/ThrowRange';
import TechSpecs from '@/components/TechSpecs';
import ProductShowcase from '@/components/ProductShowcase';
import ComparisonTable from '@/components/ComparisonTable';
import Hero from '@/components/Hero';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import StickyBuyBar from '@/components/StickyBuyBar';
import { BRAND, MEDIA, PRICING, SPECS } from '@/lib/iriz';
import { COMMERCE_ENABLED } from '@/lib/launch';
import { resolveHeroTheme } from '@/lib/heroTheme';
import { SITE_URL, absoluteUrl } from '@/lib/site';
import { ORGANIZATION_JSON_LD, pageMetadata } from '@/lib/seo';

/**
 * Homepage title, at 65 characters.
 *
 * The budget is Google's ~580px of rendered title width, which is roughly 60-65
 * characters; past it the tail is truncated in the result, and the tail is where
 * the brand name sits. "Native" is the word that was cut to make room — the
 * distinction it draws (true 1080p DISPLAY vs. the H723's 4K DECODING, see
 * lib/iriz.js) still appears in the description, the og:title, the h1 and the
 * Product markup below, none of which are width-constrained.
 */
const TITLE = 'IRIZ Mini Projector for Home — 1080p, 500 ANSI Lumens | BluNeuron';

// 147 characters. Under the ~155 Google renders, and carries the three terms
// this page is meant to rank for: "mini projector for home", "1080p", "India".
const DESCRIPTION =
  'The IRIZ mini projector for home: native 1080p, true 500 ANSI lumens, and built-in '
  + 'Google TV with 10,000+ apps. Designed and supported in India.';

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/',
  // No width budget on an OG card, so the fuller claim goes here.
  ogTitle: 'BluNeuron IRIZ — Mini Projector for Home, Native 1080p, 500 ANSI Lumens',
});

const PRODUCT_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  '@id': `${SITE_URL}/#product`,
  name: `${BRAND.fullName} Mini Projector for Home`,
  brand: { '@type': 'Brand', name: BRAND.name },
  description:
    'A mini projector for home cinema: true 500 ANSI lumens, native 1080p resolution, '
    + 'Allwinner H723 chipset, and built-in Google TV with 10,000+ apps.',
  // Absolute, fetchable URLs — Google rejects relative `image` values, and
  // every entry here is a file that exists in public/.
  image: [
    absoluteUrl(MEDIA.product.heroClean),
    absoluteUrl(MEDIA.product.retailBox),
  ],
  url: SITE_URL,
  // No `aggregateRating` or `review`. The manufacturer supplied no ratings
  // data with this unit (lib/iriz.js) and inventing one would be both a
  // structured-data violation and a lie told in a search result.
  additionalProperty: SPECS.map((spec) => ({
    '@type': 'PropertyValue',
    name: spec.label,
    value: `${spec.value} (${spec.unit})`,
  })),
  // No `offers` block while commerce is off. Structured data is a public
  // claim: an Offer with a price and `InStock` tells Google the IRIZ can be
  // bought right now for ₹13,999, which would put a price and a buy prompt in
  // search results for a product with no purchase path. Price-free product
  // markup is still valid and still earns a rich result.
  ...(COMMERCE_ENABLED
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
      {/* Two separate <script> blocks rather than one @graph array. Both are
          valid; separate blocks mean a syntax error in one can't invalidate
          the other, and Google's Rich Results Test reports them independently.
          Organization is emitted HERE and only here — it describes the site as
          a whole, so a copy on every page would be duplicate markup. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRODUCT_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
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
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}

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
import { COMMERCE_ENABLED } from '@/lib/launch';
import { resolveHeroTheme } from '@/lib/heroTheme';
import { ROUTES } from '@/lib/routes';
import { SHOW_BUY } from '@/lib/site-config';
import { ORGANIZATION_JSON_LD, pageMetadata, productJsonLd } from '@/lib/seo';

/**
 * Homepage title, at 65 characters.
 *
 * The budget is Google's ~580px of rendered title width, which is roughly 60-65
 * characters; past it the tail is truncated in the result, and the tail is where
 * the brand name sits. "Native" is the word that was cut to make room — the
 * distinction it draws (true 1080p DISPLAY vs. the H723's 4K DECODING, see
 * lib/iriz.js) still appears in the description, the og:title and the hero h1,
 * none of which are width-constrained.
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
  path: ROUTES.home,
  // No width budget on an OG card, so the fuller claim goes here.
  ogTitle: 'BluNeuron IRIZ — Mini Projector for Home, Native 1080p, 500 ANSI Lumens',
});

/**
 * Product structured data, or `null` while there is no confirmed price.
 *
 * The whole decision lives in productJsonLd() (lib/seo.js) — including why a
 * price-free Product is not emitted at all rather than emitted without
 * `offers`, and why MARKETPLACE.priceInr in lib/site-config.js is the one
 * price it is allowed to read. Resolved once at module scope: it depends only
 * on constants, so there is nothing per-request about it.
 */
const PRODUCT_JSON_LD = productJsonLd();

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
      {/* Separate <script> blocks rather than one @graph array. Both spellings
          are valid; separate blocks mean a syntax error in one can't
          invalidate the other, and Google's Rich Results Test reports them
          independently — which also lets Product drop out on its own below
          without touching Organization.

          Product renders only when it is VALID (a confirmed price, so it can
          carry `offers`). Organization is emitted HERE and only here: it
          describes the site as a whole, so a copy on every page would be
          duplicate markup. */}
      {PRODUCT_JSON_LD && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PRODUCT_JSON_LD) }}
        />
      )}
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

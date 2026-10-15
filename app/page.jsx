import Header from '@/components/Header';
import TrustBadges from '@/components/TrustBadges';
import Highlights from '@/components/Highlights';
import ThrowRange from '@/components/ThrowRange';
import TechSpecs from '@/components/TechSpecs';
import ProductShowcase from '@/components/ProductShowcase';
import ComparisonTable from '@/components/ComparisonTable';
import WhyIriz from '@/components/WhyIriz';
import Hero from '@/components/Hero';
import Newsletter from '@/components/Newsletter';
import BuySection from '@/components/BuySection';
import Footer from '@/components/Footer';
import StickyBuyBar from '@/components/StickyBuyBar';
import { COMMERCE_ENABLED } from '@/lib/launch';
import { resolveHeroTheme } from '@/lib/heroTheme';
import { ROUTES } from '@/lib/routes';
import { SHOW_BUY } from '@/lib/site-config';
import { ORGANIZATION_JSON_LD, pageMetadata } from '@/lib/seo';

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
const TITLE = 'IRIZ Mini Projector for Home — True Brightness, Google TV | BluNeuron';

/*
 * THE STORY PAGE, not the buying page.
 *
 * This description and the one on /shop/iriz are deliberately aimed at
 * different searches: "mini projector for home" and what the thing IS here;
 * "buy IRIZ projector" and what it COSTS there. They used to be near
 * paraphrases of each other, which is two pages asking Google the same
 * question — it answers once, picks one, and the one it picks is as likely
 * to be the page without the buy button. No price in this description, on
 * purpose: a price is a transactional signal and belongs to the page that
 * can act on it.
 */
const DESCRIPTION =
  'What the IRIZ mini projector for home actually is: true 500 ANSI lumens measured honestly, '
  + 'native 1080p, and built-in Google TV. Designed and supported in India.';

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: ROUTES.home,
  // No width budget on an OG card, so the fuller claim goes here.
  ogTitle: 'BluNeuron IRIZ — The Mini Projector for Home, Measured Honestly',
});

/*
 * PRODUCT STRUCTURED DATA HAS MOVED to app/shop/iriz/page.jsx.
 *
 * It was emitted here because this page was the only one describing the
 * product. Now that there is a real product page, a Product block on the
 * homepage describes something this page is not primarily about, and its
 * `url` resolved to the origin — so a rich result would have led to the
 * marketing page rather than to the offer. The decision about WHETHER to
 * emit it at all (only with a confirmed price) is unchanged and still lives
 * in productJsonLd(), lib/seo.js.
 *
 * ORGANIZATION stays here, and only here: it describes the site as a whole,
 * so a copy on every page would be duplicate markup.
 */

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
      {/* Organization, and only Organization: it describes the site as a
          whole, so a copy on every page would be duplicate markup. Product
          lives on the product page now — see the note above. */}
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
        {/* The long-form read, last before the ask. It is deliberately the
            only prose section on the page and deliberately at the bottom:
            everything above states the product in fragments, and this is
            where the fragments are joined up for the reader who is still
            deciding — and for a crawler, which cannot read the photography
            the rest of the page argues with. See components/WhyIriz. */}
        <WhyIriz />
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

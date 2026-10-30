import { SITE_URL, absoluteUrl } from './site';
import {
  BOX_PRINTED_SPECS,
  BRAND,
  MEDIA,
  SOCIAL_LINKS,
  SPEC_SHEET_ONLY_SPECS,
  SPECS,
} from './iriz';
import { ROUTES } from './routes';

/**
 * Page metadata, and the structured data that goes with it.
 *
 * ---------------------------------------------------------------------------
 * WHY EVERY PAGE BUILDS ITS WHOLE METADATA OBJECT THROUGH `pageMetadata`
 * ---------------------------------------------------------------------------
 * Next merges metadata from the root layout down to the page SHALLOWLY, and
 * duplicate keys are REPLACED rather than deep-merged. Two consequences, both
 * of which have bitten this file's predecessors:
 *
 *   1. `alternates.canonical` must NOT be set in app/layout.jsx. A canonical
 *      set there is inherited verbatim by every page that doesn't set its own,
 *      so every route would declare itself a duplicate of whatever the layout
 *      named. Canonicals are therefore set per page, here, and nowhere else.
 *
 *   2. A page that sets `openGraph.title` replaces the ENTIRE openGraph object
 *      from the layout — silently dropping `images`, `siteName` and `type`. So
 *      this helper always emits a complete openGraph/twitter pair rather than a
 *      partial one meant to merge.
 *
 * Both rules are easy to break one page at a time and invisible when broken,
 * which is the whole reason this is a function and not a convention.
 */

/**
 * The social card, in ONE place.
 *
 * EXPORTED since 30 Oct 2026 because app/layout.jsx held a hand-written copy
 * of this object — same path, same alt, its own `width: 1600, height: 1600`
 * — and a second copy of a value is a value that will eventually disagree.
 * It did: the asset became 1200x630 and the layout's dimensions would have
 * gone on declaring a square to every crawler that read the homepage.
 */
export const OG_IMAGE = {
  // The dedicated OPAQUE social asset, not the on-page product shot. A card
  // is composited by the platform on a background we do not control, so it
  // needs a baked ground — see MEDIA.product.og in lib/iriz.js.
  url: MEDIA.product.og,
  // 1.91:1, the ratio `summary_large_image` below crops to. These two numbers
  // must match the file on disk; see MEDIA.product.og in lib/iriz.js for why
  // it is no longer the 1600x1600 square it was until 30 Oct 2026.
  width: 1200,
  height: 630,
  alt: 'The BluNeuron IRIZ mini projector for home, three-quarter view, lens forward',
};

export function pageMetadata({ title, description, path, ogTitle = title }) {
  return {
    title,
    description,
    // Root-relative. metadataBase (app/layout.jsx) resolves it to an absolute
    // URL; Google requires canonicals to be absolute, and Next does that
    // expansion for us.
    alternates: { canonical: path },
    openGraph: {
      title: ogTitle,
      description,
      url: path,
      siteName: BRAND.name,
      images: [OG_IMAGE],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

/**
 * Organization — emitted once, on the homepage only.
 *
 * `logo` must be a real, fetchable, absolute URL for Google to use it, so it
 * points at the square brand mark (889x889) rather than the wordmark: the
 * wordmark is 1715x327 and gets letterboxed badly in a knowledge panel.
 *
 * `sameAs` is the claim "these accounts are this company", so it ships ONLY
 * verified handles. SOCIAL_LINKS is empty while the official ones are pending
 * (see the TODO on it in lib/iriz.js), and the key is then omitted from the
 * object altogether rather than emitted as `[]` — `sameAs` is optional in
 * schema.org, so an absent key is correct markup, while an empty array is a
 * claim about nothing. Fill in SOCIAL_LINKS and the key returns on its own.
 */
const SAME_AS = Object.values(SOCIAL_LINKS).filter(Boolean);

export const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: BRAND.name,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: absoluteUrl('/brand/logo-mark.png'),
    width: 889,
    height: 889,
  },
  ...(SAME_AS.length > 0 ? { sameAs: SAME_AS } : {}),
};

/**
 * FAQPage, built from the same FAQS array the accordion renders.
 *
 * Derived rather than retyped on purpose: Google requires FAQPage markup to
 * match the question-and-answer text VISIBLE on the page, so a second hand-
 * maintained copy of this content would be a structured-data violation one
 * copy-edit after it was written.
 *
 * Lives on /support/faq, which is the only route that renders the FAQ. It
 * moved there with the questions themselves when /support became a hub of
 * tiles — markup describing content that is no longer on the page is a
 * mismatch Google reports, so the block follows the FAQ and does not stay
 * behind on the hub.
 */
export function faqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };
}

/**
 * Product — emitted ONLY when a confirmed price exists.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS RETURNS null MOST OF THE TIME
 * ---------------------------------------------------------------------------
 * Google rejects a Product without one of `offers`, `review` or
 * `aggregateRating`: "Either 'offers', 'review' or 'aggregateRating' should be
 * specified." Search Console flagged exactly that on the price-free Product
 * this project used to emit.
 *
 * ALL THREE ARE NOW DECLINED, DELIBERATELY, AND THE NOTICE IS ACCEPTED.
 *
 * `review` and `aggregateRating` are off the table permanently. No review or
 * rating data was ever supplied with this unit (lib/iriz.js), so either one
 * could only be fabricated — a structured-data violation, and a lie told
 * inside a search result where it does the most damage.
 *
 * `offers` was emitted until 30 Oct 2026 and has been REMOVED, because this
 * site does not sell anything. There is no checkout here; the purchase
 * happens on Flipkart, under Flipkart's own price, which is theirs to set and
 * does differ from the ₹13,999 this site quotes. The block
 * that was here named our own /shop/iriz as the offer URL — asserting a
 * purchase path we do not operate, at a price we do not control. Flipkart's
 * listing already carries its own Product/Offer markup with its live price,
 * which is the one a shopping surface should be reading.
 *
 * WHAT THAT COSTS, stated plainly rather than discovered later: with none of
 * the three present, Google will not grant this page a product rich result,
 * and Search Console will keep reporting the "Either offers, review or
 * aggregateRating should be specified" notice. That is a NOTICE on a Product
 * that is honest, not an ERROR on one that is false, and it suppresses
 * nothing else on the page. Organization and FAQPage are unaffected and
 * valid; the FAQ markup is where this site's rich results actually come from.
 *
 * The block is therefore emitted unconditionally — there is no longer a price
 * for it to be gated on. If direct selling is ever switched on here
 * (DIRECT_SALES_ENABLED in lib/site-config.js), an `offers` block becomes
 * truthful again and belongs back in this function, with `seller` naming the
 * entity and `url` naming the page that actually takes the order.
 */
export function productJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    /*
     * `@id` AND `url` NAME THE SAME PAGE, which they did not until
     * 30 Oct 2026: this was `${SITE_URL}/#product` — the homepage — while
     * `url` was /shop/iriz. Two identifiers for one product, on a page that
     * is neither of the things the first one pointed at. The product page is
     * the right answer for both.
     */
    '@id': `${absoluteUrl(ROUTES.product)}#product`,
    name: `${BRAND.fullName} Mini Projector for Home`,
    brand: { '@type': 'Brand', name: BRAND.name },
    // The carton's model designation, not the name — see BRAND.modelNumber in
    // lib/iriz.js for why the two are separate fields.
    model: BRAND.modelNumber,
    description:
      'A mini projector for home cinema: true 500 ANSI lumens, native 1080p resolution, '
      + 'Allwinner H723 chipset, and built-in Android 14 for apps over Wi-Fi.',
    // Absolute, fetchable URLs — Google rejects relative `image` values, and
    // every entry here is a file that exists in public/.
    image: [
      absoluteUrl(MEDIA.product.og),
      absoluteUrl(MEDIA.product.withBox),
    ],
    // The PRODUCT PAGE, not the origin. This block used to be emitted on the
    // homepage, where `url: SITE_URL` was the only honest answer; now that
    // /shop/iriz exists, a search result has somewhere to land that is
    // actually the product being described.
    url: absoluteUrl(ROUTES.product),
    // The headline figures, then the five facts read off the printed retail
    // box, then the spec-sheet rows the box does not print. All three are
    // derived — `SPECS`, `BOX_PRINTED_SPECS` and `SPEC_SHEET_ONLY_SPECS` in
    // lib/iriz.js, the last two of which read their values straight out of
    // FULL_SPEC_SHEET — so nothing a search result shows here is typed twice.
    // No label appears in more than one list; see the note on
    // BOX_PRINTED_SPECS before adding one.
    additionalProperty: [
      ...SPECS.map((spec) => ({
        '@type': 'PropertyValue',
        name: spec.label,
        value: `${spec.value} (${spec.unit})`,
      })),
      ...[...BOX_PRINTED_SPECS, ...SPEC_SHEET_ONLY_SPECS].map((spec) => ({
        '@type': 'PropertyValue',
        name: spec.name,
        value: spec.value,
      })),
    ],
    // No `offers`, no `aggregateRating`, no `review` — see the block comment
    // above for all three, and do not add one back without reading it.
  };
}

import { SITE_URL, absoluteUrl } from './site';
import { BRAND, MEDIA, SOCIAL_LINKS, SPECS } from './iriz';
import { ROUTES } from './routes';
import { MARKETPLACE, confirmedPriceInr } from './site-config';

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

const OG_IMAGE = {
  url: MEDIA.product.heroClean,
  width: 1600,
  height: 1600,
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
 * Of the three ways to satisfy it, two are off the table permanently. No
 * review or rating data was ever supplied with this unit (lib/iriz.js), so a
 * `review` or `aggregateRating` here could only be fabricated — a
 * structured-data violation, and a lie told inside a search result where it
 * does the most damage. That leaves `offers`, which needs a real price.
 *
 * So the schema is all-or-nothing, keyed on MARKETPLACE.priceInr in
 * lib/site-config.js — the site's one price, the same field the buy card and
 * /where-to-buy render:
 *
 *   price confirmed   full Product WITH offers — valid, earns a rich result
 *   price 'TBD'       null; the page emits no Product block at all
 *
 * Emitting nothing is strictly better than emitting an invalid Product: an
 * absent Product costs a rich result the page cannot legitimately earn yet,
 * while an invalid one is a standing error in Search Console and can suppress
 * other markup on the page. Organization and FAQPage are unaffected — they
 * have their own validity and are emitted regardless.
 *
 * Set MARKETPLACE.priceInr (lib/site-config.js) to a number and this comes
 * back on its own, with no other edit anywhere.
 */
export function productJsonLd() {
  const price = confirmedPriceInr();
  if (price === null) return null;

  return {
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
    additionalProperty: SPECS.map((spec) => ({
      '@type': 'PropertyValue',
      name: spec.label,
      value: `${spec.value} (${spec.unit})`,
    })),
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: MARKETPLACE.currency,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      // /where-to-buy, not a marketplace URL. Two reasons, one from each side
      // of this merge: that page offers BOTH listings, and naming one of them
      // here would make the other invisible to a rich result; and it is a page
      // we serve, so it cannot 404 the way AMAZON_PRODUCT_URL's
      // /dp/PLACEHOLDER would. The marketplace links themselves live on it,
      // read from MARKETPLACE in lib/site-config.js.
      url: absoluteUrl(ROUTES.whereToBuy),
    },
    // Still no `aggregateRating` or `review`, and there must never be one until
    // real review data exists. `offers` alone satisfies Google's requirement.
  };
}

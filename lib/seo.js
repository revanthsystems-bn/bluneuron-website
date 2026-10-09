import { SITE_URL, absoluteUrl } from './site';
import { BRAND, MEDIA, SOCIAL_LINKS } from './iriz';

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
 * Lives on /support, which is the only route that renders the FAQ.
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

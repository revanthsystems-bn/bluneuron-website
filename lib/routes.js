/**
 * Every route this site renders, in one registry.
 *
 * WHY a registry rather than hrefs written where they are used: this site now
 * has sixteen pages cross-linking each other from a four-column footer, a
 * support hub of tiles, a sitemap, and a 404 page. Written by hand in each of
 * those places, a renamed route leaves dead links in three of them and a
 * sitemap advertising a URL that 404s. Here, `ROUTES.warrantyClaim` is the
 * only spelling of that path in the codebase, so a rename is one edit and a
 * typo is a build-time undefined rather than a silent dead link.
 *
 * It is also where DRAFT STATE is declared (DRAFT_SOURCES, below). Three
 * separate things have to agree about whether a page is still a draft — the
 * visible banner, its `noindex`, and whether the sitemap advertises it — and
 * they all read that one table, so none of them can be forgotten and all
 * three clear themselves the moment lib/site-config.js gets real values.
 */

import { SHOW_PRIVACY } from './iriz';
import {
  COMPANY,
  GRIEVANCE_OFFICER,
  MANUALS,
  MARKETPLACE,
  RETURNS,
  SHIPPING,
  SUPPORT,
  WARRANTY,
  hasTBD,
} from './site-config';

export const ROUTES = {
  home: '/',

  /* --- Shop. The product is one SKU, so /shop is a landing page with one
     card on it rather than a grid — see app/shop. The product page is nested
     under it so the URL states the hierarchy a breadcrumb would. --- */
  shop: '/shop',
  product: '/shop/iriz',

  /* --- The basket and the account. NONE of these are indexable: they are
     per-visitor state, they say nothing a search result could use, and /cart
     in particular would be indexed in whatever state a crawler happened to
     find it. They are absent from SITEMAP_CANDIDATES below and send
     `noindex` through PRIVATE_ROUTES. --- */
  cart: '/cart',
  signIn: '/sign-in',
  account: '/account',
  accountAddresses: '/account/addresses',
  accountProducts: '/account/products',
  accountOrders: '/account/orders',

  specs: '/specs',
  compare: '/compare',
  whereToBuy: '/where-to-buy',
  about: '/about',

  support: '/support',
  warrantyRegistration: '/support/warranty-registration',
  warrantyClaim: '/support/warranty-claim',
  contact: '/support/contact',
  faq: '/support/faq',
  manuals: '/support/manuals',

  warranty: '/legal/warranty',
  returns: '/legal/returns',
  shipping: '/legal/shipping',
  terms: '/legal/terms',
  grievance: '/legal/grievance',
  privacy: '/legal/privacy',
};

/**
 * The masthead's primary navigation, in order.
 *
 * Four items, which is the whole budget: a masthead that lists everything
 * stops being navigation and becomes a sitemap. "Shop" is the commercial
 * entry point, "IRIZ" goes straight to the product for people who arrived
 * knowing what they want, "Compare" is the decision aid, and "Support" is
 * for the visitor who already owns one. /specs is deliberately NOT here —
 * it is reached from the product page, which is where someone reading
 * specifications actually is.
 *
 * `exact` marks a route that should only light up on an exact match, so
 * /shop does not stay highlighted while you are on /shop/iriz (which has its
 * own nav entry).
 */
export const NAV_ITEMS = [
  { label: 'Shop', href: ROUTES.shop, exact: true },
  { label: 'IRIZ', href: ROUTES.product },
  { label: 'Compare', href: ROUTES.compare },
  { label: 'Support', href: ROUTES.support },
];

/**
 * The account area's own navigation, and the one place its four sections are
 * named. app/account/layout.jsx renders it; nothing else lists them.
 */
export const ACCOUNT_NAV = [
  { label: 'Profile', href: ROUTES.account, exact: true },
  { label: 'Saved addresses', href: ROUTES.accountAddresses },
  { label: 'My products & warranty', href: ROUTES.accountProducts },
  { label: 'My orders', href: ROUTES.accountOrders },
];

/**
 * Routes that must never be indexed, whatever state they are in.
 *
 * This is a DIFFERENT reason from the draft machinery below. A draft is
 * unfinished and becomes indexable once its details land; these are
 * permanently private — a basket, a sign-in form and an account area are
 * per-visitor state that no search result can use, and /cart would otherwise
 * be indexed in whatever state a crawler found it. `routeRobots()` reads
 * both, so a page gets `noindex` if it is a draft OR private.
 */
const PRIVATE_ROUTES = new Set([
  ROUTES.cart,
  ROUTES.signIn,
  ROUTES.account,
  ROUTES.accountAddresses,
  ROUTES.accountProducts,
  ROUTES.accountOrders,
]);

/** The id of the homepage buy card. The masthead "Buy" CTA scrolls here. */
export const BUY_ANCHOR = 'buy';

/** `/#buy` — the one spelling of the homepage buy target. */
export const BUY_HREF = `${ROUTES.home}#${BUY_ANCHOR}`;

/**
 * The support hub's tiles (app/support).
 *
 * Ordered by what someone arriving with a problem most likely wants, not
 * alphabetically: register a new unit, claim on one that has failed, look
 * something up, then talk to a person.
 *
 * `icon` names a shape in components/SupportTiles — a drawn SVG, never an
 * emoji.
 */
export const SUPPORT_TILES = [
  {
    href: ROUTES.warrantyRegistration,
    icon: 'shield',
    title: 'Register your warranty',
    body: 'Bought an IRIZ? Register it with your order ID and serial number so a future claim is quick.',
  },
  {
    href: ROUTES.warrantyClaim,
    icon: 'wrench',
    title: 'Make a warranty claim',
    body: 'Something wrong with your unit? Tell us what is happening and we will pick it up from there.',
  },
  {
    href: ROUTES.faq,
    icon: 'question',
    title: 'FAQ & troubleshooting',
    body: 'Brightness, throw distance, Wi-Fi, input lag, blurry images — the answers to what gets asked most.',
  },
  {
    href: ROUTES.manuals,
    icon: 'book',
    title: 'Manuals & downloads',
    body: 'The quick-start guide, the full manual, and firmware notes.',
  },
  {
    href: ROUTES.contact,
    icon: 'mail',
    title: 'Contact support',
    // No "phone" and no "grievance officer" in this line: we have neither a
    // helpline nor a named officer yet (SUPPORT.phone, GRIEVANCE_OFFICER in
    // lib/site-config.js), and a tile that advertises a channel the page it
    // opens does not show is a worse dead end than one that never promised it.
    body: 'Email us, see our support hours, and send a message straight to the team.',
  },
  {
    href: ROUTES.warranty,
    icon: 'document',
    title: 'Warranty policy',
    body: 'What is covered, for how long, and what is not.',
  },
];

/**
 * The footer's four columns.
 *
 * Product / Support / Policies / Company, in that order: what you came for,
 * what you need after buying, the terms of it, and who we are. Every href is
 * a ROUTES key above, so a column cannot point at a page that does not exist.
 *
 * External links carry `external: true` and are rendered with
 * `target="_blank" rel="noopener noreferrer"` — the marketplaces are the only
 * ones, and only once their URLs are real (components/Footer filters them).
 */
export const FOOTER_COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'Shop', href: ROUTES.shop },
      { label: 'BluNeuron IRIZ', href: ROUTES.product },
      { label: 'Full specs', href: ROUTES.specs },
      { label: 'Compare', href: ROUTES.compare },
      { label: 'Where to buy', href: ROUTES.whereToBuy },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Support home', href: ROUTES.support },
      { label: 'Warranty registration', href: ROUTES.warrantyRegistration },
      { label: 'Warranty claim', href: ROUTES.warrantyClaim },
      { label: 'FAQ & troubleshooting', href: ROUTES.faq },
      { label: 'Manuals & downloads', href: ROUTES.manuals },
      { label: 'Contact us', href: ROUTES.contact },
    ],
  },
  {
    title: 'Policies',
    links: [
      { label: 'Warranty', href: ROUTES.warranty },
      { label: 'Returns & refunds', href: ROUTES.returns },
      { label: 'Shipping', href: ROUTES.shipping },
      { label: 'Terms of service', href: ROUTES.terms },
      { label: 'Grievance redressal', href: ROUTES.grievance },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About BluNeuron', href: ROUTES.about },
      { label: 'Contact', href: ROUTES.contact },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * DRAFT STATE
 * ------------------------------------------------------------------ */

/**
 * What each unfinished page is waiting on.
 *
 * A page is a DRAFT when any business detail it actually quotes is still a
 * [TBD] (see lib/site-config.js). Rather than each page judging that for
 * itself, every page that quotes anything lists its dependencies here once —
 * and `isDraftRoute()` below answers the question for the banner, the robots
 * tag and the sitemap alike.
 *
 * A route ABSENT from this table is never a draft. That is correct for pages
 * built entirely from finished product content — the homepage, /specs,
 * /compare, /support (tiles and labels only), /support/faq (real answers
 * sourced from the manufacturer's material), /about (whose company-identity
 * block hides itself while unknown) and /legal/privacy (a written document).
 *
 * The lists name individual fields where a page quotes only some of a block
 * (the warranty forms show the cover length, not the exclusions) and the
 * whole block where it quotes all of it.
 */
const DRAFT_SOURCES = {
  [ROUTES.whereToBuy]: [MARKETPLACE.priceInr, MARKETPLACE.amazonUrl, MARKETPLACE.flipkartUrl],
  [ROUTES.warrantyRegistration]: [WARRANTY.months, SUPPORT.email],
  [ROUTES.warrantyClaim]: [WARRANTY.months, WARRANTY.claimRoute, SUPPORT.email],
  // SUPPORT.email and SUPPORT.hours, NOT the whole SUPPORT block and NOT
  // GRIEVANCE_OFFICER. Both of those were in this list while every field in
  // them was unknown together; they are not any more, and listing a field a
  // page no longer QUOTES is how a finished page stays `noindex` forever.
  // This page hides its phone row while SUPPORT.phone is TBD and hides the
  // whole escalation panel while the officer is unnamed, so neither can put
  // a placeholder in front of a reader — which is the only thing draft state
  // is protecting against.
  [ROUTES.contact]: [SUPPORT.email, SUPPORT.hours],
  [ROUTES.manuals]: [MANUALS],
  [ROUTES.warranty]: [WARRANTY, SUPPORT.email],
  [ROUTES.returns]: [RETURNS, SUPPORT.email],
  [ROUTES.shipping]: [SHIPPING],
  [ROUTES.terms]: [COMPANY, SUPPORT.email],
  [ROUTES.grievance]: [GRIEVANCE_OFFICER, COMPANY, SUPPORT.email],
};

/** Does this page still show a placeholder? */
export function isDraftRoute(path) {
  return hasTBD(DRAFT_SOURCES[path] ?? null);
}

/** Is this page private by nature — a basket, a sign-in, the account area? */
export function isPrivateRoute(path) {
  return PRIVATE_ROUTES.has(path);
}

/**
 * `metadata.robots` for a route. A draft or a private page must not be
 * indexed; `undefined` leaves a finished public page on the site's normal
 * (indexable) default.
 *
 *   export const metadata = { title: '…', robots: routeRobots(ROUTES.terms) };
 *
 * The two cases differ in `follow`. A DRAFT gets `nofollow` as well, because
 * its links quote unconfirmed details and we would rather a crawler ignored
 * the lot. A PRIVATE page keeps `follow`: /cart and the account pages link
 * back to real public pages, and there is no reason to throw that away.
 */
export function routeRobots(path) {
  if (isDraftRoute(path)) return { index: false, follow: false };
  if (isPrivateRoute(path)) return { index: false, follow: true };
  return undefined;
}

/* ------------------------------------------------------------------ *
 * SITEMAP
 * ------------------------------------------------------------------ */

/**
 * Candidate sitemap entries, with the drafts filtered out below.
 *
 * A sitemap is a request to index. Listing a page that also sends `noindex`
 * asks a crawler to do two contradictory things, so a draft page is simply
 * absent until its placeholders are filled — at which point it reappears here
 * with no edit to this file.
 *
 * Priorities say what the site is for: the homepage, then the page that turns
 * interest into a purchase, then the spec detail, then support, then company.
 * `changeFrequency` is honest rather than optimistic — a spec sheet does not
 * change weekly.
 */
const SITEMAP_CANDIDATES = [
  { path: ROUTES.home, priority: 1, changeFrequency: 'weekly' },
  // The product page outranks /shop deliberately: with one SKU, /shop is a
  // doorway and /shop/iriz is the thing people search for.
  { path: ROUTES.product, priority: 0.95, changeFrequency: 'weekly' },
  { path: ROUTES.shop, priority: 0.9, changeFrequency: 'weekly' },
  { path: ROUTES.whereToBuy, priority: 0.9, changeFrequency: 'weekly' },
  { path: ROUTES.specs, priority: 0.8, changeFrequency: 'monthly' },
  { path: ROUTES.compare, priority: 0.7, changeFrequency: 'monthly' },
  { path: ROUTES.support, priority: 0.7, changeFrequency: 'monthly' },
  { path: ROUTES.faq, priority: 0.6, changeFrequency: 'monthly' },
  { path: ROUTES.warrantyRegistration, priority: 0.5, changeFrequency: 'yearly' },
  { path: ROUTES.warrantyClaim, priority: 0.5, changeFrequency: 'yearly' },
  { path: ROUTES.manuals, priority: 0.5, changeFrequency: 'monthly' },
  { path: ROUTES.contact, priority: 0.5, changeFrequency: 'yearly' },
  { path: ROUTES.about, priority: 0.5, changeFrequency: 'monthly' },
  { path: ROUTES.warranty, priority: 0.3, changeFrequency: 'yearly' },
  { path: ROUTES.returns, priority: 0.3, changeFrequency: 'yearly' },
  { path: ROUTES.shipping, priority: 0.3, changeFrequency: 'yearly' },
  { path: ROUTES.terms, priority: 0.2, changeFrequency: 'yearly' },
  { path: ROUTES.grievance, priority: 0.2, changeFrequency: 'yearly' },
  // Gated on the same flag the footer link is gated on (SHOW_PRIVACY in
  // lib/iriz.js). A sitemap entry for a page the site itself refuses to link
  // is a crawl invitation to an orphan.
  ...(SHOW_PRIVACY
    ? [{ path: ROUTES.privacy, priority: 0.2, changeFrequency: 'yearly' }]
    : []),
];

export const SITEMAP = SITEMAP_CANDIDATES.filter((entry) => !isDraftRoute(entry.path));

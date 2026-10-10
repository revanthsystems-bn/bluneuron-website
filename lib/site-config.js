/**
 * BluNeuron — business, legal and support details. ONE file.
 *
 * Everything on this site that is a BUSINESS fact rather than a product fact
 * lives here: the price, the marketplace listings, the registered entity, the
 * support channels, and the warranty / returns / shipping numbers the policy
 * pages quote. Nothing below is restated anywhere else — every page imports
 * from this file, so filling in a real value is a one-line edit here and the
 * whole site updates, including the DRAFT banners and the noindex tags.
 *
 * WHAT IS *NOT* HERE, and why:
 *
 *   lib/iriz.js   PRODUCT copy, specs, media, FAQs, troubleshooting. Those are
 *                 facts about the device (sourced from the manufacturer's own
 *                 material) and already have a single source of truth. The buy
 *                 card reads the name, tagline and photo from there rather
 *                 than keeping a second copy here that could drift from the
 *                 hero.
 *
 *   lib/iriz.js   PRICING (mrp / offerPrice) and WARRANTY. Those belong to the
 *                 switched-off in-site cart and to the spec sheet's
 *                 placeholder note (see COMMERCE_ENABLED in lib/launch.js),
 *                 and nothing added for marketplace selling reads them. The
 *                 price this site now quotes is MARKETPLACE.priceInr below.
 *                 When the in-site checkout is finally deleted, that PRICING
 *                 block goes with it.
 *
 * HOW "TBD" WORKS. Every unknown value is the literal string TBD ("[TBD]") —
 * not an empty string, and never a plausible-looking guess. That does three
 * things at once:
 *
 *   1. It renders. A policy page shows "[TBD]" where the number will go, so a
 *      reader is never misled and a reviewer sees exactly what is missing.
 *   2. It is detectable. hasTBD() walks any content and reports whether a
 *      placeholder is still in it. That is what drives the visible DRAFT
 *      banner (components/DraftBanner), the noindex on those pages, and
 *      whether the sitemap lists them — all three off one declaration in
 *      lib/routes.js, and none of them decided page by page.
 *   3. It cannot ship by accident. Grep a build for "[TBD]" and every
 *      unfinished detail lists itself.
 *
 * Surfaces where a placeholder would read WORSE than nothing hide instead —
 * the footer's legal identity line (name / GSTIN / address) renders only once
 * all three are real, because a footer reading "GSTIN: [TBD]" looks like a
 * broken site rather than an unfinished one.
 */

/** The placeholder. See the header comment. */
export const TBD = '[TBD]';

/** Is this one value still a placeholder (or simply absent)? */
export function isTBD(value) {
  if (value === null || value === undefined || value === '') return true;
  return typeof value === 'string' && value.includes(TBD);
}

/** Are ALL of these real? The guard the footer identity line uses. */
export function allKnown(...values) {
  return values.every((value) => !isTBD(value));
}

/**
 * Does this content — a string, a list, or a nested config object — still
 * contain a placeholder anywhere inside it?
 *
 * Pages pass their own `sections` array, so the DRAFT banner and the noindex
 * are both derived from the exact copy being rendered rather than from a flag
 * someone has to remember to flip. React elements are skipped (`$$typeof`):
 * their props can be circular, and a page that needs markup inside a section
 * is expected to pass the strings it cares about explicitly.
 */
export function hasTBD(value) {
  if (typeof value === 'string') return value.includes(TBD);
  if (Array.isArray(value)) return value.some(hasTBD);
  if (value && typeof value === 'object') {
    if (value.$$typeof) return false;
    return Object.values(value).some(hasTBD);
  }
  return false;
}

/*
 * There is no `draftRobots(content)` helper here on purpose. Which pages are
 * drafts is declared ONCE, in lib/routes.js (DRAFT_SOURCES), and read from
 * there by all three things that have to agree about it: the visible banner,
 * the `noindex` meta tag, and whether the page appears in the sitemap. A
 * second entry point that took arbitrary content would let those three
 * disagree, which is the whole failure this is built to prevent.
 */

/* ------------------------------------------------------------------ *
 * THE SWITCH
 * ------------------------------------------------------------------ */

/**
 * Is the product actually buyable on the marketplaces yet?
 *
 * false → the homepage keeps its "Notify Me" signup (components/Newsletter)
 *         and every CTA on the site opens the launch-list modal, exactly as
 *         before. Nothing offers a path to purchase.
 * true  → the homepage's closing section becomes the marketplace buy card
 *         (components/BuySection), and the masthead / mobile-menu / sticky-bar
 *         CTA becomes "Buy" and scrolls to it.
 *
 * Flip this one constant on launch day. A plain constant rather than an env
 * var, for the same reason COMMERCE_ENABLED is one (lib/launch.js): going on
 * sale is a deploy, and the state should be visible in the diff.
 *
 * Read by: app/page.jsx, components/BuySection, components/Header,
 * components/StickyBuyBar, app/where-to-buy.
 */
export const SHOW_BUY = false;

/* ------------------------------------------------------------------ *
 * THE LISTING — price and marketplaces
 * ------------------------------------------------------------------ */

/**
 * `priceInr` is a NUMBER of rupees, GST included — the one price this site
 * quotes, formatted once by formatInr() below. It is the tax-inclusive figure
 * the marketplaces list, which is why the only note beside it is "Inclusive
 * of all taxes" and there is no separate tax line to get wrong.
 *
 * Marketplace prices move on their own (festival pricing, coupons, lightning
 * deals), so this figure can be stale by a few hundred rupees. That is why
 * the buy card says the order happens on the marketplace and the price shown
 * there is the price that applies — this is a brand site, not a storefront.
 *
 * `amazonUrl` / `flipkartUrl` are full product-listing URLs. While either is
 * TBD, components/MarketplaceButtons renders that one button INERT rather
 * than linking somewhere that 404s.
 *
 * THIS IS ALSO THE ONE PRICE THE PUBLIC STRUCTURED DATA MAY STATE. There used
 * to be a second MARKETPLACE in lib/commerce.js holding its own `priceInr`
 * purely so the schema.org Offer had something to read. Two fields meaning
 * "the price a live listing actually charges" is one field too many: fill in
 * one and the site and the search result disagree about the price, which is
 * exactly the failure a single source of truth exists to prevent. That copy is
 * gone and productJsonLd() (lib/seo.js) reads this one through
 * confirmedPriceInr() below, so filling in `priceInr` here is the only edit
 * that both prices the site and earns the Product rich result.
 */
export const MARKETPLACE = {
  priceInr: TBD,
  priceNote: 'Inclusive of all taxes',
  amazonUrl: TBD,
  flipkartUrl: TBD,
  /** Shown under the buttons. The single most important thing to say there. */
  fulfilmentNote: 'Delivery, returns and refunds handled by Amazon / Flipkart.',
  /** ISO 4217, for the schema.org Offer. formatInr() reads it too. */
  currency: 'INR',
};

/**
 * The two marketplaces, in render order.
 *
 * `name` is both the button label's subject and the `marketplace` value sent
 * to analytics, so the dashboard reads "Amazon" / "Flipkart" and there is one
 * vocabulary rather than a display name and a separate slug to keep in sync.
 */
export const MARKETPLACES = [
  { id: 'amazon', name: 'Amazon', url: MARKETPLACE.amazonUrl },
  { id: 'flipkart', name: 'Flipkart', url: MARKETPLACE.flipkartUrl },
];

/**
 * ₹13,999 — no decimals, Indian digit grouping. Returns the TBD marker
 * unchanged while the price is unset, so a price slot renders "[TBD]" and is
 * caught by hasTBD() like any other placeholder.
 */
export function formatInr(amount) {
  if (isTBD(amount)) return TBD;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: MARKETPLACE.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * The price as a positive NUMBER, or `null` when there isn't a real one yet.
 *
 * The strict counterpart to formatInr(): that one renders a placeholder for a
 * human to read, this one refuses to hand a placeholder to a machine. Every
 * caller treats `null` as "state no price at all", and productJsonLd()
 * (lib/seo.js) uses it to decide whether a Product block is emitted — so a
 * loose check here is how "[TBD]" ends up quoted as a price in a search
 * result.
 *
 * Rejected: '', null, undefined, any casing of the TBD marker, zero,
 * negatives, and anything non-numeric. Accepted: a number, or a numeric string
 * (tolerating separators and a rupee sign, so a hand-pasted "13,999" works).
 */
export function confirmedPriceInr() {
  const raw = MARKETPLACE.priceInr;
  if (isTBD(raw)) return null;
  if (typeof raw === 'string') {
    const parsed = Number(raw.trim().replace(/[,\s₹]/g, ''));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : null;
}

/* ------------------------------------------------------------------ *
 * THE ENTITY
 * ------------------------------------------------------------------ */

/**
 * The seller of record. `legalName` is the registered company name (which is
 * not the brand name — the footer prints both), `registeredAddress` is the
 * address on the GST registration, and `gstin` is the 15-character GSTIN.
 *
 * India's Consumer Protection (E-Commerce) Rules require a seller's legal
 * identity and address to be discoverable, which is why these three sit in
 * the footer of every page rather than only on /about.
 */
export const COMPANY = {
  brandName: 'BluNeuron',
  legalName: TBD,
  registeredAddress: TBD,
  gstin: TBD,
};

/* ------------------------------------------------------------------ *
 * SUPPORT
 * ------------------------------------------------------------------ */

export const SUPPORT = {
  email: TBD,
  phone: TBD,
  /** Human-readable, timezone named — e.g. "Mon–Sat, 10:00–18:00 IST". */
  hours: TBD,
};

/**
 * The grievance officer: named, and reachable. Required of an e-commerce
 * entity by the Consumer Protection (E-Commerce) Rules 2020, and it has to be
 * a PERSON rather than a shared "support@" alias.
 */
export const GRIEVANCE_OFFICER = {
  name: TBD,
  email: TBD,
};

/* ------------------------------------------------------------------ *
 * THE PROMISES
 * ------------------------------------------------------------------ */

/**
 * `months` is a number once known. `coverage` and `exclusions` are LISTS
 * rather than prose, because that is how a warranty is actually read — "is my
 * problem on one of these lists?" — and because a list of one placeholder
 * renders honestly as a single "[TBD]" bullet.
 */
export const WARRANTY = {
  months: TBD,
  coverage: [TBD],
  exclusions: [TBD],
  /** Where a claim is handled: by us, or through the marketplace's process. */
  claimRoute: TBD,
};

/**
 * Returns run through the marketplace, not through this site — there is no
 * checkout here to return anything to. These numbers exist so the policy page
 * can state where our terms go beyond the marketplace's, and so a buyer can
 * compare the two.
 */
export const RETURNS = {
  windowDays: TBD,
  refundDays: TBD,
};

export const SHIPPING = {
  notes: TBD,
};

/* ------------------------------------------------------------------ *
 * DOCUMENTS
 * ------------------------------------------------------------------ */

/**
 * Downloadable documents (/support/manuals).
 *
 * Titles and descriptions are real — these are the three documents that ship
 * with the product and the ones people come looking for. `file` and `size`
 * are TBD, and while `file` is TBD the card renders as a placeholder with no
 * link rather than a download button that fails. One list, so adding the real
 * PDF is a path and a file size here.
 */
export const MANUALS = [
  {
    title: 'Quick-start guide',
    description: 'Unbox, place, focus, and get through Google TV setup in a few minutes.',
    file: TBD,
    size: TBD,
  },
  {
    title: 'Full user manual',
    description: 'Every menu, every port, every setting — including keystone, focus and audio output.',
    file: TBD,
    size: TBD,
  },
  {
    title: 'Warranty card',
    description: 'The printed warranty terms included in the box, as a PDF.',
    file: TBD,
    size: TBD,
  },
];

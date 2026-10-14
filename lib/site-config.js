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

/**
 * The announcement bar's line (components/AnnouncementBar), chosen by the
 * same switch.
 *
 * It used to be a sentence hardcoded in the component restating the spec
 * sheet — "true 500 ANSI Lumens, native 1080P, built-in Google TV" — which
 * is what the hero, the highlights and the spec table already say three
 * times further down the page. A bar across the top of every page is worth
 * more than a fourth repetition: it should say the one thing that is TRUE
 * TODAY AND NOT YET OBVIOUS, and that thing changes on launch day.
 *
 * Both strings live here rather than in the component so that flipping
 * SHOW_BUY changes the announcement too, in the same edit, and neither
 * state can be left saying the wrong thing.
 */
export const ANNOUNCEMENT = {
  prelaunch: 'IRIZ is almost here — join the launch list and we will tell you the day it lands.',
  live: 'IRIZ is now available on Amazon & Flipkart.',
};

/** The announcement line for the current state. One caller, one decision. */
export function announcementText() {
  return SHOW_BUY ? ANNOUNCEMENT.live : ANNOUNCEMENT.prelaunch;
}

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
  priceInr: 13999,
  priceNote: 'Inclusive of all taxes',
  amazonUrl: TBD,
  flipkartUrl: TBD,
  /** Shown under the buttons. The single most important thing to say there. */
  fulfilmentNote: 'Delivery, returns and refunds handled by Amazon / Flipkart.',
  /** ISO 4217, for the schema.org Offer. formatInr() reads it too. */
  currency: 'INR',
};

/**
 * TODO(launch): paste the two real product-listing URLs into
 * `MARKETPLACE.amazonUrl` / `flipkartUrl` above, then flip SHOW_BUY to true.
 *
 * They are the SHAPE below — a deep link to the IRIZ listing itself:
 *
 *     amazonUrl:   'https://www.amazon.in/dp/<ASIN>'
 *     flipkartUrl: 'https://www.flipkart.com/<slug>/p/<itm-id>'
 *
 * The fields are deliberately left at the TBD marker rather than holding
 * `https://www.amazon.in/` as a stand-in, and the difference matters: a bare
 * marketplace homepage is a VALID URL, so every guard in this codebase would
 * read it as a confirmed listing and go live on it. The two buttons would
 * link out (components/MarketplaceButtons), /where-to-buy would drop its
 * draft banner, lose its `noindex` and enter the sitemap — and a buyer who
 * clicked would land on Amazon's front page, which is the exact outcome the
 * inert-button state was built to prevent. TBD keeps all of that switched off
 * and visible, and these two lines are the paste target.
 */

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
 * THE POLICIES
 * ------------------------------------------------------------------ */

/**
 * The date every policy page prints as "Last updated".
 *
 * ONE constant because all five documents — terms, warranty, returns,
 * shipping, privacy — were written and published together, from the same
 * source material, on the same day. Five copies of one date is five chances
 * for four of them to be right.
 *
 * SPLIT IT when that stops being true. The moment a single policy is revised
 * on its own, this constant is a lie about the other four: give that page its
 * own `lastUpdated` and leave this one holding the rest. A "last updated"
 * date that moves when the text did not is worse than no date at all — it is
 * the one line on the page a reader uses to decide whether to re-read it.
 *
 * Written out in full rather than as a Date: these are read, not computed,
 * and a `new Date()` here would silently re-date every policy on every build.
 */
export const POLICY_LAST_UPDATED = '14 October 2026';

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
  legalName: 'Bluneuron Technologies',
  registeredAddress:
    '319, Sri Ram Nagar 3rd Street, V.K. Village, Peelamedu, Coimbatore, Tamil Nadu 641004, India',
  /**
   * NOT DISPLAYED, and empty rather than TBD on purpose.
   *
   * The two markers mean different things here. TBD is "this will be filled
   * in, and until it is, say so out loud" — it renders as [TBD], raises the
   * draft banner and holds the page out of the sitemap. An empty string is
   * "there is nothing to show here", and every consumer treats it as a value
   * that is simply absent: `isTBD('')` is true, so the footer's identity line
   * and the /about disclosure both skip the GSTIN and print the rest, while
   * `hasTBD('')` is FALSE, so an empty one cannot mark a finished page as a
   * draft. Put a real GSTIN here and both surfaces show it with no other edit.
   */
  gstin: '',
  /**
   * Named in the governing-law clause of every policy page, so the four do
   * not drift apart. "Courts at Coimbatore" is what the source warranty
   * document specifies, and the registered address above is in Coimbatore —
   * a jurisdiction clause naming a city the entity has no connection to is
   * the kind of clause a court reads down.
   */
  jurisdiction: 'Coimbatore, Tamil Nadu, India',
};

/* ------------------------------------------------------------------ *
 * SUPPORT
 * ------------------------------------------------------------------ */

export const SUPPORT = {
  email: 'support@bluneuron.com',
  /**
   * Sales and partnership enquiries. A separate inbox from `email` because
   * the two have different readers and different urgency — a broken unit
   * must not queue behind a distributor enquiry.
   */
  salesEmail: 'sales@bluneuron.com',
  /**
   * THERE IS NO HELPLINE YET, and nothing on the site may imply one.
   *
   * TBD rather than a plausible-looking "+91-XXXXXXXXXX" (which is what the
   * source warranty document carries): a masked number printed on a live
   * support page reads as a real channel that is merely hard to dial, and
   * someone with a dead unit will waste an evening trying. Every surface
   * that would show a phone number now HIDES the whole row while this is
   * TBD — /support/contact's channel tiles, the grievance policy's contact
   * block, the support hub's tile copy — rather than printing a placeholder.
   *
   * TODO(launch): put the real helpline here and the row comes back on its
   * own, on every one of those surfaces, with no other edit.
   */
  phone: TBD,
  /** Human-readable, timezone named — e.g. "Mon–Sat, 10:00–18:00 IST". */
  hours: 'Monday–Saturday, 10:00 AM – 6:00 PM IST',
};

/**
 * The grievance officer: named, and reachable. Required of an e-commerce
 * entity by the Consumer Protection (E-Commerce) Rules 2020, and it has to be
 * a PERSON rather than a shared "support@" alias.
 */
/**
 * TODO(launch): appoint the officer and fill in both fields.
 *
 * While either is TBD, /legal/grievance stays a DRAFT — banner, `noindex`,
 * and out of the sitemap — because a grievance policy that cannot name its
 * officer is the one policy where the missing detail IS the policy. The
 * footer's Policies column drops the link for the same reason
 * (FOOTER_COLUMNS in lib/routes.js), and /support/contact hides its
 * escalation panel rather than printing "[TBD]" where a name goes.
 *
 * Fill these two in and all four surfaces come back on their own.
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
  months: 12,
  /** The tenure as a reader says it, for prose that would rather not say "12 months". */
  label: '1 year',
  coverage: [
    'Defects in materials and workmanship under normal use, for the whole cover period.',
    'Repair or replacement of the defective unit or part, once the defect is verified by authorised BluNeuron personnel — which of the two is at BluNeuron’s discretion.',
    'Genuine BluNeuron units bought in India from BluNeuron or an authorised seller listed on /where-to-buy.',
    'The original purchaser, holding a valid tax invoice. The cover is not transferable.',
  ],
  exclusions: [
    'Physical damage, scratches, liquid ingress, or modification of the body, software or internal circuitry.',
    'Damage from improper installation, neglect, misuse, mishandling, electrical surges, abnormal voltage, lightning, or acts of God.',
    'Repairs or service attempted by anyone other than an authorised technician.',
    'Use of non-standard, substandard or incompatible accessories — adapters and power cables that do not meet the specified electrical ratings in particular.',
    'Units whose serial number has been altered, defaced or removed.',
    'Standard wear and tear, and consumables such as remote controls, batteries, power cords and connecting cables, unless they were dead on arrival.',
  ],
  /** Where a claim is handled: by us, or through the marketplace's process. */
  claimRoute:
    'by BluNeuron directly — this is a return-to-factory warranty, carried in to an authorised service centre or our central warehouse',
  /**
   * Who pays which leg of a service shipment. Two separate answers, so the
   * page cannot state one and imply the other.
   */
  inboundShipping:
    'The customer sends or carries the unit to the authorised service centre or central warehouse, at their own cost and risk.',
  returnShipping:
    'BluNeuron pays to send the repaired or replaced unit back, and carries the transit risk on that leg.',
};

/**
 * The replacement windows, which are the real shape of this policy.
 *
 * The fields here used to be `windowDays` / `refundDays` — a change-of-mind
 * return window and a refund turnaround, neither of which exists. There is no
 * checkout on this domain to refund from, and the source policy is a REPLACE
 * policy, not a refund one. So the two numbers that actually govern a buyer's
 * rights are the two below, and they are different units on purpose: a unit
 * that does not work is a week's grace, while damage in transit has to be
 * reported before the question "was it like that when it arrived?" stops
 * having an answer.
 *
 * These are OUR windows. A marketplace order also carries Amazon's or
 * Flipkart's own return window, which is usually wider and is the one most
 * buyers will use — every page that quotes these says so.
 */
export const RETURNS = {
  /** Defective or non-functioning on arrival: report within this many DAYS. */
  replacementDays: 7,
  /** Physical/transit damage or wrong item: report within this many HOURS. */
  damageReportHours: 24,
};

export const SHIPPING = {
  /**
   * What we ship, which is only ever a service return or a spare part —
   * Amazon and Flipkart ship every order.
   */
  notes:
    'BluNeuron pays to return a repaired or replaced unit to you and carries the transit risk on that leg. Sending a unit in for service is at your own cost and risk.',
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

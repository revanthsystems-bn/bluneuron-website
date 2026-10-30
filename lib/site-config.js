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
 * THE BUILD CHANNEL
 * ------------------------------------------------------------------ */

/**
 * Is this build a PREVIEW, or the one that serves customers?
 *
 * WHY THIS EXISTS, when every other switch in this file is a plain constant.
 * Those answer "what is true about the business" and are the same wherever
 * the build runs. This one answers "who is going to read this page", and the
 * answer genuinely differs between a `wrangler versions upload` preview and
 * the live Worker built from the same commit — so it cannot be a constant in
 * the source without being wrong on one of them.
 *
 * NOTHING READS IT TODAY, and that is a change worth stating rather than
 * leaving to be discovered. The one thing it gated was a value we had but
 * could not publish: two unconfirmed support phone numbers, shown to a
 * reviewer as "+91 XXXXX XXXXX" on a preview and absent on production. There
 * is one real, confirmed number now (SUPPORT_PHONES below), so both builds
 * render the same row and the gate has nothing left to decide.
 *
 * KEPT, not deleted, because the next value in that position will want it:
 * something we hold and cannot yet publish is a recurring shape here, and
 * this is the reviewed way to handle it. `visibleSupportPhones()` still
 * filters a masked number out of EVERY build, so the safety does not depend
 * on this flag any more — which is the better arrangement.
 *
 * It must NOT grow into a general "am I in production" flag. Anything else
 * that differs between a preview and the live site is a bug in one of them.
 *
 * DEFAULTS TO PRODUCTION, and that direction is deliberate. A build with the
 * variable unset — a forgotten export, a fresh CI runner, a host that injects
 * nothing — is treated as live and hides the placeholders. The failure mode
 * of the opposite default is a fake phone number on www.bluneuron.com.
 *
 * `NEXT_PUBLIC_` because the components that read it are client components,
 * and inlined at build time like every other NEXT_PUBLIC_ value — which is
 * also why it cannot be changed by a dashboard variable after the fact.
 *
 *     NEXT_PUBLIC_BUILD_CHANNEL=preview npx opennextjs-cloudflare build
 */
export const BUILD_CHANNEL =
  process.env.NEXT_PUBLIC_BUILD_CHANNEL === 'preview' ? 'preview' : 'production';

/** Shorthand, so no caller has to remember the spelling of the value. */
export const IS_PREVIEW_BUILD = BUILD_CHANNEL === 'preview';

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
 * IT IS ON, and now for the plain reason: the product IS listed. The Flipkart
 * listing in MARKETPLACE below is real, so every Buy button on the site goes
 * to a page that sells the unit. This used to be on while the URLs were
 * PLACEHOLDER stand-ins, which was safe only because
 * scripts/check-production.js refused a production deploy while any remained;
 * that guard is still there and still runs, but nothing depends on it now.
 *
 * Amazon is a separate question and a separate switch — see AMAZON below. Its
 * button is absent rather than pending, so "on sale" and "on sale everywhere"
 * are not the same claim.
 *
 * Read by: app/page.jsx, components/BuySection, components/Header,
 * components/StickyBuyBar, app/where-to-buy.
 */
export const SHOW_BUY = true;

/**
 * ===================================================================
 * SURFACE SWITCHES — what the site OFFERS, independent of what it can do.
 * ===================================================================
 *
 * Each of these hides a whole affordance without deleting the code behind
 * it. That distinction is the point: the cart works, the account system
 * works, the launch-list modal works, and none of the three is something a
 * visitor should meet on sale day — buying happens on the marketplace,
 * nothing on this site needs a sign-in, and a "tell me when it launches"
 * modal is a worse offer than the Buy button it would cover.
 *
 * They are NOT the same thing as COMMERCE_ENABLED (lib/launch.js), which
 * answers "is the product on sale at all". These answer "does this site
 * carry its own basket / its own accounts / an uninvited modal". On sale day
 * the product IS on sale and this site has none of the three.
 *
 * Flip any one to `true` and the surface returns exactly as it was.
 */

/**
 * The in-site basket: the masthead cart icon and its badge, the slide-over
 * drawer, and every "Add to cart" control.
 *
 * While false:
 *   - components/cart/CartButton renders nothing
 *   - components/cart/CartDrawer renders nothing
 *   - components/shop/AddToCart renders nothing, and the quantity stepper
 *     beside it goes with it — a quantity with nothing to add it to is a
 *     control that cannot be completed
 *   - /cart redirects to the product page, which is where someone who typed
 *     the URL or kept an old bookmark actually wants to go. A 404 would be
 *     truthful and useless.
 *
 * CartProvider stays mounted and the cart state still works, so nothing has
 * to be rebuilt to turn this back on — see app/layout.jsx.
 */
export const CART_ENABLED = false;

/**
 * Customer accounts: the masthead account icon, /sign-in, and the /account
 * area.
 *
 * While false:
 *   - components/account/AccountButton renders nothing
 *   - /sign-in and every /account route render the "coming soon" panel
 *   - warranty registration and warranty claims KEEP WORKING, as guest
 *     forms, exactly as they do today. They never required an account and
 *     must not start to — the QR code printed on the retail carton points at
 *     the registration form, and a stranger with a box in their hands has no
 *     login.
 *
 * That last point is why this flag is narrow: it hides the ACCOUNT ENTRY
 * POINTS, not the Supabase client, not the warranty routes, and not the
 * forms. The form both warranty pages render is components/SupportForm.jsx.
 * (This used to point at components/warranty/, a parallel copy of the same
 * two forms that nothing imported but itself; it has been deleted, so there
 * is now one form and one place to change it.)
 */
export const ACCOUNTS_ENABLED = false;

/**
 * The unprompted "Launching soon / Be the first to see IRIZ" modal
 * (components/NewsletterPopup, opened on a timer by
 * components/notify/NotifyProvider).
 *
 * OFF, because the product is ON SALE. That modal is a pre-launch artefact:
 * it offers to tell you when IRIZ lands, which is news that has already
 * happened, and it interrupts the exact moment someone is deciding to buy.
 *
 * This gates ONLY the automatic open. `openNotify` still works, the modal
 * still renders, and the inline newsletter form in components/Newsletter is
 * untouched — so flipping this back to `true` restores the invitation
 * exactly as it was, with no other edit.
 */
export const NOTIFY_AUTO_OPEN = false;

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
 *
 * THE LIVE LINE NAMES THE SELLERS THAT EXIST. It used to be the literal
 * string "IRIZ is now available on Amazon & Flipkart." — which, across every
 * page of the site, advertised a listing that does not exist and sent anyone
 * who believed it to search Amazon and find nothing. It is built from
 * SELLERS() now, so the bar and the buttons can never disagree about where
 * the product is sold.
 */
export const ANNOUNCEMENT = {
  prelaunch: 'IRIZ is almost here — join the launch list and we will tell you the day it lands.',
  /** A function, because the seller list is the thing that changes. */
  live: () => `IRIZ is now available on ${sellersAnd()}.`,
};

/** The announcement line for the current state. One caller, one decision. */
export function announcementText() {
  return SHOW_BUY ? ANNOUNCEMENT.live() : ANNOUNCEMENT.prelaunch;
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
/**
 * ===================================================================
 * THE SELLERS — which marketplaces exist, and therefore what the site says.
 * ===================================================================
 */

/**
 * THE PLACEHOLDER MARKER. Distinct from TBD, and the difference is the whole
 * point of having two.
 *
 * TBD means "we have no value, so render nothing and hold the page out of
 * the index". PLACEHOLDER means "this is a stand-in that is deliberately
 * WIRED UP so the flow can be clicked through in a preview" — the buttons
 * link, the cart hands off, the analytics fire. That is useful for review
 * and catastrophic in production: a real customer would be sent to a
 * marketplace's front page instead of the listing.
 *
 * So the safety is not a convention, it is `scripts/check-production.js`,
 * which refuses a production deploy while any value here still carries this
 * marker. Grep for it and every stand-in lists itself.
 *
 * NOTHING CARRIES IT TODAY, and that is the point of keeping it. The Flipkart
 * listing below is real, and Amazon is declared ABSENT rather than stood in
 * for. The marker and its helper stay because the guard that reads them is
 * what would let a future stand-in be reviewed safely.
 */
export const PLACEHOLDER = 'PLACEHOLDER';

/** Is this value a wired-up stand-in that must never reach production? */
export function isPlaceholder(value) {
  return typeof value === 'string' && value.includes(PLACEHOLDER);
}

/**
 * AMAZON: OFF. One block, three fields, and every Amazon surface on this site
 * follows them.
 *
 * ===================================================================
 * WHERE TO CHANGE THE ASIN AND THE URL — IT IS THIS BLOCK, NOTHING ELSE.
 * ===================================================================
 * The two fields immediately below, in THIS file (lib/site-config.js):
 *
 *     asin: 'B0HPG9T21G'                        <-- line below this comment
 *     url:  'https://www.amazon.in/dp/B0HPG9T21G'
 *
 * Change BOTH, and change nothing else anywhere. The ASIN is the
 * 10-character code in the listing URL after `/dp/`, so the two always carry
 * the same string and a mismatch between them is a bug. There is no second
 * copy of either value in the codebase: `MARKETPLACE.amazonUrl`,
 * `AMAZON_ASIN`, `amazonCartUrl()`, `MARKETPLACES`, `SELLERS` and every
 * `sellers*()` helper all read this block, so one edit here moves the buy
 * buttons, the buy sheet, /where-to-buy, the comparison table's "Available
 * on" strip, the announcement bar and ~45 sentences across the legal pages.
 *
 * KEEP THE URL CLEAN: no `?tag=`, no `ref=`, no campaign parameter. See the
 * note on the field itself.
 *
 * ===================================================================
 * `live` IS FALSE: THIS SITE LAUNCHES ON FLIPKART ONLY.
 * ===================================================================
 * The ASIN and URL below are kept deliberately — they are not a draft and
 * not a guess, and they are what Amazon gets switched back on with. But the
 * listing is not public to a logged-out visitor, so the site says nothing
 * about Amazon at all: no button, no "coming soon" row, no sentence naming
 * a seller a customer cannot reach. That is the whole reason this field
 * exists separately from the two above it.
 *
 * TO SWITCH AMAZON ON, when the listing is genuinely public:
 *
 *   1. Open the URL below IN A PRIVATE WINDOW. Not the Seller Central
 *      preview — that is authenticated and will show the page to you while
 *      showing "Page Not Found" to everybody else.
 *   2. Only once it loads for a logged-out visitor, set `live: true` here.
 *
 * Nothing else anywhere needs editing: the buy buttons, the buy sheet,
 * /where-to-buy, the comparison table's "Available on" strip, the
 * announcement bar and ~45 sentences across the legal pages all follow this
 * one field.
 *
 * WHY `live` IS A SEPARATE FIELD AND NOT INFERRED FROM THE OTHER TWO. It
 * used to be inferred: a non-empty asin + url meant "on". That conflated two
 * different facts — "we have a listing URL" and "a customer can reach it" —
 * and the window between them is exactly the state this block is in now.
 * Inferring would make correcting the ASIN and publishing the listing the
 * same irreversible act; with `live` they are separate, so the URL can be
 * fixed and reviewed on a preview before anything goes out.
 *
 * ALL THREE, not some. A URL with no ASIN loses the quantity hand-off to
 * Amazon's cart endpoint; an ASIN with no URL leaves nothing to fall back to;
 * either one without `live` is a listing nobody can open. So AMAZON_LISTED
 * below is derived from all three, and a half-filled block is treated as
 * still unlisted rather than shipping a broken link.
 */
export const AMAZON = {
  /** The 10-character ASIN from https://www.amazon.in/dp/<ASIN>. */
  asin: 'B0HPG9T21G',
  /**
   * The full product-listing URL. Clean — no `?tag=`, no `ref=`, no other
   * tracking parameter. A buy link is not the place to carry an affiliate or
   * campaign tag the privacy policy does not describe.
   */
  url: 'https://www.amazon.in/dp/B0HPG9T21G',
  /**
   * Can a LOGGED-OUT visitor open that URL and see the product?
   *
   * true  → every Amazon button, link, badge and sentence is published.
   * false → the site says nothing about Amazon at all: no greyed-out button,
   *         no "coming soon on Amazon" row, nothing that implies a listing a
   *         visitor could go and look for and fail to find.
   *
   * FALSE FOR THE FLIPKART-ONLY LAUNCH — see the block comment above for
   * how to switch it back on. The asin and url above are kept on purpose and
   * are not affected by this being false.
   */
  live: false,
};

/**
 * Is there a real Amazon listing to send anyone to?
 *
 * DERIVED, never hand-maintained. There is still exactly one hand-maintained
 * bit in the block above (`live`) and it is a fact nothing in the repo can
 * observe — whether Amazon has made the page public. Everything else is read
 * from the two values beside it, so there is no second boolean to drift: a
 * URL that is present cannot be "on" while `live` is false, and `live` being
 * true cannot publish a button when there is no URL to put behind it.
 *
 * An empty string is the "no": `isTBD('')` is already true, so every existing
 * consumer treats an empty URL as absent rather than as a draft.
 */
export const AMAZON_LISTED = AMAZON.live && Boolean(AMAZON.asin) && Boolean(AMAZON.url);

/**
 * The Amazon listing identifier. Empty while unlisted.
 *
 * Still its own export because that is the name the rest of the codebase
 * already used, and because amazonCartUrl() needs to ask "is there an ASIN"
 * without reaching for the whole block.
 */
export const AMAZON_ASIN = AMAZON.asin;

/**
 * THE MARKETPLACES THAT EXIST, in render order, by name.
 *
 * This is the list the PROSE reads. Every page that used to type "Amazon and
 * Flipkart" into a sentence now interpolates one of the helpers below, so a
 * sentence cannot name a seller the buttons refuse to link to — which is the
 * specific failure of saying "sold on Amazon and Flipkart" on a site whose
 * only live listing is Flipkart. It is also what makes switching Amazon on a
 * one-block edit rather than a sweep of forty-odd strings across the legal
 * pages.
 */
export const SELLERS = [...(AMAZON_LISTED ? ['Amazon'] : []), 'Flipkart'];

/** "Flipkart" — or "Amazon and Flipkart" once Amazon is listed. */
export function sellersAnd() {
  return SELLERS.join(' and ');
}

/** "Flipkart" — or "Amazon or Flipkart". For "raise it with …" sentences. */
export function sellersOr() {
  return SELLERS.join(' or ');
}

/** "Flipkart’s" — or "Amazon’s or Flipkart’s". */
export function sellersPossessive() {
  return SELLERS.map((name) => `${name}’s`).join(' or ');
}

/**
 * Singular or plural agreement for a sentence whose subject is the seller
 * list. One marketplace "sets its own prices"; two "set their own prices".
 *
 * A helper rather than a ternary at each call site because there are a dozen
 * of them, and every one would be an opportunity to ship "Flipkart set their
 * own prices".
 */
export function sellersVerb(singular, plural) {
  return SELLERS.length > 1 ? plural : singular;
}

/**
 * THE PRICE CAVEAT, in one line, for a slot directly under a price.
 *
 * WHY IT EXISTS. MARKETPLACE.priceInr is what this site quotes; it is not
 * what the customer pays. Flipkart sets the selling price on its own listing
 * and runs its own offers, so the two genuinely differ — at the time of
 * writing the listing was several hundred rupees below the figure here. A
 * price shown with no caveat is a price a reader takes as the price.
 *
 * SHORT ON PURPOSE. This goes under a ₹ figure in a buy panel, where the
 * longer sentence used elsewhere would outweigh the price it qualifies. The
 * fuller statements stay where they are and are NOT replaced by this:
 *
 *   components/BuySection   the homepage version, which also links on to
 *                           /where-to-buy.
 *   app/where-to-buy        the landing page for a price search, where the
 *                           reader is explicitly comparing numbers.
 *   app/legal/terms         the binding wording ("indicative and published
 *                           for information only"), which is legal prose and
 *                           should not be shortened to fit a panel.
 *
 * Those three say more than this one does, and each says it for its own
 * reason. What they must never do is contradict it — if the position on
 * pricing changes, all four move together.
 *
 * AGREEMENT COMES FROM sellersVerb(), so this reads "Flipkart sets its own
 * price" today and "Amazon and Flipkart set their own prices" the moment
 * AMAZON.live flips, with no edit here or at either call site.
 */
export function marketplacePriceCaveat() {
  return `${sellersAnd()} ${sellersVerb('sets its own price', 'set their own prices')}, `
    + 'so the listing price can differ.';
}

/**
 * AUTHORISED BLUNEURON DEALERS — the offline channel.
 *
 * EMPTY, AND THAT IS A PUBLISHED STATE RATHER THAN A MISSING ONE. The sale
 * invoice names authorised dealers as a channel the warranty covers, so the
 * policy pages must say so whether or not we are ready to list shops by
 * name. This array is what decides the difference:
 *
 *   []            → /where-to-buy says dealers exist and tells a buyer to
 *                   ask for a BluNeuron invoice. No names, no map, no
 *                   "find a store near you" that leads nowhere.
 *   ['Name', …]   → the same line, followed by the names.
 *
 * So adding the first dealer is one edit here. Nothing else keys off the
 * length, and nothing renders a name that is not in this list.
 */
export const DEALERS = [];

/** Are there dealer names we can actually print? */
export const HAS_NAMED_DEALERS = DEALERS.length > 0;

/*
 * THERE IS NO authorisedSellersPhrase() HELPER ANY MORE, and it is worth
 * saying why rather than leaving the next reader to re-add one.
 *
 * It existed to name the warranty's covered channels, and it hard-coded a
 * seller: "Flipkart, and Amazon once that listing exists". That put a seller
 * in the authorised list which the Sale Invoice does not name, on the one
 * page whose job is to state the invoice terms — and it read as a dangling
 * promise. Nobody holds an Amazon invoice for this product yet, so there was
 * no reader it protected.
 *
 * Its one caller (app/legal/warranty/page.jsx) now composes the sentence
 * from sellersAnd(), so the covered marketplaces and the linkable
 * marketplaces cannot disagree, and Amazon reappears there the moment
 * AMAZON.live flips — with no edit anywhere.
 *
 * The warranty FORMS are a separate matter and still offer Amazon as a
 * purchase source (SUPPORT_PURCHASE_SOURCES below): a customer may hold an
 * Amazon invoice later, and a form that cannot record one is worse than a
 * form that can. Offering to RECORD a provenance is not the same claim as
 * listing a seller as AUTHORISED.
 */

export const MARKETPLACE = {
  priceInr: 13999,
  priceNote: 'Inclusive of all taxes',
  /**
   * THE REAL FLIPKART LISTING, as Flipkart issues it.
   *
   * Do not "tidy" it. The `itm…` path segment and the `pid=` query are both
   * part of the canonical product URL — dropping the pid lands on a variant
   * picker rather than on this product, and dropping the itm id is a 404.
   */
  flipkartUrl:
    'https://www.flipkart.com/bluneuron-iriz-500-lm-portable-projector/p/itmb78b8e3a32777?pid=PROHS4X3VCGFSGBC',
  /**
   * Read from AMAZON above rather than written here, so exactly one place in
   * the codebase knows whether an Amazon listing exists.
   *
   * GATED ON AMAZON_LISTED, not on `AMAZON.url` being filled in — and that is
   * the difference `live` introduced. The ASIN and URL are real now, so a
   * bare `AMAZON.url` here would hand every consumer a destination while the
   * listing still 404s for the public. Resolving to the EMPTY STRING instead
   * keeps the one invariant every caller was already written against: no
   * destination, render nothing, nothing reaches the DOM. It becomes the real
   * URL the moment `live` is true, with no edit here.
   */
  amazonUrl: AMAZON_LISTED ? AMAZON.url : '',
  /** Shown under the buttons. The single most important thing to say there. */
  fulfilmentNote: `Delivery, returns and refunds are handled by ${sellersOr()}.`,
  /** ISO 4217, for the schema.org Offer. formatInr() reads it too. */
  currency: 'INR',
};

/**
 * Where a "Checkout on Amazon" click actually goes, for a given quantity.
 *
 * Amazon's own cart endpoint — `/gp/aws/cart/add.html?ASIN.1=…&Quantity.1=…`
 * — is what makes a basket on this site mean anything: it carries the
 * quantity across, so someone who chose three here lands on Amazon with
 * three in their cart rather than on a product page with the number thrown
 * away.
 *
 * Returns the plain listing URL when there is no usable ASIN — and while
 * Amazon is unlisted that URL is the EMPTY STRING, which every caller already
 * reads as "no destination, render nothing". Nothing reaches the DOM.
 *
 * AMAZON_LISTED IS CHECKED FIRST, and it has to be. The ASIN is real while
 * `live` is false, so the ASIN test below would happily build a working
 * add-to-cart link into a listing the public cannot open. Every caller today
 * takes its marketplace from MARKETPLACES, which is gated already — this is
 * the second lock, so a future caller that reaches for this helper directly
 * cannot reintroduce the leak.
 */
export function amazonCartUrl(quantity = 1) {
  if (!AMAZON_LISTED) return '';
  const qty = Math.max(1, Math.min(Math.round(quantity) || 1, 10));
  if (isTBD(AMAZON_ASIN) || isPlaceholder(AMAZON_ASIN)) return MARKETPLACE.amazonUrl;
  return `https://www.amazon.in/gp/aws/cart/add.html?ASIN.1=${encodeURIComponent(AMAZON_ASIN)}&Quantity.1=${qty}`;
}

/** Flipkart has no public add-to-cart endpoint, so a checkout is the listing. */
export function flipkartCheckoutUrl() {
  return MARKETPLACE.flipkartUrl;
}

/**
 * The marketplaces, in render order, as BUY DESTINATIONS.
 *
 * `name` is both the button label's subject and the `marketplace` value sent
 * to analytics, so the dashboard reads "Amazon" / "Flipkart" and there is one
 * vocabulary rather than a display name and a separate slug to keep in sync.
 *
 * AN UNLISTED MARKETPLACE IS ABSENT FROM THIS ARRAY, not present-and-
 * withheld. Every buy surface maps over it, so Amazon not being here is what
 * removes its button from the homepage card, the buy sheet, /where-to-buy and
 * the basket at once — rather than each of those four having to remember to
 * check a flag of its own.
 */
export const MARKETPLACES = [
  ...(AMAZON_LISTED ? [{ id: 'amazon', name: 'Amazon', url: MARKETPLACE.amazonUrl }] : []),
  { id: 'flipkart', name: 'Flipkart', url: MARKETPLACE.flipkartUrl },
];

/**
 * Does this site take payments of its own yet?
 *
 * false → "BluNeuron Website" is not offered as a place someone could have
 *         bought from, because there is no checkout here and a buyer picking
 *         it would be describing a purchase that cannot exist. It stays in
 *         the list below rather than being deleted, so switching this one
 *         constant is the whole change on the day a payment gateway lands.
 *
 * Read by SUPPORT_PURCHASE_SOURCES below, which drives the select on the
 * warranty registration and claim forms AND the server-side validation in
 * app/api/warranty-registration/route.js — so the option cannot be smuggled
 * past the form by posting the value directly.
 *
 * Listed in docs/production-checklist.md: turning this on is a deliberate
 * step, not a side effect of adding a gateway.
 */
export const DIRECT_SALES_ENABLED = false;

/**
 * Where a customer could have bought the unit, as the forms offer it.
 *
 * "Other seller" is kept, and it matters. It was dropped for a while, which
 * left anyone who bought from an unauthorised reseller with no truthful
 * option — so they would pick Amazon, and the registration would be worse
 * than useless: a wrong provenance recorded with conviction. The warranty
 * policy (/legal/warranty) covers units from BluNeuron or an authorised
 * seller only, so an "Other seller" registration is ACCEPTED and FLAGGED for
 * verification rather than refused at the form. Refusing it at the form
 * teaches people to lie to it.
 *
 * `BluNeuron Website` appears only once DIRECT_SALES_ENABLED is true.
 */
export const SUPPORT_PURCHASE_SOURCES = [
  'Amazon',
  'Flipkart',
  'Authorised dealer / store',
  'Other seller',
  ...(DIRECT_SALES_ENABLED ? ['BluNeuron Website'] : []),
];

/**
 * Sources whose provenance we can verify from our own records. Anything else
 * is recorded and marked for a human to check before a claim is honoured —
 * see `needsVerification` in app/api/warranty-registration/route.js, which
 * writes the flag to both the Sheet and Supabase.
 *
 * "AUTHORISED DEALER / STORE" IS DELIBERATELY NOT IN THIS LIST, and the
 * distinction is worth stating because the name invites the opposite
 * reading. An authorised dealer IS a covered channel — the warranty applies
 * to that invoice exactly as it does to a marketplace one. What this list
 * decides is something narrower: whether we can confirm the purchase without
 * a human looking at it. A marketplace order we can reconcile against our own
 * records; a shop sale exists only on the dealer's invoice, which somebody
 * has to read. So a dealer registration is ACCEPTED and FLAGGED, which routes
 * it to the person who can check the invoice rather than refusing it or
 * waving it through.
 *
 * `needsVerification` therefore means "check the paperwork", not "suspect
 * this purchase".
 */
export const AUTHORISED_PURCHASE_SOURCES = [
  'Amazon',
  'Flipkart',
  ...(DIRECT_SALES_ENABLED ? ['BluNeuron Website'] : []),
];

/** Does this registration need a human to confirm where it came from? */
export function purchaseSourceNeedsVerification(source) {
  return !AUTHORISED_PURCHASE_SOURCES.includes(source);
}

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
 * The date a policy page prints as "Last updated".
 *
 * IT NOW HOLDS /legal/shipping ALONE, and that is the split this comment
 * used to prescribe rather than describe. All five documents — terms,
 * warranty, returns, shipping, privacy — were written and published together
 * on 14 October 2026, so one constant was right. Four of them have been
 * revised since, each on its own day, and each took its own date with it:
 *
 *   /legal/privacy   PRIVACY_LAST_UPDATED  (24 October 2026)
 *   /legal/warranty  WARRANTY.effectiveFrom (29 October 2026) — replaced
 *   /legal/returns   RETURNS.effectiveFrom  (29 October 2026) — replaced
 *   /legal/terms     TERMS_LAST_UPDATED     (29 October 2026) — amended
 *
 * Shipping's text has not changed since it was written, so this date is
 * still true of it. KEEP SPLITTING: the moment shipping is revised, give it
 * its own constant too and this one can go. A "last updated" date that moves
 * when the text did not is worse than no date at all — it is the one line on
 * the page a reader uses to decide whether to re-read it.
 *
 * NOTE THE TWO KINDS OF DATE. An amended document that still governs
 * continuously keeps `lastUpdated`; one that was REPLACED — where the old
 * terms no longer apply and a buyer needs to know which set covers their
 * unit — takes `effectiveFrom` instead. See the note on LegalPage.
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

/**
 * THE NUMBER, TYPED ONCE.
 *
 * It is read by `SUPPORT.phone` below and by SUPPORT_PHONES further down,
 * and those are the only two things that quote it. A literal in both places
 * is how a site comes to publish two different numbers on two pages after
 * one of them is corrected — so the constant exists purely to make that
 * impossible, and is not exported because nothing outside this file should
 * reach past SUPPORT_PHONES for it.
 *
 * Customer care, and also the company's own line. Formatted the way it is
 * read; `telHref()` derives the dialling form.
 */
const CUSTOMER_CARE_PHONE = '+91 91509 94000';

export const SUPPORT = {
  email: 'support@bluneuron.com',
  /**
   * Sales and partnership enquiries. A separate inbox from `email` because
   * the two have different readers and different urgency — a broken unit
   * must not queue behind a distributor enquiry.
   */
  salesEmail: 'sales@bluneuron.com',
  /**
   * SUPERSEDED BY SUPPORT_PHONES below. Still here, and no longer TBD.
   *
   * It was TBD while there were two unconfirmed numbers, because a single
   * scalar could not express that state and TBD made any caller that had not
   * moved hide its row. There is one confirmed number now, so the scalar can
   * hold it — and a forgotten caller rendering the real number is strictly
   * better than one hiding a channel the rest of the site publishes.
   *
   * SUPPORT_PHONES is still the source every surface reads. This is the
   * compatibility shim, and it cannot drift from it: both read the one
   * CUSTOMER_CARE_PHONE constant above.
   */
  phone: CUSTOMER_CARE_PHONE,
  /**
   * Human-readable, and it says what a customer needs to know rather than
   * what a timezone table would. "except public holidays" is part of the
   * promise, not a footnote to it — a line that reads "Monday to Saturday"
   * and then goes unanswered on Diwali is the sentence doing the damage.
   */
  hours: 'Monday to Saturday, 10 am – 6 pm (except public holidays)',
};

/**
 * THE SUPPORT NUMBER. ONE, CONFIRMED, AND PUBLISHED ON EVERY BUILD.
 *
 * This replaces two unconfirmed rows, and both halves of that matter.
 *
 * ONE ROW, NOT TWO. There was a "Phone 2" slot beside this; it is GONE
 * rather than emptied. A second labelled row with nothing in it is a promise
 * of a channel that does not exist, and the honest encoding of "there is one
 * number" is one entry. If a second line is ever commissioned, add it here
 * and every surface picks it up — the tile grid on /support/contact already
 * has a span table covering one through five rows.
 *
 * "Customer care" IS THE LABEL, and it is sourced rather than invented. The
 * two rows here used to be called "Phone 1" / "Phone 2" precisely because
 * which number answered what was unknown, and a label is a claim like any
 * other. It is known now: this is the customer care line, and it is also the
 * company's own number — so there is no second role for a label to get
 * wrong.
 *
 * THE SHAPE IS THE DISPLAY SHAPE, not a dialling string. Grouped the way an
 * Indian mobile number is written, because this is what a visitor reads; the
 * `tel:` href is derived from it at each surface by stripping everything but
 * `+` and digits, so the readable form and the dialled form cannot drift.
 */
export const SUPPORT_PHONES = [
  { label: 'Customer care', number: CUSTOMER_CARE_PHONE },
];

/**
 * Is this number still a slot rather than a number?
 *
 * KEPT, THOUGH NOTHING IS A PLACEHOLDER TODAY — and deliberately so. It is
 * what `visibleSupportPhones()` and the production guard are written
 * against, so adding an unconfirmed second line later is a one-line edit
 * that is safe by default rather than a leak. The companion
 * PHONE_PLACEHOLDER constant is gone with the rows that used it: there is no
 * masked number left to recognise, and the preview-only placeholder path it
 * fed is gone too (see below).
 *
 * Tests for [TBD] AND for a run of X's, so a hand-written variant
 * ("+91 XXXXXXXXXX", "+91 98XXX XXXXX") is still caught. A number that is
 * partly masked is not a number anyone can dial.
 */
export function isPlaceholderPhone(number) {
  const value = String(number ?? '');
  return isTBD(value) || /[Xx]{3,}/.test(value);
}

/**
 * The phone rows this build may render. The ONE function every surface calls.
 *
 * NO LONGER GATED ON BUILD_CHANNEL. It used to be: an unconfirmed row showed
 * as "+91 XXXXX XXXXX" on a preview so a reviewer could see the row and what
 * it did to the tile grid, and vanished on production so a customer was
 * never shown a number that does not ring. With a real number there is
 * nothing left to mask — the preview and production builds render the same
 * row, which is the better state to be reviewing.
 *
 * The filter stays, and it is the whole safety: a row whose number is [TBD]
 * or masked is dropped on EVERY build, preview included. Nothing else
 * decides this anywhere, so there is no surface to forget when a second
 * number lands and none that can leak one before it does.
 */
export function visibleSupportPhones() {
  return SUPPORT_PHONES.filter((entry) => !isPlaceholderPhone(entry.number));
}

/**
 * The `tel:` href for a number, or null when there is nothing dialable.
 *
 * ONE PLACE, because there are four surfaces and they must not each do their
 * own stripping — `tel:` with spaces in it is tolerated by some dialers and
 * mangled by others, and a `tel:` built from a masked number strips to "+91"
 * and places a real call to a two-digit prefix, which is worse than plain
 * text.
 */
export function telHref(number) {
  if (isPlaceholderPhone(number)) return null;
  const digits = String(number ?? '').replace(/[^+\d]/g, '');
  return digits ? `tel:${digits}` : null;
}

/** The primary support number, or null while there is none to publish. */
export function primarySupportPhone() {
  return visibleSupportPhones()[0] ?? null;
}

/** Are all the published phone numbers real? Read by the production guard. */
export function allPhonesConfirmed() {
  return SUPPORT_PHONES.every((entry) => !isPlaceholderPhone(entry.number));
}

/**
 * The grievance officer — the office, reachable, with a stated clock on it.
 *
 * Required of an e-commerce entity by India's Consumer Protection
 * (E-Commerce) Rules, 2020: a contact point for consumer complaints, and
 * published timelines for acknowledging and resolving them.
 *
 * A NAMED PERSON IS STILL RECOMMENDED, and is what the Rules contemplate —
 * Rule 4(5) speaks of appointing a Grievance Officer and displaying that
 * officer's name and contact details. `name` is deliberately EMPTY rather
 * than TBD: an empty value renders NOTHING (no name line at all, and no
 * "[TBD]" where a name goes), while leaving the designation, the address, the
 * email and the timelines published and indexable — which is the disclosure
 * that actually helps an unhappy customer. Put a name in and the line appears
 * on /legal/grievance and on /support/contact with no other edit.
 *
 * TODO(compliance): appoint a named officer and fill in `name`. Until then
 * the designation is the contact point, which is a weaker disclosure than the
 * Rules intend.
 *
 * `designation` and `email` are what the page is held up by: while either is
 * missing, /legal/grievance has no contact point to publish and goes back to
 * being a draft (DRAFT_SOURCES in lib/routes.js).
 */
export const GRIEVANCE_OFFICER = {
  /**
   * EMPTY ON PURPOSE. Not TBD — see above. `isTBD('')` is true, so every
   * consumer treats it as absent; `hasTBD('')` is false, so it cannot hold
   * the page in draft.
   */
  name: '',
  designation: 'Grievance Officer',
  /**
   * The support inbox, and the same address the rest of the site publishes.
   * A dedicated grievance mailbox would be better and does not exist; a
   * second address that nobody reads would be worse than this one.
   */
  email: 'support@bluneuron.com',
  /** The same hours as every other channel. One promise, not two. */
  hours: 'Monday to Saturday, 10 am – 6 pm (except public holidays)',
  /**
   * The statutory clock, stated at — not inside — the maximums the Rules set:
   * 48 hours to acknowledge, one month to resolve. Published because an
   * unpublished timeline is not a commitment anyone can hold us to.
   */
  responsePromise:
    'We acknowledge complaints within 48 hours and aim to resolve them within 30 days.',
};

/**
 * Is there a grievance contact point to publish?
 *
 * The DESIGNATION and the EMAIL, not the name. This is the question the
 * grievance policy, its footer link and the escalation panel on
 * /support/contact all turn on, and answering it with "is there a name" is
 * what held a complete, legally required disclosure off the site while one
 * optional field was blank.
 */
export function hasGrievanceContact() {
  return allKnown(GRIEVANCE_OFFICER.designation, GRIEVANCE_OFFICER.email);
}

/* ------------------------------------------------------------------ *
 * THE PROMISES
 * ------------------------------------------------------------------ */

/**
 * THE WARRANTY, as published. These are the terms, not a summary of them.
 *
 * `coverage` and `exclusions` are LISTS rather than prose because that is how
 * a warranty is actually read — "is my problem on one of these lists?" — and
 * because a list is the one shape a reader can scan under stress, which is
 * the state anyone reading this page is in.
 *
 * WRITTEN FOR THIS PRODUCT, in our own words. It is not adapted from another
 * brand's warranty and must not be: a borrowed clause carries the other
 * company's service model with it (on-site visits, dealer networks, an RMA
 * portal) and promises things this company cannot do.
 *
 * EVERY SURFACE READS THESE FIELDS. The cover period is quoted on
 * /legal/warranty, on /support/warranty-registration, on
 * /support/warranty-claim, on /shop/iriz, on /shop, on /about and in the
 * "covered until" date on the registration success screen. Seven surfaces,
 * one value — a warranty whose length differs between two pages of the same
 * site is not a document anyone can rely on. Say "1 year" everywhere, which
 * is what `label` is for: `months` is arithmetic, `label` is English, and the
 * two must never be mixed in prose.
 *
 * CHANGING ANY STRING BELOW IS A LEGAL DECISION, not an editorial one. The
 * printed warranty card in the carton says the same thing, and a card already
 * in a warehouse cannot be reissued.
 */
export const WARRANTY = {
  months: 12,
  /** The tenure as a reader says it. Use this in prose, always. */
  label: '1 year',
  /**
   * The tenure as the SALE INVOICE states it, both ways round.
   *
   * The invoice is the governing document and it says "12 months"; this site
   * has always said "1 year" because that is how a reader says it. Both are
   * the same period and neither is wrong, but a customer holding the invoice
   * beside the website should not have to work that out. So the cover line on
   * /legal/warranty states both once, and every other surface keeps `label`.
   */
  labelFull: '12 months (1 year)',
  /**
   * The date these terms take effect, printed on /legal/warranty.
   *
   * A STRING, not a Date: it is read, never computed, and `new Date()` here
   * would silently re-date the warranty on every build. Change it when the
   * terms change — and only then. A unit bought under the previous terms is
   * covered by those, which is exactly what a reader checks this line for.
   */
  effectiveFrom: '29 October 2026',
  coverage: [
    'Manufacturing defects that stop the projector working as it is meant to, under normal use in a home.',
    'Repair or replacement, once the defect has been verified by BluNeuron. We repair first; which of the two applies is BluNeuron’s decision.',
    'A unit that cannot be repaired may be replaced with the same model, or with an equivalent one if the same model is no longer available.',
    'The power adapter supplied in the box, on the same terms as the projector itself.',
  ],
  /*
   * THE FIRST FIVE VOID THE COVER. The rest are simply outside it, and the
   * difference is not pedantry: "not covered" means this fault is not paid
   * for, "voids the warranty" means the cover is gone for everything
   * afterwards. The sale invoice draws that line and so does this list —
   * each voiding bullet says so in its own words rather than relying on a
   * heading to carry it.
   *
   * The transit-damage bullet is GONE. It read "transit damage that was not
   * reported in time (see 'On delivery' below)" and pointed at a 48-hour
   * window this site no longer operates: an online order's arrival damage is
   * the marketplace's to settle under its return policy. Nothing replaced it,
   * because physical damage is already the first bullet.
   */
  exclusions: [
    'Physical damage of any kind, and liquid ingress — both void the warranty completely.',
    'Damage from power surges, lightning or abnormal mains voltage — this voids the warranty completely.',
    'Damage from misuse, accidents, or not following the user guide — this voids the warranty completely.',
    'Any attempt to open, repair or modify the unit by anyone other than BluNeuron, including changes to its software — this voids the warranty completely.',
    'Damage caused by using a non-standard adapter or cable in place of the ones supplied.',
    'Cosmetic wear: marks, scuffs and fading that do not affect how the projector works.',
    'Consequential losses — anything beyond the repair or replacement of the unit itself.',
  ],
  /**
   * ACCESSORIES ARE NOT THE PROJECTOR, and the split has to be stated rather
   * than left to the exclusions list to imply.
   *
   * The power ADAPTER is covered, deliberately: it is the one accessory whose
   * failure stops the projector working at all, and a dead adapter inside the
   * cover period is indistinguishable to a customer from a dead projector.
   * The remote, its batteries and the cables are not — they are consumables
   * and wear items, and a one-year cover on an AAA cell is not a term anyone
   * would mean.
   */
  accessories:
    'The remote control, its batteries and the supplied cables are not covered by the standard warranty. The power adapter is.',
  /*
   * THERE ARE NO DELIVERY CLOCKS ANY MORE, here or anywhere. This used to
   * point at DELIVERY_WINDOWS below RETURNS — the 48-hour and 7-day windows
   * both policy pages rendered from one pair of strings. The sale invoice
   * grants neither, so both are gone; see the note above RETURNS for why,
   * and `onArrival` above for what a customer is told instead.
   */
  /**
   * WHAT A REPAIR DOES NOT DO: restart the clock. A replaced unit carries the
   * REMAINDER of the original period, which is the term being given — stating
   * it is what stops a customer three repairs in from believing they hold a
   * four-year warranty.
   */
  afterService:
    'A repaired or replaced unit is covered for the rest of the original period only. Service does not restart or extend it.',
  /** Who the cover belongs to, and where the unit must have been bought. */
  eligibility: [
    '12 months (1 year) from the date of purchase shown on the invoice.',
    'The first purchaser only. The cover is not transferable.',
    'Units bought in India, from BluNeuron, its authorised marketplaces or an authorised BluNeuron dealer.',
    'A valid invoice is required for any claim. A warranty registration on its own does not establish the purchase date.',
  ],
  /**
   * WHO OWES THE WARRANTY — and it is not whoever sold you the unit.
   *
   * Straight off the sale invoice, and it is there for the dealer channel:
   * a customer who bought from a shop will go back to that shop with a
   * fault, and the shop is not the party that can service it. Saying so is
   * not us disowning the sale, it is telling the customer which door to
   * knock on so they do not lose weeks knocking on the wrong one.
   */
  soleProvider:
    'The warranty is provided solely by BluNeuron Technologies. Retail dealers and distributors are not liable for warranty fulfilment, service processing or refunds — contact us directly.',
  /**
   * WHAT TO DO WHEN A UNIT ARRIVES BROKEN. This replaces the two delivery
   * clocks this site used to run (48 hours for damage on arrival, 7 days for
   * an early failure), which the sale invoice does not give us: an online
   * order's returns are governed strictly by the marketplace's own policy,
   * and a store sale is not taken back at all.
   *
   * It is three statements rather than one because the answer genuinely
   * differs by channel, and the one thing common to both — photograph it
   * before you touch it — is the advice that survived the change.
   */
  onArrival: [
    'Bought online: report any damage or fault on arrival to the marketplace you bought from, through its own returns process and inside its own window. Their return policy governs the purchase.',
    'Bought from a store or dealer: goods once sold are not taken back or refunded. A manufacturing defect is handled under this warranty — contact us with your invoice.',
    'Either way, photograph the outer packaging before you open it and the unit before you set it up. Whether a projector arrived damaged stops being answerable almost immediately, and those photographs are what answer it.',
  ],
  /** Where a claim is handled: by us, or through the marketplace's process. */
  claimRoute:
    'by BluNeuron directly — this is a return-to-base warranty, with the unit sent in to our service centre',
  /**
   * THE TWO LEGS OF A SERVICE SHIPMENT, as two separate statements, so the
   * page cannot state one and imply the other.
   *
   * The service centre address is given WHEN THE TICKET IS RAISED rather than
   * published here. That is not evasiveness: a published address invites
   * units to arrive unannounced, with no ticket, no fault description and
   * nothing to match them to a claim — which is how a projector goes missing.
   */
  inboundShipping:
    'The customer sends the unit to our service centre, at their own cost and risk. We give you the address when your ticket is raised.',
  returnShipping:
    'For a repair covered by this warranty, BluNeuron pays the courier to send the unit back to you.',
  /** The ceiling on everything above. */
  liability:
    'Our liability under this warranty is limited to repairing or replacing the unit, up to the price paid for it.',
};

/**
 * How to make a claim, in the order it happens. Rendered as numbered steps.
 *
 * REGISTRATION FIRST, and `/warranty` rather than the full route, because
 * `/warranty` is the address printed on the carton (see the redirect in
 * next.config.js). Printing the long route here would teach people an address
 * the packaging does not carry.
 */
export const WARRANTY_CLAIM_STEPS = [
  'Register your unit at bluneuron.com/warranty.',
  `Raise a claim on the warranty claim form, or email ${SUPPORT.email}.`,
  'Include your invoice and the serial number, which is on the box and on the sticker on the product.',
  'We confirm the fault, then give you the service centre address to send the unit to.',
];

/**
 * RETURNS — WHAT THIS SITE PROMISES, WHICH IS NOW NOTHING OF ITS OWN.
 *
 * THE TWO DELIVERY CLOCKS ARE GONE, and with them `damageReportHours` (48)
 * and `replacementDays` (7), and the `DELIVERY_WINDOWS` strings both policy
 * pages rendered. They were this site's own promises — report damage inside
 * 48 hours and we replace it; fail inside 7 days and we replace rather than
 * repair — and the sale invoice does not give us either:
 *
 *   - An ONLINE purchase is governed strictly by the return policy of the
 *     marketplace it was bought on. A second window published here could
 *     only be narrower or wider than theirs; narrower is unenforceable and
 *     wider is a promise we cannot keep, because we do not hold the order,
 *     the payment or the reverse logistics.
 *   - A STORE or DEALER purchase is not taken back at all. Goods once sold
 *     are not returned or refunded; a manufacturing defect goes to the
 *     warranty.
 *
 * So there is no window of ours left to state, and an empty object would be
 * a worse record of that than this comment. What replaced the prose is
 * WARRANTY.onArrival above, which routes by channel instead of by clock.
 *
 * DO NOT REINTRODUCE A WINDOW HERE without the invoice terms changing to
 * match. Two documents disagreeing about a deadline a buyer can miss is the
 * exact failure the old `DELIVERY_WINDOWS` was built to prevent, and
 * publishing a window the invoice does not grant recreates it one level up.
 */
export const RETURNS = {
  /**
   * Does this site operate any return or replacement window of its own?
   *
   * false → every return question routes to the marketplace that took the
   *         payment, or, for a store sale, to "not taken back". Kept as a
   *         named constant rather than left implicit so the policy pages can
   *         say WHY they state no window, and so turning one back on is a
   *         deliberate edit here rather than prose appearing on a page.
   */
  ownWindows: false,
  /**
   * The date these return terms take effect, printed on /legal/returns.
   *
   * `effectiveFrom`, NOT `lastUpdated`, and ITS OWN VALUE rather than a read
   * of WARRANTY.effectiveFrom — which today holds the same date.
   *
   * The date is shared because one document moved both pages: the Sale
   * Invoice terms replaced the warranty's cover wording and deleted this
   * page's two return windows on the same day. The VALUE is not shared
   * because they are two policies, and amending the warranty alone must not
   * silently re-date this one. Coinciding is not the same as being linked.
   *
   * It is `effectiveFrom` for the same reason the warranty page uses it:
   * this is not a revision of the old returns policy, it is a different one.
   * A reader with a unit in their hands needs to know which terms their
   * purchase was made under, and "last updated" does not answer that.
   *
   * A STRING, not a Date — read, never computed. `new Date()` here would
   * re-date the policy on every build.
   */
  effectiveFrom: '29 October 2026',
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
 * Downloadable documents. THE ROUTE THAT RENDERED THESE IS RETIRED.
 *
 * /support/manuals is gone: it redirects to /support, it is out of the
 * footer, out of the support hub and out of the sitemap, and the page itself
 * is parked at app/support/_manuals/ where Next's underscore convention keeps
 * it out of the router. The reason is that none of the three PDFs exists —
 * the page was three cards reading "PDF [TBD] — not available for download
 * yet", which is a placeholder page wearing a nav entry, and a support link
 * that leads to nothing is worse than no link.
 *
 * THIS LIST STAYS, and is the reason restoring the page is a small change
 * rather than a rebuild: drop the PDFs in public/, fill in `file` and `size`
 * here, rename `_manuals` back to `manuals`, and put the route back in
 * lib/routes.js (ROUTES.manuals, SUPPORT_TILES, FOOTER_COLUMNS,
 * SITEMAP_CANDIDATES, DRAFT_SOURCES) and next.config.js (drop the redirect).
 * Every one of those sites carries a comment saying so.
 *
 * Titles and descriptions are real — these are the three documents that ship
 * with the product and the ones people come looking for.
 */
export const MANUALS = [
  {
    title: 'Quick-start guide',
    description: 'Unbox, place, focus, and get through Android setup in a few minutes.',
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

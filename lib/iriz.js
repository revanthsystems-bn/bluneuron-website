import { COMMERCE_ENABLED } from './launch';

/**
 * BluNeuron IRIZ — single source of truth for product copy, specs, and media.
 *
 * Every spec below is sourced from the manufacturer's own product photography
 * and infographic slides supplied with the unit. No pricing, sales, or ratings
 * data came with that material, so none is invented here — the UI simply omits
 * those fields.
 *
 * Several of the supplied renders carried a third-party logo baked into the
 * pixels. This site sells the device under the BluNeuron brand, so no other
 * mark may appear anywhere here: the affected renders were either patched
 * (seamless, since the backdrop there is already pure white) or dropped
 * entirely rather than shipped. Only the renders still referenced below were
 * clean enough to use.
 *
 * "4K"/"8K" claims in the supplied material describe video *decoding* (the
 * H723 chipset's playback capability), not the projector's native display
 * resolution, which is 1080p. Copy below keeps that distinction explicit
 * rather than repeating the ambiguous marketing shorthand.
 *
 * That rule applies to PIXELS as well as copy. Renders that arrived with a
 * badge strip burned into them — "500 Lumens / Automatic Keystone Correction /
 * 4K HD · 4K Decoding" — restate the 4K shorthand the line above exists to
 * avoid, so none of them ship. The badge-free variants are what MEDIA points
 * at.
 *
 * PRICING is a business decision (not manufacturer-sourced like the specs
 * above) — defined once here and imported everywhere a price appears (hero,
 * buy buttons, cart, checkout, order confirmation, comparison table) so a
 * price change is a one-line edit.
 */

export const BRAND = {
  name: 'BluNeuron',
  model: 'IRIZ',
  fullName: 'BluNeuron IRIZ',
};

/**
 * Social destinations for the footer. One entry per platform, in the order
 * they render.
 *
 * These are deliberately PLATFORM HOMEPAGES, not handles. A guessed handle
 * like /bluneuron may well belong to someone else, and shipping a link to a
 * stranger's account from our own footer is worse than shipping no link.
 *
 * An entry with an empty string renders no icon at all (components/Footer),
 * so a platform we do not have yet simply drops out rather than linking to
 * "#". That is why the shape is a string per platform and not a boolean plus
 * a URL — there is one source of truth for "do we have this" and it is the
 * URL itself.
 */
// The official BluNeuron accounts, confirmed. Both consumers are live again:
// the footer renders its icon row (components/Footer) and `Organization.sameAs`
// in lib/seo.js carries all three — which is how a search engine is told these
// accounts ARE this company. That second consumer is why an unverified handle
// must never be pasted in here: a wrong link in a footer is a bad link, but the
// same handle in sameAs is a claim about someone else's account.
//
// CANONICAL PROFILE URLs ONLY. The values that used to sit here carried
// tracking parameters (?stkn=, ?si=) from however they were copied — session
// artifacts that identify the person who copied the link. They are stripped
// here and must not be re-added: paste the profile URL, not the share link.
export const SOCIAL_LINKS = {
  linkedin: 'https://www.linkedin.com/company/bluneuron-technologies/',
  instagram: 'https://www.instagram.com/bluneurondotcom',
  youtube: 'https://www.youtube.com/@bluneurontechnologies',
};

/**
 * The one market this store sells into. Rendered as a static label in the
 * footer, not a picker: a <select> whose only option is the current value
 * reads as a broken control, and there is no second region behind it for the
 * value to mean anything. When a second market opens, this becomes a list and
 * the footer grows a real control — not before.
 *
 * No flag emoji. Chrome on Windows ships no flag glyphs, so U+1F1EE U+1F1F3
 * falls back to its two regional-indicator letters and the label renders as
 * "IN India". The footer draws a globe instead — an inline SVG, like the
 * social marks, so it renders the same everywhere.
 */
export const REGION = { label: 'India' };

export const PRICING = {
  currency: 'INR',
  mrp: 39999,
  offerPrice: 13999,
};

export const DISCOUNT_PERCENT = Math.round(
  ((PRICING.mrp - PRICING.offerPrice) / PRICING.mrp) * 100
);

export function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: PRICING.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const MEDIA = {
  product: {
    // The only product shot left, and now the one that represents the
    // product everywhere it is shown small — the buy sheet, the cart, the
    // account order rows — as well as the gallery and the OG card. A
    // white-on-white studio render, so every surface that draws it on a dark
    // panel pairs it with `.product-fade`/`.product-fade-tight`
    // (app/globals.css) to dissolve the ground. See PRODUCT below.
    //
    // `retailBox` IS GONE from this block and from public/. It pictured a
    // carton design that is not the one that ships, and it was still the
    // image standing next to the price in the buy sheet and the one Google
    // was being handed in the Product markup. `boxFront` is the real carton.
    //
    // `turntable`, `anglesPorts` and `angleIso` were removed earlier for a
    // different reason: they named files that have never been in public/.
    // A path in this object is an invitation to render it, and the next
    // person to do so would have shipped a hole in a page. Supply the files
    // and the keys come back; see docs/missing-media.md.
    heroClean: '/media/iriz/product/hero-clean.png',
    // The printed IRIZ retail carton, front face. This is the SPEC SOURCE as
    // well as a picture: the model number, the adapter's input range and the
    // contents list the homepage's "In the box" section renders are all read
    // off this box, not off marketing copy. It is also what the re-typeset
    // listing boards are checked against — see HIGHLIGHT_BOARDS.
    boxFront: '/media/iriz/box/iriz-box-front.png',
  },
  /*
   * `banner` AND `detail` ARE BOTH GONE, and with them eleven files and
   * ~8.3MB of artwork.
   *
   * Every one of them was a marketplace listing graphic: a PNG with its
   * headline, sub-head, figures and icon strip burned into the pixels. They
   * are now live HTML — see HIGHLIGHT_BOARDS, HIGHLIGHT_BANNERS and
   * TECH_BOARDS below for the words, and components/boards/ for the markup.
   * The apps board was deleted outright rather than re-typeset; the note on
   * HIGHLIGHT_BANNERS says why.
   *
   * Nothing should be added back here. A new claim belongs in one of those
   * three exports as text, not as a picture of text: the artwork could not
   * be read at 390px, could not be translated, could not be corrected
   * without a design tool, and disagreed with the retail box in three
   * places by the time it was removed.
   */
  heroLoop: {
    webm: '/media/iriz/video/iriz-loop.webm',
    mp4: '/media/iriz/video/iriz-loop.mp4',
    // The video's own frame 0, so the poster-to-video swap is invisible.
    // The reduced-motion path in HeroBackdrop renders this image on its own,
    // with no video behind it, so it has to stand as a still.
    poster: '/media/iriz/video/iriz-loop-poster.jpg',
    /*
     * CORRECTED. This read "...turning to show the rear ports before the
     * camera pushes in on the lens". The clip does no such thing: both
     * encodings were sampled across the full four seconds and every frame is
     * the REAR of the unit — socket, vents and I/O row — held in one hand.
     * There is no lens in it.
     *
     * That wrong description is part of why the hero shipped showing the back
     * of the product. Nothing renders this clip today (components/HeroBackdrop
     * is a front-facing still now), but the string has to be true for whoever
     * reaches for the footage next.
     */
    description:
      'BluNeuron IRIZ held in one hand, rear three-quarter, showing the vent stack and the rear ports',
  },
};

// Single purchasable SKU — the cart/checkout flow (components/cart, app/checkout)
// is built around this one product rather than a generic item lookup.
/**
 * The product page's gallery (components/shop/ProductGallery).
 *
 * TWO SHOTS, and they are the only two product photographs this repository
 * has: the unit, and the box it ships in.
 *
 * It was six. The other four were marketplace listing GRAPHICS — infographic
 * slides with their claims burned into the pixels — standing in a gallery of
 * photographs as though they were photographs. Three of them are now live
 * type further down this file (HIGHLIGHT_BOARDS, TECH_BOARDS) and the fourth
 * was deleted; see the re-typesetting note above. A picture of a spec table
 * was never a product shot, and a gallery is the wrong place to state specs
 * to someone who cannot select or translate them.
 *
 * EVERY ENTRY IS A FILE THAT EXISTS. That sounds like it should go without
 * saying, and it does not: this file used to name assets that were not in
 * public/ at all, and `next/image` on a missing local file is not a build
 * error — it is a 404 at request time and a hole in the page. Check each path
 * against the repository rather than against MEDIA.
 *
 * `fade` marks the white-studio render that needs `.product-fade` to dissolve
 * its white ground into the page. The box is a PHOTOGRAPH with its own ground
 * and must never get that treatment — the mask eats its corners.
 */
export const GALLERY = [
  {
    src: MEDIA.product.heroClean,
    fade: true,
    label: 'Three-quarter view',
    alt: `The ${BRAND.fullName} mini projector, three-quarter view with the lens forward`,
  },
  {
    // The REAL carton, photographed alone — not the old `retailBox` shot of a
    // box design that never shipped. `fade: false` still: this is a
    // photograph with its own ground and a reflection, and the radial mask
    // that dissolves a white studio render would eat its corners.
    src: MEDIA.product.boxFront,
    fade: false,
    label: 'What ships',
    alt: `The ${BRAND.fullName} retail box, front face, listing the printed specifications`,
  },
];

export const PRODUCT = {
  id: 'iriz',
  name: BRAND.fullName,
  /*
   * `heroClean` — the bare unit, front three-quarter, lens forward.
   *
   * This WAS `retailBox`, on the reasoning that a white-on-white render is
   * invisible at thumbnail size while the photograph has its own ground. Both
   * halves of that turned out to be wrong, and the buy sheet is where it
   * showed:
   *
   *   1. `retailBox` is the OLD carton artwork. The box in that photograph is
   *      not the box that ships — see `boxFront`, which is — so the one image
   *      standing next to the price was advertising packaging that does not
   *      exist.
   *   2. At 80px square it was not a product shot at all. The source is 1.66:1
   *      and the tile is 1:1, so `object-cover` threw away both ends and
   *      centre-cropped to two lens barrels on a grey field — an unreadable
   *      dark smudge, which is exactly how it was reported.
   *
   * The invisibility problem is real and is solved where it belongs, in CSS:
   * `.product-fade-tight` (app/globals.css) dissolves the white ground, and
   * the callers below box the shot with `object-contain` so the whole unit is
   * in frame. A front three-quarter view also answers the question a buy
   * sheet is actually asking — what am I buying — better than a carton does.
   *
   * Shown by components/buy/BuySheet, components/cart/CartDrawer,
   * components/cart/CartPanel and the account order rows. All four render it
   * small, on a dark panel, and all four must keep the contain + fade pair.
   */
  image: MEDIA.product.heroClean,
};

export const HERO = {
  // Sentence case in source on purpose: `.type-label` (app/globals.css)
  // applies the uppercasing, so the cased string is the one thing a
  // screen reader and a copy edit both see.
  // "Mini projector for home" — NOT "mini portable projector". The retail
  // carton does not claim portability anywhere on it (no battery, and the
  // power source is listed as AC 90-240V), so the site must not either. This
  // string is the eyebrow over the hero and the eyebrow in the buy sheet; the
  // page titles, meta descriptions and the Product JSON-LD already said
  // "Mini Projector for Home" and were never changed.
  eyebrow: 'Mini projector for home',
  title: 'True brightness. Android 14 built in.',
  body: '500 ANSI Lumens, measured honestly. Native 1080P. A 200-inch screen wherever you point it.',
  // Display type, once per page — the cinematic hero shows the model name
  // alone and lets the tagline carry the claim. This is the string the
  // WORDMARK is drawn from (lowercased and dotted-i-substituted in
  // components/Hero), so it must stay exactly the four letters of the model
  // name: anything else changes the glyphs on screen.
  display: BRAND.model,
  // The h1's accessible name, and the only h1 on the homepage — what a screen
  // reader announces and what a crawler reads as the page's heading.
  //
  // Split from `display` deliberately. The two used to be the same string,
  // which forced a choice between a wordmark that renders as a sentence and an
  // h1 that says nothing but "IRIZ". Separate, the hero can draw four letters
  // and still declare what the page is about. `display` drives the pixels;
  // this drives the accessibility tree. Changing this one cannot move the
  // wordmark by a subpixel.
  accessibleName: `${BRAND.model} mini projector for home`,
  tagline: 'Your home cinema awaits.',
  /*
   * The hero backdrop's alt text.
   *
   * NOT empty, even though the image is "decorative" in the loose sense of
   * being a backdrop: it is the only picture of the product above the fold,
   * and a visitor using a screen reader is owed the same first impression as
   * one who can see it. It is also short — the h1 and the tagline beside it
   * carry the claims, so this describes the view and stops.
   */
  backdropAlt: `The ${BRAND.fullName} mini projector, front three-quarter view with the lens forward`,
  // Where the hero's scroll cue lands. `#why-bluneuron` is TrustBadges,
  // which does not render while commerce is off — an anchor to a missing
  // element is a dead cue, so pre-launch it falls through to the next
  // section. See lib/launch.js.
  scrollTo: COMMERCE_ENABLED ? '#why-bluneuron' : '#highlights',
  ctaSecondary: { label: 'View Full Specs', href: '#specs' },
  stats: [
    { label: 'ANSI Lumens', value: '500' },
    { label: 'Native Resolution', value: '1080P' },
    { label: 'Max Screen', value: '200"' },
  ],
};

/**
 * The six headline claims, as COPY ONLY.
 *
 * Each entry used to carry an `image`, and three of those six files were not
 * in public/ — `04-google-assistant.png`, `03-apps.png` and
 * `05-lumens-compare.png`. Nothing rendered them (components/Highlights draws
 * HIGHLIGHT_BOARDS instead), so no page was ever visibly broken, but the
 * array was three `next/image` calls away from a hole in a page at any time.
 *
 * The product page (app/shop/iriz) now reads this array and renders the title
 * and subtitle as text, which is the only thing it was ever a reliable source
 * of. The `image` keys are gone rather than repointed: there is no existing
 * asset that honestly illustrates "Android 14 Built In" or the lumens
 * comparison, and pointing them at an unrelated board would be worse than
 * having no picture. Supply the three files and add the keys back.
 */
export const HIGHLIGHTS = [
  {
    title: 'Android 14 Built In',
    subtitle: 'A full smart OS on board, plus the remote in the box.',
  },
  {
    title: '10,000+ Official Apps',
    subtitle: 'Netflix, YouTube, Disney+, Prime Video, and more — pre-installed.',
  },
  {
    title: 'True 500 ANSI Lumens',
    subtitle: 'Measured brightness, not an inflated spec sheet number.',
  },
  {
    title: 'Allwinner H723 Chipset',
    subtitle: 'Quad-core ARM Cortex-A53 with hardware keystone and 8K decoding.',
  },
  {
    title: 'Auto Focus + Auto Keystone',
    subtitle: 'Sharp and perfectly square, automatically, every time you move it.',
  },
  {
    title: 'Up to a 200" Screen',
    subtitle: '1:1 throw ratio — a huge canvas from 0.9 to 5 meters away.',
  },
];

/**
 * ===================================================================
 * THE LISTING BOARDS — now LIVE HTML, not baked artwork.
 * ===================================================================
 *
 * Every panel below used to be a supplied marketplace listing graphic: a PNG
 * with its headline, sub-head, figures and icon strip burned into the pixels.
 * Seven of them, ~8.3 MB of source art, each one an image of text.
 *
 * They are re-typeset here as DATA, and drawn as real type by
 * components/boards/. The words are the words that were in the artwork; what
 * changed is that they are now selectable, translatable, searchable,
 * screen-readable without an `alt` transcription, legible at 390px without
 * pinch-zooming a 750px-wide slide, and they re-flow instead of letterboxing.
 * They also cost nothing to download.
 *
 * THREE FIGURES WERE CORRECTED AGAINST THE RETAIL BOX, which is the spec
 * source for this file (see `boxFront` in MEDIA). They are not re-typeset
 * verbatim because the artwork disagreed with the carton and with this file:
 *
 *   screen size       artwork "35-200 Inch" / a 35" step on the ladder
 *                     box + SPECS + FULL_SPEC_SHEET all say 40" - 200"
 *                     -> 40", everywhere.
 *   throw distance    artwork "1.4-5 meters optimal projection distance"
 *                     SPECS + FULL_SPEC_SHEET say 0.9m - 5m, and 0.9m is
 *                     what the artwork's OWN distance scale was labelled
 *                     -> 0.9m - 5m.
 *   ladder steps      artwork stepped 35/75/125/200 against 0.9/1.5/2.5/5m,
 *                     which is not a 1:1 throw at any of them. Rebuilt from
 *                     THROW_RANGE's endpoints and the rule it already states
 *                     ("roughly another 40 inches of screen" per metre), so
 *                     the diagram, the dial and the spec table agree.
 *
 * ONE BOARD WAS DELETED RATHER THAN RE-TYPESET: "Access to 10,000+ Apps".
 * It was a photograph of a Google TV home screen carrying the Google TV,
 * Netflix, Disney+, Prime Video, Spotify, YouTube and Google Play marks, over
 * a grid of AI-generated film posters with garbled titles, around a projector
 * whose shell is not the shell that ships. None of that is ours to publish.
 * The 10,000+ apps CLAIM is untouched and still stated in copy — HIGHLIGHTS
 * above, FULL_SPEC_SHEET's "App Store" row, and the page descriptions.
 *
 * NO `alt` TRANSCRIPTIONS ANY MORE. Each board used to carry a long `alt`
 * restating its burned-in text, because the text WAS the content. Live type
 * needs none: the heading is a heading, the figures are figures, and the only
 * remaining images are decorative diagrams marked `aria-hidden`.
 */

/**
 * The two wide banners under the board row — the "why it looks and sounds
 * good" pair. Same shape as a board but landscape, with the callout strip
 * running along the bottom.
 */
export const HIGHLIGHT_BANNERS = [
  {
    id: 'brightness',
    eyebrow: 'Picture',
    headline: 'True 500 ANSI Lumens Projector',
    subhead: 'Brighter. Clearer. More Vibrant.',
    // The 1080P / 720P side-by-side the artwork made with two photographs of
    // the same strawberry. Drawn in CSS instead — see components/boards.
    compare: {
      good: { label: '1080P', caption: 'True 500 ANSI Lumens' },
      bad: { label: '720P', caption: 'Low Brightness Projectors' },
    },
    callouts: [
      { title: 'True 500 ANSI Lumens', body: 'Brighter and clearer images, even in normal light.' },
      { title: '1080P Resolution', body: 'Sharp and detailed visual experience.' },
      { title: 'Vibrant Colors', body: 'True-to-life and bright visuals.' },
      { title: '4Ω 5W Speaker', body: 'Louder and clearer sound for an immersive experience.' },
    ],
  },
  {
    id: 'speaker',
    eyebrow: 'Sound',
    headline: 'Powerful 5W Speaker',
    subhead: 'Never require a home theatre.',
    body: 'Loud, clear and immersive audio for a complete entertainment experience.',
    callouts: [
      { title: 'Loud & Clear Audio' },
      { title: 'Immersive Sound' },
      { title: 'True Home Theatre Experience' },
    ],
  },
];

/**
 * "What You Get" — three boards on the homepage.
 *
 * Four, before the apps board was deleted (see the note above). Three is also
 * a better row: the grid below md is a swipe carousel either way, and at lg
 * three wide tiles read better than four narrow ones.
 *
 * `figure` names the diagram components/boards draws beside the type. It is a
 * KEY, not a component: this file is imported by server and client components
 * alike and must stay free of JSX.
 */
export const HIGHLIGHT_BOARDS = [
  {
    id: 'chipset',
    figure: 'chipset',
    eyebrow: 'Platform',
    headline: 'Allwinner H723',
    subhead: 'Quad-core ARM Cortex-A53, ARM G31 MP2',
    callouts: [
      { value: '23%', title: 'Increase in CPU Performance' },
      { title: 'Hardware Keystone Correction' },
      { title: 'Android 14.0 OS' },
      { value: '8K', title: 'Supports 8K Video Decoding' },
    ],
  },
  {
    id: 'screen',
    figure: 'screen',
    eyebrow: 'Screen',
    headline: '200" Screen Projection Display',
    // 0.9m-5m, not the artwork's "1.4-5 meters optimal" — see the correction
    // note above.
    subhead: '0.9–5 metres projection distance',
    badge: 'Throw Ratio 1 : 1',
    callouts: [],
  },
  {
    id: 'keystone',
    figure: 'keystone',
    eyebrow: 'Setup',
    headline: 'Auto Keystone Correction',
    // Not a new line: this is HIGHLIGHTS' own "Auto Focus + Auto Keystone"
    // subtitle, above. The artwork carried a headline and nothing else, and a
    // tile needs a second line — so the sub-head is borrowed from copy this
    // file already states rather than written fresh, which would be a claim
    // the retail box has not seen.
    subhead: 'Sharp and perfectly square, automatically, every time you move it.',
    callouts: [],
  },
];

/**
 * The two boards in "Under the Hood" (components/TechSpecs) — the spec panel
 * and the latency panel. Same treatment and the same reasons as the three
 * above; kept in their own export because they belong to a different section
 * and a different grid.
 *
 * The spec rows are the artwork's own seven figures. Every one of them also
 * appears in FULL_SPEC_SHEET, which is what they are checked against —
 * except the projection size, which the artwork printed as "35-200 Inch" and
 * which is 40"-200" on the retail box. See the correction note above.
 */
export const TECH_BOARDS = {
  spec: {
    id: 'spec-sheet',
    headline: 'Native 1080P',
    subhead: '1920×1080 resolution',
    rows: [
      { label: 'Display Technology', value: '3.5" LTPS LCD' },
      { label: 'Chipset', value: 'Allwinner H723' },
      { label: 'Focus', value: 'Auto Focus' },
      { label: 'Projection Distance', value: '0.9m–5m' },
      { label: 'Projection Size', value: '40″–200″' },
      { label: 'Throw Ratio', value: '1:1' },
    ],
  },
  latency: {
    id: 'latency',
    headline: 'High Definition, Low Latency',
    // The artwork set 0.004s against a 2s figure labelled on the blurred,
    // still-loading half of a split game frame. Both numbers survive; the
    // stock game art does not.
    value: '0.004s',
    valueLabel: 'Response time',
    against: { value: '2s', label: 'Typical lag' },
  },
};

/**
 * The nested-screen ladder drawn inside the `screen` board.
 *
 * Derived, not transcribed: every step is THROW_RANGE's own rule — a 1:1
 * throw, so inches of diagonal run at roughly 40 per metre — which is what
 * makes the diagram, the scroll dial (components/ThrowRange) and
 * FULL_SPEC_SHEET's "Throw & Screen" group state the same thing. The
 * artwork's 35/75/125/200 ladder did not hold at any step.
 */
export const SCREEN_LADDER = [
  { size: 40, distance: 0.9 },
  { size: 100, distance: 2.5 },
  { size: 200, distance: 5 },
];

// The scroll-driven throw-range dial (components/ThrowRange.jsx). The numbers
// are the same ones the spec table states — SPECS' "Throw Ratio" row and
// FULL_SPEC_SHEET's "Throw & Screen" group — restated here as the endpoints
// the dial interpolates between. Change them in all three or the section will
// animate to a figure the table below it contradicts.
export const THROW_RANGE = {
  eyebrow: 'Throw',
  line: 'A 1:1 throw ratio. Every metre you step back is roughly another 40 inches of screen.',
  min: { size: 40, distance: 0.9 },
  max: { size: 200, distance: 5 },
};

export const SPECS = [
  { label: 'Brightness', value: '500', unit: 'True ANSI Lumens' },
  { label: 'Resolution', value: '1080P', unit: 'Native 1920×1080' },
  { label: 'Chipset', value: 'H723', unit: 'Allwinner, Quad-core Cortex-A53' },
  { label: 'Throw Ratio', value: '1:1', unit: '0.9m–5m · 40"–200" screen' },
  { label: 'Low-Latency Mode', value: '0.004s', unit: 'Response time' },
  { label: 'Audio', value: '5W', unit: '4Ω built-in speaker' },
];

/**
 * Pending-detail gate — the three spec cards whose values aren't confirmed yet.
 *
 * Nothing in the source manufacturer material covers the box contents,
 * the warranty terms, or the physical dimensions and weight (see the
 * file-header note above), so all three were written as explicit
 * "To be confirmed" placeholders rather than guessed at. Placeholders are
 * honest in a repo and unhelpful on a live page: a visitor reading the spec
 * sheet gets three cards that answer nothing, and the warranty one says so in
 * amber.
 *
 * `false` hides all three. Flip it to `true` once the details are confirmed
 * and they come back exactly as they were — nothing below has been deleted.
 *
 * What this gates, and where:
 *
 *   app/specs/page.jsx   the "Dimensions & Weight" group (filtered out of
 *                        FULL_SPEC_SHEET by its `pending` key), the whole
 *                        "In the Box" / "Warranty" section, and the bento
 *                        spans + meta description that describe the board
 *
 * The data itself — the "Dimensions & Weight" group below, BOX_CONTENTS,
 * WARRANTY — stays right here, in place and exported. Three cards are
 * hidden, not three facts thrown away; confirming them is an edit to the
 * values, not a rebuild of the page.
 *
 * NOT gated, on purpose:
 *   - The draft legal pages (app/legal/*) carry their own visible DRAFT
 *     banner via components/LegalPage. That is a different decision with a
 *     different audience — a policy page has to exist to be linked from a
 *     signup form, so it says it's a draft instead of hiding.
 *
 * Kept a plain constant rather than an env var for the same reason as
 * COMMERCE_ENABLED in lib/launch.js: the state belongs in the diff, not in
 * an environment that can drift.
 */
export const SHOW_PENDING_SPECS = false;

/**
 * Whether the site shows its privacy policy and the links to it.
 *
 * The policy at app/legal/privacy is a real, written document now — not the
 * placeholder draft this flag was added to hide — so it is ON, it is indexed,
 * and it is in the sitemap. The flag stays because the surfaces it gates are
 * worth being able to move together, and because turning them off is a one
 * line change rather than an archaeology exercise.
 *
 * What this gates, and where:
 *
 *   components/ConsentNotice    the whole fixed bar — the cookies/ads notice,
 *                               its Privacy Policy link and "Got it"
 *   components/Newsletter       the "By signing up, you agree to our Privacy
 *                               Policy." line under the inline form's button
 *   components/NewsletterPopup  the same line in the modal
 *   components/Footer           the Privacy Policy link beside the copyright
 *
 * NOT gated, deliberately, and this is the change from when it was false:
 *   - app/sitemap.js lists /legal/privacy unconditionally, and the page sets
 *     no robots noindex. Both of those were there to keep an unreviewed draft
 *     out of search results. A policy people are pointed at from a signup
 *     form has to be findable on its own.
 *
 * Off, the signup forms fall back to "No spam. Unsubscribe anytime." rather
 * than to nothing, so the fine print never disappears entirely.
 *
 * Kept a plain constant rather than an env var for the same reason as
 * COMMERCE_ENABLED in lib/launch.js: the state belongs in the diff, not in an
 * environment that can drift.
 */
export const SHOW_PRIVACY = true;

export const FULL_SPEC_SHEET = [
  { group: 'Optics & Display', rows: [
    ['Native Resolution', '1080P (1920×1080)'],
    ['Display Technology', '3.5" LTPS LCD'],
    ['Brightness', 'True 500 ANSI Lumens'],
    ['Video Decoding', 'Up to 8K (playback/decode only)'],
    ['Focus', 'Auto focus (fine-tune with F+/F- on the remote)'],
    ['Keystone Correction', 'Automatic, hardware-based'],
  ]},
  { group: 'Throw & Screen', rows: [
    ['Throw Ratio', '1:1'],
    ['Projection Distance', '0.9m – 5m'],
    ['Screen Size Range', '40" – 200"'],
    ['Angle Adjustment', 'Stepless, 0°–180°'],
  ]},
  { group: 'Platform', rows: [
    ['Chipset', 'Allwinner H723'],
    ['CPU', 'Quad-core ARM Cortex-A53'],
    ['GPU', 'ARM Mali-G31 MP2'],
    ['Operating System', 'Android 14'],
    ['App Store', '10,000+ official apps'],
  ]},
  { group: 'Connectivity & Audio', rows: [
    ['HDMI', '1× HDMI In'],
    ['USB', '1× USB-A'],
    ['Audio Out', '1× 3.5mm AV / headphone'],
    ['Power', '1× DC power in'],
    ['Speaker', '4Ω 5W built-in'],
    ['Low-Latency Mode', '0.004s response'],
  ]},
  // Dimensions/weight aren't in the source manufacturer material (see the
  // file-header note above) — flagged for confirmation rather than guessed,
  // same policy as pricing/ratings. `pending` is what SHOW_PENDING_SPECS
  // reads: measure a unit, replace the two values, drop this one key.
  { group: 'Dimensions & Weight', pending: true, rows: [
    ['Dimensions (W × D × H)', 'To be confirmed'],
    ['Weight', 'To be confirmed'],
  ]},
];

/**
 * What ships in the carton — read off the PRINTED retail box, which is the
 * change that matters here. The previous version of this list was inferred
 * from marketing copy and said "1× Google TV Remote"; the box says neither
 * Google TV nor a quantity, and it carries a fifth item the inference missed.
 *
 * The shape changed with the source. The old list was four plain strings for
 * a bulleted <ul>; these are rows, because components/ProductShowcase renders
 * each as an icon tile + title + optional sub-line. `icon` is a KEY, not a
 * component — the SVG paths live in ProductShowcase, so this file stays pure
 * content and nothing here imports from a component.
 *
 * Quantities went with the strings. "1×" on every row of a five-row list is
 * five identical prefixes carrying no information, and the box does not print
 * them either.
 *
 * Still inside SHOW_PENDING_SPECS on /specs, deliberately: the gate there
 * covers "In the Box" AND "Warranty" as one section, and the warranty terms
 * are still unconfirmed. The homepage section does not read that flag — these
 * five items are confirmed by the carton, so they ship.
 */
export const BOX_CONTENTS = [
  { icon: 'projector', title: 'IRIZ projector', note: 'Model BNA-510SH, with stand' },
  { icon: 'remote', title: 'Remote' },
  { icon: 'adapter', title: 'Power adapter', note: 'AC 90–240 V' },
  { icon: 'guide', title: 'Quick start guide' },
  { icon: 'faq', title: 'FAQ card' },
];

/**
 * The muted line under the box list. Three headline specs, each one already
 * stated in FULL_SPEC_SHEET above and each one printed on the carton — a
 * restatement at a glance, not a new claim.
 */
export const BOX_SUMMARY = 'Android 14 · 1080p · 500 ANSI lumens';

/**
 * The box photograph, with its INTRINSIC pixel size.
 *
 * The two numbers are the real dimensions of the file on disk, which is what
 * lets next/image reserve the space before the bytes land and keeps this
 * section out of the page's layout shift. They are also a warning: at 603px
 * wide the source is small, so ProductShowcase caps how large it is ever
 * drawn rather than letting a half-width column scale it past 1:1 and soften
 * it. Re-shoot at 1600px or wider and that cap can go.
 */
export const BOX_PHOTO = {
  src: MEDIA.product.boxFront,
  width: 603,
  height: 588,
  alt: 'BluNeuron IRIZ projector retail box, front view, model BNA-510SH',
};

export const WARRANTY = {
  summary: 'Warranty terms have not been finalized for launch.',
  note: 'To be confirmed before launch — placeholder only.',
};

export const COMPARISON = {
  columns: [
    { key: 'iriz', name: 'BluNeuron IRIZ', highlight: true },
    { key: 'other', name: 'Typical Budget Projector', highlight: false },
  ],
  rows: [
    // Price is a buy affordance even inside a comparison, so it leaves with
    // the rest of commerce. Spreading an empty array drops the whole <tr> —
    // ComparisonTable maps over `rows`, so there is no orphaned "Price"
    // label left behind. See lib/launch.js.
    ...(COMMERCE_ENABLED
      ? [
          {
            label: 'Price',
            iriz: `${formatPrice(PRICING.offerPrice)} (MRP ${formatPrice(PRICING.mrp)}, ${DISCOUNT_PERCENT}% off)`,
            other: 'Similar or higher, rarely discounted',
          },
        ]
      : []),
    { label: 'Brightness', iriz: 'True 500 ANSI Lumens', other: 'Inflated "lumens" claims' },
    { label: 'Resolution', iriz: 'Native 1080P', other: '720P, upscaled' },
    { label: 'Smart OS', iriz: 'Android 14', other: 'No smart OS' },
    { label: 'Keystone Correction', iriz: true, other: false },
    { label: 'Auto Focus', iriz: true, other: false },
    { label: 'Audio', iriz: '4Ω 5W speaker', other: '1–3W, thin sound' },
    { label: 'Low-Latency Mode', iriz: '0.004s', other: 'High input lag' },
    { label: 'Screen Size Range', iriz: '40" – 200"', other: 'Limited range' },
  ],
};

/*
 * PRODUCT_SHOTS IS GONE.
 *
 * It was a four-entry showcase — Lens, Shell, Stand, Rear Ports — and three
 * of its four images (`turntable-360`, `angles-ports-clean`,
 * `angle-iso-plain`) have never been in public/. Nothing read it:
 * components/ProductShowcase renders the retail-carton photograph on its own
 * (BOX_PHOTO, above) and does not import this array.
 *
 * It is deleted rather than repointed because there is no honest substitute
 * — we have no photograph of the shell, the stand or the rear ports, and
 * illustrating "Full I/O, Nothing Missing" with a picture of the retail box
 * would be a caption that lies. Supply the four renders and it comes back
 * from git history intact.
 */


// The "Why Shop BluNeuron" board. Each promise already had a number buried
// in its sentence (24 hours, 256-bit, 30 days, 24/7), so each one is split
// out as `stat`/`unit` and set as the tile's headline — the numbers are the
// reason to trust the claim, so they carry the tile instead of an icon.
//
// `feature: true` marks the one that anchors the bento board as a tall tile.
// The returns wording tracks /legal/returns exactly (30 days from delivery,
// full refund, original condition) — that page is still a draft and leaves
// return shipping and restocking undefined, so nothing here promises either.
export const TRUST_BADGES = [
  {
    icon: 'returns',
    stat: '30',
    unit: 'Days',
    title: 'Risk-Free Trial',
    text: 'Set it up on your own wall, in your own room, and live with it for a month. If it isn’t right, return it within 30 days of delivery in its original condition for a full refund.',
    feature: true,
  },
  {
    icon: 'truck',
    stat: '24',
    unit: 'Hours',
    title: 'Express Dispatch',
    text: 'Every order leaves the warehouse within a day of being placed.',
  },
  {
    icon: 'shield',
    stat: '256',
    unit: 'Bit',
    title: 'Encrypted Checkout',
    text: 'Bank-grade encryption on every payment.',
  },
  {
    icon: 'support',
    stat: '24/7',
    unit: 'Human Support',
    title: 'VIP Concierge',
    text: 'Real people on the other end, any hour — setup, troubleshooting, or a second opinion on where to mount it. No bots, no ticket queue.',
  },
];

export const SETUP_STEPS = [
  {
    title: 'Unbox and place it',
    body: 'Set the IRIZ on a flat, stable surface 0.9–5m from your screen or wall, using the stepless 0°–180° stand to angle it toward the projection surface.',
  },
  {
    title: 'Power on and connect Wi-Fi',
    body: 'Plug in the included power adapter and follow the on-screen Android setup to connect to your Wi-Fi network and sign in.',
  },
  {
    title: 'Let auto focus and keystone do the work',
    body: 'The IRIZ automatically focuses the image and squares up the corners the moment it detects it has settled in a new position — no manual sliders.',
  },
  {
    title: 'Fine-tune if needed',
    body: 'If the auto correction doesn’t nail it in a tricky room, nudge the focus with the F+/F- keys on the remote, or open Settings for keystone adjustment. Auto focus stays on — these are a trim on top of it, not a manual mode.',
  },
  {
    title: 'Start streaming',
    body: 'Use the remote to open any of the 10,000+ pre-installed apps — Netflix, YouTube, Disney+, Prime Video, and more.',
  },
];

export const FAQS = [
  {
    q: 'What does "500 ANSI Lumens" actually mean?',
    a: 'ANSI lumens is the projector industry’s standardized brightness measurement, taken as an average across nine points on the projected image. Unlike "LED lumens" marketing numbers (measured at the bulb, before any optical loss), ANSI lumens reflects what you actually see on the wall — so the IRIZ’s 500 ANSI lumens holds up in a normally lit room.',
  },
  {
    q: 'Do I need a special screen?',
    a: 'No. The IRIZ projects onto any flat, light-colored wall or surface. A dedicated projector screen will improve contrast and color accuracy, but it isn’t required to get started.',
  },
  {
    q: 'How far away does it need to be?',
    a: 'The IRIZ has a 1:1 throw ratio and works from 0.9m to 5m away, producing a 40″ to 200″ image depending on distance.',
  },
  {
    q: 'Does it work without Wi-Fi?',
    a: 'Basic playback over HDMI or USB works without a network connection. The Android 14 smart features — the built-in app store and the streaming apps — require Wi-Fi.',
  },
  {
    q: 'What’s the input lag for gaming?',
    a: 'Low-Latency Mode brings response time down to 0.004s, suitable for casual and most competitive gaming over the HDMI input.',
  },
  {
    q: 'Can I connect a game console or laptop?',
    a: 'Yes — the IRIZ has an HDMI input for consoles, laptops, and streaming boxes, plus a USB port for direct media playback and a 3.5mm output for external speakers or headphones.',
  },
];

export const TROUBLESHOOTING = [
  {
    issue: 'Image looks blurry',
    fix: 'Auto focus runs automatically whenever the projector is moved. If it hasn’t re-triggered, open Settings → Display → Auto Focus on the remote to run it again, or trim it with the F+/F- keys on the remote.',
  },
  {
    issue: 'Image isn’t square (trapezoid shape)',
    fix: 'Auto keystone correction should square the image automatically on movement. If it looks off, open Settings → Display → Keystone Correction and adjust manually, or reseat the projector so it’s more level with the wall.',
  },
  {
    issue: 'No sound',
    fix: 'Check that the volume isn’t muted via the remote, and that an external speaker (if connected via the 3.5mm output) is powered on and selected as the audio output in Settings → Sound.',
  },
  {
    issue: 'Won’t connect to Wi-Fi',
    fix: 'Confirm the network is 2.4GHz or 5GHz (check your router’s settings) and that the password was entered correctly. Restarting the projector from Settings → System → Restart often resolves transient connection issues.',
  },
  {
    issue: 'Remote isn’t responding',
    fix: 'Check that the remote has line of sight to the projector, and that its batteries are correctly inserted. Re-pairing instructions are in Settings → Remote & Accessories.',
  },
];

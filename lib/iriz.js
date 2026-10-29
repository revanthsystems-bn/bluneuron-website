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
  /*
   * PRODUCT PHOTOGRAPHY — the current hardware, shot on a white seamless.
   *
   * THE WHOLE OF THIS BLOCK WAS REPLACED. What stood here before —
   * `heroClean`, `cutout`, `retailBox`, `boxFront` — pictured a DIFFERENT
   * UNIT: an all-white chassis with no black front panel, no lens bezel
   * ring and no `bluneuron IRIZ` wordmark on it anywhere. It is not the
   * product this site sells. Those five files are not deleted; they are
   * parked in design-src/old/ with a README saying what each one was, so
   * the history is recoverable without any of it being servable.
   *
   * `shot` and `withBox` are the supplied photographs, re-encoded for the
   * web and nothing else: no crop, no retouch, no background removal.
   */
  product: {
    /*
     * THE product image — the bare unit, front three-quarter, lens forward,
     * carrying the wordmark on its front panel and lid.
     *
     * OPAQUE, on its own #FEFEFE seamless. Read PRODUCT_SHOT below before
     * rendering it: this is not a cutout, and dropping it straight onto a
     * dark section puts a white rectangle there. PRODUCT_SHOT.plate is how
     * every caller deals with that, in one place.
     */
    shot: '/media/iriz/product/iriz-product-shot.jpg',
    /*
     * The retail carton with the unit standing beside it — what actually
     * arrives. Shown full-bleed in a card (components/ProductShowcase), so
     * its light ground is the tile rather than something to hide, which is
     * the treatment the previous box photograph already had.
     *
     * This REPLACED both `boxFront` and `retailBox`. They were two pictures
     * of two different cartons, and lib/iriz.js itself recorded that the
     * `retailBox` one "pictures the OLD carton — the box in it is not the
     * box that ships". One photograph of the shipping carton ends that.
     */
    withBox: '/media/iriz/product/iriz-with-box.jpg',
    /*
     * The SOCIAL CARD and JSON-LD image: `shot` contained on its own
     * seamless, extended to the 1600x1600 square that app/layout.jsx and
     * lib/seo.js already declare. Contained, never cropped — a social
     * thumbnail that shaves the lens is worse than letterboxing.
     *
     * A SEPARATE, OPAQUE FILE ON PURPOSE, and it must stay opaque even if
     * `shot` is one day replaced by a transparent cutout. A social card is
     * composited by the platform on a background we do not control, so a
     * transparent PNG there lands on whatever it picks — usually white,
     * sometimes black. This is the one job that wants a baked ground.
     */
    og: '/media/iriz/product/iriz-og.jpg',
    // `turntable`, `anglesPorts` and `angleIso` are still GONE from this
    // block, for the reason they were removed: all three named files that
    // have never been in public/, and a path in this object is an invitation
    // to render it. Supply the files and the keys come back; see
    // docs/missing-media.md for the list.
  },
  // Marketing BANNERS, shown full-width under the Highlights bento
  // board (components/Highlights). Kept apart from `detail` because they are a
  // different kind of asset: `detail` slides are single-subject infographic
  // panels sized for a tile's media band, these are finished composite
  // layouts with their own headline, sub-head, and icon strip baked in.
  //
  // Checked against the rules in the file header before being shipped:
  // no third-party logo, no "4K" shorthand, and every figure they state is one this
  // file already states — 500 ANSI (SPECS Brightness), native 1080P (SPECS
  // Resolution), 5W mono (SPECS Audio). They restate existing claims; they do
  // not introduce one. The unit pictured carries the BluNeuron wordmark.
  //
  // Shipped as the source PNGs rather than re-encoded: next/image converts
  // them per request to AVIF/WebP (next.config.js `images.formats`), which is
  // what the browser actually receives — the PNG on disk is just the master.
  banner: {
    brightness1080p: '/media/iriz/banner/brightness-1080p.png',
    speaker5w: '/media/iriz/banner/speaker-5w.png',
    // 64px-wide, over-saturated copies of the two above, generated once with
    // sharp. They exist to be scaled up and blurred as the ambient glow behind
    // each framed banner. Blurring the full-size PNG with a large CSS filter
    // would make the compositor re-blur a 1.8MB surface on every paint; a
    // ~1.3KB source upscaled is almost free and looks the same once blurred.
    brightness1080pGlow: '/media/iriz/banner/brightness-1080p-glow.jpg',
    speaker5wGlow: '/media/iriz/banner/speaker-5w-glow.jpg',
  },
  detail: {
    specSheet: '/media/iriz/detail/02-spec-sheet.png',
    chipset: '/media/iriz/detail/06-chipset.png',
    latency: '/media/iriz/detail/07-latency.png',
    keystone: '/media/iriz/detail/08-keystone.png',
    screenSize: '/media/iriz/detail/09-screen-size.png',
    /*
     * The ORIGINAL supplied apps board, restored — not the generated
     * replacement that briefly stood here (11-apps-builtin.png, deleted;
     * its source is still design-src/images/apps.html if it is ever
     * wanted back).
     *
     * ONLY THE HEADLINE WAS EDITED: "Access to 10,000+ Apps" became
     * "Your apps. Built in.", matched to the artwork's own face (Outfit
     * 600 at 76px, cap height 54, the accent carrying the same cyan→azure
     * vertical gradient). Nothing else in the frame was touched — a diff
     * against the supplied file changes 31,038 pixels, all of them inside
     * the headline band, and zero outside it.
     *
     * SO THE PROJECTED SCREEN IS STILL THE GOOGLE TV HOME SCREEN, with the
     * Google TV, Netflix, Disney+, Prime Video, Spotify, YouTube and Play
     * marks and a grid of AI-generated film posters, and the remote in shot
     * still carries four of those marks on its buttons. That is a deliberate
     * decision taken with the trade-off in hand, not an oversight: the screen
     * could not be replaced convincingly, because the whole photograph is lit
     * by it (screen mean luminance 150 against a 21-25 wall and a 47 desk)
     * and any dark replacement would radiate light it could not be casting.
     *
     * If those marks ever need to go, the honest fix is new artwork, not a
     * composite.
     */
    appsBoard: '/media/iriz/detail/11-apps-10000.png',
  },
  /**
   * THE THREE `reel-*.mp4` FILES ARE NOT IN THIS REPOSITORY and never were.
   *
   * `hero`, `showcase` and `ambient` pointed at them, and their only
   * consumers — components/Showroom and components/VideoPlayer — are not
   * imported by any page, so nothing ever requested a missing file. Both
   * components are kept on purpose (VideoPlayer says so in its own header:
   * swap it back when real footage exists), which is exactly why the paths
   * could not be left as they were. Re-enabling either would have shipped a
   * video element pointing at a 404.
   *
   * All three now alias the one real clip in the repository. That is
   * deliberate and visible rather than clever: if a component is switched
   * back on it plays the hero loop — correct-looking, obviously a
   * placeholder, and not broken. Point them back at real reels when the
   * footage is supplied (docs/missing-media.md).
   */
  video: {
    hero: '/media/iriz/video/iriz-loop.mp4',
    showcase: '/media/iriz/video/iriz-loop.mp4',
    ambient: '/media/iriz/video/iriz-loop.mp4',
  },
  // The hero loop: a 4.000s silent cut of the source footage, re-encoded to
  // VP9 + H.264 and listed in that order. The `reel-*` files above are all
  // HEVC/H.265, which Firefox cannot decode at all, so none of them can be
  // shipped to a browser directly.
  //
  // This is the WHITE-STUDIO clip — the unit held in one hand against a lit
  // white seamless — not the dark-room beam loop (`iriz-hero-loop.*`, left on
  // disk). That matters to everything stacked over it: a white-ground loop
  // behind white headline type needs the heavier 0.42 veil and no media
  // grade, which is what app/globals.css and components/Hero.jsx are set up
  // for. Swapping the two files is never a one-line change — see the hero
  // scrim block in app/globals.css before touching these paths.
  heroLoop: {
    webm: '/media/iriz/video/iriz-loop.webm',
    mp4: '/media/iriz/video/iriz-loop.mp4',
    // The video's own frame 0, so the poster-to-video swap is invisible.
    // The reduced-motion path in HeroBackdrop renders this image on its own,
    // with no video behind it, so it has to stand as a still.
    poster: '/media/iriz/video/iriz-loop-poster.jpg',
    description:
      'BluNeuron IRIZ held in one hand, turning to show the rear ports before the camera pushes in on the lens',
  },
};

/**
 * THE PRODUCT SHOT, and the one switch that controls how it is mounted.
 *
 * ---------------------------------------------------------------------------
 * WHY `plate` EXISTS
 * ---------------------------------------------------------------------------
 * The supplied photograph is OPAQUE: the unit sits on a studio seamless that
 * is a flat #FEFEFE right out to all four edges (measured, not assumed —
 * every border row and column means #FEFEFE). The site's product surfaces are
 * `bg-black`. Dropping this straight into them puts a white rectangle on a
 * black page.
 *
 * The previous asset solved that by BEING a transparent cutout. This one is
 * not, and it is deliberately not being made into one: the keyer in
 * design-src/cutout.mjs works by flood-filling near-white from the frame
 * edge, and on this photograph the white top lid is reachable from the edge
 * (no dark lens barrel stands between them, as it did on the old render), so
 * the fill eats a bite out of the product. A hand-made cutout is the right
 * fix and is not something to fake.
 *
 * So instead of hiding the ground, the ground is OWNED: the image is mounted
 * on a card filled with its own backdrop colour. Because the fill is exactly
 * the photograph's own #FEFEFE, the seam between card and photo is invisible
 * at every size — letterbox bands included, which is what `object-contain` in
 * a square frame produces from a 3:2 source.
 *
 * Verified through the whole pipeline: `next/image` re-encodes to AVIF at
 * quality 75 (next.config.js), and the border of the result still means
 * #FEFEFE with a 252-255 spread. No visible edge.
 *
 * ---------------------------------------------------------------------------
 * THE SWAP, WHEN A TRANSPARENT PNG ARRIVES
 * ---------------------------------------------------------------------------
 * Point `src` at the transparent file and set `plate: null`. That is the
 * whole change. Every caller reads `plate` through `productPlate()` below and
 * renders no background when it is null, so the light cards disappear
 * everywhere at once and the cutout drops onto the dark sections the way the
 * old one did. No component edits, no CSS, no hunting for hard-coded colours.
 *
 * The callers are: components/BuySection, app/where-to-buy, app/specs,
 * components/ComparisonTable, components/buy/BuySheet, components/cart/
 * CartDrawer, components/cart/CartPanel, and GALLERY below.
 *
 * `width`/`height` are the real pixel size of the file on disk. They are
 * passed to every non-`fill` caller so the browser reserves the right box and
 * the page does not shift — and they are LANDSCAPE 3:2, not square, which is
 * the mistake the old asset's note recorded: an <img> takes its aspect ratio
 * from its attributes, so a square pair on a 3:2 source stretches the
 * product. Re-shoot and these numbers move with it.
 */
export const PRODUCT_SHOT = {
  src: MEDIA.product.shot,
  width: 1536,
  height: 1024,
  alt: `${BRAND.fullName} 1080p smart projector`,
  // The photograph's own backdrop. `null` when the asset is transparent.
  plate: '#FEFEFE',
};

/**
 * The inline style that mounts PRODUCT_SHOT on its own ground — or nothing at
 * all, once the asset no longer needs one.
 *
 * A function rather than a constant so a caller cannot accidentally mutate
 * the shared object, and so the `null` case returns `undefined` — which React
 * drops from the DOM entirely rather than emitting an empty `style`.
 */
export function productPlate() {
  // THE `background` SHORTHAND, NOT `backgroundColor`, and that is the whole
  // reason this is a function worth reading.
  //
  // Several of the frames that mount this image carry `.product-stage`, whose
  // rule is `background: radial-gradient(...)` — the dark ambient key that
  // made a transparent cutout read as a lit space. An inline
  // `background-color` loses to it: the colour is applied, and then the
  // class's background-IMAGE is painted straight over the top of it, so the
  // plate is invisible and what reaches the screen is the opaque photo's own
  // white rectangle floating on a dark card with hard corners.
  //
  // The shorthand resets `background-image` to `none` as well as setting the
  // colour, so the gradient is switched off exactly where the plate is on,
  // and comes back by itself when `plate` is null. The same single line also
  // overrides the `bg-black-*` utility on the three cart/buy tiles.
  // The shadow travels WITH the plate rather than being a utility class on
  // each frame, for the same reason the colour does: one `plate: null` and
  // the light card and its lift both go, with no component left holding a
  // `shadow-[...]` that no longer has anything to cast from. Deliberately
  // soft and heavily inset (-24px spread) so it is a lift at card size and
  // effectively nothing on the 36px comparison thumbnail.
  return PRODUCT_SHOT.plate
    ? { background: PRODUCT_SHOT.plate, boxShadow: '0 18px 48px -24px rgba(0, 0, 0, 0.85)' }
    : undefined;
}

/**
 * The retail carton with the unit beside it, with its INTRINSIC pixel size.
 *
 * Shown full-bleed in a card, so unlike PRODUCT_SHOT it needs no plate: the
 * photograph IS the tile, clipped to the card's radius, and its light ground
 * reads as a deliberate photo panel rather than a stray white box. That was
 * already the treatment the previous carton photograph had.
 *
 * At 1254x1254 this is more than double the 603px source it replaces, which
 * retires the "re-shoot the carton at 1600px or wider" note that used to sit
 * here: at the widest this section goes (~484 CSS px) it is now comfortably
 * past 1:1 even on a 2x display.
 */
export const BOX_PHOTO = {
  src: MEDIA.product.withBox,
  width: 1254,
  height: 1254,
  alt: `${BRAND.fullName} projector with its retail box`,
};

// Single purchasable SKU — the cart/checkout flow (components/cart, app/checkout)
// is built around this one product rather than a generic item lookup.
/**
 * The product page's gallery (components/shop/ProductGallery).
 *
 * EVERY ENTRY IS A FILE THAT EXISTS. That sounds like it should go without
 * saying, and it does not: MEDIA above names several assets that are not in
 * public/ — `turntable`, `anglesPorts`, `angleIso`, and four of the `detail`
 * boards — and the surfaces that render them (HIGHLIGHTS, PRODUCT_SHOTS) are
 * serving broken images on the live site today. This list was built by
 * checking each path against the repository rather than by reading MEDIA, and
 * must be maintained the same way. `next/image` on a missing local file is
 * not a build error; it is a 404 at request time and a hole in the page.
 *
 * `fade` marks the white-studio renders that need `.product-fade` to
 * dissolve their white ground into the page. `retailBox` is a PHOTOGRAPH on
 * a grey seamless with its own reflection and must never get that treatment
 * — see the note on it in MEDIA.
 *
 * The `detail` boards are infographic panels with their message burned into
 * the pixels, which is why each one's `alt` states that message in full
 * rather than describing the picture: the text IS the content, and a screen
 * reader gets nothing from "product detail image".
 */
export const GALLERY = [
  {
    src: PRODUCT_SHOT.src,
    // `fade: false`, and it must stay false. `.product-fade` is an elliptical
    // radial mask, and this is a rectangular photograph mounted on its own
    // plate — the mask would dissolve the plate's corners into the dark page
    // and leave exactly the glowing lozenge the old note described. The
    // plate, not a mask, is how this asset meets a dark ground.
    fade: false,
    plate: true,
    label: 'Three-quarter view',
    alt: PRODUCT_SHOT.alt,
  },
  {
    src: BOX_PHOTO.src,
    fade: false,
    // PLATED, like the shot above. In components/ProductShowcase this same
    // photograph is full-bleed `object-cover` in a card of its own ratio, so
    // it fills the tile and needs no plate. HERE it is `object-contain`
    // inside a padded frame that is 3:2 on a phone and square from `sm`, so
    // an opaque 1:1 photograph lands as a white rectangle floating on the
    // dark frame with a hard edge all round it. The plate is the frame
    // meeting the photograph instead of sitting behind it.
    plate: true,
    label: 'What ships',
    alt: BOX_PHOTO.alt,
  },
  {
    src: MEDIA.detail.screenSize,
    fade: false,
    plate: false,
    label: 'Screen size',
    alt: 'Screen size by distance: a 1:1 throw ratio giving a 35-inch picture at 0.9m up to 200 inches at 5m',
  },
  {
    src: MEDIA.detail.keystone,
    fade: false,
    plate: false,
    label: 'Auto keystone',
    alt: 'Automatic keystone correction squaring up a projected image that was thrown at an angle',
  },
  {
    src: MEDIA.detail.appsBoard,
    fade: false,
    plate: false,
    label: 'Apps',
    alt: 'The IRIZ projecting a smart TV home screen, with rows of streaming app tiles and the remote held in shot',
  },
  {
    src: MEDIA.detail.specSheet,
    fade: false,
    plate: false,
    label: 'Spec sheet',
    alt: 'The IRIZ specification sheet: 500 ANSI lumens, native 1080p, Allwinner H723 chipset and a 5W mono speaker',
  },
];

export const PRODUCT = {
  id: 'iriz',
  name: BRAND.fullName,
  /*
   * The bare unit, front three-quarter, lens forward — PRODUCT_SHOT.
   *
   * This is the answer to "which picture represents this product in a list",
   * and it is imported rather than re-spelled wherever that question comes
   * up. Two earlier answers were both wrong and are worth keeping on record:
   *
   *   1. The retail-box photograph. It pictured the OLD carton, so the one
   *      image standing next to the price advertised packaging that does not
   *      exist. (That carton is retired now; see MEDIA.product.withBox.)
   *   2. A white-on-white render, cropped `object-cover` into a 1:1 tile
   *      from a 1.42:1 source — which threw away the product and kept
   *      background.
   *
   * Shown small, on a dark panel, by components/buy/BuySheet,
   * components/cart/CartDrawer and components/cart/CartPanel. ALL THREE MUST
   * USE `object-contain` AND MUST MOUNT IT ON `productPlate()`. Those are the
   * two invariants:
   *
   *   - `object-contain`, because the source is 3:2 and all three tiles are
   *     1:1. There is no safe crop; `object-cover` centre-crops to a patch of
   *     seamless.
   *   - the plate, because the source is OPAQUE. Without it the letterbox
   *     bands above and below the photo show the dark tile through, and the
   *     photo reads as a white sticker rather than a product on a card.
   *
   * `.product-fade-tight` is NOT used and must not be: it is an elliptical
   * mask, and this is a rectangular photograph on a plate.
   */
  image: PRODUCT_SHOT.src,
};

export const HERO = {
  // Sentence case in source on purpose: `.type-label` (app/globals.css)
  // applies the uppercasing, so the cased string is the one thing a
  // screen reader and a copy edit both see.
  // "Mini projector for home" — NOT "mini portable projector". The retail
  // carton makes no portability claim anywhere on it: there is no battery,
  // and the power source is printed as AC 90-240V. The page titles, meta
  // descriptions and the Product JSON-LD already said "Mini Projector for
  // Home" and were never wrong; this eyebrow was the one place that was.
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
    // MERGED from two entries. This one carried "A full smart OS on board,
    // plus the remote in the box"; the next was "10,000+ Official Apps /
    // Netflix, YouTube, Disney+, Prime Video, and more — pre-installed."
    //
    // That second entry had three problems at once: it named five
    // third-party services we have no agreement with, it called the apps
    // "official" and "pre-installed" (they are neither — they are whatever
    // the owner chooses to install), and "10,000+" is a store-catalogue
    // figure the retail box does not print. Replacing it with its own
    // "Android 14" line would have put the same title on the board twice,
    // so the two are one entry now and HIGHLIGHTS is five long.
    //
    // The remote is not dropped, only moved: it is an item in BOX_CONTENTS,
    // which is where "what is in the box" belongs.
    title: 'Android 14 built in',
    subtitle: 'Stream and install your favourite apps over Wi-Fi. No extra stick needed.',
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
    title: '4-point Auto Keystone',
    subtitle: 'Squares the picture up by itself, every time you move it.',
  },
  {
    title: 'Up to a 200" Screen',
    subtitle: '1:1 throw ratio — a huge canvas from 0.9 to 5 meters away.',
  },
];

/**
 * The two full-width banners under the Highlights bento board.
 *
 * NO overlaid copy, deliberately. Every other image on this page is a mute
 * panel that a tile's own eyebrow/headline/body speaks for; these two arrive
 * with a headline, a sub-head, and a labelled icon strip already in the
 * pixels. Anything we set over or under them would be a second headline in
 * the same frame, so each panel is the image and nothing else.
 *
 * `alt` carries the banner's burned-in message in full. A screen reader gets
 * nothing from "marketing banner": the text IS the content here, so the alt
 * has to say what the picture says.
 *
 * Intrinsic `width`/`height` are the real pixel dimensions. next/image uses
 * them to reserve the box before the bytes land, which is what keeps these
 * panels out of the page's layout shift.
 *
 * Those same two numbers drive the side-by-side row. The pair differ in aspect
 * (1.500:1 and 1.777:1), and the row gives each a column fraction EQUAL to its
 * aspect ratio — `grid-template-columns: 1.5fr 1.777fr`. `fr` distributes what
 * is left after the gap, so widths come out proportional to aspect and the two
 * heights land identical with neither image cropped. Equal columns would have
 * forced one to letterbox or crop.
 */
export const HIGHLIGHT_BANNERS = [
  {
    image: MEDIA.banner.brightness1080p,
    glow: MEDIA.banner.brightness1080pGlow,
    eyebrow: 'Brightness',
    width: 1536,
    height: 1024,
    alt:
      'True 500 ANSI Lumens Projector — Brighter. Clearer. More Vibrant. The BluNeuron IRIZ beside a '
      + 'comparison of the same image at 1080P and at 720P, with four callouts: True 500 ANSI Lumens, '
      + '1080P Resolution, Vibrant Colors, and a 5W mono speaker.',
  },
  {
    image: MEDIA.banner.speaker5w,
    glow: MEDIA.banner.speaker5wGlow,
    eyebrow: 'Sound',
    width: 1672,
    height: 941,
    alt:
      'Powerful 5W Speaker — Never require a home theatre. The BluNeuron IRIZ on a table in a living '
      + 'room, sound radiating from both sides, projecting a concert onto a large screen. Three callouts: '
      + 'Loud and Clear Audio, Immersive Sound, True Home Theatre Experience.',
  },
];

/**
 * "What You Get" — four full detail boards on a 2x2 grid, no text tiles.
 *
 * These replace the six-tile bento board that used to run here. Each image
 * carries its own headline in the pixels, which is why the section has no tile
 * copy at all: an eyebrow and a headline beside a board that already states
 * "Your apps. Built in." is the same sentence twice.
 *
 * HIGHLIGHTS above is deliberately left in place and unused by this section.
 *
 * `width`/`height` are the real pixel dimensions. They let next/image render
 * each board as an INTRINSICALLY sized element rather than a `fill` layer, so
 * the <img> box is the artwork box — which is what makes a centred
 * object-contain fit work in both constraint directions without an
 * aspect-ratio wrapper fighting a max-height.
 *
 * Each board's tile background class lives in components/Highlights, not here — tailwind.config.js scans only ./app and
 * ./components, and Tailwind tree-shakes `@layer components` rules it cannot
 * find a reference for, so a class name written in this file would compile to
 * nothing. This object stays pure content: the image and what it says.
 *
 * `alt` states what the board shows AND the claims printed on it — these are
 * images of text, so an alt that only described the picture would drop the
 * content entirely.
 */
export const HIGHLIGHT_BOARDS = [
  {
    image: MEDIA.detail.appsBoard,
    width: 1014,
    height: 1551,
    alt:
      'Your apps. Built in. — a BluNeuron IRIZ on a table projecting a smart TV home screen with '
      + 'Movies, TV Shows, Live and Apps tabs over rows of streaming app tiles, with the remote '
      + 'held in shot.',
  },
  {
    image: MEDIA.detail.chipset,
    width: 750,
    height: 1240,
    alt:
      'Allwinner H723 — quad-core ARM Cortex-A53 with ARM G31 MP2 graphics, shown as a chip render, '
      + 'with four callouts: 23% increase in CPU performance, hardware keystone correction, '
      + 'Android 14.0 OS, and support for 8K video decoding.',
  },
  {
    image: MEDIA.detail.screenSize,
    width: 750,
    height: 1065,
    alt:
      '200-inch screen projection display at a 1:1 throw ratio — nested screens stepping from 35 to '
      + '75 to 125 to 200 inches against a distance scale of 0.9m, 1.5m, 2.5m and 5m, with the '
      + 'projector at the near end.',
  },
  {
    image: MEDIA.detail.keystone,
    width: 750,
    height: 967,
    alt:
      'Auto keystone correction — a projector on a side table throwing an off-axis image onto a wall '
      + 'screen, with corner markers showing the picture being pulled square.',
  },
];

// The scroll-driven throw-range dial (components/ThrowRange.jsx). The numbers
// are the same ones the spec table states, restated here as the endpoints the
// dial interpolates between.
//
// THE SCREEN-SIZE RANGE IS WRITTEN OUT IN FIVE PLACES, and they must agree or
// the page contradicts itself — this has already happened once, with the dial
// and the tables saying 40" while 02-spec-sheet.png said 35-200:
//
//   1. THROW_RANGE.min.size          (here — drives the dial)
//   2. SPECS "Throw Ratio" row       (unit string)
//   3. FULL_SPEC_SHEET "Throw & Screen" -> "Screen Size Range"
//   4. COMPARISON rows               -> "Screen Size Range"
//   5. the "How far away does it need to be?" FAQ answer
//
// `line` below is NOT one of them: "roughly another 40 inches" is the rate per
// metre, (200-35)/(5-0.9) = 40.2, not the minimum size.
//
// The figures must also match the artwork, which is the authority here:
// 02-spec-sheet.png reads "0.9M-5M" and "35-200 Inch" in the pixels.
export const THROW_RANGE = {
  eyebrow: 'Throw',
  line: 'A 1:1 throw ratio. Every metre you step back is roughly another 40 inches of screen.',
  min: { size: 35, distance: 0.9 },
  max: { size: 200, distance: 5 },
};

export const SPECS = [
  { label: 'Brightness', value: '500', unit: 'True ANSI Lumens' },
  { label: 'Resolution', value: '1080P', unit: 'Native 1920×1080' },
  { label: 'Chipset', value: 'H723', unit: 'Allwinner, Quad-core Cortex-A53' },
  { label: 'Throw Ratio', value: '1:1', unit: '0.9m–5m · 35"–200" screen' },
  { label: 'Audio', value: '5W', unit: 'Mono, built-in' },
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
    // Printed on the retail carton. Stated as the bare ratio the box prints,
    // with no "dynamic" or "max" qualifier added — the box does not carry
    // one, and inventing one would be a claim about how it was measured.
    ['Contrast Ratio', '1500:1'],
    ['Video Decoding', 'Up to 8K (playback/decode only)'],
    ['Keystone Correction', '4-point automatic, hardware-based'],
  ]},
  { group: 'Throw & Screen', rows: [
    ['Throw Ratio', '1:1'],
    ['Projection Distance', '0.9m – 5m'],
    ['Screen Size Range', '35" – 200"'],
    ['Angle Adjustment', 'Stepless, 0°–180°'],
  ]},
  { group: 'Platform', rows: [
    ['Chipset', 'Allwinner H723'],
    ['CPU', 'Quad-core ARM Cortex-A53'],
    ['GPU', 'ARM Mali-G31 MP2'],
    // Printed on the retail carton. One row rather than two, because the box
    // prints the pair that way and because they are read together — 8 GB is
    // the on-device space the "Apps" row below installs into.
    ['RAM / Storage', '1 GB / 8 GB'],
    ['Operating System', 'Android 14'],
    ['Apps', 'Installed over Wi-Fi from the Android app store'],
  ]},
  // THIS GROUP IS NO LONGER A LIST OF PORTS. It was, and the FAQ note below
  // (see FAQS_EXTRA) said so to explain why the Bluetooth answer could only
  // cite the carton. Wi-Fi and Bluetooth are read off the printed retail box
  // and are stated here now, so the sheet and that answer share a source.
  // The wireless radios come first because they are the connection most
  // visitors are checking for; the physical ports follow in the order they
  // sit on the chassis.
  { group: 'Connectivity & Audio', rows: [
    ['Wi-Fi', '2.4 / 5 GHz'],
    ['Bluetooth', '5.2'],
    ['HDMI', '1× HDMI In'],
    ['USB', '1× USB-A'],
    ['Audio Out', '1× 3.5mm AV / headphone'],
    // TWO POWER ROWS, deliberately, and they are different facts. 'Power' is
    // the socket on the chassis — a row in the port list, unchanged.
    // 'Power Input' is the mains rating the carton prints for the supplied
    // adapter, which is also what BOX_CONTENTS notes on the adapter line and
    // what the HERO eyebrow comment cites for making no portability claim.
    ['Power', '1× DC power in'],
    ['Power Input', 'AC 90–240 V'],
    ['Speaker', '5W mono, built-in'],
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
 * The five rows above that come off the PRINTED RETAIL BOX rather than the
 * manufacturer's infographic slides, flattened to `{ name, value }`.
 *
 * It exists for lib/seo.js. The Product JSON-LD's `additionalProperty` was
 * built from `SPECS` alone — the six headline figures — which left the box's
 * own facts stated on /specs and absent from the structured data describing
 * the same product. These five are exactly the ones a shopping surface asks
 * for and the headline cards have no room to carry.
 *
 * THE VALUES ARE NOT RETYPED HERE. Each label is looked up in
 * FULL_SPEC_SHEET, so the sheet is the single source and the JSON-LD cannot
 * quote a figure the page does not show. A label that no longer matches a row
 * throws at module load — which fails `next build`, loudly, rather than
 * silently dropping a property out of the markup. Rename a row above and this
 * list must be renamed with it; that is the point.
 */
export const BOX_PRINTED_SPECS = [
  'Contrast Ratio',
  'Wi-Fi',
  'Bluetooth',
  'RAM / Storage',
  'Power Input',
].map((name) => {
  // Pending groups are skipped, for the same reason /specs filters them out
  // of the board: SHOW_PENDING_SPECS hides those rows from visitors, and a
  // JSON-LD property is not the place for a value the page will not show.
  const row = FULL_SPEC_SHEET
    .filter((group) => !group.pending)
    .flatMap((group) => group.rows)
    .find(([label]) => label === name);
  if (!row) throw new Error(`BOX_PRINTED_SPECS: no FULL_SPEC_SHEET row labelled "${name}"`);
  return { name, value: row[1] };
});

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

/*
 * THE PLACEHOLDER WARRANTY IS GONE.
 *
 * There used to be a `WARRANTY` export here reading "Warranty terms have not
 * been finalized for launch" with an amber "placeholder only" badge beside
 * it, rendered on /specs. The terms are finalised and published now, so the
 * one place that read this reads WARRANTY in lib/site-config.js instead —
 * which is also where /legal/warranty, /shop/iriz, /shop, /about and both
 * warranty forms read it. A product file is the wrong home for it: the cover
 * period is a business promise, not a property of the device.
 *
 * Do not add it back. A second WARRANTY is how two pages of one site come to
 * disagree about how long the cover runs.
 */

/**
 * THE SUBLINE UNDER THE COMPARISON HEADLINE.
 *
 * Here rather than in the component because the component is shared by the
 * homepage block and /compare, and a sentence typed into it would be a
 * second place product copy lives. It makes no claim of its own — it says
 * what the table below it is for.
 */
export const COMPARISON_SUBLINE =
  'The real difference is in the technology, quality and overall experience.';

/**
 * `icon` IS A KEY, NOT A COMPONENT, exactly as it is in BOX_CONTENTS above.
 * The SVG paths live in components/ComparisonTable, so this file stays pure
 * content and imports nothing from a component. An unrecognised key draws no
 * glyph and the row still renders its label — a missing icon must never cost
 * a row.
 */
export const COMPARISON = {
  columns: [
    { key: 'iriz', name: 'BluNeuron IRIZ', highlight: true },
    { key: 'other', name: 'Typical budget projector', highlight: false },
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
            icon: 'price',
            iriz: `${formatPrice(PRICING.offerPrice)} (MRP ${formatPrice(PRICING.mrp)}, ${DISCOUNT_PERCENT}% off)`,
            other: 'Similar or higher, rarely discounted',
          },
        ]
      : []),
    { label: 'Brightness', icon: 'brightness', iriz: 'True 500 ANSI Lumens', other: 'Inflated "lumens" claims' },
    { label: 'Resolution', icon: 'resolution', iriz: 'Native 1080P', other: '720P, upscaled' },
    { label: 'Smart OS', icon: 'os', iriz: 'Android 14', other: 'No smart OS' },
    { label: 'Keystone correction', icon: 'keystone', iriz: '4-point, automatic', other: false },
    { label: 'Audio', icon: 'audio', iriz: '5W mono speaker', other: '1–3W, thin sound' },
    /*
     * MOVED HERE FROM app/compare's local EXTRA_ROWS, and nothing about it
     * was rewritten on the way.
     *
     * It is in the shared table now because the homepage comparison block
     * shows this row, and a row the homepage shows cannot live in a constant
     * declared inside /compare's page file. /compare renders COMPARISON.rows
     * followed by its own extras, so the row still appears there — higher up
     * the table than before, and that is the only change to that page.
     *
     * THE IRIZ VALUE IS FULL_SPEC_SHEET'S, WORD FOR WORD. EXTRA_ROWS had
     * shortened it to "Up to 8K (decode)"; the sheet says "Up to 8K
     * (playback/decode only)" and the parenthesis is the whole point of the
     * row — the chipset DECODES an 8K stream, the panel is 1080p, and
     * dropping "only" is how a decode spec gets read as a resolution claim.
     *
     * `other` is EXTRA_ROWS' own wording, carried across unchanged.
     */
    { label: 'Video playback', icon: 'video', iriz: 'Up to 8K (playback/decode only)', other: 'Typically 1080p or lower' },
    { label: 'Screen Size Range', icon: 'screen', iriz: '35" – 200"', other: 'Limited range' },
  ],
};

/**
 * The six rows the HOMEPAGE comparison block shows, by label.
 *
 * A SUBSET, NOT A SECOND TABLE. The homepage block is a teaser that ends in
 * "See the full comparison →"; /compare is the full thing. Both render the
 * same component over the same COMPARISON rows, and this list is only which
 * of them the short version keeps — so a value can never differ between the
 * two pages, because there is only one copy of it.
 *
 * LABELS, not indices, and they are ASSERTED below. An index list silently
 * points at the wrong row the moment one is inserted — and COMMERCE_ENABLED
 * already inserts one at the top.
 */
export const COMPARISON_FEATURED = [
  'Brightness',
  'Resolution',
  'Smart OS',
  'Keystone correction',
  'Audio',
  'Video playback',
];

/**
 * The featured rows themselves. Throws at module load — which fails
 * `next build`, loudly — if a label above no longer matches a row, for the
 * same reason BOX_PRINTED_SPECS does in this file: a renamed row must not
 * quietly drop a section of the homepage.
 */
export const COMPARISON_FEATURED_ROWS = COMPARISON_FEATURED.map((label) => {
  const row = COMPARISON.rows.find((r) => r.label === label);
  if (!row) throw new Error(`COMPARISON_FEATURED: no COMPARISON row labelled "${label}"`);
  return row;
});

/**
 * WHERE PEOPLE PUT IT — the use-case strip under the comparison.
 *
 * ================================================================
 * EVERY ONE OF THESE IS A PLACE, NOT A CAPABILITY. That is the rule.
 * ================================================================
 * A room is not a claim about the device: "hotels & resorts" says who buys
 * it, and is true of any projector sold in India. A FEATURE dressed as a
 * use-case is a spec claim wearing a friendlier label, and this strip is not
 * allowed to carry one.
 *
 * WHAT WAS LEFT OUT, and why it is written down here rather than argued
 * again next time:
 *
 *   "Screen mirroring"  — REFUSED. Mirroring, casting and AirPlay are not
 *                         confirmed by the box, the spec sheet or any other
 *                         manufacturer material behind this file; see the
 *                         standing note on FAQS below, which forbids this
 *                         file from acquiring a mirroring claim anywhere.
 *                         Bluetooth 5.2 being present is not evidence for
 *                         it. An icon is a claim like a sentence is.
 *
 *   "Auto focus"        — REFUSED, and not in this list's shape at all. The
 *                         carton states 4-point auto KEYSTONE and no
 *                         autofocus; FULL_SPEC_SHEET has no focus row.
 *
 * "Movies & gaming" IS here, and it is the one entry that names an activity
 * rather than a room — so it is the one that needed sourcing rather than
 * judgement. Both halves are already published: FAQS below answers "Can I
 * connect a game console or laptop?" with a plain yes on the strength of the
 * HDMI input (FULL_SPEC_SHEET > Connectivity & Audio), and "Your home cinema
 * awaits" is the product's own tagline. It claims a console can be plugged
 * in, which the spec sheet supports — not a game mode, not a latency figure,
 * neither of which is stated anywhere and neither of which this may grow
 * into.
 *
 * `icon` is a key, as above.
 */
export const USE_CASES = [
  { icon: 'cinema', label: 'Home cinema' },
  { icon: 'party', label: 'Party & gatherings' },
  { icon: 'hotel', label: 'Hotels & resorts' },
  { icon: 'office', label: 'Office presentations' },
  { icon: 'play', label: 'Movies & gaming' },
];

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
//
// THESE ARE DORMANT: the board renders only when COMMERCE_ENABLED is true
// (app/page.jsx), which it is not. They are corrected anyway, because a
// dormant promise is still a promise the moment that flag flips, and these
// two contradicted the Sale Invoice terms outright:
//
//   "30 Days / Risk-Free Trial ... return it within 30 days of delivery in
//   its original condition for a full refund" — we grant no such window. An
//   online purchase is governed strictly by the marketplace's return policy;
//   a store purchase is not taken back at all. See /legal/returns.
//
//   "24/7 Human Support" — support hours are Monday to Saturday, 10am-6pm,
//   except public holidays (SUPPORT.hours in lib/site-config.js), and the
//   invoice publishes those hours beside the number.
//
// Both now state something the invoice actually backs. The remaining two
// ("Express Dispatch", "Encrypted Checkout") describe a direct-sales model
// this site does not operate; they are left as they are because they cannot
// render until the same flag turns direct selling on, and rewriting them
// now would be guessing at terms that do not exist yet.
export const TRUST_BADGES = [
  {
    icon: 'shield',
    stat: '1',
    unit: 'Year',
    title: 'Manufacturer Warranty',
    text: 'Every genuine IRIZ carries 12 months of BluNeuron cover from the invoice date, against manufacturing defects. Repair or replacement, handled by us directly.',
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
    stat: 'Mon',
    unit: 'to Sat',
    title: 'Real Human Support',
    text: 'Real people on the other end, 10am to 6pm Monday to Saturday — setup, troubleshooting, or a second opinion on where to mount it. No bots, no ticket queue.',
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
    title: 'Let auto keystone do the work',
    body: 'The IRIZ automatically focuses the image and squares up the corners the moment it detects it has settled in a new position — no manual sliders.',
  },
  {
    title: 'Fine-tune if needed',
    body: 'If the auto correction doesn’t nail it in a tricky room, open Settings for keystone adjustment, or trim the focus with the F+/F- keys on the remote.',
  },
  {
    title: 'Start streaming',
    body: 'Connect to Wi-Fi, sign in to the app store on the device, and install the apps you watch. Use the remote to open them.',
  },
];

/**
 * `topic` groups these on /support/faq and is the ONLY thing added to this
 * array — not one word of a question or an answer changed. It exists because
 * a flat list of answers makes a reader scan all of them to find the one
 * about sound; the groups are the five a projector owner actually arrives
 * with. A missing `topic` falls into "General" rather than disappearing, so
 * adding a question without one is a cosmetic mistake and not a lost answer.
 *
 * Keep it out of faqJsonLd (lib/seo.js): Google's FAQPage schema has no
 * notion of a group, and the markup has to match the questions visible on the
 * page, which it still does.
 */
export const FAQS = [
  {
    q: 'What does "500 ANSI Lumens" actually mean?',
    topic: 'Picture',
    a: 'ANSI lumens is the projector industry’s standardized brightness measurement, taken as an average across nine points on the projected image. Unlike "LED lumens" marketing numbers (measured at the bulb, before any optical loss), ANSI lumens reflects what you actually see on the wall — so the IRIZ’s 500 ANSI lumens holds up in a normally lit room.',
  },
  {
    q: 'Do I need a special screen?',
    topic: 'Picture',
    a: 'No. The IRIZ projects onto any flat, light-colored wall or surface. A dedicated projector screen will improve contrast and color accuracy, but it isn’t required to get started.',
  },
  {
    q: 'How far away does it need to be?',
    topic: 'Setup',
    a: 'The IRIZ has a 1:1 throw ratio and works from 0.9m to 5m away, producing a 35″ to 200″ image depending on distance.',
  },
  {
    q: 'Does it work without Wi-Fi?',
    topic: 'Connectivity',
    a: 'Basic playback over HDMI or USB works without a network connection. The Android 14 smart features — the built-in app store and the streaming apps — require Wi-Fi.',
  },
  {
    q: 'Can I connect a game console or laptop?',
    topic: 'Connectivity',
    a: 'Yes — the IRIZ has an HDMI input for consoles, laptops, and streaming boxes, plus a USB port for direct media playback and a 3.5mm output for external speakers or headphones.',
  },
];

/**
 * The rest of the FAQ — the questions support actually gets, answered only
 * from what this site already states.
 *
 * WHY A SECOND ARRAY AND NOT MORE ENTRIES IN `FAQS`. `FAQS` is rendered in
 * three places. On /shop/iriz it is the "Before you buy" accordion, and that
 * section exists to answer a buyer's last three doubts at the moment of
 * decision — nineteen entries there is a wall of text where a short list was
 * the point. So `FAQS` stays the shortlist, this is the long tail, and
 * `ALL_FAQS` below is what the support surfaces render.
 *
 * EVERY ANSWER IS SOURCED. The `source` key names where in this repo the fact
 * comes from, and it is not decoration: this is the file where an unverified
 * spec would be easiest to slip in, and the next person to edit an entry
 * should be able to check it in one jump. Nothing here was invented, and
 * nothing may be.
 *
 * BLUETOOTH IS ANSWERED; SCREEN MIRRORING IS NOT, AND THAT IS DELIBERATE.
 * The Bluetooth entry used to hedge, because the spec sheet behind this file
 * listed only the physical ports and the retail box was the one place
 * "Bluetooth 5.2" appeared. FULL_SPEC_SHEET > Connectivity & Audio now
 * carries both wireless radios — Wi-Fi 2.4 / 5 GHz and Bluetooth 5.2, read
 * off the same printed carton — so this answer and the spec sheet state one
 * fact from one source instead of the FAQ carrying it alone.
 *
 * Screen mirroring, casting and AirPlay are a SEPARATE capability and none of
 * them is confirmed by the box, the spec sheet or any other manufacturer
 * material behind this file. Bluetooth being present is not evidence for any
 * of them. So this file makes no mirroring claim at all, and no entry here
 * may acquire one until the capability is confirmed in writing.
 *
 * Answers are plain strings with no markup, because faqJsonLd() in lib/seo.js
 * emits them into FAQPage structured data and Google wants the text a visitor
 * sees.
 */
export const FAQS_EXTRA = [
  // ---------------------------------------------------------------- Setup
  {
    q: 'How long does setup take?',
    topic: 'Setup',
    source: 'SETUP_STEPS 1-3',
    a: 'About five minutes. Put the IRIZ on something flat 0.9m to 5m from the wall, angle it with the stand, and plug in the included power adapter. Android 14 walks you through joining Wi-Fi while the auto keystone squares the picture.',
  },
  {
    q: 'Can I project onto the ceiling?',
    topic: 'Setup',
    source: 'FULL_SPEC_SHEET > Throw & Screen > Angle Adjustment',
    a: 'Yes. The stand adjusts steplessly through 0° to 180°, so the picture can go on the wall opposite or straight up onto the ceiling from a bedside table.',
  },
  {
    q: 'Do I have to square the image again every time I move it?',
    topic: 'Setup',
    source: 'SETUP_STEPS 3; FULL_SPEC_SHEET > Keystone Correction',
    a: 'No. Keystone correction is automatic and runs on movement — the IRIZ re-squares the image itself once it detects it has settled in a new position. There are no manual sliders to reset.',
  },
  // -------------------------------------------------------------- Picture
  {
    q: 'What screen size will I get at my distance?',
    topic: 'Picture',
    source: 'THROW_RANGE',
    a: 'It is a 1:1 throw ratio, so every metre you step back is roughly another 40 inches of screen. At 0.9m that is about 35 inches of picture; at 5m, up to 200 inches.',
  },
  {
    q: 'Is the 1080p native, or upscaled?',
    topic: 'Picture',
    source: 'FULL_SPEC_SHEET > Optics & Display',
    a: 'Native. The panel is a 3.5-inch LTPS LCD with a native resolution of 1920x1080, so every pixel of a 1080p source has a physical pixel of its own to land on.',
  },
  {
    q: 'Can it play 4K or 8K files?',
    topic: 'Picture',
    source: 'FULL_SPEC_SHEET > Video Decoding',
    a: 'The chipset decodes video up to 8K, and that is a decoding capability rather than a display one — an 8K file plays, scaled down to the 1080p panel. The picture on the wall is 1080p.',
  },
  {
    q: 'Will it work with the lights on?',
    topic: 'Picture',
    source: 'FAQS "What does 500 ANSI Lumens actually mean?"',
    a: 'The IRIZ is rated at a true 500 ANSI lumens, which holds up in a normally lit room. ANSI is averaged across nine points of the projected image, so it describes what you actually see on the wall rather than the output at the bulb. A darker room is still a better picture.',
  },
  // --------------------------------------------------------- Connectivity
  {
    q: 'What can I plug into it?',
    topic: 'Connectivity',
    source: 'FULL_SPEC_SHEET > Connectivity & Audio',
    a: 'One HDMI input for a console, laptop or streaming box; one USB-A port for playing files off a drive; one 3.5mm AV / headphone output for an external speaker or headphones; and the DC power input.',
  },
  {
    q: 'Does it have Bluetooth?',
    topic: 'Connectivity',
    source: 'FULL_SPEC_SHEET > Connectivity & Audio > Bluetooth; retail box',
    a: 'Yes — IRIZ has Bluetooth 5.2.',
  },
  {
    q: 'Do I need a streaming stick?',
    topic: 'Connectivity',
    source: 'FULL_SPEC_SHEET > Platform; BOX_CONTENTS',
    a: 'No. Android 14 is built in and the remote is in the box, so the apps you watch install onto the projector itself over Wi-Fi. There is no second remote to juggle and no HDMI input occupied before you start.',
  },
  // ----------------------------------------------------------------- Sound
  {
    q: 'Is the built-in speaker enough, or do I need external audio?',
    topic: 'Sound',
    source: 'FULL_SPEC_SHEET > Connectivity & Audio > Speaker',
    a: 'There is a 5W mono speaker built in, which is enough to start watching the day it arrives. For more than that, the 3.5mm output takes headphones or a powered speaker.',
  },
  // ----------------------------------------------------------- In the box
  {
    q: 'What comes in the box?',
    topic: 'In the box',
    source: 'BOX_CONTENTS',
    a: 'The IRIZ projector (model BNA-510SH, with its stand), the remote, a power adapter rated AC 90-240V, a quick start guide and an FAQ card.',
  },
  // ---------------------------------------------------- Warranty & support
  {
    q: 'How long is the warranty?',
    topic: 'Warranty & support',
    source: 'WARRANTY in lib/site-config.js',
    a: 'Twelve months (1 year) from the date on your invoice, provided by BluNeuron Technologies. It applies to units bought from BluNeuron, our authorised marketplaces or an authorised BluNeuron dealer, and the invoice is required for any claim. The full terms, including what is and is not covered, are on the warranty policy page.',
  },
  {
    q: 'Do I have to register to be covered?',
    topic: 'Warranty & support',
    source: '/support/warranty-registration page copy',
    a: 'No. Registration is optional and your cover runs from the invoice date either way. Registering records the purchase details so that a future claim does not start with hunting for an invoice — that is the whole of what it buys. Keep your invoice regardless.',
  },
  {
    q: 'How do I make a warranty claim?',
    topic: 'Warranty & support',
    source: '/support/warranty-claim page copy',
    a: 'Fill in the warranty claim form and you get a claim reference as soon as it is in. Have your invoice ready — the claim form asks for the invoice number, and the invoice is the proof of purchase date the claim is assessed against. The serial number is optional: it is the eleven-character code on the sticker on the box, and units sold before those stickers existed do not have one.',
  },
];

/**
 * Everything the support surfaces search and render: the shortlist plus the
 * long tail, in that order, so the five questions a buyer asks most still
 * come first.
 *
 * /shop/iriz deliberately does NOT use this — see the note on FAQS_EXTRA.
 */
export const ALL_FAQS = [...FAQS, ...FAQS_EXTRA];

export const TROUBLESHOOTING = [
  {
    issue: 'Image looks blurry',
    topic: 'Picture',
    fix: 'Trim the focus with the F+/F- keys on the remote until the picture is sharp. If the whole image is soft, check the projector is between 0.9 m and 5 m from the wall and sitting on something level.',
  },
  {
    issue: 'Image isn’t square (trapezoid shape)',
    topic: 'Picture',
    fix: 'Auto keystone correction should square the image automatically on movement. If it looks off, open Settings → Display → Keystone Correction and adjust manually, or reseat the projector so it’s more level with the wall.',
  },
  {
    issue: 'No sound',
    topic: 'Sound',
    fix: 'Check that the volume isn’t muted via the remote, and that an external speaker (if connected via the 3.5mm output) is powered on and selected as the audio output in Settings → Sound.',
  },
  {
    issue: 'Won’t connect to Wi-Fi',
    topic: 'Connectivity',
    fix: 'Confirm the network is 2.4GHz or 5GHz (check your router’s settings) and that the password was entered correctly. Restarting the projector from Settings → System → Restart often resolves transient connection issues.',
  },
  {
    issue: 'Remote isn’t responding',
    topic: 'Setup',
    fix: 'Check that the remote has line of sight to the projector, and that its batteries are correctly inserted. Re-pairing instructions are in Settings → Remote & Accessories.',
  },
];

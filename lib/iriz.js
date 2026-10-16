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
    heroClean: '/media/iriz/product/hero-clean.png',
    // `turntable`, `anglesPorts` and `angleIso` are GONE from this block.
    // All three named files that have never been in public/ — nothing
    // rendered them (PRODUCT_SHOTS, their only consumer, was itself unused),
    // but a path in this object is an invitation to render it, and the next
    // person to do so would have shipped a hole in a page. Supply the files
    // and the keys come back; see docs/missing-media.md for the list.
    // The only PHOTOGRAPH among the product shots — unit on its stand beside
    // the retail box, lit on a grey seamless with its own reflection. Every
    // other entry here is a white-on-white studio render that needs
    // `.product-fade`/`.product-glow` to dissolve its backdrop; this one must
    // NOT get that treatment, because the grey ground and the box are what
    // anchor it. Use `.product-photo` instead.
    retailBox: '/media/iriz/product/retail-box.jpg',
    // The printed IRIZ retail carton, front face. This is the SPEC SOURCE as
    // well as a picture: the model number, the adapter's input range and the
    // contents list the homepage's "In the box" section renders are all read
    // off this box, not off marketing copy.
    //
    // Not the same asset as `retailBox` above, which is the unit AND the box
    // on a grey seamless and is only ever drawn as a small thumbnail. This is
    // the box alone, shown large.
    boxFront: '/media/iriz/box/iriz-box-front.png',
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
  // Resolution), 4Ω 5W (SPECS Audio). They restate existing claims; they do
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
    // The 10,000+ apps board. It used to sit alongside an older `apps` entry
    // (`03-apps.png`); that file is not in public/ and its key is gone, so
    // this is now the only apps artwork.
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
    src: MEDIA.product.heroClean,
    fade: true,
    label: 'Three-quarter view',
    alt: `The ${BRAND.fullName} mini projector, three-quarter view with the lens forward`,
  },
  {
    src: MEDIA.product.retailBox,
    fade: false,
    label: 'What ships',
    alt: `The ${BRAND.fullName} on its stand beside the retail box`,
  },
  {
    src: MEDIA.detail.screenSize,
    fade: false,
    label: 'Screen size',
    alt: 'Screen size by distance: a 1:1 throw ratio giving a 35-inch picture at 0.9m up to 200 inches at 5m',
  },
  {
    src: MEDIA.detail.keystone,
    fade: false,
    label: 'Auto keystone',
    alt: 'Automatic keystone correction squaring up a projected image that was thrown at an angle',
  },
  {
    src: MEDIA.detail.appsBoard,
    fade: false,
    label: 'Apps',
    alt: 'A smart TV home screen with 10,000+ official apps pre-installed, including Netflix, YouTube, Disney+ and Prime Video',
  },
  {
    src: MEDIA.detail.specSheet,
    fade: false,
    label: 'Spec sheet',
    alt: 'The IRIZ specification sheet: 500 ANSI lumens, native 1080p, Allwinner H723 chipset and a 4-ohm 5W speaker',
  },
];

export const PRODUCT = {
  id: 'iriz',
  name: BRAND.fullName,
  // The retail-box photograph, not `heroClean`. This image is only ever shown
  // small — a 96px cart thumbnail and an 80px order-summary tile, both on a
  // dark glass panel — and a white-on-white render of the bare unit at that
  // size is nearly invisible and says nothing about what ships. The photo has
  // its own ground and shows the box.
  image: MEDIA.product.retailBox,
};

export const HERO = {
  // Sentence case in source on purpose: `.type-label` (app/globals.css)
  // applies the uppercasing, so the cased string is the one thing a
  // screen reader and a copy edit both see.
  eyebrow: 'Mini portable projector for home',
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
      + '1080P Resolution, Vibrant Colors, and a 4-ohm 5W speaker.',
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
 * "Access to 10,000+ Apps" is the same sentence twice.
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
      'Access to 10,000+ Apps — a BluNeuron IRIZ on a table projecting a smart TV home screen '
      + 'with Movies, TV Shows, Live and Apps tabs and a row of app tiles including YouTube, Netflix, '
      + 'Disney+, Prime Video, Spotify and Google Play, with the remote held in shot.',
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

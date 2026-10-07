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
// TODO before launch: replace with official BluNeuron handles
export const SOCIAL_LINKS = {
  linkedin: 'https://www.linkedin.com/company/bluneuron-technologies/',
  instagram: 'https://www.instagram.com/bluneurondotcom?stkn=dmFla2J0YTh0dWto&utm_source=qr',
  youtube: 'https://youtube.com/@bluneurontechnologies?si=X_ALAyBwcKtLe8Jh',
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
    turntable: '/media/iriz/product/turntable-360.png',
    anglesPorts: '/media/iriz/product/angles-ports-clean.png',
    // The badge-free variant. The other copy of this render carries a strip
    // across the bottom reading "500 Lumens / Automatic Keystone Correction /
    // 4K HD · 4K Decoding". That 4K lockup reads as a display-resolution
    // claim, which is exactly the ambiguity the header note above says this
    // project refuses to repeat — the IRIZ is native 1080p and only DECODES
    // up to 8K. The pixels contradicted the copy, so that copy is not shipped.
    angleIso: '/media/iriz/product/angle-iso-plain.png',
    // The only PHOTOGRAPH among the product shots — unit on its stand beside
    // the retail box, lit on a grey seamless with its own reflection. Every
    // other entry here is a white-on-white studio render that needs
    // `.product-fade`/`.product-glow` to dissolve its backdrop; this one must
    // NOT get that treatment, because the grey ground and the box are what
    // anchor it. Use `.product-photo` instead.
    retailBox: '/media/iriz/product/retail-box.jpg',
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
    googleTvHero: '/media/iriz/detail/01-google-tv-hero.png',
    specSheet: '/media/iriz/detail/02-spec-sheet.png',
    apps: '/media/iriz/detail/03-apps.png',
    googleAssistant: '/media/iriz/detail/04-google-assistant.png',
    lumensCompare: '/media/iriz/detail/05-lumens-compare.png',
    chipset: '/media/iriz/detail/06-chipset.png',
    latency: '/media/iriz/detail/07-latency.png',
    keystone: '/media/iriz/detail/08-keystone.png',
    screenSize: '/media/iriz/detail/09-screen-size.png',
    // The updated 10,000+ apps board (IRIZ/Detail image/750_04.png). Added
    // alongside `apps` rather than replacing it: `03-apps.png` is the older
    // artwork and is still referenced by HIGHLIGHTS below, which is kept on
    // disk even though the bento board that rendered it is gone.
    appsBoard: '/media/iriz/detail/11-apps-10000.png',
    angleAdjust: '/media/iriz/detail/10-angle-adjust.png',
  },
  video: {
    hero: '/media/iriz/video/reel-01.mp4',
    showcase: '/media/iriz/video/reel-02.mp4',
    ambient: '/media/iriz/video/reel-03.mp4',
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
  title: 'True brightness. Built-in Google TV.',
  body: '500 ANSI Lumens, measured honestly. Native 1080P. A 200-inch screen wherever you point it.',
  // Display type, once per page — the cinematic hero shows the model name
  // alone and lets the tagline carry the claim.
  display: BRAND.model,
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

export const HIGHLIGHTS = [
  {
    title: 'Built-in Google TV',
    subtitle: '"Hey Google" voice search, plus a full Google TV remote in the box.',
    image: MEDIA.detail.googleAssistant,
  },
  {
    title: '10,000+ Official Apps',
    subtitle: 'Netflix, YouTube, Disney+, Prime Video, and more — pre-installed.',
    image: MEDIA.detail.apps,
  },
  {
    title: 'True 500 ANSI Lumens',
    subtitle: 'Measured brightness, not an inflated spec sheet number.',
    image: MEDIA.detail.lumensCompare,
  },
  {
    title: 'Allwinner H723 Chipset',
    subtitle: 'Quad-core ARM Cortex-A53 with hardware keystone and 8K decoding.',
    image: MEDIA.detail.chipset,
  },
  {
    title: 'Auto Focus + Auto Keystone',
    subtitle: 'Sharp and perfectly square, automatically, every time you move it.',
    image: MEDIA.detail.keystone,
  },
  {
    title: 'Up to a 200" Screen',
    subtitle: '1:1 throw ratio — a huge canvas from 0.9 to 5 meters away.',
    image: MEDIA.detail.screenSize,
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
      'Access to 10,000+ Apps — a BluNeuron IRIZ on a table projecting a Google TV home screen '
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
  min: { size: 35, distance: 0.9 },
  max: { size: 200, distance: 5 },
};

export const SPECS = [
  { label: 'Brightness', value: '500', unit: 'True ANSI Lumens' },
  { label: 'Resolution', value: '1080P', unit: 'Native 1920×1080' },
  { label: 'Chipset', value: 'H723', unit: 'Allwinner, Quad-core Cortex-A53' },
  { label: 'Throw Ratio', value: '1:1', unit: '0.9m–5m · 35"–200" screen' },
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
    ['Screen Size Range', '35" – 200"'],
    ['Angle Adjustment', 'Stepless, 0°–180°'],
  ]},
  { group: 'Platform', rows: [
    ['Chipset', 'Allwinner H723'],
    ['CPU', 'Quad-core ARM Cortex-A53'],
    ['GPU', 'ARM Mali-G31 MP2'],
    ['Operating System', 'Android 14 (Google TV built-in)'],
    ['Voice Assistant', 'Built-in "Hey Google"'],
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

// Inferred from confirmed copy (HERO/HIGHLIGHTS: "a full Google TV remote in
// the box", DC-power spec above) — not manufacturer-sourced, so this is
// flagged the same way as the dimensions/weight placeholders, and hidden by
// the same gate. Both of these are behind SHOW_PENDING_SPECS above: kept and
// exported, not rendered. Confirm the retail carton before flipping it —
// "1× Google TV Remote" in particular is an inference from marketing copy.
export const BOX_CONTENTS = [
  '1× BluNeuron IRIZ Projector',
  '1× Google TV Remote',
  '1× Power Adapter',
  '1× Quick Start Guide',
];

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
    { label: 'Smart OS', iriz: 'Android 14 · Google TV built-in', other: 'No smart OS' },
    { label: 'Keystone Correction', iriz: true, other: false },
    { label: 'Auto Focus', iriz: true, other: false },
    { label: 'Audio', iriz: '4Ω 5W speaker', other: '1–3W, thin sound' },
    { label: 'Low-Latency Mode', iriz: '0.004s', other: 'High input lag' },
    { label: 'Screen Size Range', iriz: '35" – 200"', other: 'Limited range' },
  ],
};

// Passive, scroll-advanced product tour — one image per key angle, each
// paired with a genuinely distinguishing spec rather than a generic caption.
export const PRODUCT_SHOTS = [
  {
    image: MEDIA.product.heroClean,
    label: 'Front',
    title: 'All-Glass Auto-Focus Lens',
    body: 'Sharp 35"–200" images from 0.9–5m away, always in focus.',
  },
  {
    image: MEDIA.product.angleIso,
    label: 'Shell',
    title: 'Diamond-Cut, Fingerprint-Resistant Shell',
    body: 'A textured top panel that resists prints and stays cool to the touch.',
  },
  {
    image: MEDIA.product.turntable,
    label: 'Stand',
    title: 'Stepless 0°–180° Stand',
    body: 'Tabletop, floor, or ceiling — angle it and it holds.',
  },
  {
    image: MEDIA.product.anglesPorts,
    label: 'Rear Ports',
    title: 'Full I/O, Nothing Missing',
    body: 'HDMI, USB, 3.5mm AV, and DC power — all at the back.',
  },
];

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
    body: 'Plug in the included power adapter and follow the on-screen Google TV setup to connect to your Wi-Fi network and sign in to your Google account.',
  },
  {
    title: 'Let auto focus and keystone do the work',
    body: 'The IRIZ automatically focuses the image and squares up the corners the moment it detects it has settled in a new position — no manual sliders.',
  },
  {
    title: 'Fine-tune if needed',
    body: 'If the auto correction doesn’t nail it in a tricky room, nudge the focus with the F+/F- keys on the Google TV remote, or open Settings for keystone adjustment. Auto focus stays on — these are a trim on top of it, not a manual mode.',
  },
  {
    title: 'Start streaming',
    body: 'Say "Hey Google" or use the remote to open any of the 10,000+ pre-installed apps — Netflix, YouTube, Disney+, Prime Video, and more.',
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
    a: 'The IRIZ has a 1:1 throw ratio and works from 0.9m to 5m away, producing a 35″ to 200″ image depending on distance.',
  },
  {
    q: 'Does it work without Wi-Fi?',
    a: 'Basic playback over HDMI or USB works without a network connection. Google TV features — the built-in app store, voice assistant, and streaming apps — require Wi-Fi.',
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

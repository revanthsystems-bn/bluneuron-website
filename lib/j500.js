/**
 * BluNeuron J500 — single source of truth for product copy, specs, and media.
 *
 * Every spec below is sourced from the source manufacturer's own product
 * photography and infographic slides in `./J500` (see `Detail image/` and
 * `White background image/`). No pricing, sales, or ratings data shipped in
 * that folder, so none is invented here — the UI simply omits those fields.
 *
 * Most of the "White background image" renders have the original OEM's
 * "JUNUO" logo baked into the pixels (top-left corner). This site sells the
 * device under the BluNeuron brand, so that logo can't appear anywhere here:
 * three renders (angle-iso-clean/angles-ports-clean/bg-cyberpunk) were
 * patched with a white overlay over the logo region — seamless, since the
 * source background there is already pure white — and three colorful
 * "orchid/aurora/iridescent/blossom" backdrop renders were dropped entirely
 * rather than patched. Only `hero-clean` and `turntable-360` were logo-free
 * as shot.
 *
 * "4K"/"8K" claims from the source material describe video *decoding*
 * (the H723 chipset's playback capability), not the projector's native
 * display resolution, which is 1080p. Copy below keeps that distinction
 * explicit rather than repeating the ambiguous marketing shorthand.
 */

export const BRAND = {
  name: 'BluNeuron',
  model: 'J500',
  fullName: 'BluNeuron J500',
};

export const MEDIA = {
  product: {
    heroClean: '/media/j500/product/hero-clean.png',
    turntable: '/media/j500/product/turntable-360.png',
    anglesPorts: '/media/j500/product/angles-ports-clean.png',
    angleIso: '/media/j500/product/angle-iso-clean.png',
    bgCyberpunk: '/media/j500/product/bg-cyberpunk.png',
    lifestyleAmbient: '/media/j500/product/lifestyle-ambient-v2.jpg',
  },
  detail: {
    googleTvHero: '/media/j500/detail/01-google-tv-hero.png',
    specSheet: '/media/j500/detail/02-spec-sheet.png',
    apps: '/media/j500/detail/03-apps.png',
    googleAssistant: '/media/j500/detail/04-google-assistant.png',
    lumensCompare: '/media/j500/detail/05-lumens-compare.png',
    chipset: '/media/j500/detail/06-chipset.png',
    latency: '/media/j500/detail/07-latency.png',
    keystone: '/media/j500/detail/08-keystone.png',
    screenSize: '/media/j500/detail/09-screen-size.png',
    angleAdjust: '/media/j500/detail/10-angle-adjust.png',
  },
  video: {
    hero: '/media/j500/video/reel-01.mp4',
    showcase: '/media/j500/video/reel-02.mp4',
    ambient: '/media/j500/video/reel-03.mp4',
  },
};

export const HERO = {
  eyebrow: 'The BluNeuron J500',
  title: 'True brightness. Built-in Google TV.',
  body: '500 ANSI Lumens, measured honestly. Native 1080P. A 200-inch screen wherever you point it.',
  ctaPrimary: { label: 'Explore J500', href: '#showcase' },
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
    title: 'Auto Keystone Correction',
    subtitle: 'A perfectly square image, automatically, every time you move it.',
    image: MEDIA.detail.keystone,
  },
  {
    title: 'Up to a 200" Screen',
    subtitle: '1:1 throw ratio — a huge canvas from 0.9 to 5 meters away.',
    image: MEDIA.detail.screenSize,
  },
];

export const SPECS = [
  { label: 'Brightness', value: '500', unit: 'True ANSI Lumens' },
  { label: 'Resolution', value: '1080P', unit: 'Native 1920×1080' },
  { label: 'Chipset', value: 'H723', unit: 'Allwinner, Quad-core Cortex-A53' },
  { label: 'Throw Ratio', value: '1:1', unit: '0.9m–5m · 35"–200" screen' },
  { label: 'Low-Latency Mode', value: '0.004s', unit: 'Response time' },
  { label: 'Audio', value: '5W', unit: '4Ω built-in speaker' },
];

export const FULL_SPEC_SHEET = [
  { group: 'Display', rows: [
    ['Native Resolution', '1080P (1920×1080)'],
    ['Display Technology', '3.5" LTPS LCD'],
    ['Brightness', 'True 500 ANSI Lumens'],
    ['Video Decoding', 'Up to 8K (playback/decode only)'],
    ['Focus', 'Auto Focus'],
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
    ['Ports', 'HDMI, USB, 3.5mm AV/headphone, DC power'],
    ['Speaker', '4Ω 5W built-in'],
    ['Low-Latency Mode', '0.004s response'],
  ]},
];

export const COMPARISON = {
  columns: [
    { key: 'j500', name: 'BluNeuron J500', highlight: true },
    { key: 'other', name: 'Typical Budget Projector', highlight: false },
  ],
  rows: [
    { label: 'Brightness', j500: 'True 500 ANSI Lumens', other: 'Inflated "lumens" claims' },
    { label: 'Resolution', j500: 'Native 1080P', other: '720P, upscaled' },
    { label: 'Smart OS', j500: 'Android 14 · Google TV built-in', other: 'No smart OS' },
    { label: 'Keystone Correction', j500: true, other: false },
    { label: 'Auto Focus', j500: true, other: false },
    { label: 'Audio', j500: '4Ω 5W speaker', other: '1–3W, thin sound' },
    { label: 'Low-Latency Mode', j500: '0.004s', other: 'High input lag' },
    { label: 'Screen Size Range', j500: '35" – 200"', other: 'Limited range' },
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

export const TRUST_BADGES = [
  { icon: 'truck', title: 'Express Delivery', text: 'Dispatch within 24 hours.' },
  { icon: 'shield', title: 'Encrypted & Guaranteed', text: '256-bit protected checkout.' },
  { icon: 'returns', title: '30-Day Risk-Free Trial', text: 'Love it, or a full refund.' },
  { icon: 'support', title: 'VIP Concierge', text: '24/7 human tech support.' },
];

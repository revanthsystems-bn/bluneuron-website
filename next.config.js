/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // AVIF first, WebP as the fallback for browsers that can't decode it; the
    // original JPEG/PNG is the last resort. Next picks per request from the
    // `Accept` header, and ARRAY ORDER is the preference order.
    //
    // This exists for the full-bleed photo sections (components/PhotoSection):
    // a 3000px photograph shown at 100svh is the heaviest thing on the page,
    // and AVIF lands it roughly 20% under WebP. The cost is encode time on the
    // first request for each size — which is why those images are lazy and
    // never preloaded; nothing above the fold waits on them.
    formats: ['image/avif', 'image/webp'],

    // Next 16 changed `qualities` from "anything the caller asks for" to an
    // allowlist defaulting to [75]; a `quality` not listed here is refused at
    // request time, not silently clamped. 82 is for the full-bleed
    // photographs only — at 100svh, 75 shows visible blocking in the smooth
    // wall gradient behind the product. Everything else on the site still
    // takes the 75 default.
    qualities: [75, 82],
  },
};

module.exports = nextConfig;

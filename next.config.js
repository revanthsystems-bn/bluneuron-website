const { PHASE_PRODUCTION_BUILD } = require('next/constants');
const { assertBuildEnv } = require('./scripts/assert-build-env');

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

/**
 * Exported as a FUNCTION rather than the object, for one reason: `phase`.
 *
 * The required-env check below must run on a production build and ONLY on a
 * production build — not on `next dev`, where a developer who has not set up
 * a pixel should still get a working site, and not on `next start`, where the
 * values were already baked in by the build and re-checking them would fail
 * on a correct deployment (the server process need not see them at all).
 *
 * This is the right hook for it because Next loads .env.production /
 * .env.local BEFORE it requires this file, and because it runs however the
 * build was invoked — `npm run build`, a bare `next build`, or whatever
 * GoDaddy's build step calls. A `prebuild` npm script would miss the env
 * files; a check inside a component would run too late, after the bundle it
 * was meant to protect had already been written.
 *
 * `assertBuildEnv` throws, and a throw out of next.config.js aborts the build
 * with a non-zero exit code. See scripts/assert-build-env.js for what is
 * required and why.
 */
module.exports = (phase) => {
  if (phase === PHASE_PRODUCTION_BUILD) {
    assertBuildEnv();
  }

  return nextConfig;
};

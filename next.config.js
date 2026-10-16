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

  /**
   * ===================================================================
   * PRINTED ON PACKAGING — never remove or change.
   * ===================================================================
   * `/warranty` is the short address behind the QR code printed on the IRIZ
   * carton. Cartons are already manufactured; the ones in a warehouse today
   * will be opened years from now. This redirect therefore has to keep
   * working FOREVER, and it cannot be renamed, retargeted at a page that
   * might be deleted, or "tidied up" — a dead QR code on retail packaging
   * cannot be recalled or patched.
   *
   * If /support/warranty-registration is ever moved, change the
   * DESTINATION here. Do not change the source.
   *
   * `permanent: true` emits a 308, which browsers and search engines cache
   * hard — correct for an address that is now physically printed, and the
   * reason this must not be pointed somewhere temporary.
   *
   * THE QUERY STRING IS PRESERVED AUTOMATICALLY. Next carries any query it
   * did not consume in the match onto the destination, so `/warranty?src=qr`
   * arrives as `/support/warranty-registration?src=qr` and GA4 records it as
   * a page URL. Nothing reads `src`; it exists so print runs can be told
   * apart in analytics, and it carries no personal data.
   *
   * It lives here, in next.config.js, rather than in custom-worker.js or a
   * Cloudflare redirect rule, because next.config.js is the one file all
   * three hosts read. A Workers-only rule would mean /warranty 404s on the
   * Vercel and GoDaddy builds — see the "must keep working on all three"
   * rule in CLAUDE.md. The trailing-slash form is handled before this by
   * Next's own normalisation (trailingSlash defaults to false, so
   * `/warranty/` 308s to `/warranty` and then lands here), and the apex
   * bluneuron.com → www redirect happens at the DNS/Cloudflare layer above
   * the Worker, so bluneuron.com/warranty arrives here too.
   */
  async redirects() {
    return [
      {
        source: '/warranty',
        destination: '/support/warranty-registration',
        permanent: true,
      },
    ];
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

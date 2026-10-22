const crypto = require('node:crypto');
const { PHASE_PRODUCTION_BUILD } = require('next/constants');
const { assertBuildEnv } = require('./scripts/assert-build-env');
const { ANIM_GATE } = require('./lib/anim-gate');

/** sha256-<base64>, the form a CSP hash source takes. */
const sha256 = (source) =>
  `'sha256-${crypto.createHash('sha256').update(source, 'utf8').digest('base64')}'`;

/**
 * Next's own flight-data bootstrap. Byte-identical on every page and across
 * builds, so it hashes cleanly — but it IS a Next internal, and a version
 * bump may change it. The failure mode is one extra console report in a
 * report-only policy, not a broken page.
 *
 * What is deliberately NOT hashed: the per-page `self.__next_f.push([1,...])`
 * payload. Its content is that route's own RSC stream, different on every
 * page, so there is no stable hash to take. Enforcing the script-src would
 * need a nonce, and a nonce must be generated per request — which pulls every
 * statically prerendered route into dynamic rendering. That is a real cost on
 * Workers (see the no-ISR note in CLAUDE.md) for a site whose pages are all
 * static, and it is why this policy ships REPORT-ONLY.
 */
const NEXT_BOOTSTRAP = '(self.__next_f=self.__next_f||[]).push([0])';

/**
 * The Supabase project origin, read rather than typed.
 *
 * `NEXT_PUBLIC_SUPABASE_URL` is already in the committed .env.production, and
 * Next loads the env files before it requires this one — so the policy names
 * the real project without a second place to keep in sync. Absent (an
 * environment that has not set it), the entry is dropped: a CSP must never
 * contain the literal string "undefined", which is a valid host-source
 * matching a real host of that name.
 */
function supabaseSources() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];
  try {
    const { origin, host } = new URL(raw);
    // Both schemes: REST and auth calls are https, and the realtime channel
    // the client opens for live rows is a wss upgrade to the same host.
    return [origin, `wss://${host}`];
  } catch {
    return [];
  }
}

/**
 * Content-Security-Policy, REPORT-ONLY.
 *
 * Report-only means the browser evaluates every directive and logs what WOULD
 * have been blocked, while blocking nothing. That is the right first step for
 * a policy on a live site: the console says what breaks before customers do.
 *
 * Every origin below is something the site actually uses, verified against the
 * built HTML and the network log rather than copied from a template:
 *
 *   googletagmanager.com   GA4 tag (components/GoogleAnalytics)
 *   google-analytics.com   GA4 collect beacons, incl. regional subdomains
 *   connect.facebook.net   Meta Pixel library (components/MetaPixel)
 *   www.facebook.com       the pixel's /tr image beacon
 *   api.web3forms.com      form delivery
 *   the Supabase project   account features, when they are enabled
 *
 * The three loose directives, none of them accidental:
 *
 *   style-src 'unsafe-inline'  Next inlines critical CSS and framer-motion
 *                              writes style attributes on what it animates.
 *                              Inline STYLE cannot be hashed in practice, and
 *                              the risk is far below script.
 *   img-src data: blob:        next/image placeholders, and the canvas work
 *                              in the lens zoom.
 *   font-src 'self' data:      next/font self-hosts at build time, so there is
 *                              no font CDN to allow; `data:` covers the
 *                              size-adjusted fallback faces it generates.
 *
 * `frame-ancestors 'none'` duplicates X-Frame-Options: DENY on purpose — the
 * header is what older browsers obey, the directive is what is actually
 * specified, and while this policy is report-only the header is the half that
 * enforces.
 *
 * No `report-uri`/`report-to`: violations surface in the browser console,
 * which is where they get read. A collector is a separate decision with its
 * own data-handling question.
 */
function contentSecurityPolicy() {
  const directives = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'frame-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'script-src': [
      "'self'",
      // Puts the first 40 characters of a blocked inline script into the
      // violation report. Without it every inline violation reads only
      // "inline", which is useless for telling OUR scripts apart from the
      // framework's. It leaks nothing a page's own source does not.
      "'report-sample'",
      sha256(ANIM_GATE),
      sha256(NEXT_BOOTSTRAP),
      'https://www.googletagmanager.com',
      'https://connect.facebook.net',
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://www.facebook.com',
    ],
    'font-src': ["'self'", 'data:'],
    'media-src': ["'self'"],
    'connect-src': [
      "'self'",
      'https://api.web3forms.com',
      'https://www.google-analytics.com',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://www.googletagmanager.com',
      'https://connect.facebook.net',
      'https://www.facebook.com',
      ...supabaseSources(),
    ],
    /*
     * NO `upgrade-insecure-requests` HERE.
     *
     * The spec says it is ignored when delivered in a report-only policy, and
     * Chrome says so out loud: it logs a console error on every page, which
     * cost a Lighthouse Best Practices point and put a permanent warning in
     * the one place a developer looks for real ones.
     *
     * It is also doing no work. Strict-Transport-Security above already stops
     * the plain-http request being made at all, and the site has no http://
     * subresources to upgrade — the CDN allow-list in this policy is https
     * throughout. ADD IT BACK in the same edit that renames this header to
     * the enforcing `Content-Security-Policy`, where it starts to mean
     * something.
     */
  };

  return Object.entries(directives)
    .map(([name, values]) => (values.length ? `${name} ${values.join(' ')}` : name))
    .join('; ');
}

/**
 * The headers every response carries.
 *
 *   Strict-Transport-Security  a year, subdomains included. The site is
 *                              https-only behind Cloudflare already; this
 *                              stops the first plain-http request being made
 *                              at all. No `preload` token: that is a
 *                              submission to a browser-vendor list and an
 *                              effectively irreversible commitment for every
 *                              subdomain — a decision to take deliberately,
 *                              not to inherit from a header.
 *   X-Content-Type-Options     stops MIME sniffing turning a mistyped asset
 *                              into script.
 *   X-Frame-Options            no framing at all. Nothing here is meant to be
 *                              embedded and there are no iframes of our own
 *                              to break: verified zero in the source and zero
 *                              in the built HTML.
 *   Referrer-Policy            origin only when leaving the site, so a
 *                              warranty URL with a query string is never
 *                              handed to a third party.
 *   Permissions-Policy         the four the brief names, all denied. The site
 *                              asks for no device permission.
 */
const SECURITY_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  /*
   * `X-Powered-By: Next.js` off. It names the framework and its presence on
   * every response is free reconnaissance; nothing reads it.
   */
  poweredByHeader: false,

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
  /*
   * `/:path*` matches every route INCLUDING the asset paths Next serves,
   * which is what "on every response" has to mean — headers on the document
   * alone leave the JSON, the images and the chunks uncovered.
   *
   * These are set HERE rather than in custom-worker.js for the same reason as
   * the redirect below: next.config.js is the one file all three hosts read,
   * so the Vercel and GoDaddy builds get the identical policy. The Worker
   * passes them through untouched.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...SECURITY_HEADERS,
          {
            key: 'Content-Security-Policy-Report-Only',
            value: contentSecurityPolicy(),
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/warranty',
        destination: '/support/warranty-registration',
        permanent: true,
      },
      /*
       * `/contact` is a address people guess, type and link to — it is the
       * conventional place for it on almost every other site, and it was a
       * 404 here. The page it should reach is /support/contact.
       *
       * 308, not 307: the move is settled, there is no plan to put anything
       * else at /contact, and a permanent redirect is the one that
       * consolidates any link equity onto the real page instead of splitting
       * it. It also preserves the method and body, which a 301 does not
       * guarantee — irrelevant for a GET, correct by default.
       */
      {
        source: '/contact',
        destination: '/support/contact',
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

/**
 * Build-time guard for the NEXT_PUBLIC_* values that get INLINED into the
 * browser bundle, and therefore have to exist before `next build` runs rather
 * than when the server starts.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE EXISTS: GODADDY LOADS SECRETS AT START, NOT AT BUILD
 * ---------------------------------------------------------------------------
 * A `NEXT_PUBLIC_` variable is not read at runtime. `next build` substitutes
 * its literal value into every client bundle that mentions it, and an absent
 * one is replaced with `undefined` — which `lib/metaPixel` and
 * `lib/web3forms` turn into `''` and then treat as "feature off".
 *
 * GoDaddy's own deployment notes say environment variables are loaded "when
 * your app starts". If that is after the build step, setting them in the
 * GoDaddy panel alone produces a build that is already missing them: a site
 * that boots perfectly, serves every page, and has NO Meta Pixel and a
 * "Notify Me" form that refuses every submission. Nothing in the server log
 * says so — the only symptom is an empty inbox and a flat ads dashboard,
 * noticed days later.
 *
 * So the build fails instead. Loudly, naming the variable, before a single
 * page is emitted. A failed build is a five-minute fix; a silently
 * de-instrumented launch site is not recoverable, because the visits it
 * failed to record are gone.
 *
 * Called from next.config.js at PHASE_PRODUCTION_BUILD, so it runs for
 * `npm run build` and a bare `next build` alike, and it runs AFTER Next has
 * loaded .env.production / .env.local (verified: `loadEnvConfig` runs inside
 * `loadConfig` before next.config.js is required). It is deliberately NOT a
 * `prebuild` npm script, which would run in a plain node process with none of
 * those files loaded and would fail on a perfectly good build.
 *
 * CommonJS, because next.config.js is.
 */

/**
 * The strict set: every one of these must be a non-empty value at build time.
 *
 * `why` is printed with the failure. It is the part a person reading a red
 * build log actually needs — not "variable missing", but what breaks on the
 * live site if the build were allowed to continue.
 */
const REQUIRED = [
  {
    name: 'NEXT_PUBLIC_META_PIXEL_ID',
    why:
      'Without it the Meta Pixel is not loaded at all: no PageView, no Lead ' +
      'on signup, and no conversion data for any Facebook/Instagram ad ' +
      'pointed at this site.',
    where:
      'Meta Events Manager > Data sources > your pixel > the numeric ID ' +
      'under its name.',
  },
  {
    name: 'NEXT_PUBLIC_WEB3FORMS_KEY',
    why:
      'Without it EVERY form on the site refuses to submit — the "Notify Me" ' +
      'launch signup and the checkout reservation both. Visitors see an ' +
      'error and no lead reaches the inbox.',
    where: 'https://web3forms.com/ > your access key for the destination inbox.',
  },
];

/**
 * Deliberately NOT in REQUIRED:
 *
 *   NEXT_PUBLIC_GA_ID  Optional by design. The GA4 property may not exist
 *                      yet, and with no ID lib/googleAnalytics simply loads
 *                      no tag — no script, no events, no warning. A missing
 *                      analytics number is a reporting gap; a missing pixel
 *                      or form key is a broken site. Only the second kind
 *                      stops a build. See the TODO(analytics) in
 *                      lib/googleAnalytics.js.
 *
 *   NEXT_PUBLIC_PURCHASE_MODE, NEXT_PUBLIC_RAZORPAY_KEY_ID
 *                      Both have working defaults in lib/commerce.js
 *                      ('dummy', and an empty key the dummy flow never
 *                      uses), and commerce is switched off entirely by
 *                      COMMERCE_ENABLED in lib/launch.js.
 */

function assertBuildEnv() {
  const missing = REQUIRED.filter(({ name }) => {
    const value = process.env[name];
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missing.length === 0) return;

  // Written as one block to stderr rather than a thrown Error's single line,
  // because a build log is skimmed and the fix has to be readable without
  // opening this file.
  const lines = [
    '',
    '  BUILD STOPPED — required public environment variables are missing.',
    '',
    `  These values are inlined into the browser bundle by \`next build\`, so`,
    '  they must be present NOW, not when the server starts. Setting them only',
    '  in a hosting panel that loads them at start-up is too late: the build',
    '  would succeed and ship a site with the feature silently switched off.',
    '',
  ];

  for (const { name, why, where } of missing) {
    lines.push(`  ${name}`);
    lines.push(`      ${why}`);
    lines.push(`      Get it from: ${where}`);
    lines.push('');
  }

  lines.push('  Set them in one of these, then build again:');
  lines.push('');
  lines.push('      .env.production   committed on the godaddy branch; public,');
  lines.push('                        browser-visible values ONLY, never a secret');
  lines.push('      .env.local        local work (gitignored)');
  lines.push('      the environment   e.g. NEXT_PUBLIC_META_PIXEL_ID=... npm run build');
  lines.push('');
  lines.push('  NEXT_PUBLIC_GA_ID is NOT required — leave it empty and Google');
  lines.push('  Analytics simply does not load.');
  lines.push('');

  // eslint-disable-next-line no-console
  console.error(lines.join('\n'));

  const names = missing.map(({ name }) => name).join(', ');
  throw new Error(`Missing required build-time environment variables: ${names}`);
}

module.exports = { assertBuildEnv, REQUIRED };

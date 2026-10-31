#!/usr/bin/env node
/**
 * THE PRODUCTION GATE. Everything that is safe in a preview and dangerous
 * live, checked in one place, wired into `npm run deploy`.
 *
 * WHY IT EXISTS. This repository deliberately supports states that must never
 * reach a customer: a marketplace URL that points at a front page instead of
 * a listing, an account area running on fixtures, a placeholder phone number,
 * `[TBD]` on a policy page. Every one of those is useful for review and every
 * one is a real failure in production — and none of them breaks a build, so
 * nothing else would stop them. A convention ("remember to replace the
 * placeholders") is not a control. This is.
 *
 * WHAT IT CHECKS:
 *   1. No PLACEHOLDER values in lib/site-config.js.
 *   2. At least one REAL marketplace listing URL — a product page, not a
 *      marketplace home page, and one that `AMAZON.live` has not withheld.
 *      One is enough: Flipkart is live and Amazon is withheld, which is a
 *      supported state.
 *   3. Demo account data is UNREACHABLE. Not "Supabase is configured" —
 *      see the long note on that check, which is the one that changed.
 *   4. Every referenced image exists. Delegated to scripts/check-media.js.
 *   5. One gtag.js, and the Google Ads ID in one file. Delegated to
 *      scripts/check-google-tag.js.
 *   6. No [TBD], no masked phone, canonicals and sitemap sane. Delegated to
 *      scripts/validate-seo.js, which checks the BUILT site.
 *
 * WHAT IT REPORTS BUT DOES NOT FAIL ON: an unconfirmed support phone number,
 * and an Amazon listing withheld by `AMAZON.live`. Neither can leak — a
 * masked row is dropped from every build (visibleSupportPhones in
 * lib/site-config.js) and a withheld marketplace is absent from MARKETPLACES
 * — so there is nothing to block. They are printed as notes because
 * publishing no phone number, or no Amazon button, is a decision worth
 * seeing every time rather than a defect. There IS one real number today, so
 * the phone note is expected to read "all 1 confirmed".
 *
 * WHAT IT DOES NOT DO: it does not deploy, and it does not fix anything. It
 * exits non-zero and says what is wrong.
 *
 * HOW IT READS lib/site-config.js: by PARSING THE SOURCE, not by importing
 * it. That file is ESM and `package.json` declares no `"type": "module"`, so
 * Node loads a `.js` file as CommonJS and `import`ing it throws on the first
 * `export`. Every pattern below is anchored to an exact declaration rather
 * than to a loose keyword, and each one asserts it MATCHED — a silently
 * unmatched regex is a check that passes by accident, which is worse than no
 * check at all.
 *
 * Run `node scripts/check-production.js --skip-seo` to check only the fast
 * static conditions (no server boot). The deploy script runs the full set.
 */

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const skipSeo = process.argv.includes('--skip-seo');

const failures = [];
const checks = [];
const notes = [];

function pass(name) {
  checks.push(`  ok   ${name}`);
}
function fail(name, detail) {
  checks.push(`  FAIL ${name}`);
  failures.push(`${name}\n       ${detail.split('\n').join('\n       ')}`);
}
function note(text) {
  notes.push(text);
}

const CONFIG_PATH = path.join(ROOT, 'lib', 'site-config.js');
const CONFIG = fs.readFileSync(CONFIG_PATH, 'utf8');

/**
 * Read one value out of the config source, and FAIL LOUDLY if the shape of
 * the file has moved. `label` is what the failure says it was looking for.
 */
function readConfig(label, pattern) {
  const m = CONFIG.match(pattern);
  if (!m) {
    fail(
      `could not read ${label} from lib/site-config.js`,
      `This check parses the source and its pattern no longer matches:\n`
        + `  ${pattern}\n\n`
        + 'The config was probably refactored. FIX THE PATTERN — do not delete\n'
        + 'the check. An unmatched regex here is a production guard that passes\n'
        + 'because it looked at nothing.'
    );
    return null;
  }
  return m[1];
}

/* ------------------------------------------------------------------ *
 * 1. PLACEHOLDER values
 * ------------------------------------------------------------------ */
{
  // Only ASSIGNED VALUES matter. The marker's own declaration, the helper
  // that tests for it, and the prose explaining both all contain the word —
  // so a naive grep could never pass. A line counts only if it is not a
  // comment, is not the declaration, and assigns something containing the
  // marker inside a string or template literal.
  const assignments = CONFIG
    .split(/\r?\n/)
    .map((raw, i) => ({ line: raw.trim(), n: i + 1 }))
    .filter(({ line }) => line.includes('PLACEHOLDER'))
    .filter(({ line }) => !/^(\*|\/\/|\/\*)/.test(line))
    .filter(({ line }) => !line.startsWith('export const PLACEHOLDER'))
    // PHONE_PLACEHOLDER was a different thing with an unfortunately similar
    // name: the masked phone slot, hidden on a production build rather than
    // being a wired-up stand-in. It is GONE — there is one real support
    // number now (SUPPORT_PHONES in lib/site-config.js) and nothing left to
    // mask. The filter stays so the name cannot fail this check if a future
    // unconfirmed line brings it back; check 4 below is what reports those.
    .filter(({ line }) => !/PHONE_PLACEHOLDER/.test(line))
    .filter(({ line }) => /`[^`]*PLACEHOLDER[^`]*`|'[^']*PLACEHOLDER[^']*'|"[^"]*PLACEHOLDER[^"]*"/.test(line));

  if (assignments.length === 0) {
    pass('no PLACEHOLDER values in lib/site-config.js');
  } else {
    fail(
      'PLACEHOLDER values still in lib/site-config.js',
      assignments.map(({ n, line }) => `line ${n}: ${line}`).join('\n')
        + '\n\nReplace them with real listing URLs, or declare the marketplace'
        + '\nabsent the way AMAZON is — empty fields, no stand-in.'
    );
  }
}

/* ------------------------------------------------------------------ *
 * 2. At least one REAL marketplace listing
 * ------------------------------------------------------------------ *
 *
 * ONE IS ENOUGH, and that is the change. This check used to be implicit in
 * check 1 — "no placeholders" — which was satisfiable only by filling in
 * both marketplaces, because both carried a placeholder URL. Amazon has no
 * listing, so it is now declared ABSENT (empty asin and url), which clears
 * check 1 honestly and would have left NOTHING asserting that the site has a
 * buy path at all. A site with SHOW_BUY true, a Buy button on every page and
 * no destination behind it is a worse production failure than a placeholder,
 * and it would have shipped silently.
 *
 * SO THIS CHECKS THE URL IS A PRODUCT PAGE, not merely a non-empty string.
 * A marketplace home page is the exact failure the placeholder markers
 * existed to prevent, and `https://www.flipkart.com/` would otherwise pass a
 * "looks like a URL" test. Flipkart product URLs carry `/p/`; Amazon's carry
 * `/dp/`.
 *
 * AND IT READS `AMAZON.live`, because a filled-in URL is no longer the same
 * question as a reachable listing. The Amazon ASIN and URL are real and the
 * listing is not public yet, so `live: false` withholds every Amazon surface
 * (AMAZON_LISTED in lib/site-config.js). Without reading that flag this
 * check would count Amazon as a second buy path and drop the note saying it
 * is hidden — reporting a destination the site deliberately does not offer.
 * `withheld` is the state for that: a VALID product URL that is switched
 * off, which is neither broken nor live.
 */
{
  const flipkart = readConfig('MARKETPLACE.flipkartUrl', /flipkartUrl:\s*\r?\n?\s*'([^']*)'/);
  const amazonUrl = readConfig('AMAZON.url', /export const AMAZON = \{[\s\S]*?url:\s*'([^']*)'/);
  // `live` sits after `url` in the AMAZON block. Matched as a word so the
  // prose above it ("while `live` is false") cannot satisfy the pattern.
  const amazonLive =
    readConfig('AMAZON.live', /export const AMAZON = \{[\s\S]*?\blive:\s*(true|false)\b/) === 'true';

  if (flipkart !== null && amazonUrl !== null) {
    const listings = [
      { name: 'Flipkart', url: flipkart, productPath: '/p/', enabled: true },
      { name: 'Amazon', url: amazonUrl, productPath: '/dp/', enabled: amazonLive },
    ];

    const valid = listings.filter(
      (l) =>
        l.url
        && /^https:\/\//.test(l.url)
        && !l.url.includes('PLACEHOLDER')
        && l.url.includes(l.productPath)
    );
    const live = valid.filter((l) => l.enabled);
    const withheld = valid.filter((l) => !l.enabled);
    const broken = listings.filter((l) => l.url && !valid.includes(l));

    if (broken.length > 0) {
      fail(
        'a marketplace URL is set but is not a product listing',
        broken.map((l) => `${l.name}: ${l.url || '(empty)'}`).join('\n')
          + '\n\nA marketplace HOME page behind a "Buy" button sends a customer'
          + '\nshopping for somebody else\'s projector. Use the full listing URL'
          + `\n(it contains "${broken[0].productPath}"), or clear the field to declare the`
          + '\nmarketplace absent — an empty URL removes its button everywhere.'
      );
    } else if (live.length === 0) {
      fail(
        'no real marketplace listing URL — the site has no buy path',
        'Both MARKETPLACE.flipkartUrl and AMAZON.url are empty, so every Buy\n'
          + 'button on the site leads nowhere. Fill in at least one real product\n'
          + 'listing URL, or set SHOW_BUY to false so the site stops offering to\n'
          + 'sell something it cannot sell.'
      );
    } else {
      pass(
        `${live.length} real marketplace listing${live.length > 1 ? 's' : ''}`
          + ` (${live.map((l) => l.name).join(', ')})`
      );
      const absent = listings.filter((l) => !l.url).map((l) => l.name);
      if (absent.length > 0) {
        note(
          `${absent.join(' and ')} ${absent.length > 1 ? 'are' : 'is'} declared ABSENT`
            + ' — every button, link and mention is hidden sitewide.\n'
            + '       Fill in the asin and url in AMAZON (lib/site-config.js) to bring it back.'
        );
      }
      // A VALID listing URL that is switched off. Reported as loudly as an
      // absent one, because the site says nothing about it either way and
      // that has to stay a visible decision rather than a forgotten flag.
      if (withheld.length > 0) {
        note(
          `${withheld.map((l) => l.name).join(' and ')} ${withheld.length > 1 ? 'have' : 'has'}`
            + ' a real listing URL but is WITHHELD (live: false)\n'
            + '       — every button, link, badge and mention is hidden sitewide.\n'
            + '       Confirm the listing opens in a logged-out browser, then set\n'
            + '       live: true in AMAZON (lib/site-config.js) to publish it.'
        );
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * 3. Demo account data is UNREACHABLE
 * ------------------------------------------------------------------ *
 *
 * THIS CHECK USED TO ASK THE WRONG QUESTION. It required
 * NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to be present,
 * on the reasoning that their absence means DEMO MODE and demo mode would
 * serve a fictional "Demo User" with fixture orders to real visitors.
 *
 * That was true when the account area was switched ON. It is not now:
 * ACCOUNTS_ENABLED is false, and app/account/layout.jsx returns the "coming
 * soon" panel BEFORE it reaches the session check, so no page in the account
 * area reads a fixture at all. Demanding Supabase credentials to deploy a
 * site whose account area is deliberately closed blocked a correct release
 * over a backend nothing uses — which is the failure mode of a guard that
 * checks a proxy instead of the thing it cares about.
 *
 * WHAT IT ASKS NOW: can demo data reach a visitor? Two ways it cannot —
 * the account surface is closed, or there is a real backend behind it. If
 * the surface is OPEN and there is no backend, that is exactly the original
 * failure and it still fails.
 *
 * /sign-in and the whole /account area also stay `noindex` while closed
 * (PRIVATE_ROUTES in lib/routes.js), and validate-seo proves that against
 * the built site — so this check covers reachability and that one covers
 * indexability.
 */
{
  const accounts = readConfig(
    'ACCOUNTS_ENABLED',
    /export const ACCOUNTS_ENABLED = (true|false);/
  );
  const cart = readConfig('CART_ENABLED', /export const CART_ENABLED = (true|false);/);

  if (accounts !== null && cart !== null) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseConfigured = Boolean(url && key);

    if (accounts === 'false') {
      pass('demo account data is unreachable (ACCOUNTS_ENABLED is false)');
      if (!supabaseConfigured) {
        note(
          'Supabase is NOT configured, and that is fine while accounts are off.\n'
            + '       Warranty registration and claims do not need it — they are guest\n'
            + '       forms writing to the Google Sheet. Configure it before setting\n'
            + '       ACCOUNTS_ENABLED to true; see docs/supabase-setup.md.'
        );
      }
    } else if (supabaseConfigured) {
      pass('account area is open and Supabase is configured (not demo mode)');
    } else {
      fail(
        'the account area is OPEN with no backend — the build would ship DEMO MODE',
        'ACCOUNTS_ENABLED is true and Supabase is not configured.\n'
          + `Missing: ${[!url && 'NEXT_PUBLIC_SUPABASE_URL', !key && 'NEXT_PUBLIC_SUPABASE_ANON_KEY'].filter(Boolean).join(', ')}\n\n`
          + 'Demo mode serves a fictional "Demo User" with fixture addresses and\n'
          + 'orders to every visitor. Either export both values before building\n'
          + '(see docs/supabase-setup.md), or set ACCOUNTS_ENABLED back to false.'
      );
    }

    if (cart === 'false') {
      pass('the in-site basket is off (CART_ENABLED is false)');
    } else {
      note(
        'CART_ENABLED is TRUE. The basket is a real surface again — re-read the\n'
          + '       cart-to-marketplace hand-off before shipping it, and check that\n'
          + '       components/cart/CartPanel is not still importing the superseded\n'
          + '       MarketplaceButtons (see the warning at the top of that file).'
      );
    }
  }
}

/* ------------------------------------------------------------------ *
 * 4. Support phone numbers — REPORTED, never a failure
 * ------------------------------------------------------------------ */
{
  const phones = CONFIG.match(/export const SUPPORT_PHONES = \[[\s\S]*?\];/);
  if (!phones) {
    fail(
      'could not read SUPPORT_PHONES from lib/site-config.js',
      'The pattern no longer matches. Fix it rather than removing the check.'
    );
  } else {
    // A row is unconfirmed if its number is [TBD], a run of X's, or the old
    // PHONE_PLACEHOLDER constant — the same three shapes isPlaceholderPhone()
    // tests for, read off the source text rather than by importing it, which
    // is how every other check in this file reads the config.
    const total = (phones[0].match(/label:/g) || []).length;
    const unconfirmed = (
      phones[0].match(/number:\s*(?:PHONE_PLACEHOLDER|'[^']*(?:\[TBD\]|[Xx]{3,})[^']*')/g) || []
    ).length;

    if (unconfirmed === 0) {
      pass(`all ${total} support phone number${total === 1 ? '' : 's'} confirmed`);
    } else {
      // DELIBERATELY NOT A FAILURE. A production build omits an unconfirmed
      // row entirely (visibleSupportPhones()), so nothing fake is published
      // and there is nothing for this gate to stop. Printed so that shipping
      // a support page with no phone number stays a visible decision.
      pass(
        `${unconfirmed} of ${total} support phone numbers unconfirmed`
          + ' — those rows are HIDDEN on a production build'
      );
      note(
        'The site will publish NO phone number. /support, /support/contact and\n'
          + '       the grievance disclosure show email and service hours only.\n'
          + '       Fill in SUPPORT_PHONES (lib/site-config.js) and every surface\n'
          + '       picks it up with no other edit.'
      );
    }
  }
}

/* ------------------------------------------------------------------ *
 * 5, 6 & 7. The other scripts, run as themselves.
 * ------------------------------------------------------------------ */
function runScript(name, script, args = []) {
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'scripts', script), ...args], {
      stdio: 'pipe',
      cwd: ROOT,
    });
    pass(name);
  } catch (error) {
    const output = [error.stdout?.toString(), error.stderr?.toString()]
      .filter(Boolean)
      .join('\n')
      .trim();
    fail(name, output || `${script} exited ${error.status}`);
  }
}

runScript('every referenced image exists in public/', 'check-media.js');

// Not behind --skip-seo: it reads source text, boots no server and takes
// milliseconds, so there is no fast/slow split to make. A duplicated gtag.js
// is also exactly the kind of defect that ships during a hurried release,
// which is when --skip-seo gets used.
runScript('one gtag.js, and the Google Ads ID in one file', 'check-google-tag.js');

if (skipSeo) {
  checks.push('  --   SEO validation skipped (--skip-seo)');
} else {
  runScript('no [TBD] or masked phone on an indexable page', 'validate-seo.js');
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */
console.log('\nProduction readiness\n');
console.log(checks.join('\n'));

if (notes.length > 0) {
  console.log('\nNotes (not failures):');
  for (const n of notes) console.log(`  -    ${n}`);
}

if (failures.length > 0) {
  console.error(`\n${'-'.repeat(68)}\nNOT READY FOR PRODUCTION\n${'-'.repeat(68)}\n`);
  failures.forEach((f, i) => console.error(`${i + 1}. ${f}\n`));
  console.error('Deploy blocked. Nothing has been published.\n');
  process.exit(1);
}

console.log('\nAll production checks passed.\n');

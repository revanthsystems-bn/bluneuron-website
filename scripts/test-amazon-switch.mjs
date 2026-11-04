#!/usr/bin/env node
/**
 * THE AMAZON ON/OFF SWITCH, flipped both ways and asserted.
 *
 *     npm run test:amazon
 *     npm run test:amazon -- --rendered http://127.0.0.1:3000
 *
 * ---------------------------------------------------------------------------
 * WHAT IS BEING PROTECTED
 * ---------------------------------------------------------------------------
 * `AMAZON.live` in lib/site-config.js is a one-field claim with a very large
 * blast radius: the buy buttons, the masthead's Buy sheet, /shop, /shop/iriz,
 * /where-to-buy, /compare, the FAQ, the JSON-LD, ~45 sentences across the
 * legal pages and the warranty form's own hint text all follow it. The whole
 * design is that switching Amazon on is ONE edit.
 *
 * That design is only true while every one of those surfaces reads the switch
 * instead of typing the word. It is not self-enforcing: a new sentence that
 * says "Amazon and Flipkart" as a literal compiles, renders, reads perfectly
 * well today — and silently names a marketplace the customer cannot buy from
 * the moment the flag is false. Two such sentences were live when this test
 * was written, both in quiet places (the hint under the invoice-number field,
 * and the same sentence restated on the registration page's "what you will
 * need" list), which is exactly how they survived the sweep that converted
 * the other forty-odd.
 *
 * So there are two halves here, and they check different things:
 *
 *   PART A — THE SWITCH ITSELF. The config is patched on disk to live:false
 *            and then to live:true, and read back in a FRESH node process
 *            each time, so the derived exports are genuinely re-evaluated
 *            rather than served from a module cache. Every value a surface
 *            consumes is asserted in both states.
 *
 *   PART B — NOBODY TYPES IT. Every .js/.jsx under app/, components/ and
 *            lib/ is scanned for the word Amazon OUTSIDE comments. Anything
 *            not on the documented allowlist below is a failure, because a
 *            literal is by definition a string the switch cannot move.
 *
 *   PART C — THE RENDERED PAGES (optional, needs a running server). Fetches
 *            every public route and asserts the HTML agrees with whatever
 *            AMAZON.live currently says. This is the end-to-end proof; it is
 *            optional because it needs `npm run dev` or a preview URL, and A
 *            and B together already pin the behaviour.
 *
 * ---------------------------------------------------------------------------
 * IT RESTORES THE FILE. ALWAYS.
 * ---------------------------------------------------------------------------
 * Part A edits lib/site-config.js in place. The original text is held in
 * memory and written back in a `finally`, and again from an exit handler if
 * the process dies some other way. If this test ever leaves the file patched,
 * `git diff lib/site-config.js` says so immediately — and the assertion that
 * the restored text is byte-identical to the original runs before the summary
 * is printed.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = path.join(ROOT, 'lib/site-config.js');

const failures = [];
let checks = 0;

function check(label, condition, detail = '') {
  checks += 1;
  if (!condition) failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

function is(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  check(label, a === e, `got ${a}, want ${e}`);
}

/* ====================================================================== *
 * PART A — THE SWITCH, READ BACK FROM A FRESH PROCESS
 * ====================================================================== */

/**
 * Why a child process and not a dynamic import with a cache-busting query.
 *
 * These are ES modules and the values under test are MODULE-LEVEL CONSTANTS
 * derived at evaluation time (`AMAZON_LISTED`, `SELLERS`, `MARKETPLACES` …).
 * Re-importing the same file in this process returns the same evaluated
 * module however the specifier is spelled, and a `?v=2` suffix only works
 * until something else in the graph imports the un-suffixed path — which
 * lib/warranty.js and lib/account-demo.js both do. A fresh process has a
 * fresh registry and no such trap, and it costs a few hundred milliseconds.
 */
function readConfigWith(live) {
  const original = fs.readFileSync(CONFIG, 'utf8');
  const patched = patchLive(original, live);

  const probe = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'amazon-switch-')),
    'probe.mjs'
  );

  const url = (rel) => JSON.stringify(pathToFileURL(path.join(ROOT, rel)).href);
  fs.writeFileSync(
    probe,
    `
      const config = await import(${url('lib/site-config.js')});
      const warranty = await import(${url('lib/warranty.js')});
      const demo = await import(${url('lib/account-demo.js')});
      const destinations = await import(${url('lib/buy-destinations.js')});
      process.stdout.write(JSON.stringify({
        AMAZON_LISTED: config.AMAZON_LISTED,
        amazonUrl: config.MARKETPLACE.amazonUrl,
        amazonCartUrl1: config.amazonCartUrl(1),
        amazonCartUrl3: config.amazonCartUrl(3),
        SELLERS: config.SELLERS,
        marketplaceIds: config.MARKETPLACES.map((m) => m.id),
        marketplaceNames: config.MARKETPLACES.map((m) => m.name),
        sellersAnd: config.sellersAnd(),
        sellersOr: config.sellersOr(),
        sellersPossessive: config.sellersPossessive(),
        sellersVerbSets: config.sellersVerb('sets its', 'set their'),
        supportPurchaseSources: config.SUPPORT_PURCHASE_SOURCES,
        authorisedPurchaseSources: config.AUTHORISED_PURCHASE_SOURCES,
        invoiceHint: warranty.INVOICE_NO_HINT,
        demoMarketplace: demo.DEMO_PRODUCTS[0].marketplace,
        buyLabels: destinations.buyDestinations().map((d) => d.label),
      }));
    `
  );

  try {
    fs.writeFileSync(CONFIG, patched);
    // `--import` the resolver, or the probe dies on lib/warranty.js's first
    // line: these files are written for the bundler and use the `@/` alias
    // and extensionless relative imports. See scripts/next-resolve-loader.mjs.
    const out = execFileSync(
      process.execPath,
      ['--import', pathToFileURL(path.join(ROOT, 'scripts/next-resolve-loader.mjs')).href, probe],
      {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 1 << 24,
        // stderr CAPTURED, not inherited. The child prints a
        // MODULE_TYPELESS_PACKAGE_JSON warning for every lib/ file it loads —
        // package.json has no "type", by design, because Next and the three
        // hosts want it that way — and inheriting puts a dozen lines of it
        // in the middle of the test output. A real failure still surfaces:
        // execFileSync throws, and the thrown error carries this stderr.
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    return JSON.parse(out);
  } finally {
    fs.writeFileSync(CONFIG, original);
    fs.rmSync(path.dirname(probe), { recursive: true, force: true });
  }
}

/**
 * Flips `live:` inside the AMAZON block and nowhere else.
 *
 * Anchored on `export const AMAZON = {` and matched non-greedily up to the
 * first `live:` after it, so it cannot wander into another object that also
 * has a `live` field. It THROWS rather than returning the text unchanged if
 * it does not match — a patch that silently did nothing would make both
 * halves of this test assert the same state and pass for the wrong reason,
 * which is the one failure mode that matters here.
 */
function patchLive(source, live) {
  const re = /(export const AMAZON = \{[\s\S]*?\blive:\s*)(true|false)\b/;
  if (!re.test(source)) {
    throw new Error(
      'could not find `live:` inside the AMAZON block in lib/site-config.js. '
        + 'The file is unchanged. If the block was renamed, update patchLive() here.'
    );
  }
  return source.replace(re, `$1${live}`);
}

function assertOff(c) {
  is('OFF  AMAZON_LISTED', c.AMAZON_LISTED, false);

  // The destination every buy surface reads. Empty, not the real URL held
  // beside it — a filled-in `AMAZON.url` with `live:false` must not reach a
  // consumer, or the flag only hides the label and still ships the link.
  is('OFF  MARKETPLACE.amazonUrl', c.amazonUrl, '');
  is('OFF  amazonCartUrl(1)', c.amazonCartUrl1, '');
  is('OFF  amazonCartUrl(3)', c.amazonCartUrl3, '');

  // The prose list, and every helper built on it.
  is('OFF  SELLERS', c.SELLERS, ['Flipkart']);
  is('OFF  sellersAnd()', c.sellersAnd, 'Flipkart');
  is('OFF  sellersOr()', c.sellersOr, 'Flipkart');
  is('OFF  sellersPossessive()', c.sellersPossessive, 'Flipkart’s');
  // Singular agreement, or a policy page reads "Flipkart set their own prices".
  is('OFF  sellersVerb()', c.sellersVerbSets, 'sets its');

  // The buy registry: absent from the array, not present-and-disabled.
  is('OFF  MARKETPLACES ids', c.marketplaceIds, ['flipkart']);
  check(
    'OFF  no buy button names Amazon',
    !c.buyLabels.some((l) => /amazon/i.test(l)),
    c.buyLabels.join(' | ')
  );

  // The form hint under the invoice-number field — the leak this test was
  // written for.
  check(
    'OFF  INVOICE_NO_HINT does not name Amazon',
    !/amazon/i.test(c.invoiceHint),
    c.invoiceHint
  );

  // The demo account's fixture order, which renders a "Track on …" link.
  check(
    'OFF  demo order marketplace is not Amazon',
    !/amazon/i.test(c.demoMarketplace),
    c.demoMarketplace
  );

  /*
   * THE ONE DELIBERATE EXCEPTION, asserted so it stays deliberate.
   *
   * The warranty form's purchase-source dropdown KEEPS Amazon while the
   * listing is off. That is not an oversight and it is not prose: it records
   * where a customer ACTUALLY bought, and somebody holding an Amazon invoice
   * — from a listing that existed before this site's launch, or outside its
   * knowledge — must be able to say so. A form that cannot record a real
   * purchase is worse than one that lists a marketplace the site does not
   * currently link to.
   *
   * Naming a seller in PROSE is a claim about where to buy. Offering it in a
   * provenance dropdown is a question about the past. The two are gated
   * differently on purpose, and this assertion is here so that someone
   * "fixing" the inconsistency has to read this note first.
   */
  check(
    'OFF  the warranty form still OFFERS Amazon as a purchase source (deliberate)',
    c.supportPurchaseSources.includes('Amazon'),
    c.supportPurchaseSources.join(' | ')
  );
  check(
    'OFF  an Amazon purchase is still self-verifying (deliberate)',
    c.authorisedPurchaseSources.includes('Amazon'),
    c.authorisedPurchaseSources.join(' | ')
  );
}

function assertOn(c, asin, url) {
  is('ON   AMAZON_LISTED', c.AMAZON_LISTED, true);

  is('ON   MARKETPLACE.amazonUrl', c.amazonUrl, url);

  // The cart hand-off: quantity carried across to Amazon's own endpoint, so
  // somebody who chose three here lands there with three in the basket.
  check(
    'ON   amazonCartUrl(3) carries the ASIN and the quantity',
    c.amazonCartUrl3.includes(`ASIN.1=${asin}`) && c.amazonCartUrl3.includes('Quantity.1=3'),
    c.amazonCartUrl3
  );
  check(
    'ON   amazonCartUrl(1) carries the ASIN',
    c.amazonCartUrl1.includes(`ASIN.1=${asin}`),
    c.amazonCartUrl1
  );

  // AMAZON FIRST, in the prose and in the buttons. The order is the claim
  // the hero's single buy button makes — it renders buyDestinations()[0].
  is('ON   SELLERS', c.SELLERS, ['Amazon', 'Flipkart']);
  is('ON   sellersAnd()', c.sellersAnd, 'Amazon and Flipkart');
  is('ON   sellersOr()', c.sellersOr, 'Amazon or Flipkart');
  is('ON   sellersPossessive()', c.sellersPossessive, 'Amazon’s or Flipkart’s');
  // Plural agreement now that the subject is two marketplaces.
  is('ON   sellersVerb()', c.sellersVerbSets, 'set their');

  is('ON   MARKETPLACES ids', c.marketplaceIds, ['amazon', 'flipkart']);
  check(
    'ON   a buy button names Amazon, and it is the first one',
    /amazon/i.test(c.buyLabels[0] || ''),
    c.buyLabels.join(' | ')
  );

  check(
    'ON   INVOICE_NO_HINT names both marketplaces',
    /amazon/i.test(c.invoiceHint) && /flipkart/i.test(c.invoiceHint),
    c.invoiceHint
  );

  is('ON   demo order marketplace', c.demoMarketplace, 'Amazon');
}

/* ====================================================================== *
 * PART B — NOBODY TYPES THE WORD
 * ====================================================================== */

/**
 * Occurrences of "amazon" that are allowed to be literals, each with the
 * reason it is not a leak.
 *
 * `file` is an exact repo-relative path and `match` must appear in the
 * offending line, so an allowance covers one known line rather than giving a
 * whole file a pass. A new literal anywhere — including in these files —
 * fails until somebody adds it here and writes down why.
 */
const ALLOWED = [
  {
    file: 'lib/site-config.js',
    match: "url: 'https://www.amazon.in/dp/B0HPG9T21G'",
    why: 'the switch itself: the listing URL, gated by AMAZON_LISTED on the way out',
  },
  {
    file: 'lib/site-config.js',
    match: "https://www.amazon.in/gp/aws/cart/add.html",
    why: "amazonCartUrl(): Amazon's own cart endpoint, returned only when AMAZON_LISTED",
  },
  {
    file: 'lib/site-config.js',
    match: "AMAZON_LISTED ? ['Amazon'] : []",
    why: 'SELLERS: the conditional that adds the name to the prose list',
  },
  {
    file: 'lib/site-config.js',
    match: "AMAZON_LISTED ? [{ id: 'amazon', name: 'Amazon'",
    why: 'MARKETPLACES: the conditional that adds the buy destination',
  },
  {
    file: 'lib/site-config.js',
    match: "'Amazon',",
    why:
      'SUPPORT_PURCHASE_SOURCES / AUTHORISED_PURCHASE_SOURCES — provenance, not prose. '
      + 'A customer holding an Amazon invoice must be able to register it whether or '
      + 'not we currently link to the listing. See the note in lib/warranty.js.',
  },
  {
    file: 'lib/warranty.js',
    match: "'Amazon',",
    why: 'the documented non-live mirror of the purchase-source lists; see the note above it',
  },
  {
    file: 'lib/warranty.js',
    match: "export const AUTHORISED_PURCHASE_SOURCES = ['Amazon', 'Flipkart']",
    why: 'same mirror; the live list is the one in lib/site-config.js',
  },
  {
    file: 'lib/commerce.js',
    match: "export const AMAZON_PRODUCT_URL = 'https://amazon.in/dp/PLACEHOLDER'",
    why:
      'belongs to the switched-off in-site cart (PURCHASE_MODE), which never runs: '
      + 'COMMERCE_ENABLED is false and the mode defaults to "dummy". Carries the '
      + 'PLACEHOLDER marker, so check-production refuses a deploy if it is ever reachable.',
  },
  {
    file: 'components/account/OrderList.jsx',
    match: "Amazon: 'https://www.amazon.in/gp/css/order-history'",
    why:
      'a lookup keyed by the marketplace the CUSTOMER recorded, behind sign-in. '
      + 'Someone who really bought on Amazon still gets their orders link; nothing '
      + 'renders this key unless their own registration carries it.',
  },
];

/**
 * Strips comments so the scan sees only code.
 *
 * A small state machine rather than a regex, because the three things that
 * look like comments and are not — `//` inside a string, `/*` inside a
 * template literal, and a `/` that begins a regex — are all present in this
 * codebase, and a regex-based stripper mangles exactly the lines that matter.
 * Newlines are preserved so reported line numbers stay true.
 */
function stripComments(source) {
  let out = '';
  let i = 0;
  const n = source.length;
  let state = 'code'; // code | line | block | single | double | template
  while (i < n) {
    const c = source[i];
    const next = source[i + 1];

    if (state === 'code') {
      if (c === '/' && next === '/') {
        state = 'line';
        i += 2;
        continue;
      }
      if (c === '/' && next === '*') {
        state = 'block';
        i += 2;
        continue;
      }
      if (c === "'") state = 'single';
      else if (c === '"') state = 'double';
      else if (c === '`') state = 'template';
      out += c;
      i += 1;
      continue;
    }

    if (state === 'line') {
      if (c === '\n') {
        state = 'code';
        out += c;
      }
      i += 1;
      continue;
    }

    if (state === 'block') {
      if (c === '*' && next === '/') {
        state = 'code';
        i += 2;
        continue;
      }
      // Keep newlines so line numbers survive.
      if (c === '\n') out += c;
      i += 1;
      continue;
    }

    // Inside a string or template: copy through, honouring escapes.
    out += c;
    if (c === '\\') {
      out += source[i + 1] ?? '';
      i += 2;
      continue;
    }
    if (
      (state === 'single' && c === "'")
      || (state === 'double' && c === '"')
      || (state === 'template' && c === '`')
    ) {
      state = 'code';
    }
    i += 1;
  }
  return out;
}

function sourceFiles(dir, out = []) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) sourceFiles(rel, out);
    else if (/\.(jsx?|mjs)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

/**
 * WHAT COUNTS AS TYPING IT, and what is just the plumbing's own vocabulary.
 *
 * A blanket /amazon/i over the source flags fifteen lines that are not leaks
 * at all: `AMAZON_LISTED`, `amazonCartUrl()`, `MARKETPLACE.amazonUrl`,
 * `PURCHASE_MODE === 'amazon'`. Those are the NAMES of the machinery that
 * implements the switch — the test would be telling the switch off for
 * existing, and the noise would bury the two real hits. So the rule is
 * narrowed to the two shapes that can actually reach a visitor:
 *
 *   PROSE   the word as a word, with that exact capitalisation — `Amazon` in
 *           a string, in JSX text, or as an object key a label is read from.
 *           Case-sensitive and bounded, so `AMAZON_LISTED` (shouted) and
 *           `amazonCartUrl` (camelCase) are not it, while `'Amazon'` and
 *           `… on Amazon and Flipkart` are. `.` is in the lookbehind so a
 *           property access can never match.
 *
 *   A LINK   any amazon.in / amazon.com URL, whatever its case. A hard-coded
 *           listing URL is a leak even when nothing renders the word, because
 *           it is a destination the switch cannot withdraw.
 */
const PROSE = /(?<![A-Za-z0-9_$.])Amazon(?![A-Za-z0-9_$])/;
const LINK = /amazon\.(in|com)/i;

function scanForLiterals() {
  const found = [];
  for (const file of ['app', 'components', 'lib'].flatMap((d) => sourceFiles(d))) {
    const code = stripComments(fs.readFileSync(path.join(ROOT, file), 'utf8'));
    code.split('\n').forEach((line, index) => {
      if (!PROSE.test(line) && !LINK.test(line)) return;
      const allowed = ALLOWED.some((a) => a.file === file && line.includes(a.match));
      if (!allowed) found.push({ file, line: index + 1, text: line.trim() });
    });
  }
  return found;
}

/* ====================================================================== *
 * PART C — THE RENDERED PAGES (optional)
 * ====================================================================== */

/**
 * Every public route, as a visitor gets it. The account area is excluded on
 * purpose: it is behind sign-in, `noindex`, and its one Amazon reference is
 * keyed by the customer's own recorded marketplace rather than by this
 * switch (see the allowlist entry for OrderList).
 */
const ROUTES = [
  '/',
  '/shop',
  '/shop/iriz',
  '/where-to-buy',
  '/compare',
  '/specs',
  '/about',
  '/cart',
  '/support',
  '/support/faq',
  '/support/contact',
  '/support/warranty-registration',
  '/support/warranty-claim',
  '/legal/warranty',
  '/legal/returns',
  '/legal/shipping',
  '/legal/terms',
  '/legal/privacy',
  '/legal/grievance',
];

/**
 * The two routes that render the warranty form, and therefore the ONE place
 * the word Amazon legitimately appears in the markup while the listing is
 * off: the purchase-source `<select>`.
 *
 * Those pages are not exempted — that would hide a real prose leak on the
 * very pages where two of them were found. Instead the exact `<option>` is
 * cut out of the HTML, the test asserts it WAS there (so the deliberate
 * exception cannot quietly disappear either), and everything else on the page
 * is held to the same "says nothing about Amazon" rule as every other route.
 */
const FORM_ROUTES = ['/support/warranty-registration', '/support/warranty-claim'];
const PURCHASE_SOURCE_OPTION = /<option value="Amazon"[^>]*>Amazon<\/option>/g;

async function checkRendered(base, expectAmazon) {
  const root = base.replace(/\/+$/, '');
  for (const route of ROUTES) {
    let html;
    try {
      const res = await fetch(`${root}${route}`, { headers: { 'user-agent': 'amazon-switch-test' } });
      if (!res.ok) {
        check(`HTML ${route}`, false, `HTTP ${res.status}`);
        continue;
      }
      html = await res.text();
    } catch (error) {
      check(`HTML ${route}`, false, error.message);
      continue;
    }

    let body = html;
    if (FORM_ROUTES.includes(route)) {
      const options = html.match(PURCHASE_SOURCE_OPTION) ?? [];
      check(
        `HTML ${route} still offers Amazon as a purchase source (deliberate)`,
        options.length === 1,
        `${options.length} matching <option>, want 1`
      );
      body = html.replace(PURCHASE_SOURCE_OPTION, '');
    }

    const hits = [...body.matchAll(/amazon/gi)];
    if (expectAmazon) {
      // Not every page sells; only assert the ones whose copy names a seller.
      const mustName = ['/', '/shop', '/shop/iriz', '/where-to-buy', '/legal/terms'];
      if (mustName.includes(route)) {
        check(`HTML ${route} names Amazon`, hits.length > 0, 'no occurrence in the markup');
      }
    } else {
      // The JSON-LD is in the same document, so this covers structured data
      // as well as the visible copy.
      check(
        `HTML ${route} says nothing about Amazon`,
        hits.length === 0,
        hits.length ? `${hits.length} occurrence(s), e.g. …${context(html, hits[0].index)}…` : ''
      );
    }
  }
}

function context(html, at) {
  return html.slice(Math.max(0, at - 70), at + 70).replace(/\s+/g, ' ');
}

/* ====================================================================== *
 * RUN
 * ====================================================================== */

const argv = process.argv.slice(2);
const renderedAt = argv.includes('--rendered') ? argv[argv.indexOf('--rendered') + 1] : null;

const originalConfig = fs.readFileSync(CONFIG, 'utf8');

// A second safety net under the `finally` in readConfigWith(): if this
// process is killed between the patch and the restore, put the file back.
const restore = () => {
  if (fs.readFileSync(CONFIG, 'utf8') !== originalConfig) fs.writeFileSync(CONFIG, originalConfig);
};
process.on('exit', restore);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    restore();
    process.exit(130);
  });
}

console.log('AMAZON SWITCH\n');

/* --- The state the repository is actually in, which must not change. --- */
const liveNow = /export const AMAZON = \{[\s\S]*?\blive:\s*(true|false)\b/.exec(originalConfig)?.[1];
const asin = /export const AMAZON = \{[\s\S]*?\basin:\s*'([^']*)'/.exec(originalConfig)?.[1];
const url = /export const AMAZON = \{[\s\S]*?\burl:\s*'([^']*)'/.exec(originalConfig)?.[1];
console.log(`  committed state   AMAZON.live = ${liveNow}`);
console.log(`  asin / url        ${asin} / ${url}\n`);

/* --- PART A --- */
console.log('A. the switch, flipped both ways');
assertOff(readConfigWith(false));
assertOn(readConfigWith(true), asin, url);
console.log(`   ${checks} assertions\n`);

/* --- The file is back exactly as it was. --- */
const after = fs.readFileSync(CONFIG, 'utf8');
check('lib/site-config.js is byte-identical after the flips', after === originalConfig);

/* --- PART B --- */
console.log('B. no surface types the word');
const literals = scanForLiterals();
check(
  'no un-allowlisted "Amazon" literal in app/, components/ or lib/',
  literals.length === 0,
  literals.length
    ? `\n${literals.map((l) => `       ${l.file}:${l.line}  ${l.text}`).join('\n')}`
    : ''
);
console.log(`   ${ALLOWED.length} documented exceptions, ${literals.length} new\n`);

/* --- PART C --- */
if (renderedAt) {
  console.log(`C. the rendered pages at ${renderedAt} (expecting AMAZON.live = ${liveNow})`);
  await checkRendered(renderedAt, liveNow === 'true');
  console.log(`   ${ROUTES.length} routes\n`);
} else {
  console.log('C. the rendered pages — SKIPPED');
  console.log('   Start the site and pass --rendered <url> to run it:');
  console.log('     npm run dev');
  console.log('     npm run test:amazon -- --rendered http://127.0.0.1:3000\n');
}

if (failures.length) {
  console.error(`FAILED — ${failures.length} of ${checks}\n`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error('');
  process.exit(1);
}

console.log(`PASSED — ${checks} assertions.`);

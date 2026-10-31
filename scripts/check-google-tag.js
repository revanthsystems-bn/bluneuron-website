#!/usr/bin/env node
/**
 * THE GOOGLE TAG GATE. Two invariants, asserted against the SOURCE:
 *
 *   1. gtag.js is loaded EXACTLY ONCE. One `googletagmanager.com/gtag/js`
 *      reference in the whole repository.
 *   2. The Google Ads ID appears in EXACTLY ONE source file —
 *      lib/site-config.js, where the "WHERE TO CHANGE THE GOOGLE ADS ID"
 *      comment is.
 *
 * WHY EITHER MATTERS ENOUGH TO BLOCK A DEPLOY.
 *
 * (1) Google's own Google Ads snippet ships its own gtag.js script tag, and
 * the obvious way to "add the Ads tag" is to paste that snippet in next to
 * the GA4 one. gtag.js is multi-destination and is not built to be loaded
 * twice: the second load re-runs the bootstrap, and the documented symptoms
 * are duplicated page views and double-counted conversions. Neither breaks a
 * build, neither is visible on the page, and both corrupt every number the
 * marketer reads for as long as they go unnoticed. Nothing else in this
 * repository would catch it.
 *
 * (2) An `AW-` ID written twice is the ordinary way a hand-replaced ID goes
 * half-replaced — one file updated, one missed, and the tag reporting to a
 * conversion account nobody is looking at. The constant exists so that
 * swapping the ID is one line; this check is what keeps that true. It counts
 * FILES, not occurrences, so the declaration and the trailing
 * "WHERE TO CHANGE" comment on the same line are fine.
 *
 * IT CHECKS THE SOURCE, AND THE NETWORK PANEL WILL SHOW TWO. Verified on a
 * preview deployment: the browser makes TWO gtag/js requests, one for the GA4
 * measurement ID and one for the Ads ID. The second is injected by gtag.js
 * ITSELF — Google's loader fetches a per-destination config bundle once a
 * `config` call names an Ads destination — and it is not what this check is
 * about. In the DOM, only one script tag has an id (`ga4-src`, ours); the
 * `AW-` one has none, because nothing in this repository wrote it.
 *
 * It is also not the defect: a page load sends ONE page_view per destination
 * (one to google-analytics.com for the G- id, one to google.com/ccm/collect
 * for the AW- id), which is correct, not double-counted. The failure this
 * check exists to prevent is a SECOND BOOTSTRAP from a pasted snippet, and
 * that is a source-level fact. So do not "fix" this check to count network
 * requests — it would fail on a correct site, which is the worst kind of gate.
 *
 * HOW IT READS THE SOURCE: by scanning app/, components/, lib/ and scripts/
 * as text. Nothing here imports lib/site-config.js — that file is ESM and
 * `package.json` declares no `"type": "module"`, so Node would throw on its
 * first `export`. Same approach, and same reasoning, as
 * scripts/check-production.js, which runs this as one of its checks.
 *
 * THE ADS ID IS NOT WRITTEN IN THIS FILE. It is read out of
 * lib/site-config.js at run time, because a check that hard-codes the value
 * it is policing is itself the second copy it exists to forbid — and it would
 * fail the moment the ID is replaced, which is exactly when it needs to work.
 *
 * Run it directly: `node scripts/check-google-tag.js`
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SCAN_DIRS = ['app', 'components', 'lib', 'scripts'];
const SCAN_EXT = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);

// This file policies the others and is not itself a tag site. Excluded by
// name so its own prose — which has to spell the script path and the ID
// prefix to explain itself — cannot trip either check.
const SELF = path.join('scripts', 'check-google-tag.js');

const failures = [];

/** Every source file under SCAN_DIRS, as repo-relative paths. */
function sourceFiles() {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next') continue;
        walk(rel);
      } else if (SCAN_EXT.has(path.extname(entry.name))) {
        if (rel !== SELF) out.push(rel);
      }
    }
  };
  for (const dir of SCAN_DIRS) {
    if (fs.existsSync(path.join(ROOT, dir))) walk(dir);
  }
  return out;
}

const FILES = sourceFiles().map((rel) => ({
  rel,
  text: fs.readFileSync(path.join(ROOT, rel), 'utf8'),
}));

/* ------------------------------------------------------------------ *
 * 1. gtag.js is loaded exactly once
 * ------------------------------------------------------------------ */
{
  // The host and path only. The `?id=` query is deliberately NOT part of the
  // pattern: the point is how many times the SCRIPT is fetched, and a second
  // load pointed at an Ads ID is the exact mistake being prevented.
  const GTAG_SRC = /googletagmanager\.com\/gtag\/js/;

  const hits = [];
  for (const { rel, text } of FILES) {
    text.split(/\r?\n/).forEach((line, i) => {
      // A line that only talks about the script is not a line that loads it.
      // Comment lines are skipped so the long explanations in
      // components/GoogleAnalytics and lib/googleAds stay free to name it.
      const trimmed = line.trim();
      if (/^(\*|\/\/|\/\*)/.test(trimmed)) return;
      if (GTAG_SRC.test(line)) hits.push(`${rel}:${i + 1}: ${trimmed}`);
    });
  }

  if (hits.length === 1) {
    console.log(`  ok   gtag.js is loaded exactly once (${hits[0].split(':')[0]})`);
  } else if (hits.length === 0) {
    failures.push(
      'gtag.js is not loaded anywhere\n'
        + '    Expected exactly one reference, in components/GoogleAnalytics.\n'
        + '    If the Google tag was removed on purpose, remove this check with it —\n'
        + '    but GA4 and Google Ads both ride on that one script, so the far more\n'
        + '    likely cause is a refactor that dropped the script tag.'
    );
  } else {
    failures.push(
      `gtag.js is loaded ${hits.length} times — it must be loaded ONCE\n`
        + hits.map((h) => `      ${h}`).join('\n')
        + '\n\n    gtag.js is multi-destination: ONE script, then one config call per\n'
        + '    destination ID. Loading it twice re-runs the bootstrap and\n'
        + '    double-counts page views and conversions, silently, in the\n'
        + '    reports the marketer reads.\n\n'
        + '    If this came from pasting a Google Ads conversion snippet: delete its\n'
        + '    script tag and keep only the config call. See the header of\n'
        + '    lib/googleAds.js.'
    );
  }
}

/* ------------------------------------------------------------------ *
 * 2. The Google Ads ID appears in exactly one source file
 * ------------------------------------------------------------------ */
{
  const CONFIG_REL = path.join('lib', 'site-config.js');
  const config = FILES.find((f) => f.rel === CONFIG_REL);

  if (!config) {
    failures.push(
      `could not read ${CONFIG_REL}\n`
        + '    This check parses that file for the Ads ID. Fix the path rather than\n'
        + '    removing the check.'
    );
  } else {
    const declared = config.text.match(/export const GOOGLE_ADS_ID = '([^']*)'/);

    if (!declared) {
      failures.push(
        'could not read GOOGLE_ADS_ID from lib/site-config.js\n'
          + '    Expected a line declaring it as a single-quoted string.\n'
          + '    The config was probably refactored. FIX THE PATTERN — do not delete\n'
          + '    the check. An unmatched regex here is a guard that passes because it\n'
          + '    looked at nothing.'
      );
    } else if (declared[1] === '') {
      // Empty is a supported state (see lib/googleAds.js), so there is no ID
      // to find in a second file and nothing to assert. Said out loud,
      // because "all checks passed" while Google Ads is switched off is a
      // fact worth seeing rather than inferring.
      console.log('  ok   GOOGLE_ADS_ID is empty — Google Ads is off, nothing to check');
    } else {
      const id = declared[1];

      if (!/^AW-\d+$/.test(id)) {
        failures.push(
          `GOOGLE_ADS_ID is not a Google Ads conversion ID: '${id}'\n`
            + '    Expected the AW- form — the value from Google Ads -> Tools -> Data\n'
            + '    manager -> Google tag. A G- value is a GA4 measurement ID and\n'
            + '    belongs in NEXT_PUBLIC_GA_ID; a GT- value is a Google Tag container\n'
            + '    and this site does not use one.'
        );
      }

      const holders = FILES.filter((f) => f.text.includes(id)).map((f) => f.rel);

      if (holders.length === 1 && holders[0] === CONFIG_REL) {
        console.log(`  ok   the Google Ads ID is written in one file only (${CONFIG_REL})`);
      } else if (holders.length === 0) {
        // Not reachable in practice — the declaration itself contains the ID
        // — so this firing means the scan list no longer covers lib/.
        failures.push(
          `the Google Ads ID '${id}' was not found in any scanned file\n`
            + '    Including the one that declares it, which means this scan is no\n'
            + '    longer looking where it thinks it is. Fix SCAN_DIRS.'
        );
      } else {
        const extra = holders.filter((h) => h !== CONFIG_REL);
        failures.push(
          `the Google Ads ID '${id}' appears in ${holders.length} source files`
            + ' — it must appear in ONE\n'
            + holders
              .map(
                (h) =>
                  `      ${h}${h === CONFIG_REL ? '  (the declaration — correct)' : '  <- remove it from here'}`
              )
              .join('\n')
            + '\n\n    GOOGLE_ADS_ID in lib/site-config.js is the single place the ID is\n'
            + '    written, so that replacing it is a one-line edit.\n'
            + `    Import the constant in ${extra.join(', ')} instead of repeating it.`
        );
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */
if (failures.length > 0) {
  console.error('\nGoogle tag check FAILED\n');
  failures.forEach((f, i) => console.error(`  ${i + 1}. ${f}\n`));
  process.exit(1);
}

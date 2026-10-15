#!/usr/bin/env node
/**
 * THE PRODUCTION GATE. Everything that is safe in a preview and dangerous
 * live, checked in one place, wired into `npm run deploy`.
 *
 * WHY IT EXISTS. This branch deliberately ships states that must never reach
 * a customer: marketplace URLs that point at Amazon's front page instead of
 * the listing, an account area running on fixtures, `[TBD]` on a policy page.
 * Every one of those is useful for review and every one is a real failure in
 * production — and none of them breaks a build, so nothing would otherwise
 * stop them. A convention ("remember to replace the placeholders") is not a
 * control. This is.
 *
 * WHAT IT CHECKS:
 *   1. No PLACEHOLDER values in lib/site-config.js (the marketplace URLs and
 *      the Amazon ASIN).
 *   2. Supabase keys present — i.e. not DEMO MODE, which would serve a
 *      fictional "Demo User" account to real visitors.
 *   3. No [TBD] on an indexable page, and no masked phone numbers anywhere.
 *      Delegated to scripts/validate-seo.js, which checks the BUILT site.
 *   4. Every referenced image exists. Delegated to scripts/check-media.js.
 *
 * WHAT IT DOES NOT DO: it does not deploy, and it does not fix anything. It
 * exits non-zero and says what is wrong.
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

function pass(name) {
  checks.push(`  ok   ${name}`);
}
function fail(name, detail) {
  checks.push(`  FAIL ${name}`);
  failures.push(`${name}\n       ${detail.split('\n').join('\n       ')}`);
}

/* ------------------------------------------------------------------ *
 * 1. PLACEHOLDER values
 * ------------------------------------------------------------------ */
{
  const file = path.join(ROOT, 'lib', 'site-config.js');
  const src = fs.readFileSync(file, 'utf8');

  // Only ASSIGNED VALUES matter. The marker's own declaration, the helper
  // that tests for it, and the prose explaining both all contain the word —
  // so a naive grep could never pass. A line counts only if it is not a
  // comment, is not the declaration, and assigns something containing the
  // marker.
  const assignments = src
    .split(/\r?\n/)
    .map((raw, i) => ({ line: raw.trim(), n: i + 1 }))
    .filter(({ line }) => line.includes('PLACEHOLDER'))
    .filter(({ line }) => !/^(\*|\/\/|\/\*)/.test(line))
    .filter(({ line }) => !line.startsWith('export const PLACEHOLDER'))
    // The marker must appear INSIDE a string or template literal to count.
    // `value.includes(PLACEHOLDER)` uses it as an identifier and is the
    // helper doing its job; `` `${PLACEHOLDER}_ASIN` `` is a shipped value.
    // An earlier version tested for "an assignment" and flagged the helper,
    // because `=== 'string'` looks like one.
    .filter(({ line }) => /`[^`]*PLACEHOLDER[^`]*`|'[^']*PLACEHOLDER[^']*'|"[^"]*PLACEHOLDER[^"]*"/.test(line));

  if (assignments.length === 0) {
    pass('no PLACEHOLDER values in lib/site-config.js');
  } else {
    fail(
      'PLACEHOLDER values still in lib/site-config.js',
      assignments.map(({ n, line }) => `line ${n}: ${line}`).join('\n')
        + '\n\nReplace them with the real Amazon ASIN and the two real listing URLs.'
    );
  }
}

/* ------------------------------------------------------------------ *
 * 2. Supabase configured (not demo mode)
 * ------------------------------------------------------------------ */
{
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    pass('Supabase keys present (account area is live, not demo)');
  } else {
    const missing = [
      !url && 'NEXT_PUBLIC_SUPABASE_URL',
      !key && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ].filter(Boolean);
    fail(
      'Supabase is not configured — the build would ship DEMO MODE',
      `Missing: ${missing.join(', ')}\n`
        + 'Demo mode serves a fictional "Demo User" account with fixture\n'
        + 'addresses and orders. Export both before building, or see\n'
        + 'docs/supabase-setup.md.'
    );
  }
}

/* ------------------------------------------------------------------ *
 * 3 & 4. The other two scripts, run as themselves.
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

if (failures.length > 0) {
  console.error(`\n${'-'.repeat(68)}\nNOT READY FOR PRODUCTION\n${'-'.repeat(68)}\n`);
  failures.forEach((f, i) => console.error(`${i + 1}. ${f}\n`));
  console.error('Deploy blocked. Nothing has been published.\n');
  process.exit(1);
}

console.log('\nAll production checks passed.\n');

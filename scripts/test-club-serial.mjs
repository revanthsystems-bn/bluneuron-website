/**
 * The serial check-letter test. Run it with:
 *
 *   node scripts/test-club-serial.mjs
 *   node scripts/test-club-serial.mjs path/to/serials.csv   # also check a real export
 *
 * WHY THIS TEST IS THE IMPORTANT ONE. lib/club-serial.js is a transcription
 * of a script that lives outside this repository and prints onto cardboard.
 * If the two drift, every carton already in a warehouse becomes a box whose
 * owner cannot join, and there is no way to patch a printed sticker. So the
 * vectors below come from the REAL label script, not from this module — a
 * test that generates its own expectations would pass against any formula,
 * including a wrong one.
 *
 * It runs standalone (no test framework) for the same reason every other
 * check in scripts/ does: `node scripts/…` with no install step, so it can be
 * run from a shell the moment someone suspects the label script has changed.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * WHY THE MODULE IS COPIED BEFORE IT IS IMPORTED.
 *
 * `package.json` declares no `"type": "module"`, so Node loads any `.js` file
 * as CommonJS and a plain `import … from '../lib/club-serial.js'` dies on its
 * first `export`. Next.js does not care — it bundles the file rather than
 * handing it to Node's loader — so the module is correct as it is and it is
 * only this standalone runner that cannot read it.
 *
 * Renaming it to `.mjs` would fix the test and break nothing today, but
 * `lib/` is `.js` throughout and one odd extension is a worse trade than six
 * lines here. Copying the REAL FILE's bytes to a temporary `.mjs` and
 * importing that tests exactly what ships: there is no second copy to drift,
 * and the copy is rebuilt on every run so it can never go stale.
 */
const SOURCE = new URL('../lib/club-serial.js', import.meta.url);
const tempDir = mkdtempSync(join(tmpdir(), 'club-serial-'));
const tempModule = join(tempDir, 'club-serial.mjs');
writeFileSync(tempModule, readFileSync(SOURCE, 'utf8'));

const {
  SERIAL_EXAMPLE,
  SERIAL_LENGTH,
  checkLetter,
  isValidSerial,
  normalizeSerial,
  parseSerial,
} = await import(pathToFileURL(tempModule).href);

rmSync(tempDir, { recursive: true, force: true });

let failures = 0;
let checks = 0;

function ok(condition, label) {
  checks += 1;
  if (condition) return;
  failures += 1;
  console.log(`  x  ${label}`);
}

function eq(actual, expected, label) {
  checks += 1;
  if (actual === expected) return;
  failures += 1;
  console.log(`  x  ${label}\n       expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

/* ------------------------------------------------------------------ *
 * 1. THE VECTORS, from the label script itself.
 * ------------------------------------------------------------------ */

/**
 * Two runs on purpose. 001-005 walks the unit digit through the low end;
 * 500-502 lands in a different batch position and crosses the modulo
 * boundary, which is where an off-by-one in the weights would otherwise hide.
 *
 * An earlier set of five in the original brief (…001Y, …002H, …003T, …004C,
 * …005M) came from a retired 10-character format and is NOT valid under the
 * current rule — they are the reason this file exists. Do not add them back.
 */
const KNOWN_GOOD = [
  'IRZT6XA001D',
  'IRZT6XA002P',
  'IRZT6XA003A',
  'IRZT6XA004L',
  'IRZT6XA005X',
  'IRZT6XA500L',
  'IRZT6XA501X',
  'IRZT6XA502H',
];

console.log('\nIRIZ Club — serial check letter\n');
console.log('Known-good serials from the label script:');
for (const serial of KNOWN_GOOD) {
  eq(checkLetter(serial.slice(0, 10)), serial[10], `${serial} check letter`);
  ok(isValidSerial(serial), `${serial} is valid`);
  eq(parseSerial(serial), serial, `${serial} parses to itself`);
}

/* ------------------------------------------------------------------ *
 * 2. SINGLE-CHARACTER CHANGES — and the exact set this checksum cannot see.
 * ------------------------------------------------------------------ *
 *
 * EVERY single-character change is rejected EXCEPT one precisely-defined
 * family, and this test asserts that family rather than pretending it does
 * not exist. Measured, not assumed: of 3,080 mutations across the eight
 * vectors, 72 survive and every one of them is the same thing.
 *
 * WHY. The check is `sum((i+1) * value) % 23`. Substituting a character at
 * position i changes the sum by `(i+1) * delta`, where delta is the change in
 * the character's VALUE (its index in FULL). The mutation is invisible
 * exactly when `(i+1) * delta ≡ 0 (mod 23)`. 23 is prime and the weights are
 * 1..10, so no weight is divisible by it — which leaves `delta ≡ 0 (mod 23)`.
 * Values run 0..35, so the only possible such delta is ±23.
 *
 * THAT IS 9 PAIRS PER SERIAL, and they are not typos anyone makes: a value
 * 23 apart is 0↔N, 1↔O, 4↔R, 6↔T, A↔X, C↔Z. Nobody mistypes Z as C. The
 * misreadings a sticker actually produces — 0/O, 1/I, 5/S, 8/B, and any
 * transposition of adjacent characters — are all caught, because their deltas
 * are small and their weights differ.
 *
 * AND IT DOES NOT MATTER OPERATIONALLY, which is the real point: the check
 * letter only decides whether a string is worth a database call. An
 * undetectable typo produces a well-formed serial that is not in
 * `club_serials`, so it comes back NOT_FOUND. The database is the gate.
 *
 * The check letter's OWN position is covered too, and has no survivors:
 * exactly one letter is correct for a given ten, so guessing it always fails.
 */
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MODULUS = 23;
let mutations = 0;
const unexpected = [];
let invisible = 0;

for (const serial of KNOWN_GOOD) {
  for (let i = 0; i < serial.length; i += 1) {
    for (const ch of ALPHABET) {
      if (ch === serial[i]) continue;
      const mutated = serial.slice(0, i) + ch + serial.slice(i + 1);
      mutations += 1;
      if (!isValidSerial(mutated)) continue;

      // It survived. It is only allowed to if it is in the family above:
      // a payload position whose VALUE moved by exactly a multiple of 23.
      const delta = ALPHABET.indexOf(ch) - ALPHABET.indexOf(serial[i]);
      const explained = i < 10 && delta !== 0 && delta % MODULUS === 0;
      if (explained) invisible += 1;
      else unexpected.push(`${serial} -> ${mutated} (position ${i}, delta ${delta})`);
    }
  }
}

checks += 1;
if (unexpected.length > 0) {
  failures += 1;
  console.log(`  x  ${unexpected.length} mutation(s) survived for a reason this checksum does not predict:`);
  for (const s of unexpected.slice(0, 10)) console.log(`       ${s}`);
} else {
  console.log(
    `  ok  ${mutations - invisible} of ${mutations} single-character changes rejected`
  );
  console.log(
    `  ok  the other ${invisible} are all value-delta ±23, which a mod-23 checksum`
  );
  console.log('      cannot detect by construction (0/N 1/O 4/R 6/T A/X C/Z — not typos).');
}

/* ------------------------------------------------------------------ *
 * 3. Normalisation: what a person actually types.
 * ------------------------------------------------------------------ */
console.log('\nNormalisation:');
eq(normalizeSerial('irzt6xa001d'), 'IRZT6XA001D', 'lowercase is upper-cased');
eq(normalizeSerial('IRZ-T6X-A001-D'), 'IRZT6XA001D', 'dashes are stripped');
eq(normalizeSerial('  irz t6x a001 d '), 'IRZT6XA001D', 'spaces are stripped');
eq(normalizeSerial(null), '', 'null normalises to empty');
eq(normalizeSerial(undefined), '', 'undefined normalises to empty');
ok(isValidSerial(' irz-t6x-a001-d '), 'a spaced, dashed, lowercase serial is valid');

/* ------------------------------------------------------------------ *
 * 4. Rejections that are not single-character changes.
 * ------------------------------------------------------------------ */
console.log('\nRejections:');
ok(!isValidSerial(''), 'empty string');
ok(!isValidSerial('IRZT6XA001'), 'ten characters (check letter missing)');
ok(!isValidSerial('IRZT6XA001DD'), 'twelve characters');
ok(!isValidSerial('IRZT6XA001I'), 'I is not in the check alphabet');
ok(!isValidSerial('IRZT6XA001O'), 'O is not in the check alphabet');
ok(!isValidSerial('IRZT6XA001Q'), 'Q is not in the check alphabet');
ok(!isValidSerial('IRZT6XA00_D'), 'underscore is outside the value alphabet');
ok(!isValidSerial('IRZT6XA00.D'), 'full stop is outside the value alphabet');
ok(!isValidSerial(null), 'null');
ok(!isValidSerial(undefined), 'undefined');
ok(!isValidSerial(12345678901), 'a number');
eq(checkLetter('SHORT'), null, 'checkLetter on a short payload returns null');
eq(checkLetter('IRZT6XA00!'), null, 'checkLetter on an out-of-alphabet payload returns null');
eq(parseSerial('IRZT6XA001Y'), null, 'a wrong check letter does not parse');

/* ------------------------------------------------------------------ *
 * 5. The example on the page must itself be well-formed.
 * ------------------------------------------------------------------ *
 * It is printed on /club as "this is what a serial looks like", so a
 * malformed one would teach every visitor the wrong shape.
 */
console.log('\nThe on-page example:');
ok(isValidSerial(SERIAL_EXAMPLE), `${SERIAL_EXAMPLE} (SERIAL_EXAMPLE) is well-formed`);
eq(SERIAL_EXAMPLE.length, SERIAL_LENGTH, 'SERIAL_EXAMPLE is the declared length');

/* ------------------------------------------------------------------ *
 * 6. OPTIONAL: a real serials.csv, if one was handed over.
 * ------------------------------------------------------------------ *
 *
 * The manufacturing export is not in this repository and must not be — it is
 * the full list of keys to the Club. Point this test at a local copy before
 * importing it into Supabase, because a CSV that disagrees with this module
 * is a CSV whose rows can be imported and then never claimed.
 *
 * Reads the `serial` column by header name rather than by position, so a
 * column added to the export does not silently shift it.
 */
const csvPath = process.argv[2];
if (csvPath) {
  console.log(`\nserials.csv (${csvPath}):`);
  const lines = readFileSync(csvPath, 'utf8').split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const column = header.indexOf('serial');

  if (column === -1) {
    failures += 1;
    console.log('  x  no "serial" column in the header row');
  } else {
    const bad = [];
    const seen = new Set();
    const duplicates = [];

    for (let i = 1; i < lines.length; i += 1) {
      const value = (lines[i].split(',')[column] ?? '').trim();
      if (!value) continue;
      const parsed = parseSerial(value);
      if (!parsed) bad.push(`line ${i + 1}: ${value}`);
      else if (seen.has(parsed)) duplicates.push(`line ${i + 1}: ${parsed}`);
      else seen.add(parsed);
    }

    checks += 1;
    if (bad.length) {
      failures += 1;
      console.log(`  x  ${bad.length} row(s) failed the check letter:`);
      for (const b of bad.slice(0, 20)) console.log(`       ${b}`);
      console.log('\n     These rows can be imported and then never claimed. Either the');
      console.log('     label script and lib/club-serial.js disagree, or the export is');
      console.log('     from an older format. Do NOT import until this is zero.');
    } else {
      console.log(`  ok  all ${seen.size} serials pass the check letter`);
    }

    checks += 1;
    if (duplicates.length) {
      failures += 1;
      console.log(`  x  ${duplicates.length} duplicate serial(s) — the import will fail on the primary key:`);
      for (const d of duplicates.slice(0, 20)) console.log(`       ${d}`);
    } else {
      console.log('  ok  no duplicate serials');
    }
  }
} else {
  console.log('\nserials.csv: not checked (pass a path as the first argument).');
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */
if (failures > 0) {
  console.log(`\n${failures} of ${checks} checks FAILED.\n`);
  process.exit(1);
}
console.log(`\nAll ${checks} checks passed.\n`);

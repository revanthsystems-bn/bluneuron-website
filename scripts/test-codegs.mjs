/**
 * Code.gs, unit-tested — WITHOUT Google.
 *
 *   node scripts/test-codegs.mjs
 *
 * ===========================================================================
 * WHY THIS EXISTS: the live site and this repository are deployed separately.
 * ===========================================================================
 * www.bluneuron.com is a Worker deployed by hand from `cloudflare` and still
 * posts the OLD field name (`orderId`), while this branch posts the new one
 * (`invoiceNo`). Code.gs has to accept both, write them into the same column,
 * and rename that column's header in place without moving or losing anything.
 * None of that is observable from the site, and all of it is one mistake away
 * from a column of customer data landing in the wrong place — so it is tested
 * here rather than discovered in the Sheet.
 *
 * HOW IT RUNS THE SCRIPT. Code.gs is plain JavaScript that happens to call
 * five Google services. It is evaluated in a `node:vm` context with a FAKE
 * SpreadsheetApp / PropertiesService / LockService / Utilities /
 * ContentService underneath it — see the stubs below. The fake sheet is an
 * array of arrays and the assertions read it directly, so what is checked is
 * the actual values that would land in actual cells.
 *
 * WHAT IT CANNOT CATCH, stated plainly: anything about the real Sheets API
 * that the stubs get wrong — a range off by one, a number format that does
 * not behave as assumed. The stubs implement the handful of calls Code.gs
 * makes and nothing else. After the Apps Script is redeployed, one
 * registration and one claim should still be walked through by hand.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createContext, Script } from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

let failures = 0;
let checks = 0;

function ok(condition, label, detail) {
  checks += 1;
  if (condition) {
    console.log(`  ok  ${label}`);
    return;
  }
  failures += 1;
  console.log(`  x   ${label}${detail ? `\n        ${detail}` : ''}`);
}

function eq(actual, expected, label) {
  ok(
    JSON.stringify(actual) === JSON.stringify(expected),
    label,
    `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
  );
}

/* ------------------------------------------------------------------ *
 * THE FAKE SPREADSHEET
 * ------------------------------------------------------------------ *
 * A sheet is `cells`, a dense array of rows. getLastRow/getLastColumn are
 * computed from it the way Sheets computes them — the last row and column
 * holding anything — because ensureSheetHeaders branches on both and a stub
 * that returned the array's raw dimensions would hide the empty-sheet path.
 */
function makeSheet(name, cells = []) {
  const sheet = {
    name,
    cells,
    frozenRows: 0,
    setFrozenRows(n) { sheet.frozenRows = n; },
    getLastRow() {
      let last = 0;
      cells.forEach((row, i) => {
        if ((row ?? []).some((v) => v !== '' && v !== null && v !== undefined)) last = i + 1;
      });
      return last;
    },
    getLastColumn() {
      let last = 0;
      for (const row of cells) {
        (row ?? []).forEach((v, j) => {
          if (v !== '' && v !== null && v !== undefined) last = Math.max(last, j + 1);
        });
      }
      return last;
    },
    getRange(row, col, numRows = 1, numCols = 1) {
      return {
        setNumberFormat() { return this; },
        clearContent() {
          for (let r = 0; r < numRows; r += 1) {
            const target = (cells[row - 1 + r] ??= []);
            for (let c = 0; c < numCols; c += 1) target[col - 1 + c] = '';
          }
          return this;
        },
        getValues() {
          const out = [];
          for (let r = 0; r < numRows; r += 1) {
            const source = cells[row - 1 + r] ?? [];
            const line = [];
            for (let c = 0; c < numCols; c += 1) line.push(source[col - 1 + c] ?? '');
            out.push(line);
          }
          return out;
        },
        getDisplayValues() {
          return this.getValues().map((line) => line.map((v) => String(v ?? '')));
        },
        setValues(values) {
          values.forEach((line, r) => {
            const target = (cells[row - 1 + r] ??= []);
            line.forEach((v, c) => { target[col - 1 + c] = v; });
          });
          return this;
        },
        // Used only for the registration de-duplication scan.
        createTextFinder(needle) {
          return {
            matchEntireCell() { return this; },
            findNext() {
              for (let r = 0; r < numRows; r += 1) {
                const value = (cells[row - 1 + r] ?? [])[col - 1];
                if (value !== undefined && String(value) === String(needle)) {
                  return { getRow: () => row + r };
                }
              }
              return null;
            },
          };
        },
      };
    },
  };
  return sheet;
}

function runScript({ sheets = {}, token = 'test-token', spreadsheetId = 'SHEET_ID' } = {}) {
  const store = { API_TOKEN: token, SPREADSHEET_ID: spreadsheetId };
  const logs = [];

  const spreadsheet = {
    getId: () => spreadsheetId,
    getSheetByName: (name) => sheets[name] ?? null,
    insertSheet: (name) => (sheets[name] = makeSheet(name)),
  };

  const sandbox = {
    console: { log: (m) => logs.push(m), error: (m) => logs.push(String(m)) },
    JSON,
    Date,
    String,
    Number,
    Math,
    isNaN,
    RegExp,
    Object,
    Array,
    Error,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
      openById: () => spreadsheet,
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => store[k] ?? null,
        setProperty: (k, v) => { store[k] = v; },
      }),
    },
    LockService: {
      getScriptLock: () => ({ waitLock() {}, releaseLock() {} }),
    },
    Session: { getScriptTimeZone: () => 'Asia/Kolkata' },
    Utilities: {
      getUuid: () => '00000000-0000-4000-8000-000000000000',
      // Only the two patterns Code.gs asks for.
      formatDate(date, _tz, pattern) {
        const iso = new Date(date).toISOString();
        return pattern === 'yyyy-MM-dd' ? iso.slice(0, 10) : `${iso.slice(0, 10)} ${iso.slice(11, 19)}`;
      },
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (text) => ({ text, setMimeType: () => ({ text }) }),
    },
  };

  const context = createContext(sandbox);
  new Script(readFileSync(join(root, 'Code.gs'), 'utf8')).runInContext(context);

  return {
    sheets,
    logs,
    post(body) {
      const out = sandbox.doPost({ postData: { contents: JSON.stringify(body) } });
      return JSON.parse(out.text);
    },
    fn: sandbox,
  };
}

const UUID = '11111111-2222-4333-8444-555555555555';
const REG_HEADERS_OLD = [
  'Registration ID', 'Full name', 'Email', 'Phone number', 'Where you bought it',
  'Order ID', 'Purchase date', 'Serial number', 'Needs verification', 'Registered at',
];
const REG_HEADERS_NEW = [
  'Registration ID', 'Full name', 'Email', 'Phone number', 'Where you bought it',
  'Invoice No', 'Purchase date', 'Serial No', 'Needs verification', 'Registered at',
];

/** A registration body in the shape the UPDATED site posts. */
function registration(extra = {}) {
  return {
    apiToken: 'test-token',
    registrationId: UUID,
    fullName: 'Test Person',
    email: 'test@example.test',
    phoneNumber: '+919876543210',
    purchaseSource: 'Flipkart',
    purchaseDate: '2026-01-15',
    invoiceNo: 'FAABCD2601234567',
    orderId: 'FAABCD2601234567',
    serialNumber: 'IRZT6XA001D',
    needsVerification: false,
    ...extra,
  };
}

/** A registration body in the shape the LIVE site posts — no `invoiceNo`. */
function legacyRegistration(extra = {}) {
  const body = registration(extra);
  delete body.invoiceNo;
  return body;
}

console.log('\nCode.gs — registrations, claims and the column rename\n');

/* --- 1. The updated site: invoiceNo and a check-lettered serial. */
console.log('The updated site (invoiceNo):');
{
  const sheets = { 'Warranty Registrations': makeSheet('Warranty Registrations', [[...REG_HEADERS_OLD]]) };
  const run = runScript({ sheets });
  const result = run.post(registration());
  ok(result.saved === true, 'a registration with invoiceNo is saved', JSON.stringify(result));

  const rows = sheets['Warranty Registrations'].cells;
  eq(rows[0], REG_HEADERS_NEW, 'the header row was renamed in place');
  eq(rows[1][5], 'FAABCD2601234567', 'the invoice number landed in column 6, where Order ID was');
  eq(rows[1][7], 'IRZT6XA001D', 'the serial landed in column 8, where Serial number was');
  ok(rows[0].length === 10, 'still ten columns — nothing was appended', `got ${rows[0].length}`);
}

/* --- 2. The LIVE site: orderId only, and it must keep working. */
console.log('\nThe live site (orderId, unchanged):');
{
  const sheets = { 'Warranty Registrations': makeSheet('Warranty Registrations', [[...REG_HEADERS_OLD]]) };
  const run = runScript({ sheets });
  const result = run.post(legacyRegistration());
  ok(result.saved === true, 'a registration with only orderId is saved', JSON.stringify(result));
  eq(sheets['Warranty Registrations'].cells[1][5], 'FAABCD2601234567',
    'the legacy orderId landed in the SAME column as invoiceNo');
}
{
  // The rule that would have broken the live site: an order ID with a space
  // in it, which the old script accepted and the new strict rule does not.
  const sheets = { 'Warranty Registrations': makeSheet('Warranty Registrations', [[...REG_HEADERS_OLD]]) };
  const run = runScript({ sheets });
  const result = run.post(legacyRegistration({ orderId: '407-1234567 8901234' }));
  ok(result.saved === true, 'a legacy order ID containing a space is still accepted',
    JSON.stringify(result));
  eq(sheets['Warranty Registrations'].cells[1][5], '407-1234567 8901234',
    'and is stored verbatim');
}
{
  // The live site's serial is free text and has never been check-lettered.
  const sheets = { 'Warranty Registrations': makeSheet('Warranty Registrations', [[...REG_HEADERS_OLD]]) };
  const run = runScript({ sheets });
  const result = run.post(legacyRegistration({ serialNumber: 'BNA510SH2026000917' }));
  ok(result.saved === true, 'a legacy serial in another format is still accepted');
  eq(sheets['Warranty Registrations'].cells[1][7], 'BNA510SH2026000917', 'and is stored verbatim');
}

/* --- 3. The invoice number, under the strict rule. */
console.log('\nThe invoice number, strictly (updated site only):');
{
  const cases = [
    ['FAABCD2601234567', true, 'a Flipkart invoice number'],
    ['BN/2026-27/0042', true, 'a dealer book number with slashes'],
    ['AB.12', true, 'dots are allowed'],
    ['ABC', false, 'three characters is under the floor'],
    ['F'.repeat(41), false, 'forty-one characters is over the ceiling'],
    ['FA ABCD 2601', false, 'a space is refused'],
    ['FA#ABCD', false, 'a hash is refused'],
    ['  FAABCD2601  ', true, 'surrounding whitespace is trimmed, not refused'],
  ];
  for (const [value, expected, label] of cases) {
    const sheets = { 'Warranty Registrations': makeSheet('Warranty Registrations', [[...REG_HEADERS_OLD]]) };
    const run = runScript({ sheets });
    const result = run.post(registration({ invoiceNo: value, orderId: value }));
    ok(result.saved === expected, label, `saved=${result.saved} for ${JSON.stringify(value)}`);
  }
}

/* --- 4. The serial number is OPTIONAL, and checked when given. */
console.log('\nThe serial number (optional):');
{
  const sheets = { 'Warranty Registrations': makeSheet('Warranty Registrations', [[...REG_HEADERS_OLD]]) };
  const run = runScript({ sheets });
  const result = run.post(registration({ serialNumber: '' }));
  ok(result.saved === true, 'a registration with NO serial is saved', JSON.stringify(result));
  eq(sheets['Warranty Registrations'].cells[1][7], '', 'and the Serial No cell is empty');
}
{
  const sheets = { 'Warranty Registrations': makeSheet('Warranty Registrations', [[...REG_HEADERS_OLD]]) };
  const run = runScript({ sheets });
  const result = run.post(registration({ serialNumber: undefined }));
  ok(result.saved === true, 'a registration with the serial key absent is saved');
}
{
  const sheets = { 'Warranty Registrations': makeSheet('Warranty Registrations', [[...REG_HEADERS_OLD]]) };
  const run = runScript({ sheets });
  const result = run.post(registration({ serialNumber: 'irz-t6x-a001-d' }));
  ok(result.saved === true, 'a lower-case dashed serial is accepted');
  eq(sheets['Warranty Registrations'].cells[1][7], 'IRZT6XA001D',
    'and is normalised to upper case without spaces or dashes');
}
{
  const sheets = { 'Warranty Registrations': makeSheet('Warranty Registrations', [[...REG_HEADERS_OLD]]) };
  const run = runScript({ sheets });
  // IRZT6XA001D is the valid one; Y is the wrong check letter.
  const result = run.post(registration({ serialNumber: 'IRZT6XA001Y' }));
  ok(result.saved === false, 'a wrong check letter is REFUSED, not stored');
  ok(sheets['Warranty Registrations'].cells.length === 1, 'and no row was written');
}

/* --- 5. The check letter agrees with lib/club-serial.js. */
console.log('\nThe check letter agrees with the site:');
{
  /*
   * lib/club-serial.js is ESM in a package that declares no `"type":
   * "module"`, so Node's loader reads it as CommonJS and chokes on its first
   * `export`. The REAL FILE's bytes are copied to a temporary `.mjs` and
   * imported from there — the same trick, for the same reason, as
   * scripts/test-club-serial.mjs. See the long note there.
   */
  const tempDir = mkdtempSync(join(tmpdir(), 'codegs-serial-'));
  const tempModule = join(tempDir, 'club-serial.mjs');
  writeFileSync(tempModule, readFileSync(join(root, 'lib', 'club-serial.js'), 'utf8'));
  const { isValidSerial } = await import(pathToFileURL(tempModule).href);
  rmSync(tempDir, { recursive: true, force: true });

  const run = runScript();
  const vectors = ['IRZT6XA001D', 'IRZT6XA002P', 'IRZT6XA003A', 'IRZT6XA500L', 'IRZT6XA001Y', 'IRZT6XA006N'];
  const agree = vectors.every((s) => run.fn.isValidSerial(s) === isValidSerial(s));
  ok(agree, 'Code.gs and lib/club-serial.js give the same answer for every vector');
}

/* --- 6. De-duplication on Registration ID still works. */
console.log('\nDe-duplication:');
{
  const sheets = { 'Warranty Registrations': makeSheet('Warranty Registrations', [[...REG_HEADERS_OLD]]) };
  const run = runScript({ sheets });
  run.post(registration());
  run.post(registration({ fullName: 'Test Person Again' }));
  const rows = sheets['Warranty Registrations'].cells;
  ok(rows.length === 2, 'a resubmitted registration id overwrites its own row', `${rows.length} rows`);
  eq(rows[1][1], 'Test Person Again', 'with the newer values');
}

/* --- 7. A sheet already on the NEW headers is left alone. */
console.log('\nIdempotence:');
{
  const sheets = { 'Warranty Registrations': makeSheet('Warranty Registrations', [[...REG_HEADERS_NEW]]) };
  const run = runScript({ sheets });
  const result = run.post(registration());
  ok(result.saved === true, 'a sheet already renamed accepts a registration');
  eq(sheets['Warranty Registrations'].cells[0], REG_HEADERS_NEW, 'and its headers are untouched');
}

/* --- 8. Existing rows survive the rename. */
console.log('\nExisting rows survive the rename:');
{
  const existing = [
    'old-id-0001', 'Earlier Customer', 'earlier@example.test', '+919000000000',
    'Amazon', 'ORDER-123', '2025-12-01', 'BNA510SH0001', '', '2025-12-01T00:00:00.000Z',
  ];
  const sheets = {
    'Warranty Registrations': makeSheet('Warranty Registrations', [[...REG_HEADERS_OLD], existing]),
  };
  const run = runScript({ sheets });
  run.post(registration());
  const rows = sheets['Warranty Registrations'].cells;
  eq(rows[0], REG_HEADERS_NEW, 'the headers are renamed');
  eq(rows[1], existing, 'the pre-existing row is byte-for-byte where it was');
  eq(rows[2][5], 'FAABCD2601234567', 'and the new row went underneath it');
}

/* --- 9. Claims: the same two renames, the same two spellings. */
console.log('\nClaims:');
const CLAIM_HEADERS_OLD = [
  'Timestamp', 'Claim reference', 'Full name', 'Email', 'Phone number',
  'Order ID', 'Serial number', 'Issue type', 'Description', 'Status',
];
const CLAIM_HEADERS_NEW = [
  'Timestamp', 'Claim reference', 'Full name', 'Email', 'Phone number',
  'Invoice No', 'Serial No', 'Issue type', 'Description', 'Status',
];

function claim(extra = {}) {
  return {
    apiToken: 'test-token',
    type: 'claim',
    claimRef: 'CLM-2345-6789',
    fullName: 'Test Person',
    email: 'test@example.test',
    phoneNumber: '+919876543210',
    invoiceNo: 'FAABCD2601234567',
    orderId: 'FAABCD2601234567',
    serialNumber: 'IRZT6XA001D',
    issueType: 'Picture',
    description: 'The picture has a green cast across the whole frame since last week.',
    ...extra,
  };
}

{
  const sheets = { Claims: makeSheet('Claims', [[...CLAIM_HEADERS_OLD]]) };
  const run = runScript({ sheets });
  const result = run.post(claim());
  ok(result.saved === true, 'a claim with invoiceNo is saved', JSON.stringify(result));
  eq(sheets.Claims.cells[0], CLAIM_HEADERS_NEW, 'the Claims headers were renamed in place');
  eq(sheets.Claims.cells[1][5], 'FAABCD2601234567', 'the invoice number is in column 6');
  eq(sheets.Claims.cells[1][9], 'New', 'the status column still defaults to New');
}
{
  const sheets = { Claims: makeSheet('Claims', [[...CLAIM_HEADERS_OLD]]) };
  const run = runScript({ sheets });
  const body = claim();
  delete body.invoiceNo;
  const result = run.post(body);
  ok(result.saved === true, 'a claim with only orderId is saved');
  eq(sheets.Claims.cells[1][5], 'FAABCD2601234567', 'into the same column');
}
{
  const sheets = { Claims: makeSheet('Claims', [[...CLAIM_HEADERS_OLD]]) };
  const run = runScript({ sheets });
  const result = run.post(claim({ serialNumber: '' }));
  ok(result.saved === true, 'a claim with no serial is saved');
  eq(sheets.Claims.cells[1][6], '', 'and the Serial No cell is empty');
}
{
  const sheets = { Claims: makeSheet('Claims', [[...CLAIM_HEADERS_OLD]]) };
  const run = runScript({ sheets });
  run.post(claim());
  run.post(claim({ claimRef: 'CLM-3456-789A' }));
  ok(sheets.Claims.cells.length === 3, 'claims append rather than de-duplicate',
    `${sheets.Claims.cells.length} rows`);
}
{
  const sheets = { Claims: makeSheet('Claims') };
  const run = runScript({ sheets });
  const result = run.post(claim());
  ok(result.saved === true, 'an empty Claims tab is created with the new headers');
  eq(sheets.Claims.cells[0], CLAIM_HEADERS_NEW, 'with the new names from the start');
}

/* --- 10. Refusals that must stay refusals. */
console.log('\nStill refused:');
{
  const run = runScript({ sheets: { 'Warranty Registrations': makeSheet('Warranty Registrations', [[...REG_HEADERS_OLD]]) } });
  eq(run.post({ ...registration(), apiToken: 'wrong' }).error, 'Unauthorized request.',
    'a wrong API token');
  ok(run.post(registration({ invoiceNo: undefined, orderId: undefined })).saved === false,
    'no invoice number under either name');
  ok(run.post(registration({ purchaseSource: 'Shady Reseller' })).saved === false,
    'a purchase source off the allow-list');
  ok(run.post(registration({ purchaseDate: '2099-01-01' })).saved === false,
    'a future purchase date');
  ok(run.post(registration({ registrationId: 'not-a-uuid' })).saved === false,
    'a malformed registration id');
  ok(run.post(claim({ claimRef: 'nope' })).saved === false, 'a malformed claim reference');
  ok(run.post(claim({ description: 'too short' })).saved === false, 'a one-line claim description');
}

if (failures > 0) {
  console.log(`\n${failures} of ${checks} checks FAILED.\n`);
  process.exit(1);
}
console.log(`\nAll ${checks} checks passed.\n`);

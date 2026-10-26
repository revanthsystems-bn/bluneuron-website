/**
 * Validation tests for the two warranty API routes — INVALID DATA ONLY.
 *
 *   node scripts/form-validation-check.mjs http://localhost:3000
 *
 * EVERY PAYLOAD HERE IS DELIBERATELY INVALID, and that is a safety property,
 * not a limitation of the test. A payload that passed validation would be
 * forwarded to the live Google Apps Script endpoint and written to the real
 * warranty sheet, so the suite contains no valid case at all: each one is
 * expected to be rejected by the route before it makes any outbound call.
 *
 * `expect` is the status the route should return. A 200 ANYWHERE IN THIS
 * OUTPUT IS A FAILURE — it means something invalid was accepted, and may mean
 * a row was written.
 */

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/+$/, '');

/** A registration body that is valid in every field EXCEPT the one overridden. */
const REG = {
  name: 'Test Invalid',
  email: 'not-an-email',          // invalid by default, so a typo cannot pass
  phone: '12345',
  purchaseSource: 'Nowhere',
  invoiceNo: 'X',                 // under the 4-character floor
  purchaseDate: '2026-13-45',
  serialNumber: 'X',              // optional, but 'X' is not a valid serial
};

const CASES = [
  // ---------------------------------------------------- registration
  { route: '/api/warranty-registration', name: 'empty object', expect: 400, body: {} },
  { route: '/api/warranty-registration', name: 'array body (not an object)', expect: 400, body: [] },
  { route: '/api/warranty-registration', name: 'malformed JSON', expect: 400, raw: '{"name": ' },
  { route: '/api/warranty-registration', name: 'honeypot filled', expect: 400, body: { ...REG, botcheck: 'spam' } },
  { route: '/api/warranty-registration', name: 'every field invalid', expect: 400, body: REG },
  { route: '/api/warranty-registration', name: 'invalid email only', expect: 400,
    body: { ...REG, email: 'a@b', purchaseSource: 'Amazon', purchaseDate: '2026-01-01' } },
  { route: '/api/warranty-registration', name: 'purchase source off the allow-list', expect: 400,
    body: { ...REG, email: 'x@example.com', purchaseSource: 'Shady Reseller Ltd', purchaseDate: '2026-01-01' } },
  { route: '/api/warranty-registration', name: 'impossible purchase date', expect: 400,
    body: { ...REG, email: 'x@example.com', purchaseSource: 'Amazon', purchaseDate: '2026-02-31' } },
  { route: '/api/warranty-registration', name: 'future purchase date', expect: 400,
    body: { ...REG, email: 'x@example.com', purchaseSource: 'Amazon', purchaseDate: '2099-01-01' } },
  { route: '/api/warranty-registration', name: 'field over 200 chars', expect: 400,
    body: { ...REG, email: 'x@example.com', purchaseSource: 'Amazon', purchaseDate: '2026-01-01', name: 'A'.repeat(500) } },
  { route: '/api/warranty-registration', name: 'invoice number with a space in it', expect: 400,
    body: { ...REG, email: 'x@example.com', purchaseSource: 'Amazon', purchaseDate: '2026-01-01',
      invoiceNo: 'FA ABCD 2601', serialNumber: '' } },
  { route: '/api/warranty-registration', name: 'invoice number over 40 chars', expect: 400,
    body: { ...REG, email: 'x@example.com', purchaseSource: 'Amazon', purchaseDate: '2026-01-01',
      invoiceNo: 'F'.repeat(41), serialNumber: '' } },
  { route: '/api/warranty-registration', name: 'serial with a wrong check letter', expect: 400,
    body: { ...REG, email: 'x@example.com', purchaseSource: 'Amazon', purchaseDate: '2026-01-01',
      invoiceNo: 'FAABCD2601234567', serialNumber: 'IRZT6XA001Y' } },
  { route: '/api/warranty-registration', name: 'legacy orderId, still invalid on its own', expect: 400,
    body: { ...REG, email: 'x@example.com', purchaseSource: 'Amazon', purchaseDate: '2026-01-01',
      invoiceNo: undefined, orderId: 'X' } },
  { route: '/api/warranty-registration', name: 'body over the 10KB cap', expect: 413,
    body: { ...REG, serialNumber: 'A'.repeat(11 * 1024) } },
  { route: '/api/warranty-registration', name: 'GET instead of POST', expect: 405, method: 'GET' },

  // ----------------------------------------------------------- claim
  { route: '/api/warranty-claim', name: 'empty object', expect: 400, body: {} },
  { route: '/api/warranty-claim', name: 'honeypot filled', expect: 400,
    body: { ...REG, issueType: 'Other', description: 'x', botcheck: 'spam' } },
  { route: '/api/warranty-claim', name: 'issue type off the allow-list', expect: 400,
    body: { ...REG, email: 'x@example.com', purchaseSource: 'Amazon', purchaseDate: '2026-01-01',
      issueType: 'Not A Real Issue Type', description: 'test' } },
  { route: '/api/warranty-claim', name: 'description over 4000 chars', expect: 400,
    body: { ...REG, email: 'x@example.com', purchaseSource: 'Amazon', purchaseDate: '2026-01-01',
      issueType: 'Other', description: 'A'.repeat(4100) } },
  { route: '/api/warranty-claim', name: 'body over the 10KB cap', expect: 413,
    body: { ...REG, description: 'A'.repeat(11 * 1024) } },
  { route: '/api/warranty-claim', name: 'GET instead of POST', expect: 405, method: 'GET' },
];

let pass = 0;
let fail = 0;
const accepted = [];

for (const c of CASES) {
  const payload = c.raw ?? (c.body === undefined ? undefined : JSON.stringify(c.body));
  let res;
  try {
    res = await fetch(base + c.route, {
      method: c.method || 'POST',
      headers: { 'content-type': 'application/json' },
      body: c.method === 'GET' ? undefined : payload,
    });
  } catch (e) {
    console.log(`  ERROR  ${c.route} — ${c.name}: ${e.message}`);
    fail += 1;
    continue;
  }

  const ok = res.status === c.expect;
  if (res.status === 200) accepted.push(`${c.route} — ${c.name}`);
  if (ok) pass += 1; else fail += 1;

  let detail = '';
  try {
    const j = await res.json();
    detail = (j.error || j.message || '').slice(0, 54);
  } catch { /* some statuses have no JSON body */ }

  console.log(
    `  ${ok ? 'pass' : 'FAIL'}  ${String(res.status).padEnd(3)} (want ${c.expect})  ` +
    `${c.route.replace('/api/warranty-', '')} — ${c.name}${detail ? `  → "${detail}"` : ''}`,
  );
}

console.log(`\n  ${pass} passed, ${fail} failed`);
if (accepted.length) {
  console.log('\n  *** SOMETHING INVALID WAS ACCEPTED (200). A row may have been written: ***');
  accepted.forEach((a) => console.log('    ' + a));
}
process.exit(fail ? 1 : 0);

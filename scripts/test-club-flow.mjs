/**
 * THE CLUB, END TO END, against a MOCK Supabase.
 *
 *   node scripts/test-club-flow.mjs <base-url> [mock-port]
 *
 * WHAT IT ACTUALLY EXERCISES. Everything between the browser and the database:
 * the route handlers, the body cap, the same-origin check, the server-side
 * check letter, the TWO-STEP join (check-serial then join), the cookie
 * signing and verification, the server guard on /club/home, and the
 * masthead's /api/club/me. Real HTTP against a real `next start` of a real
 * build.
 *
 * THE THREE PROPERTIES OF THE TWO-STEP FLOW THAT ARE WORTH TESTING, and that
 * are each one refactor away from quietly breaking:
 *
 *   1. INVALID AND NOT_FOUND ARE BYTE-IDENTICAL. A malformed serial and a
 *      well-formed one nobody has ever manufactured must produce the same
 *      status and the same body, or /api/club/check-serial becomes an oracle
 *      that tells an attacker which guessed serials are real units.
 *   2. THE RATE LIMIT IS SHARED. Five failures an hour across check-serial
 *      AND join together, not five each — otherwise step one is simply a
 *      second allowance to spend.
 *   3. STEP ONE GRANTS NOTHING. Posting straight to /api/club/join without
 *      ever calling check-serial is validated exactly as fully.
 *
 * WHAT IT MOCKS, and why that is honest: the four PostgREST RPC endpoints.
 * The Supabase project has no club tables until somebody runs the migration
 * by hand (docs/club-setup.md), and a test that cannot run until then is a
 * test that never runs. The mock below implements the SAME contract the SQL
 * does — the same error codes, the same one-serial-one-member rule, the same
 * five-failures-an-hour limit — so a change to the route handlers that breaks
 * against Postgres breaks here too.
 *
 * WHAT IT CANNOT CATCH, stated plainly: a bug inside the SQL functions. The
 * check letter is the one piece of that logic duplicated in SQL, and
 * `scripts/test-club-serial.mjs` plus the cross-check in the migration's
 * comments are what keep those two honest. After the migration is run, the
 * flows here should be walked once by hand against the real database.
 *
 * HOW TO RUN THE WHOLE THING (the build has to point at the mock, because
 * NEXT_PUBLIC_SUPABASE_URL is inlined at build time):
 *
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key \
 *   npx next build
 *
 *   CLUB_SERVER_KEY=<any 64 chars> CLUB_COOKIE_SECRET=<any 32+ chars> \
 *   npx next start -p 3300 &
 *
 *   node scripts/test-club-flow.mjs http://127.0.0.1:3300 54321
 */

import { createServer } from 'node:http';

const base = (process.argv[2] || 'http://127.0.0.1:3300').replace(/\/+$/, '');
const mockPort = Number(process.argv[3] || 54321);

const NL = String.fromCharCode(10);

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

/* ------------------------------------------------------------------ *
 * THE MOCK DATABASE
 * ------------------------------------------------------------------ *
 * Mirrors supabase/migrations/20261024_club.sql: the same return shapes, the
 * same codes, and the same order of checks. It does NOT re-implement the
 * check letter — the route handler rejects a bad one before the RPC is
 * reached, which is itself one of the things being tested.
 */
const SERVER_KEY = 'test-server-key-'.padEnd(64, '0');
const COOKIE_SECRET = 'test-cookie-secret-'.padEnd(48, '0');

const serials = new Set(['IRZT6XA001D', 'IRZT6XA002P', 'IRZT6XA003A', 'IRZT6XA500L']);
const members = new Map(); // serial -> { member_no, email, name, joined_at }
const attempts = new Map(); // key_hash -> timestamps[]
let nextMemberNo = 1;

function rateLimited(keyHash) {
  if (!keyHash) return true;
  const recent = (attempts.get(keyHash) ?? []).filter((t) => Date.now() - t < 3600_000);
  attempts.set(keyHash, recent);
  return recent.length >= 5;
}
function recordFailure(keyHash) {
  const list = attempts.get(keyHash) ?? [];
  list.push(Date.now());
  attempts.set(keyHash, list);
}

const mock = createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    const reply = (obj) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(obj));
    };
    const args = JSON.parse(body || '{}');

    // The server key guard, exactly as club_key_ok does it.
    if (args.p_server_key !== SERVER_KEY) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'forbidden' }));
      return;
    }

    /*
     * club_check_serial. Mirrors 20261027_club_two_step.sql, including the
     * part that matters most: a serial that is not in the set comes back as
     * INVALID, not NOT_FOUND. The conflation happens in SQL so that no route
     * handler can reintroduce the distinction by accident, and the mock has
     * to be conflated too or the test would be checking a looser contract
     * than the one that ships.
     */
    if (req.url.endsWith('/club_check_serial')) {
      if (rateLimited(args.p_key_hash)) return reply({ code: 'RATE_LIMITED' });
      if (!serials.has(args.p_serial)) {
        recordFailure(args.p_key_hash);
        return reply({ code: 'INVALID' });
      }
      // CLAIMED does not count as a failure: the person hitting it is
      // overwhelmingly the owner who has forgotten they joined.
      if (members.has(args.p_serial)) return reply({ code: 'CLAIMED' });
      return reply({ code: 'OK' });
    }

    if (req.url.endsWith('/club_claim')) {
      if (rateLimited(args.p_key_hash)) return reply({ code: 'RATE_LIMITED' });
      if (args.p_consent !== true) return reply({ code: 'INVALID' });
      // Required since the two-step join. Not counted as a rate-limit
      // failure, exactly as the name and email checks are not.
      if (!args.p_phone || !String(args.p_phone).trim()) return reply({ code: 'INVALID' });
      if (!serials.has(args.p_serial)) {
        recordFailure(args.p_key_hash);
        return reply({ code: 'NOT_FOUND' });
      }
      if (members.has(args.p_serial)) return reply({ code: 'ALREADY_CLAIMED' });

      const member = {
        member_no: nextMemberNo++,
        name: args.p_name,
        email: args.p_email,
        joined_at: new Date().toISOString(),
      };
      members.set(args.p_serial, member);
      return reply({ member_no: member.member_no });
    }

    if (req.url.endsWith('/club_signin')) {
      if (rateLimited(args.p_key_hash)) return reply({ code: 'RATE_LIMITED' });
      const member = members.get(args.p_serial);
      if (!member || member.email.toLowerCase() !== String(args.p_email).toLowerCase()) {
        recordFailure(args.p_key_hash);
        return reply({ code: 'NOT_FOUND' });
      }
      return reply({ member_no: member.member_no });
    }

    if (req.url.endsWith('/club_member')) {
      const member = [...members.values()].find((m) => m.member_no === args.p_member_no);
      if (!member) return reply({ code: 'NOT_FOUND' });
      return reply({
        member_no: member.member_no,
        first_name: String(member.name).trim().split(' ')[0],
        joined_at: member.joined_at,
      });
    }

    res.writeHead(404);
    res.end('{}');
  });
});

/* ------------------------------------------------------------------ *
 * A COOKIE JAR PER "BROWSER"
 * ------------------------------------------------------------------ *
 * Two jars is the whole point of the sign-in test: a second device has no
 * cookie, and must be able to get one with serial + email.
 */
function jar() {
  const store = new Map();
  return {
    header() {
      return [...store].map(([k, v]) => `${k}=${v}`).join('; ');
    },
    absorb(response) {
      const raw = response.headers.getSetCookie?.() ?? [];
      for (const line of raw) {
        const [pair] = line.split(';');
        const idx = pair.indexOf('=');
        const name = pair.slice(0, idx).trim();
        const value = pair.slice(idx + 1).trim();
        if (/Max-Age=0/i.test(line) || value === '') store.delete(name);
        else store.set(name, value);
      }
    },
    has(name) {
      return store.has(name);
    },
  };
}

async function post(path, payload, cookies, extraHeaders = {}) {
  const response = await fetch(base + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // The same-origin guard: a browser always sends this on a POST.
      Origin: base,
      ...(cookies ? { Cookie: cookies.header() } : {}),
      ...extraHeaders,
    },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
    redirect: 'manual',
  });
  if (cookies) cookies.absorb(response);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

/**
 * Visible text, with tags removed and whitespace collapsed.
 *
 * Needed because React splits an interpolated heading across text nodes:
 * `Welcome to the {CLUB.name}` arrives as "Welcome to the " and "IRIZ Club"
 * with markup between them, so a raw `includes()` on the HTML looks for a
 * string that is never contiguous. Matching what a READER sees is the right
 * assertion anyway — it does not care how the markup is chunked.
 */
function visible(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function get(path, cookies) {
  const response = await fetch(base + path, {
    headers: cookies ? { Cookie: cookies.header() } : {},
    redirect: 'manual',
  });
  return {
    status: response.status,
    location: response.headers.get('location'),
    text: response.status === 200 ? await response.text() : '',
  };
}

/* ------------------------------------------------------------------ *
 * THE RUN
 * ------------------------------------------------------------------ */
await new Promise((resolve) => mock.listen(mockPort, '127.0.0.1', resolve));
console.log(`\nIRIZ Club — end to end (mock Supabase on :${mockPort})\n`);

const deviceOne = jar();
const deviceTwo = jar();

try {
  /* --- 1. The door is open to a stranger, and says nothing about members. */
  console.log('The door:');
  {
    const page = await get('/club');
    ok(page.status === 200, '/club returns 200 to a visitor with no cookie');
    ok(
      visible(page.text).includes('Welcome to the IRIZ Club'),
      '/club shows the welcome heading'
    );
    ok(
      /name="robots"[^>]*noindex/i.test(page.text),
      '/club sends robots noindex'
    );
  }

  /* --- 2. A non-member cannot reach the member area. */
  console.log('\nThe guard:');
  {
    const home = await get('/club/home');
    ok(
      home.status === 307 || home.status === 302,
      'a non-member hitting /club/home is redirected',
      `status ${home.status}`
    );
    ok(
      (home.location ?? '').endsWith('/club'),
      'the redirect goes to /club',
      `location ${home.location}`
    );
    ok(home.text === '', 'no member markup is sent to a non-member');
  }

  /* --- 3. The masthead tab is absent for a non-member. */
  console.log('\nThe masthead tab:');
  {
    const me = await get('/api/club/me');
    ok(me.status === 200, '/api/club/me answers 200 to a non-member');
    ok(me.text.trim() === '{}', '/api/club/me returns {} — no label, no href', me.text);

    const home = await get('/');
    ok(
      !home.text.includes('/club'),
      'the homepage HTML contains no /club path'
    );
  }

  /* --- 4. Guards that run before anything else. */
  console.log('\nRefused before the database:');
  {
    const noOrigin = await fetch(`${base}/api/club/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serial: 'IRZT6XA001D' }),
    });
    ok(noOrigin.status === 403, 'a POST with no Origin is refused', `status ${noOrigin.status}`);

    const crossOrigin = await post(
      '/api/club/join',
      { serial: 'IRZT6XA001D' },
      null,
      { Origin: 'https://evil.example' }
    );
    ok(crossOrigin.status === 403, 'a cross-origin POST is refused');

    const huge = await post('/api/club/join', 'x'.repeat(8 * 1024), null);
    ok(huge.status === 400, 'a body over the 4 KB cap is refused');

    const badLetter = await post(
      '/api/club/join',
      { serial: 'IRZT6XA001Y', name: 'A', email: 'a@b.co', phone: '9876543210', consent: true },
      null
    );
    ok(badLetter.status === 400, 'a wrong check letter is refused server-side');

    const noConsent = await post(
      '/api/club/join',
      { serial: 'IRZT6XA001D', name: 'A', email: 'a@b.co', phone: '9876543210', consent: false },
      null
    );
    ok(noConsent.status === 400, 'a join without consent is refused');

    // The mobile number became required with the two-step join.
    const noPhone = await post(
      '/api/club/join',
      { serial: 'IRZT6XA001D', name: 'A', email: 'a@b.co', consent: true },
      null
    );
    ok(noPhone.status === 400, 'a join with no mobile number is refused');

    const badPhone = await post(
      '/api/club/join',
      { serial: 'IRZT6XA001D', name: 'A', email: 'a@b.co', phone: '12345', consent: true },
      null
    );
    ok(badPhone.status === 400, 'a join with a number that is not an Indian mobile is refused');

    // ...and every guard above applies to step one as well.
    const checkNoOrigin = await fetch(base + '/api/club/check-serial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serial: 'IRZT6XA001D' }),
    });
    ok(checkNoOrigin.status === 403, 'check-serial with no Origin is refused');

    const checkCrossOrigin = await post(
      '/api/club/check-serial',
      { serial: 'IRZT6XA001D' },
      null,
      { Origin: 'https://evil.example' }
    );
    ok(checkCrossOrigin.status === 403, 'a cross-origin check-serial is refused');

    const checkHuge = await post('/api/club/check-serial', 'x'.repeat(8 * 1024), null);
    ok(checkHuge.status === 400, 'a check-serial body over the 4 KB cap is refused');

    ok(members.size === 0, 'none of the above reached the database');
  }

  /* --- 4b. STEP ONE, and the property that makes it safe to exist. */
  console.log(NL + 'Step one - check-serial:');
  {
    const good = await post('/api/club/check-serial', { serial: 'irz-t6x-a001-d' }, null);
    ok(
      good.status === 200 && good.data.status === 'OK',
      'a real, unclaimed serial answers OK - lower case and dashed, as typed',
      JSON.stringify(good.data)
    );
    ok(members.size === 0, 'and OK reserved nothing: no member row was created');

    /*
     * THE ENUMERATION TEST. This is the reason the endpoint returns so
     * little. IRZT6XA001Y has a WRONG check letter and dies in the route
     * handler; IRZT6XA004L has a CORRECT one and reaches the database, which
     * has never heard of it. Those are two completely different code paths,
     * and from outside they must be one response.
     */
    const malformed = await post('/api/club/check-serial', { serial: 'IRZT6XA001Y' }, null);
    const unknown = await post('/api/club/check-serial', { serial: 'IRZT6XA004L' }, null);
    ok(
      malformed.status === unknown.status,
      'INVALID and NOT_FOUND share a status code',
      malformed.status + ' vs ' + unknown.status
    );
    ok(
      JSON.stringify(malformed.data) === JSON.stringify(unknown.data),
      'INVALID and NOT_FOUND share a byte-identical body - no enumeration hint',
      JSON.stringify(malformed.data) + ' vs ' + JSON.stringify(unknown.data)
    );
    ok(
      !/not found|unknown|does not exist/i.test(unknown.data.error ?? ''),
      'and the message does not hint that the serial was well-formed but unknown'
    );

    const empty = await post('/api/club/check-serial', { serial: '' }, null);
    ok(empty.status === 400, 'an empty serial is refused');

    const honeypot = await post(
      '/api/club/check-serial',
      { serial: 'IRZT6XA001D', botcheck: 'spam' },
      null
    );
    ok(honeypot.status === 400, 'the honeypot is wired up on check-serial too');
  }

  /* --- 5. Joining, both steps, the way a browser does it. */
  console.log(NL + 'Joining (step one, then step two):');
  {
    const stepOne = await post('/api/club/check-serial', { serial: 'irz-t6x-a001-d' }, deviceOne);
    ok(stepOne.status === 200 && stepOne.data.status === 'OK', 'step one clears the serial');
    ok(!deviceOne.has('club_session'), 'step one sets no cookie - it is not a sign-in');

    const joined = await post(
      '/api/club/join',
      {
        serial: 'irz-t6x-a001-d', // lower case and dashed, as a person types it
        name: 'Asha Menon',
        email: 'Asha@example.test',
        phone: '98765 43210',
        city: 'Coimbatore',
        consent: true,
      },
      deviceOne
    );
    ok(joined.status === 200 && joined.data.ok === true, 'a valid serial joins', JSON.stringify(joined.data));
    ok(joined.data.memberNo === 1, 'the first member is #1');
    ok(deviceOne.has('club_session'), 'a session cookie was set');
    ok(members.has('IRZT6XA001D'), 'the serial was normalised to upper case before storage');
  }

  /* --- 6. The member area opens, and shows the member's own card. */
  console.log('\nThe member area:');
  {
    const home = await get('/club/home', deviceOne);
    ok(home.status === 200, 'a member reaches /club/home');
    ok(visible(home.text).includes('Hello, Asha.'), 'the card greets them by first name only');
    ok(visible(home.text).includes('#0001'), 'the card shows the padded member number');
    ok(!home.text.includes('Asha@example.test'), 'the page does not contain the email address');
    ok(!home.text.includes('IRZT6XA001D'), 'the page does not contain the serial number');
    ok(!home.text.includes('9876543210'), 'the page does not contain the phone number');
    ok(
      visible(home.text).includes('Member-only offers will appear here first'),
      'an empty offers list renders the honest line'
    );
    ok(
      visible(home.text).includes('Community opens soon'),
      'an empty community URL renders the honest line'
    );

    const me = await get('/api/club/me', deviceOne);
    ok(me.text.includes('"label"') && me.text.includes('/club'), 'the masthead tab is served to a member');
  }

  /* --- 7. One serial, one member. */
  console.log('\nOne serial, one member:');
  {
    const again = await post(
      '/api/club/join',
      {
        serial: 'IRZT6XA001D',
        name: 'Someone Else',
        email: 'someone@example.test',
        phone: '9000000001',
        consent: true,
      },
      jar()
    );
    ok(again.status === 400, 'a second claim on the same serial is refused');
    ok(
      /already been used/i.test(again.data.error ?? ''),
      'and says so, so the real owner knows to sign in instead'
    );
    ok(members.size === 1, 'no second member row was created');

    // And step one says so FIRST, which is the whole point of step one: the
    // owner is sent to sign-in before typing five more fields.
    const check = await post('/api/club/check-serial', { serial: 'IRZT6XA001D' }, jar());
    ok(
      check.status === 200 && check.data.status === 'CLAIMED',
      'step one reports CLAIMED for a serial that already has a member',
      JSON.stringify(check.data)
    );
  }

  /* --- 7b. STEP ONE GRANTS NOTHING. */
  console.log(NL + 'Step one is not a gate:');
  {
    /*
     * A join posted with NO preceding check-serial, naming a serial that
     * does not exist. If step one were ever treated as an entitlement - a
     * token, a cookie, a cached "verified" flag - this is where it would
     * show up, as either an acceptance or a different error.
     */
    const straightToJoin = await post(
      '/api/club/join',
      {
        serial: 'IRZT6XA005X',   // correct check letter, not a real unit
        name: 'Nobody',
        email: 'nobody@example.test',
        phone: '9876543210',
        consent: true,
      },
      jar()
    );
    ok(straightToJoin.status === 400, 'joining without step one is still validated server-side');
    ok(!members.has('IRZT6XA005X'), 'and no member row was created');

    // The opposite direction: step one says OK, then the join is posted with
    // a DIFFERENT serial. The join must judge what it was sent, not what was
    // checked a moment ago.
    const device = jar();
    await post('/api/club/check-serial', { serial: 'IRZT6XA002P' }, device);
    const swapped = await post(
      '/api/club/join',
      {
        serial: 'IRZT6XA501X',   // correct check letter, not a real unit
        name: 'Swapper',
        email: 'swapper@example.test',
        phone: '9876543210',
        consent: true,
      },
      device
    );
    ok(swapped.status === 400, 'a serial swapped in after step one is refused');
    ok(!members.has('IRZT6XA501X'), 'and claims nothing');
    ok(!members.has('IRZT6XA002P'), 'and does not claim the serial that WAS checked either');
  }

  /* --- 8. A second device signs in. */
  console.log('\nA second device:');
  {
    /*
     * THE BUCKET IS CLEARED FIRST, for the same reason section 11 clears
     * it, and it became necessary when the two-step sections above were
     * added. Every request in this file comes from 127.0.0.1, so they all
     * share one rate-limit key — and sections 4b and 7b deliberately spend
     * three failures probing the enumeration behaviour. Add the two this
     * section spends itself (the wrong email, and the unknown-serial probe
     * beside it) and the real sign-in below was the sixth: refused with 429
     * by a limiter doing its job, which made three assertions about SIGNING
     * IN fail for reasons that have nothing to do with signing in.
     *
     * Clearing it here keeps each section measuring the thing it is named
     * after. The limiter itself is tested in section 11, from zero.
     */
    attempts.clear();

    const homeBefore = await get('/club/home', deviceTwo);
    ok(homeBefore.status !== 200, 'the second device starts out locked out');

    const wrongEmail = await post(
      '/api/club/signin',
      { serial: 'IRZT6XA001D', email: 'wrong@example.test' },
      deviceTwo
    );
    ok(wrongEmail.status === 400, 'the wrong email does not sign in');
    ok(
      wrongEmail.data.error === (await post('/api/club/signin', { serial: 'IRZT6XA003A', email: 'wrong@example.test' }, jar())).data.error,
      'an unknown serial and a wrong email give the SAME message (no oracle)'
    );

    const signedIn = await post(
      '/api/club/signin',
      { serial: 'IRZT6XA001D', email: 'asha@EXAMPLE.test' }, // different case
      deviceTwo
    );
    ok(signedIn.status === 200 && signedIn.data.ok === true, 'serial + email signs in on a new device');
    ok(signedIn.data.memberNo === 1, 'and it is the same member');

    const home = await get('/club/home', deviceTwo);
    ok(home.status === 200, 'the second device now reaches the member area');
  }

  /* --- 9. Signing out. */
  console.log('\nSigning out:');
  {
    const out = await post('/api/club/signout', {}, deviceTwo);
    ok(out.status === 200, 'sign-out succeeds');
    ok(!deviceTwo.has('club_session'), 'the cookie is cleared');

    const home = await get('/club/home', deviceTwo);
    ok(home.status !== 200, 'the signed-out device is locked out again');

    const stillIn = await get('/club/home', deviceOne);
    ok(stillIn.status === 200, 'the OTHER device is still signed in');
  }

  /* --- 10. A forged cookie. */
  console.log('\nA forged cookie:');
  {
    const forged = jar();
    forged.absorb({
      headers: {
        getSetCookie: () => ['club_session=eyJtIjoxLCJlIjo5OTk5OTk5OTk5fQ.not-a-real-signature'],
      },
    });
    const home = await get('/club/home', forged);
    ok(home.status !== 200, 'a token with a bad signature does not open the member area');

    const me = await get('/api/club/me', forged);
    ok(me.text.trim() === '{}', 'and does not earn a masthead tab');
  }

  /* --- 11. The rate limit. */
  console.log('\nThe rate limit:');
  {
    /*
     * THE BUCKET IS CLEARED FIRST, and that is a statement about the test,
     * not a loosening of it. Earlier sections already spent failures from
     * this IP's allowance — the wrong-email sign-in and the unknown-serial
     * probe each recorded one, which is the limiter working. Counting from
     * zero here is what makes "the fifth is allowed, the sixth is not" an
     * assertion about the rule rather than about how many checks happen to
     * run above it.
     */
    attempts.clear();

    /*
     * EVERY ONE OF THESE HAS A CORRECT CHECK LETTER, and that is the point
     * of the list rather than an accident of it. A serial with a BAD check
     * letter is refused by the route handler before the RPC is reached, so
     * it never touches the limiter — which is correct (a typo is not an
     * attack) and which quietly made an earlier version of this test
     * meaningless: one of its five guesses was `IRZT6XA006N`, the real
     * letter is H, so only four attempts were ever recorded and the
     * "sixth" request sailed through.
     *
     * None of them is in the mock's serial list, so each reaches the RPC and
     * comes back NOT_FOUND — which is exactly what an enumeration attempt
     * looks like from the server's side.
     */
    const guesses = ['IRZT6XA004L', 'IRZT6XA005X', 'IRZT6XA501X', 'IRZT6XA502H', 'IRZT6XA006H'];
    const seen = [];
    for (const serial of guesses) {
      const r = await post(
        '/api/club/join',
        { serial, name: 'Guess', email: 'guess@example.test', phone: '9000000002', consent: true },
        jar()
      );
      seen.push(r.status);
    }
    ok(
      seen.every((s) => s === 400),
      'the first five unknown serials are each refused with the generic message',
      `statuses ${seen.join(', ')}`
    );

    const sixth = await post(
      '/api/club/join',
      { serial: 'IRZT6XA003A', name: 'Guess', email: 'guess@example.test', phone: '9000000002', consent: true },
      jar()
    );
    ok(sixth.status === 429, 'the sixth attempt is rate limited', `status ${sixth.status}`);
    ok(
      /wait an hour/i.test(sixth.data.error ?? ''),
      'and says how long to wait'
    );
    ok(
      !members.has('IRZT6XA003A'),
      'the rate-limited attempt did not claim the serial it named'
    );

    /*
     * ONE ALLOWANCE, SHARED BY BOTH STEPS.
     *
     * The failures below are spent entirely on /api/club/check-serial, and
     * the request that is then refused is a /api/club/join. If step one
     * ever grew a counter of its own, this is where it would show: the join
     * would sail through on a fresh budget, and an enumerator would simply
     * use check-serial, which is cheaper to call and answers faster.
     */
    attempts.clear();
    {
      const sharedGuesses = [
        'IRZT6XA004L', 'IRZT6XA005X', 'IRZT6XA501X', 'IRZT6XA502H', 'IRZT6XA006H',
      ];
      for (const serial of sharedGuesses) {
        await post('/api/club/check-serial', { serial }, jar());
      }

      const joinAfterChecks = await post(
        '/api/club/join',
        {
          serial: 'IRZT6XA003A',
          name: 'Shared',
          email: 'shared@example.test',
          phone: '9000000005',
          consent: true,
        },
        jar()
      );
      ok(
        joinAfterChecks.status === 429,
        'five failed check-serials rate-limit the JOIN - one shared counter',
        'status ' + joinAfterChecks.status
      );
      ok(!members.has('IRZT6XA003A'), 'and the serial it named was not claimed');

      const checkAfterChecks = await post(
        '/api/club/check-serial',
        { serial: 'IRZT6XA002P' },
        jar()
      );
      ok(
        checkAfterChecks.status === 429,
        'and check-serial is itself refused once the allowance is gone',
        'status ' + checkAfterChecks.status
      );
    }

    /*
     * A TYPO IS NOT AN ATTACK. A serial with a bad check letter is rejected
     * by the route handler before the RPC, so it costs the caller nothing
     * from their hourly allowance. Someone fat-fingering their own serial
     * five times must not lock themselves out of their own membership.
     */
    attempts.clear();
    for (let i = 0; i < 8; i += 1) {
      await post(
        '/api/club/join',
        { serial: 'IRZT6XA001Y', name: 'Typo', email: 'typo@example.test', phone: '9000000003', consent: true },
        jar()
      );
    }
    const afterTypos = await post(
      '/api/club/join',
      { serial: 'IRZT6XA003A', name: 'Real', email: 'real@example.test', phone: '9000000004', consent: true },
      jar()
    );
    ok(
      afterTypos.status === 200,
      'eight mistyped serials do NOT use up the allowance — a typo is not an attack',
      `status ${afterTypos.status}`
    );

    // The same on step one. Someone squinting at a sticker will mistype it
    // more than five times, and must not be locked out of the first screen
    // before ever reaching the second.
    attempts.clear();
    for (let i = 0; i < 8; i += 1) {
      await post('/api/club/check-serial', { serial: 'IRZT6XA001Y' }, jar());
    }
    const checkAfterTypos = await post(
      '/api/club/check-serial',
      { serial: 'IRZT6XA002P' },
      jar()
    );
    ok(
      checkAfterTypos.status === 200 && checkAfterTypos.data.status === 'OK',
      'eight typos on step one do not use up the allowance either',
      'status ' + checkAfterTypos.status
    );
  }

  /* --- 12. The club is not in the sitemap. */
  console.log('\nDiscoverability:');
  {
    const sitemap = await get('/sitemap.xml');
    ok(!sitemap.text.includes('/club'), 'the sitemap does not list any club URL');

    const robots = await get('/robots.txt');
    ok(
      !robots.text.includes('/club'),
      'robots.txt does not mention /club — a Disallow would publish the path'
    );
  }
} finally {
  mock.close();
}

if (failures > 0) {
  console.log(`\n${failures} of ${checks} checks FAILED.\n`);
  process.exit(1);
}
console.log(`\nAll ${checks} checks passed.\n`);

/**
 * THE CLUB'S SERVER SIDE: the guards every club route shares, and the one
 * way it talks to the database.
 *
 * ===========================================================================
 * SERVER ONLY. Never import this from a client component.
 * ===========================================================================
 * It reads CLUB_SERVER_KEY. Both secrets this area uses are Worker secrets
 * set with `wrangler secret put`, never `NEXT_PUBLIC_`, never committed, and
 * never in a `.env` file git can see — see docs/club-setup.md.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS A SERVER KEY AT ALL, when the database already has RLS
 * ---------------------------------------------------------------------------
 * The Supabase anon key is PUBLIC by design: it is inlined into the browser
 * bundle of every page on this site. The club's four functions are
 * SECURITY DEFINER, so they run with the owner's rights and can read
 * `club_serials`, which anon cannot touch directly. Granting EXECUTE to anon
 * is therefore granting it to the whole internet — anyone with the page
 * source could sit and call `club_claim` with guessed serials.
 *
 * So each function also demands `p_server_key` and compares it against a
 * value held in a private table that anon cannot read. The key lives only in
 * the Worker. The practical effect: the claim path is reachable only through
 * our own route handlers, where the rate limit, the body cap, the same-origin
 * check and the check-letter validation all apply first.
 *
 * It is not a substitute for RLS. RLS is still on and still denies anon every
 * table. This is the bolt on the one door RLS has to leave ajar.
 */

import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase/config';

/** Body cap. A join is six short fields; 4 KB is already generous. */
export const MAX_CLUB_REQUEST_BYTES = 4 * 1024;

/**
 * Field length caps, applied BEFORE anything reaches the database.
 *
 * Not for storage — Postgres `text` has no length problem — but because an
 * unbounded field is an unbounded thing to log, render and email. The caps
 * are what a real value needs and no more.
 */
export const CLUB_LIMITS = {
  name: 60,
  email: 160,
  phone: 20,
  city: 60,
};

/**
 * Is the Club wired up on this deployment?
 *
 * Four things have to be present: the Supabase URL and anon key (build-time,
 * committed in .env.production) and the two Worker secrets (runtime). A
 * preview built before the secrets are set answers 503 and the page says the
 * Club is not open yet, which is the truth and is better than a 500.
 */
export function clubConfigured() {
  return Boolean(
    SUPABASE_URL
    && SUPABASE_ANON_KEY
    && process.env.CLUB_SERVER_KEY
    && process.env.CLUB_COOKIE_SECRET
  );
}

/**
 * SAME-ORIGIN CHECK, on every club POST.
 *
 * The second half of the CSRF defence; SameSite=Lax on the cookie is the
 * first. Lax already blocks a cross-site POST from carrying the cookie, so
 * this is belt and braces — but it is cheap, and it also rejects the scripted
 * cross-origin calls that are not CSRF at all, just somebody hammering the
 * join endpoint from a console on another page.
 *
 * `Origin` is compared against the request's OWN host rather than against
 * SITE_URL, because one build serves www.bluneuron.com, every
 * *.workers.dev preview version, and localhost — and pinning the production
 * origin would make every preview impossible to test.
 *
 * ===========================================================================
 * THE HOST COMES FROM THE `Host` HEADER, NOT FROM `request.url`.
 * ===========================================================================
 * This is not a stylistic preference, it is a bug that was caught by
 * scripts/test-club-flow.mjs and would not have been caught by hand.
 *
 * On `next start`, Next NORMALISES `request.url` in a route handler: a
 * request to http://127.0.0.1:3300/api/club/join arrives with
 * `request.url === 'http://localhost:3300/api/club/join'` while the `Host`
 * header still says `127.0.0.1:3300`. Comparing Origin to the parsed
 * `request.url` therefore rejected every single POST — join, sign-in and
 * sign-out alike — on any host reached by an address other than the literal
 * word "localhost". On Cloudflare Workers `request.url` does carry the real
 * host, so this would have passed in production and failed on the Node
 * hosts, which is the worst shape a bug can have.
 *
 * `Host` is the right header anyway: it is what the browser connected to,
 * and `Origin` is what the page was served from. Both are set by the browser
 * and neither can be forged by a cross-site page, which is the only threat
 * this check exists for. A non-browser caller can set both headers to
 * whatever it likes — and could equally set them to match a `request.url`
 * comparison, so nothing is lost.
 *
 * A request with NO Origin is refused. Every browser sends one on a POST, so
 * its absence means the caller is not a browser.
 */
export function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  const host = request.headers.get('host') || safeHost(request.url);
  if (!host) return false;

  return safeHost(origin) === host;
}

/** The host of a URL string, or null if it will not parse. */
function safeHost(value) {
  try {
    return new URL(value).host || null;
  } catch {
    return null;
  }
}

/**
 * A stable, non-reversible key for rate limiting — NOT an IP address.
 *
 * ===========================================================================
 * THE RAW IP IS NEVER STORED, NEVER LOGGED, AND NEVER LEAVES THIS FUNCTION.
 * ===========================================================================
 * `club_attempts` holds only this hash. An IP address is personal data under
 * the DPDP Act and under GDPR, and the only thing the rate limiter actually
 * needs is "is this the same caller as a moment ago" — which a hash answers
 * exactly as well.
 *
 * SALTED WITH CLUB_SERVER_KEY, which matters: an unsalted SHA-256 of an IPv4
 * address is reversible by brute force in seconds, because there are only
 * four billion of them. Salted with a secret the attacker does not have, the
 * hash is useless to anyone who obtains the table.
 *
 * `CF-Connecting-IP` is set by Cloudflare and cannot be spoofed by the
 * client at the edge. `x-forwarded-for` is the fallback for the other two
 * hosts and its FIRST entry is taken — the rest are proxies. When there is
 * no address at all, every caller shares one bucket: a stricter outcome than
 * no limit, and the correct failure direction.
 */
export async function rateLimitKey(request) {
  const cf = request.headers.get('cf-connecting-ip');
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = (cf || forwarded?.split(',')[0] || 'unknown').trim();

  const salted = `${process.env.CLUB_SERVER_KEY ?? ''}:${ip}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salted));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Call one of the club's SECURITY DEFINER functions.
 *
 * PLAIN `fetch` AGAINST PostgREST, not @supabase/supabase-js. The client
 * library exists for session-aware, RLS-scoped queries from a browser; these
 * are four unauthenticated RPCs from a Worker, and pulling the whole client
 * in would add weight to the Worker bundle to save four lines.
 *
 * The server key is injected HERE, in one place, so no route handler can
 * forget it and no route handler has to know the environment variable's name.
 *
 * A 10-SECOND TIMEOUT, because a Worker request that hangs on a database
 * holds an invocation open and a customer watches a spinner. A timeout
 * surfaces as `UNAVAILABLE`, which the routes turn into "try again shortly".
 */
async function callRpc(fn, args) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_server_key: process.env.CLUB_SERVER_KEY, ...args }),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      // The body may name a column or a constraint. It is logged WITHOUT the
      // arguments, so nothing a caller typed — a serial, an email — is
      // written to a log line.
      const detail = await response.text().catch(() => '');
      console.error(`[BluNeuron] club RPC ${fn} failed with ${response.status}: ${detail.slice(0, 300)}`);
      return { code: 'UNAVAILABLE' };
    }

    return (await response.json()) ?? { code: 'UNAVAILABLE' };
  } catch (error) {
    // Never log `error` wholesale: a fetch error can carry the request URL,
    // and the URL of an RPC call is harmless but the habit is not.
    console.error(`[BluNeuron] club RPC ${fn} could not be reached:`, error?.name ?? 'error');
    return { code: 'UNAVAILABLE' };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Step one of joining: is this serial real, and is it free?
 *
 * Answers only OK / CLAIMED / INVALID / RATE_LIMITED. INVALID covers both
 * "that is not a serial" and "we have never heard of it", conflated in SQL
 * rather than here - see club_check_serial in
 * supabase/migrations/20261027_club_two_step.sql, and the note on
 * clubErrorMessage below.
 *
 * It shares `club_attempts` with the two below, so a failure here spends
 * from the same five-an-hour allowance a join or a sign-in would.
 */
export function rpcCheckSerial(args) {
  return callRpc('club_check_serial', args);
}

/** Claim a serial and become a member. */
export function rpcClaim(args) {
  return callRpc('club_claim', args);
}

/** Sign in on another device with serial + the email used to join. */
export function rpcSignin(args) {
  return callRpc('club_signin', args);
}

/** The minimal profile for a member number: first name, number, joined date. */
export function rpcMember(args) {
  return callRpc('club_member', args);
}

/**
 * THE ONE MESSAGE A FAILED ATTEMPT GETS, whatever actually went wrong.
 *
 * ===========================================================================
 * NOT_FOUND AND INVALID MUST READ IDENTICALLY. This is the whole point.
 * ===========================================================================
 * A different message for "that serial is not one of ours" would turn the
 * join form into an oracle: feed it generated serials, and the ones that come
 * back with a different error are real units sitting in a warehouse. The
 * check letter is public arithmetic, so generating well-formed candidates is
 * trivial — the only thing standing between that and a list of valid serials
 * is this function refusing to distinguish them.
 *
 * `club_check_serial` goes one step further and conflates the two IN SQL,
 * returning INVALID for a serial it has never heard of. It is a one-field
 * endpoint whose entire job is to answer questions about serials, so the
 * distinction must not exist anywhere in its code path rather than merely
 * being rendered away at the end of one. See
 * supabase/migrations/20261027_club_two_step.sql.
 *
 * ALREADY_CLAIMED is deliberately DIFFERENT, and that is a considered trade.
 * It tells a caller that a serial exists, which is information — but the
 * person hitting it is overwhelmingly someone who already joined and has
 * forgotten, and sending them round the "check your serial" loop forever is a
 * real cost to a real owner. The rate limit is what makes it safe to say:
 * five failures an hour is not an enumeration tool.
 */
export function clubErrorMessage(code) {
  switch (code) {
    case 'ALREADY_CLAIMED':
      return 'That serial number has already been used to join. If it was you, sign in with your serial number and the email address you joined with.';
    case 'RATE_LIMITED':
      return 'Too many attempts. Please wait an hour and try again.';
    case 'UNAVAILABLE':
      return 'The Club is not available right now. Please try again shortly.';
    case 'INVALID':
    case 'NOT_FOUND':
    default:
      return 'We could not match that serial number. Check it against the sticker on your box and try again.';
  }
}

/** The HTTP status for an error code. */
export function clubErrorStatus(code) {
  if (code === 'RATE_LIMITED') return 429;
  if (code === 'UNAVAILABLE') return 503;
  return 400;
}

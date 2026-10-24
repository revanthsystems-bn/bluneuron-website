/**
 * THE MEMBER COOKIE: minting it, and proving one was minted by us.
 *
 * ===========================================================================
 * SERVER ONLY. Nothing here may be imported by a client component.
 * ===========================================================================
 * It reads CLUB_COOKIE_SECRET. A `process.env` lookup without the
 * `NEXT_PUBLIC_` prefix is replaced with `undefined` in the browser bundle
 * rather than with the value, so an accidental client import fails loudly at
 * runtime instead of leaking — but do not rely on that. Import it from route
 * handlers and server components, and nowhere else.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS IN THE TOKEN, AND WHAT IS DELIBERATELY NOT
 * ---------------------------------------------------------------------------
 *
 *     <base64url payload>.<base64url hmac-sha256>
 *     payload = {"m": 1, "e": 1799999999}
 *
 * `m` is the member number. `e` is the expiry as a Unix second. THAT IS ALL.
 *
 * No name, no email, no serial, no phone. A cookie travels with every request
 * to /club, sits in the browser for ninety days, and lands in any proxy or
 * log that records headers — so it carries an opaque integer and a date and
 * forces anything that wants a name to ask the database for it. The member
 * number is not secret (it is printed on the member's own card) and it is not
 * a capability on its own: the token is only accepted because the signature
 * verifies.
 *
 * ---------------------------------------------------------------------------
 * WHY HMAC AND NOT A SESSION TABLE
 * ---------------------------------------------------------------------------
 * A session row per device would mean a database round trip on every page
 * view of the member area, on a Worker, for a membership that grants nothing
 * but a page. The signature is checked locally in under a millisecond and
 * needs no storage. The cost is that a token cannot be revoked individually —
 * rotating CLUB_COOKIE_SECRET signs everybody out at once, which is the right
 * emergency lever and a poor routine one.
 *
 * ---------------------------------------------------------------------------
 * WHY WEB CRYPTO AND NOT node:crypto
 * ---------------------------------------------------------------------------
 * `crypto.subtle` is a global on Cloudflare Workers, on Node 18+ and in every
 * browser. `node:crypto` would pin these routes to the Node runtime, which is
 * exactly the mistake the warranty routes were corrected for — see the
 * runtime note at the top of app/api/warranty-registration/route.js. The same
 * code has to run on all three of this site's hosts.
 */

import { CLUB_COOKIE, CLUB_COOKIE_PATHS, CLUB_SESSION_SECONDS } from './club';

/** base64url, because a cookie value may not contain '+', '/' or '='. */
function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const encoder = new TextEncoder();

/**
 * The signing key, or null when the secret is not configured.
 *
 * NOT MEMOISED. A `CryptoKey` cached at module scope would be shared across
 * requests in the same isolate, which is fine, but the secret is read from
 * the environment and importing it costs microseconds — not enough to justify
 * holding key material in a module-level variable for the life of an isolate.
 *
 * Returns null rather than throwing so a route can answer 503 ("the Club is
 * not available") instead of 500 ("something exploded"). A missing secret is
 * a deployment that is not finished, not a bug in a request.
 */
async function signingKey() {
  const secret = process.env.CLUB_COOKIE_SECRET;
  if (!secret || secret.length < 32) return null;

  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/** Is the club configured enough to issue or read a session at all? */
export function clubSessionConfigured() {
  const secret = process.env.CLUB_COOKIE_SECRET;
  return Boolean(secret && secret.length >= 32);
}

/**
 * Mint a token for a member number. Returns null if the secret is missing.
 *
 * The expiry is baked into the signed payload, so an attacker who keeps a
 * cookie past its Max-Age gains nothing: `readSession` checks the date inside
 * the signature, not the browser's willingness to forget.
 */
export async function createSessionToken(memberNo) {
  const key = await signingKey();
  if (!key) return null;

  const n = Number(memberNo);
  if (!Number.isFinite(n) || n <= 0) return null;

  const payload = JSON.stringify({
    m: Math.floor(n),
    e: Math.floor(Date.now() / 1000) + CLUB_SESSION_SECONDS,
  });

  const payloadPart = toBase64Url(encoder.encode(payload));
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadPart));
  return `${payloadPart}.${toBase64Url(new Uint8Array(signature))}`;
}

/**
 * The member number inside a token, or null.
 *
 * Null for every failure, and they are deliberately indistinguishable to the
 * caller: no signature, bad signature, malformed payload, expired. A route
 * that could tell "expired" from "forged" would be a route that tells an
 * attacker which half of the token to keep working on.
 *
 * `crypto.subtle.verify` is used rather than re-signing and comparing
 * strings, because it compares in constant time. A `===` on two hex digests
 * leaks, through timing, how many leading bytes a guess got right.
 */
export async function readSessionToken(token) {
  if (typeof token !== 'string' || token.length === 0 || token.length > 512) return null;

  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return null;

  const payloadPart = token.slice(0, dot);
  const signaturePart = token.slice(dot + 1);
  if (!/^[A-Za-z0-9_-]+$/.test(payloadPart) || !/^[A-Za-z0-9_-]+$/.test(signaturePart)) {
    return null;
  }

  const key = await signingKey();
  if (!key) return null;

  let valid;
  try {
    valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(signaturePart),
      encoder.encode(payloadPart)
    );
  } catch {
    // Malformed base64url in the signature half.
    return null;
  }
  if (!valid) return null;

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadPart)));
  } catch {
    return null;
  }

  // The payload is signed, so these checks are about a token we minted
  // ourselves in an older format — not about an attacker. Belt and braces.
  if (!payload || typeof payload !== 'object') return null;
  const memberNo = Number(payload.m);
  const expiry = Number(payload.e);
  if (!Number.isFinite(memberNo) || memberNo <= 0) return null;
  if (!Number.isFinite(expiry) || expiry <= Math.floor(Date.now() / 1000)) return null;

  return { memberNo: Math.floor(memberNo), expiresAt: expiry };
}

/**
 * The `Set-Cookie` lines for a session — one per path in CLUB_COOKIE_PATHS.
 *
 * Every flag here is load-bearing:
 *   HttpOnly   script cannot read it, so an injected script cannot steal a
 *              membership
 *   Secure     never sent over http. The site is https-only (HSTS), so this
 *              costs nothing and closes the downgrade case
 *   SameSite=Lax  not sent on a cross-site POST, which is the CSRF defence
 *              the same-origin check in the routes is the second half of.
 *              Lax rather than Strict so that FOLLOWING THE PRINTED QR CODE
 *              from a camera app or a messaging app still arrives signed in —
 *              Strict would log a member out every time they came in from
 *              outside the site, which is the normal way into /club
 *   Max-Age    ninety days, matched by the signed expiry inside the token
 */
export function sessionCookieHeaders(token) {
  return CLUB_COOKIE_PATHS.map(
    (path) =>
      `${CLUB_COOKIE}=${token}; Path=${path}; Max-Age=${CLUB_SESSION_SECONDS}; HttpOnly; Secure; SameSite=Lax`
  );
}

/**
 * The `Set-Cookie` lines that clear a session.
 *
 * Max-Age=0 AND an empty value, on every path the cookie was set on. Missing
 * one path leaves a cookie that still authenticates the API after the page
 * believes the member signed out — which is the classic half-signed-out bug.
 */
export function clearSessionCookieHeaders() {
  return CLUB_COOKIE_PATHS.map(
    (path) => `${CLUB_COOKIE}=; Path=${path}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
  );
}

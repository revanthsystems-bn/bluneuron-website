import { NextResponse } from 'next/server';
import { readJsonBody } from '@/lib/request-body';
import { isValidEmail, normalizePhone } from '@/lib/web3forms';
import { parseSerial } from '@/lib/club-serial';
import {
  CLUB_LIMITS,
  MAX_CLUB_REQUEST_BYTES,
  clubConfigured,
  clubErrorMessage,
  clubErrorStatus,
  isSameOrigin,
  rateLimitKey,
  rpcClaim,
} from '@/lib/club-server';
import { createSessionToken, sessionCookieHeaders } from '@/lib/club-session';

/**
 * POST /api/club/join — claim a serial and become a member.
 *
 * RUNTIME: the default, edge-compatible one. No `export const runtime`, no
 * `node:crypto` — the signing and hashing both use `crypto.subtle`, which is
 * a global on Workers, on Node 18+ and in browsers. Same reasoning as the
 * warranty routes; read the runtime note at the top of
 * app/api/warranty-registration/route.js before adding either.
 *
 * THE ORDER OF THE GUARDS IS THE DESIGN. Each one is cheaper than the next,
 * and each refuses a class of request the following one would otherwise have
 * to handle:
 *
 *   1. configured?      no secrets -> 503, before anything is read
 *   2. same origin?     a cross-site POST never reaches the body reader
 *   3. body cap         counted off the stream, not from content-length
 *   4. shape + lengths  caps applied before a value is passed anywhere
 *   5. check letter     arithmetic, local, no network — catches the typos
 *   6. rate-limit key   one hash, no network
 *   7. the RPC          the only step that touches the database
 *
 * A well-formed-but-unknown serial reaches step 7 and comes back NOT_FOUND.
 * A mistyped one dies at step 5 and costs the database nothing, which is the
 * entire reason the check letter exists.
 *
 * STEP ONE IS NOT TRUSTED. /api/club/check-serial has usually already told
 * the browser this serial is free, and this route behaves exactly as if it
 * had not: the check letter, the existence of the serial and whether it is
 * already claimed are all established again here and again in SQL. A
 * "status" a browser is holding is not a fact.
 *
 * WHAT IS NEVER LOGGED: the serial, the name, the email, the phone, the city,
 * the IP. There is no `console.log` of a request body anywhere in this file,
 * and the one error path in lib/club-server logs a status code and a function
 * name. A support request that needs a serial gets it from the member, not
 * from a log.
 */

function fail(code) {
  return NextResponse.json(
    { ok: false, error: clubErrorMessage(code) },
    { status: clubErrorStatus(code) }
  );
}

/** A trimmed string within its cap, or null. */
function text(value, max) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

/** An optional trimmed string: empty is fine, too long is not. */
function optionalText(value, max) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return undefined; // undefined = reject
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? undefined : trimmed;
}

export async function POST(request) {
  if (!clubConfigured()) return fail('UNAVAILABLE');
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'Request blocked.' }, { status: 403 });
  }

  const read = await readJsonBody(request, MAX_CLUB_REQUEST_BYTES);
  if (!read.ok) return fail('INVALID');

  const body = read.value;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('INVALID');

  // The honeypot, same as the warranty forms: a field no human fills in.
  if (body.botcheck) return fail('INVALID');

  // CONSENT IS REQUIRED, and it is checked here as well as in SQL. The box is
  // the lawful basis for keeping the row at all, so it is not something the
  // form may be submitted without and not something a direct POST may omit.
  if (body.consent !== true) return fail('INVALID');

  const name = text(body.name, CLUB_LIMITS.name);
  const email = text(body.email, CLUB_LIMITS.email);
  if (!name || !email || !isValidEmail(email)) return fail('INVALID');

  const city = optionalText(body.city, CLUB_LIMITS.city);
  if (city === undefined) return fail('INVALID');

  /*
   * THE MOBILE NUMBER IS REQUIRED, as of the two-step join.
   *
   * It used to be optional. A member we cannot reach when their email
   * bounces is a row that does nothing for them or for us, and the Club's
   * one promise - that we will tell members things first - needs a channel
   * that works. The form asks for it, this refuses without it, and
   * `club_claim` refuses again in SQL (see
   * supabase/migrations/20261027_club_two_step.sql). Members who joined
   * before the change keep their rows: the SQL constraint is `not valid`,
   * so it binds new rows only.
   *
   * It must be a real Indian mobile, normalised to +91XXXXXXXXXX so support
   * is not left with four spellings of one number. A malformed one is
   * refused rather than stored as typed: an uncallable number in a members
   * table is worse than no number.
   */
  const rawPhone = text(body.phone, CLUB_LIMITS.phone);
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (!phone) return fail('INVALID');

  // THE CHECK LETTER, server side. The browser checks it too, which is a
  // courtesy to the person typing; this is the one that counts, because the
  // browser's copy can be skipped by anyone posting directly.
  const serial = parseSerial(body.serial);
  if (!serial) return fail('INVALID');

  const result = await rpcClaim({
    p_serial: serial,
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_city: city,
    p_consent: true,
    p_key_hash: await rateLimitKey(request),
  });

  if (!result || result.code) return fail(result?.code ?? 'UNAVAILABLE');

  const memberNo = Number(result.member_no);
  if (!Number.isFinite(memberNo) || memberNo <= 0) return fail('UNAVAILABLE');

  const token = await createSessionToken(memberNo);
  if (!token) return fail('UNAVAILABLE');

  // The member number goes back so the page can show it immediately without a
  // second round trip. It is already in the cookie and already on the card.
  const response = NextResponse.json({ ok: true, memberNo });
  for (const cookie of sessionCookieHeaders(token)) {
    response.headers.append('Set-Cookie', cookie);
  }
  return response;
}

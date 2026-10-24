import { NextResponse } from 'next/server';
import { readJsonBody } from '@/lib/request-body';
import { isValidEmail } from '@/lib/web3forms';
import { parseSerial } from '@/lib/club-serial';
import {
  CLUB_LIMITS,
  MAX_CLUB_REQUEST_BYTES,
  clubConfigured,
  clubErrorMessage,
  clubErrorStatus,
  isSameOrigin,
  rateLimitKey,
  rpcSignin,
} from '@/lib/club-server';
import { createSessionToken, sessionCookieHeaders } from '@/lib/club-session';

/**
 * POST /api/club/signin — the same member, a second device.
 *
 * Serial plus the email they joined with. There is no password and no
 * emailed code, because this project has no transactional email set up and
 * inventing a password for a page that shows a member number and some links
 * would be security theatre with a support cost attached.
 *
 * WHAT THAT IS WORTH, stated plainly rather than implied: someone holding the
 * box AND knowing the owner's email can sign in as them. What they get is a
 * first name, a member number and a join date — no address, no order, no
 * payment method, and nothing they can change. The protection is proportionate
 * to the asset, and the rate limit is what stops it being guessable at scale.
 *
 * The error message is the SAME one the join form gives, deliberately. A
 * distinct "that serial exists but the email is wrong" would confirm a serial
 * to someone who has only guessed it. See clubErrorMessage.
 */

function fail(code) {
  return NextResponse.json(
    { ok: false, error: clubErrorMessage(code) },
    { status: clubErrorStatus(code) }
  );
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
  if (body.botcheck) return fail('INVALID');

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email || email.length > CLUB_LIMITS.email || !isValidEmail(email)) return fail('INVALID');

  // Server-side check letter, for the same reason as the join route: the
  // browser's copy is a courtesy, this one is the control.
  const serial = parseSerial(body.serial);
  if (!serial) return fail('INVALID');

  const result = await rpcSignin({
    p_serial: serial,
    p_email: email,
    p_key_hash: await rateLimitKey(request),
  });

  if (!result || result.code) return fail(result?.code ?? 'UNAVAILABLE');

  const memberNo = Number(result.member_no);
  if (!Number.isFinite(memberNo) || memberNo <= 0) return fail('UNAVAILABLE');

  const token = await createSessionToken(memberNo);
  if (!token) return fail('UNAVAILABLE');

  const response = NextResponse.json({ ok: true, memberNo });
  for (const cookie of sessionCookieHeaders(token)) {
    response.headers.append('Set-Cookie', cookie);
  }
  return response;
}

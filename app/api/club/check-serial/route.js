import { NextResponse } from 'next/server';
import { readJsonBody } from '@/lib/request-body';
import { parseSerial } from '@/lib/club-serial';
import {
  MAX_CLUB_REQUEST_BYTES,
  clubConfigured,
  clubErrorMessage,
  clubErrorStatus,
  isSameOrigin,
  rateLimitKey,
  rpcCheckSerial,
} from '@/lib/club-server';

/**
 * POST /api/club/check-serial — step one of joining, and nothing more.
 *
 * ===========================================================================
 * THIS IS NOT A GATE. /api/club/join RE-CHECKS EVERYTHING.
 * ===========================================================================
 * The answer this returns travels to a browser and comes back as "the user
 * pressed Continue". Anything a browser holds can be skipped, so the join
 * route validates the serial from scratch and `club_claim` validates it a
 * third time in SQL. This endpoint exists to tell a customer their serial is
 * wrong before they type six more fields — a courtesy, measured in seconds
 * saved, not a security boundary. See the guard order at the top of
 * app/api/club/join/route.js, which is reproduced here for the same reasons.
 *
 * ---------------------------------------------------------------------------
 * THE ANSWER IS ONE OF THREE WORDS, AND TWO OF THEM MEAN THE SAME THING
 * ---------------------------------------------------------------------------
 *
 *   { status: 'OK' }        the serial exists and nobody has claimed it
 *   { status: 'CLAIMED' }   the serial exists and someone already has it
 *   { ok: false, ... }      everything else, with ONE message
 *
 * A malformed serial and a perfectly well-formed serial that is not in
 * `club_serials` produce a byte-identical response: same status code, same
 * body, same message. That is the entire point of the endpoint's design. The
 * check letter is public arithmetic, so anyone can generate candidates that
 * look real; the only thing standing between that and a list of units
 * sitting in a warehouse is this refusing to tell them apart. The conflation
 * is done in SQL as well (club_check_serial returns INVALID for both), so
 * there is no code path here that could leak the distinction by accident.
 *
 * CLAIMED is deliberately distinguishable, and it is the same trade
 * `clubErrorMessage` already makes for ALREADY_CLAIMED on the join: the
 * person who hits it is overwhelmingly the owner, who has forgotten they
 * joined, and the useful thing to do is offer them the sign-in form.
 *
 * ---------------------------------------------------------------------------
 * THE RATE LIMIT IS THE JOIN'S, not a second one
 * ---------------------------------------------------------------------------
 * `rateLimitKey` produces the same salted hash the join and sign-in routes
 * compute, and `club_attempts` is one table, so the five-failures-an-hour
 * allowance is spent across all three endpoints together. A separate
 * allowance here would simply be a fresh budget for an enumerator to spend
 * before touching the join at all.
 *
 * WHAT IS NEVER LOGGED: the serial, and the IP. There is no `console.log` of
 * a request body in this file.
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

  /*
   * THE CHECK LETTER, LOCALLY FIRST — and then the RPC anyway.
   *
   * A mistyped serial is refused here without a database round trip, which
   * is what the check letter is for. But it is refused with the SAME
   * response the RPC's INVALID produces, so the short-circuit is invisible
   * from outside: a caller cannot tell a locally-rejected serial from one
   * the database had never heard of, including by timing it, because the
   * message and the status are identical and the difference is a few
   * milliseconds against network jitter measured in hundreds.
   *
   * It also means a typo costs the caller nothing from their hourly
   * allowance, exactly as on the join route: a typo is not an attack.
   */
  const serial = parseSerial(body.serial);
  if (!serial) return fail('INVALID');

  const result = await rpcCheckSerial({
    p_serial: serial,
    p_key_hash: await rateLimitKey(request),
  });

  const code = result?.code;

  if (code === 'OK') return NextResponse.json({ ok: true, status: 'OK' });
  if (code === 'CLAIMED') return NextResponse.json({ ok: true, status: 'CLAIMED' });

  // INVALID, RATE_LIMITED, UNAVAILABLE, and anything unrecognised — which is
  // treated as UNAVAILABLE rather than as INVALID, because an unexpected
  // code means the database said something this build does not understand,
  // and telling a customer their serial is wrong on that basis would be a
  // lie. `clubErrorMessage` renders INVALID with the same sentence the join
  // form uses.
  return fail(code === 'INVALID' || code === 'RATE_LIMITED' ? code : 'UNAVAILABLE');
}

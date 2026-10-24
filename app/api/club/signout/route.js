import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/club-server';
import { clearSessionCookieHeaders } from '@/lib/club-session';

/**
 * POST /api/club/signout — forget this device.
 *
 * A POST, not a GET, and that is not pedantry: a GET sign-out is a URL that
 * anyone can put in an <img> on another site to log a member out, and it is
 * the one that link-prefetchers and antivirus scanners hit by accident.
 *
 * IT ALWAYS SUCCEEDS, including when there is no session, when the secret is
 * missing and when the cookie is already expired. There is nothing to
 * authenticate: the request is "stop sending me this cookie", and the correct
 * answer is always yes. Returning an error on a missing session would leave a
 * member stuck on a page with a sign-out button that refuses to work.
 *
 * The same-origin check stays, so a cross-site page cannot sign somebody out
 * as a nuisance.
 */
export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'Request blocked.' }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  // Cleared on EVERY path the cookie was set on. Missing one leaves a cookie
  // that still authenticates the API after the page thinks you signed out.
  for (const cookie of clearSessionCookieHeaders()) {
    response.headers.append('Set-Cookie', cookie);
  }
  return response;
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CLUB, CLUB_COOKIE, CLUB_PATH } from '@/lib/club';
import { readSessionToken } from '@/lib/club-session';

/**
 * GET /api/club/me — "is whoever is asking a member, and if so what should
 * the masthead show them?"
 *
 * ===========================================================================
 * THIS ENDPOINT EXISTS SO THAT /club IS NOT IN ANY NON-MEMBER'S BROWSER.
 * ===========================================================================
 * The Club tab has to appear in the masthead for members and be invisible —
 * genuinely invisible — to everyone else. The masthead (components/Header) is
 * a client component rendered by PageShell with no props, so the obvious
 * route is to read the cookie in app/layout.jsx and pass a flag down. That
 * works, and it turns all twenty-five prerendered pages into a Worker render
 * per request, because `cookies()` in a layout makes the whole tree dynamic.
 * That is a sitewide performance change to show one nav item.
 *
 * So the Header asks this instead, once, after it mounts.
 *
 * THE RESPONSE CARRIES THE LABEL AND THE HREF, which is the part that makes
 * this better than a boolean. If the client had `{ member: true }` and
 * rendered `<a href="/club">Club</a>` itself, the string "/club" would sit in
 * the JavaScript bundle that every visitor downloads — and the bundle is as
 * readable as the HTML. Sending the strings from the server means a
 * non-member's browser never receives the word "Club" or the path at all,
 * from any file.
 *
 * `{}` for a non-member. Not `{ member: false }`, not a 401: an empty object
 * is the smallest honest answer and it makes the endpoint useless for
 * probing — it says nothing a caller did not already know.
 *
 * NO PERSONAL DATA. Not the name, not the member number, not the join date.
 * This answers a question about navigation. /club/home reads the profile, on
 * the server, behind the same cookie.
 *
 * CACHING: `no-store`, and `private` for good measure. A shared cache that
 * kept one member's response would hand the Club tab to the next visitor
 * through that cache — which is the one way this design could leak.
 */

const NO_STORE = {
  'Cache-Control': 'private, no-store, max-age=0',
  // The response varies by cookie. Belt and braces beside no-store, for any
  // intermediary that honours one header and not the other.
  Vary: 'Cookie',
};

export async function GET() {
  const token = (await cookies()).get(CLUB_COOKIE)?.value;
  const session = token ? await readSessionToken(token) : null;

  if (!session) {
    return NextResponse.json({}, { headers: NO_STORE });
  }

  return NextResponse.json(
    { label: CLUB.navLabel, href: CLUB_PATH },
    { headers: NO_STORE }
  );
}

/**
 * THE IRIZ CLUB — configuration, and the one place its content is decided.
 *
 * A members-only area for people who own an IRIZ. The door is /club, the
 * key is the serial number printed on the carton sticker, and the only way
 * anyone finds it is the QR code on the card in the box.
 *
 * ===========================================================================
 * EVERY PERK BELOW IS EMPTY UNTIL IT IS REAL.
 * ===========================================================================
 * `communityUrl` and `offers` ship empty on purpose, and the member page
 * renders an honest "opening soon" line instead of each one. That is not a
 * placeholder waiting to be tidied: a members-only area whose selling point
 * is invented perks is worse than one that admits it is new. Fill either in
 * and the card changes on its own, with no edit to app/club/home.
 *
 * Nothing here may become a claim we cannot keep. No discount percentages, no
 * "exclusive early access to every launch", no member counts.
 */

import { ROUTES } from './routes';
import { SUPPORT } from './site-config';

/**
 * THE PRINTED URL. It is on a card inside every carton and it can never move.
 *
 * Same rule as the `/warranty` redirect in next.config.js, and for the same
 * reason: cards are already manufactured, the ones in a warehouse today will
 * be opened years from now, and a dead QR code on retail packaging cannot be
 * recalled or patched. If the club area is ever restructured, /club stays
 * where it is and redirects.
 */
export const CLUB_PATH = '/club';

/** The member area behind the door. Reached only with a valid cookie. */
export const CLUB_HOME_PATH = '/club/home';

/**
 * The cookie the browser gets after joining or signing in.
 *
 * `__Host-` is not used, tempting as it is. That prefix requires `Path=/`,
 * and this cookie is deliberately scoped to /club so it is not attached to
 * every request for every page and asset on the site. Scope beats prefix
 * here: the cookie is signed, httpOnly, Secure and SameSite=Lax regardless,
 * and the prefix would buy nothing those four do not already give.
 */
export const CLUB_COOKIE = 'club_session';

/**
 * 90 days, as a number of seconds, and it is both the cookie's Max-Age and
 * the expiry signed INSIDE the token.
 *
 * Both, because they protect against different things. Max-Age is a request
 * to the browser and a browser may ignore it; the signed expiry is checked by
 * the server on every read and cannot be edited without the secret. A cookie
 * that outlives its signature is simply rejected.
 */
export const CLUB_SESSION_SECONDS = 90 * 24 * 60 * 60;

/**
 * The paths the cookie is sent for. Narrow on purpose.
 *
 * `/club` covers /club and /club/home. `/api/club` covers the route handlers.
 * A cookie on `Path=/` would ride along on every image, stylesheet and page
 * request on the site, which is both wasteful and a wider surface than a
 * membership token needs.
 *
 * TWO cookies are therefore set, with the same value and the same signature —
 * see lib/club-session.js. That is not a duplicate session; it is one session
 * presented to the two paths that need it.
 */
export const CLUB_COOKIE_PATHS = ['/club', '/api/club'];

export const CLUB = {
  /** What the area is called, everywhere it is named. */
  name: 'IRIZ Club',

  /**
   * What the masthead tab says. "Club", not "IRIZ Club", because every other
   * item up there is one word and the masthead's budget is four items — see
   * NAV_ITEMS in lib/routes.js. The full name is on the page itself.
   */
  navLabel: 'Club',

  /**
   * The community link — a WhatsApp or Telegram invite.
   *
   * EMPTY UNTIL THE GROUP EXISTS. The card then reads "Community opens
   * soon", which is true, rather than linking to a group with nobody in it.
   * Paste the invite URL here and the button appears.
   */
  communityUrl: '',

  /**
   * Member offers. EMPTY, and it must stay empty until an offer is agreed.
   *
   * Shape, when there is one:
   *   { title: 'Spare remote', body: 'What it is.', href: '', cta: 'Claim' }
   *
   * `href` may be empty for an offer that is claimed by writing to support —
   * the card then shows the support address instead of a button. Do not add
   * an entry to "show what it will look like": the card already says that in
   * words, and a fictional offer on a members-only page is the one thing that
   * would make the Club worth leaving.
   */
  offers: [],

  /**
   * Where a member goes for the things the Club does not do itself. Read from
   * the registry and from SUPPORT so the Club cannot name a route that does
   * not exist or an inbox nobody reads.
   */
  links: {
    warrantyRegistration: ROUTES.warrantyRegistration,
    warrantyPolicy: ROUTES.warranty,
    faq: ROUTES.faq,
    support: ROUTES.contact,
    privacy: ROUTES.privacy,
    supportEmail: SUPPORT.email,
    supportHours: SUPPORT.hours,
  },
};

/** Is there a community to link to yet? */
export function hasCommunity() {
  return typeof CLUB.communityUrl === 'string' && CLUB.communityUrl.trim().length > 0;
}

/** Are there any member offers to show yet? */
export function hasOffers() {
  return Array.isArray(CLUB.offers) && CLUB.offers.length > 0;
}

/**
 * "Member #0001" — the member number as it is displayed, everywhere.
 *
 * Padded to four digits because a card reading "Member #7" looks like a bug
 * and "Member #0007" looks like a membership. Numbers past 9999 are printed
 * in full rather than truncated: the padding is a minimum width, not a cap.
 */
export function formatMemberNumber(memberNo) {
  const n = Number(memberNo);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `#${String(Math.floor(n)).padStart(4, '0')}`;
}

/**
 * "Member since October 2026" — month and year, never the day.
 *
 * The exact timestamp is in the database and nobody needs it on a card. The
 * month is friendly; the day is a fact about a person that the page has no
 * reason to display.
 *
 * `en-GB` with an explicit UTC timezone, so the month cannot shift by one for
 * a member who joined near midnight in a different offset from the renderer.
 */
export function formatJoinedAt(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

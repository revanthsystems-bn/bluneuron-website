import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import PageShell from '@/components/PageShell';
import ClubSignOut from '@/components/club/ClubSignOut';
import { SETUP_STEPS } from '@/lib/iriz';
import {
  CLUB,
  CLUB_COOKIE,
  CLUB_PATH,
  formatJoinedAt,
  formatMemberNumber,
  hasCommunity,
  hasOffers,
} from '@/lib/club';
import { readSessionToken } from '@/lib/club-session';
import { clubConfigured, rpcMember } from '@/lib/club-server';

/**
 * /club/home — THE MEMBER AREA.
 *
 * ===========================================================================
 * THE GUARD IS HERE, ON THE SERVER, AND IT IS THE ONLY ONE THAT COUNTS.
 * ===========================================================================
 * The cookie is read and its HMAC verified before a single byte of this page
 * is produced, so a visitor without a valid session is redirected to /club
 * having seen nothing — no flash of a member card, nothing to read in the
 * HTML, no client-side "checking…" state that a disabled script would skip.
 * There is no client-side guard for this page, deliberately: a second check
 * in the browser would be a convenience that someone later mistakes for the
 * boundary. Same reasoning as the server guard on the account area
 * (app/account/layout.jsx).
 *
 * Reading cookies makes this route dynamic, which is correct — a member page
 * is per-visitor by definition and must never be cached at the edge.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS PAGE MAY SAY
 * ---------------------------------------------------------------------------
 * Only what is true. Every perk comes from CLUB in lib/club.js, every one of
 * them ships EMPTY, and each card renders an honest "coming soon" line
 * instead of an invented benefit. A members-only area that oversells itself
 * is the one that gets left. Fill in `communityUrl` or push an entry into
 * `offers` and the card changes with no edit to this file.
 *
 * The profile is three fields — first name, member number, join date — because
 * club_member() in the migration returns three fields. The email, the phone,
 * the city and the serial stay in the database: this page has no use for them
 * and a page that fetches them is a page that can leak them.
 */

export const metadata = {
  title: 'IRIZ Club — BluNeuron',
  description: 'Your IRIZ Club membership.',
};

export default async function ClubHomePage() {
  const token = (await cookies()).get(CLUB_COOKIE)?.value;
  const session = token ? await readSessionToken(token) : null;
  if (!session) redirect(CLUB_PATH);

  /*
   * THE COOKIE SAYS WHO, THE DATABASE SAYS WHETHER THEY STILL EXIST.
   *
   * A signature only proves the token was minted here. A membership that has
   * since been deleted — a leave request honoured, a row removed — must stop
   * working, and the only thing that knows is club_members. So the profile is
   * fetched rather than read off the token, and a member who is gone is sent
   * back to the door like anyone else.
   */
  const profile = clubConfigured() ? await rpcMember({ p_member_no: session.memberNo }) : null;
  if (!profile || profile.code || !profile.member_no) redirect(CLUB_PATH);

  const memberNumber = formatMemberNumber(profile.member_no);
  const joined = formatJoinedAt(profile.joined_at);
  const firstName = typeof profile.first_name === 'string' ? profile.first_name : '';

  return (
    <PageShell>
      {/* No <Reveal> in the Club — see the note on app/club/page.jsx. */}

      {/* ----------------------------------------------------------------- *
       * THE MEMBER CARD.
       *
       * The light beam again, as on the door, so the two pages read as one
       * place. Drawn in CSS: a projector throwing light is the brand's own
       * metaphor and it costs nothing to draw, where an image would be
       * another asset to ship to a page most people open on mobile data.
       * ----------------------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-border-subtle bg-black py-16 sm:py-20">
        <div
          aria-hidden="true"
          /* See the note on the same beam in app/club/page.jsx: capped at the
              viewport width so the element's box cannot extend past a phone
              screen, which the UI audit reports as an overflow even when
              `overflow-hidden` hides it. */
          className="pointer-events-none absolute left-1/2 top-[-20rem] h-[36rem] w-screen max-w-[52rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(80,140,255,0.22),rgba(80,140,255,0.06)_45%,transparent_70%)] blur-2xl"
        />

        <div className="section-container relative">
          <div className="glass-panel max-w-[560px] p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft">
              {CLUB.name}
              {memberNumber && <span className="text-white/55"> · Member {memberNumber}</span>}
            </p>

            <h1 className="mt-4 text-3xl font-bold tracking-tighter text-white sm:text-4xl">
              {firstName ? `Hello, ${firstName}.` : 'Hello.'}
            </h1>

            {joined && <p className="mt-3 text-sm text-white/55">Member since {joined}</p>}
          </div>
        </div>
      </section>

      <section className="border-b border-border-subtle bg-black py-14 sm:py-20">
        <div className="section-container">
          <div className="bento-grid">
            {/* --- YOUR IRIZ ------------------------------------------- */}
            <div className="bento-tile p-6 sm:p-8 lg:col-span-6">
              <h2 className="text-base font-semibold text-white">Your IRIZ</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Joining the Club is not the same as registering your warranty — they are separate
                records, and the warranty one is what a future claim is assessed against.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href="/warranty" className="btn-secondary justify-center">
                  Register your warranty
                </a>
                <a href={CLUB.links.warrantyPolicy} className="btn-secondary justify-center">
                  Warranty policy
                </a>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-white/55">
                Something wrong with your unit? Email{' '}
                <a
                  href={`mailto:${CLUB.links.supportEmail}`}
                  className="underline underline-offset-4 decoration-white/25 transition-colors hover:decoration-white"
                >
                  {CLUB.links.supportEmail}
                </a>{' '}
                — {CLUB.links.supportHours}.
              </p>
            </div>

            {/* --- TIPS & SETUP ---------------------------------------- *
                SETUP_STEPS, the same five that lead /support/faq. Reused,
                not rewritten: a second set of setup instructions for members
                would be a second thing to keep true, and there is nothing
                about setting up a projector that should differ by whether
                its owner joined a club. */}
            <div className="bento-tile p-6 sm:p-8 lg:col-span-6">
              <h2 className="text-base font-semibold text-white">Tips &amp; setup</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                The five-step walkthrough, and the answers to what gets asked most.
              </p>
              <ol className="mt-5 space-y-2.5 text-sm leading-relaxed text-white/60">
                {SETUP_STEPS.map((step, i) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="font-mono text-xs text-white/35">{i + 1}</span>
                    <span>{step.title}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-5">
                <a href={CLUB.links.faq} className="btn-secondary inline-flex">
                  Setup, FAQ &amp; troubleshooting →
                </a>
              </div>
            </div>

            {/* --- COMMUNITY ------------------------------------------- */}
            <div className="bento-tile p-6 sm:p-8 lg:col-span-6">
              <h2 className="text-base font-semibold text-white">Community</h2>
              {hasCommunity() ? (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">
                    Swap setups, screen sizes and film nights with other owners.
                  </p>
                  <div className="mt-5">
                    <a
                      href={CLUB.communityUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary inline-flex"
                    >
                      Join the group
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  Community opens soon. We will put the invite here first.
                </p>
              )}
            </div>

            {/* --- MEMBER OFFERS --------------------------------------- */}
            <div className="bento-tile p-6 sm:p-8 lg:col-span-6">
              <h2 className="text-base font-semibold text-white">Member offers</h2>
              {hasOffers() ? (
                <ul className="mt-4 space-y-5">
                  {CLUB.offers.map((offer) => (
                    <li key={offer.title}>
                      <h3 className="text-sm font-semibold text-white">{offer.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-white/55">{offer.body}</p>
                      {offer.href ? (
                        <a href={offer.href} className="btn-secondary mt-3 inline-flex">
                          {offer.cta || 'See the offer'}
                        </a>
                      ) : (
                        <p className="mt-2 text-xs text-white/45">
                          Claim it by emailing {CLUB.links.supportEmail} with your member number.
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  Member-only offers will appear here first.
                </p>
              )}
            </div>

            {/* --- EARLY ACCESS ---------------------------------------- *
                NO FORM. Members gave us an email address when they joined,
                and asking for it again would be asking twice for the same
                thing — which reads as a company that does not know what it
                already holds. */}
            <div className="bento-tile p-6 sm:p-8 lg:col-span-12">
              <h2 className="text-base font-semibold text-white">Early access</h2>
              <p className="mt-2 max-w-[640px] text-sm leading-relaxed text-white/55">
                Be first to hear about new BluNeuron products. You are already on the list — we
                have the email address you joined with, and there is nothing else to sign up for.
              </p>
            </div>
          </div>

          {/* SIGN OUT, at the bottom and on its own. It is the one
              destructive control on the page, so it does not sit beside the
              things a member came here to press. */}
          <div className="mt-10 flex flex-col gap-4 border-t border-border-subtle pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-white/45">
              To leave the Club and have your details deleted, email{' '}
              <a
                href={`mailto:${CLUB.links.supportEmail}`}
                className="underline underline-offset-4 decoration-white/25 transition-colors hover:decoration-white"
              >
                {CLUB.links.supportEmail}
              </a>
              .
            </p>
            <ClubSignOut />
          </div>
        </div>
      </section>
    </PageShell>
  );
}

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import PageShell from '@/components/PageShell';
import ClubDoor from '@/components/club/ClubDoor';
import { CLUB, CLUB_COOKIE, CLUB_HOME_PATH } from '@/lib/club';
import { SERIAL_EXAMPLE } from '@/lib/club-serial';
import { readSessionToken } from '@/lib/club-session';
import { clubConfigured } from '@/lib/club-server';

/**
 * /club — THE DOOR. The address printed on the card in every carton.
 *
 * ===========================================================================
 * THIS URL IS PRINTED ON PACKAGING AND CAN NEVER MOVE.
 * ===========================================================================
 * Same rule as the `/warranty` redirect in next.config.js and for the same
 * reason: the cards are already made, the ones in a warehouse today will be
 * opened years from now, and a dead QR code on retail packaging cannot be
 * recalled or patched. If the Club is ever restructured, /club stays and
 * redirects. Do not rename it, do not nest it, do not add a required query
 * parameter to it.
 *
 * A MEMBER NEVER SEES THIS PAGE. A valid cookie redirects straight to
 * /club/home — someone scanning the card a second time wants their member
 * area, not a form asking them to join something they are already in.
 *
 * `noindex, nofollow` comes from app/club/layout.jsx, which covers this page
 * and every page added beside it. See the long note there for the other three
 * halves of keeping this undiscoverable.
 *
 * No `metadata.title` here beyond the default: the layout's robots rules are
 * what matter, and a distinctive title is one more string that could end up
 * somewhere it should not.
 */

export const metadata = {
  title: 'IRIZ Club — BluNeuron',
  description: 'The IRIZ Club is for IRIZ owners.',
};

/** Where the serial is, in words. No invented photograph of a sticker. */
const WHERE_TO_LOOK = [
  'On the sticker on the bottom of the projector, beside the model number.',
  'On the white label on the side of the retail carton.',
  'On the warranty card inside the box.',
];

export default async function ClubPage() {
  /*
   * READING THE COOKIE MAKES THIS ROUTE DYNAMIC, which is correct and is why
   * the Club lives in its own folder: the member check has to run per
   * request, and confining it here leaves the other twenty-five pages
   * prerendered. The masthead's Club tab is served separately, by
   * /api/club/me, for exactly that reason.
   */
  const token = (await cookies()).get(CLUB_COOKIE)?.value;
  if (token && (await readSessionToken(token))) {
    redirect(CLUB_HOME_PATH);
  }

  // The secrets are Worker secrets and are set by hand. A preview built
  // before they exist says so, rather than offering a form that answers 503
  // to every submission.
  const ready = clubConfigured();

  return (
    <PageShell>
      {/* No <Reveal> anywhere in the Club, for the same reason there is none
          under /support: most arrivals here are an in-app browser opened by a
          QR scan from a camera app, where the bundle may never land. Plain,
          static, visible markup. See components/Reveal.jsx. */}
      <section className="relative overflow-hidden border-b border-border-subtle bg-black py-20 sm:py-28">
        {/* THE LIGHT BEAM. A projector's own metaphor, drawn in CSS rather
            than shipped as an image: a wide, soft conic wash from the top
            centre, clipped by the section. `pointer-events-none` so it never
            eats a click on the form below, and `aria-hidden` because it says
            nothing a reader needs. */}
        <div
          aria-hidden="true"
          /* `w-screen max-w-[52rem]`, not a bare `w-[52rem]`.
              A fixed 52rem beam is wider than a phone, so although the
              section's `overflow-hidden` clips it and the page never scrolls
              sideways, the element's own box still extends past the viewport
              — which scripts/ui-audit.mjs reports, correctly, as an overflow.
              Capping it at the viewport width keeps the box inside the screen
              and changes nothing above 832px, where 52rem is the smaller of
              the two. */
          className="pointer-events-none absolute left-1/2 top-[-18rem] h-[36rem] w-screen max-w-[52rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(80,140,255,0.22),rgba(80,140,255,0.06)_45%,transparent_70%)] blur-2xl"
        />

        <div className="section-container relative">
          <div className="max-w-[640px]">
            <p className="eyebrow mb-3">Members only</p>
            <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl">
              Welcome to the {CLUB.name}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/60">
              Exclusive for IRIZ owners. Enter the serial number from your box sticker to join.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border-subtle bg-black py-14 sm:py-20">
        <div className="section-container">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="min-w-0">
              {ready ? (
                <ClubDoor />
              ) : (
                /* HONEST, not broken. The Club is a deploy-time thing: the
                   page exists, the database may not be connected yet. Saying
                   so beats a form that fails on submit. */
                <div className="glass-panel p-6 sm:p-8">
                  <h2 className="text-lg font-semibold text-white">The Club is not open yet</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">
                    We are still setting this up. Keep the card from your box — the address on it
                    does not change — and try again soon.
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-white/55">
                    Anything urgent about your projector:{' '}
                    <a
                      href={`mailto:${CLUB.links.supportEmail}`}
                      className="underline underline-offset-4 decoration-white/25 transition-colors hover:decoration-white"
                    >
                      {CLUB.links.supportEmail}
                    </a>
                  </p>
                </div>
              )}
            </div>

            {/* WHERE THE SERIAL IS. Described, not illustrated.
                A drawing of a sticker we have not photographed would be a
                guess at what the carton looks like, and a wrong one sends
                people hunting in the wrong place. The example serial is the
                real format and its check letter is genuine — but it is not in
                club_serials, so nobody can join by typing the one on the
                website. */}
            <aside className="min-w-0">
              <div className="rounded-2xl border border-border-subtle bg-white/[0.02] p-6 sm:p-8">
                <h2 className="text-base font-semibold text-white">
                  Where to find your serial number
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  Eleven characters, letters and digits, printed in one block. It looks like this:
                </p>
                <p className="mt-4 rounded-xl border border-border bg-black-elevated px-4 py-3 font-mono text-base tracking-[0.18em] text-white">
                  {SERIAL_EXAMPLE}
                </p>

                <ul className="mt-6 space-y-3 text-sm leading-relaxed text-white/60">
                  {WHERE_TO_LOOK.map((line) => (
                    <li key={line} className="flex gap-3">
                      <span
                        className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent-soft"
                        aria-hidden="true"
                      />
                      {line}
                    </li>
                  ))}
                </ul>

                <p className="mt-6 text-xs leading-relaxed text-white/55">
                  Capitals, lower case, spaces and dashes are all fine — we tidy it up for you.
                  Cannot find it? Email{' '}
                  <a
                    href={`mailto:${CLUB.links.supportEmail}`}
                    className="underline underline-offset-4 decoration-white/25 transition-colors hover:decoration-white"
                  >
                    {CLUB.links.supportEmail}
                  </a>{' '}
                  with a photo of the box.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

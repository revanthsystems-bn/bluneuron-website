import PageShell from '@/components/PageShell';
import PageHero from '@/components/PageHero';
import SupportTiles from '@/components/SupportTiles';
import AnswerSearch from '@/components/support/AnswerSearch';
import { ALL_FAQS, BRAND, MEDIA, TROUBLESHOOTING } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import {
  SUPPORT,
  telHref,
  visibleSupportPhones,
} from '@/lib/site-config';

export const metadata = {
  ...pageMetadata({
    title: 'IRIZ Support — Warranty, FAQs & Downloads | BluNeuron',
    description:
      'Register a warranty, make a claim, read the FAQ and troubleshooting, or contact BluNeuron support in India — email, phone and service hours.',
    path: ROUTES.support,
  }),
  robots: routeRobots(ROUTES.support),
};

/**
 * The support HUB.
 *
 * This page used to be the whole support section on one scroll: a setup guide,
 * the FAQ, troubleshooting, and a contact form stacked five screens deep. That
 * works while support is four things. It stops working the moment warranty
 * registration and claims exist — the two things a real owner comes
 * here to DO would have been buried below several screens of reading, and
 * neither had a URL anyone could be sent to.
 *
 * So the content moved to pages that can be linked, and this page became the
 * index of them:
 *
 *   setup guide        → /support/faq, as its own leading section. It was
 *                        on /support/manuals until that route retired; the
 *                        PDFs there do not exist yet, the walkthrough does
 *   FAQ                → /support/faq
 *   troubleshooting    → /support/faq, alongside the FAQ (both are "my
 *                        question has an answer already")
 *   contact form       → /support/contact
 *
 * The old in-page anchors (/support#faq, /support#contact) are gone with them.
 * Every link that used them has been repointed at the new routes — see
 * lib/routes.js, which is now the only place any of these paths is spelled.
 *
 * THE CHANNEL STRIP below the tiles is not a duplicate of /support/contact,
 * and the difference is what it leaves out. That page is the full set with a
 * note under each explaining when to use it, plus the form and the grievance
 * escalation. This is the two addresses, the phone number and the hours, on
 * the page everyone lands on first, because "how do I reach you and when are
 * you open" is the commonest question here and it should not cost a click.
 * Both read SUPPORT and visibleSupportPhones() from lib/site-config.js, so
 * neither can state a channel the other does not — and the phone rows obey
 * the same one rule: a confirmed number renders on every build, a masked one
 * is dropped from every build.
 */

/**
 * The hub's channels, flattened to label + value + href.
 *
 * No `note` field and no icons: a strip of four short rows under a heading
 * does not need either, and copying the notes across from /support/contact is
 * how two pages start saying slightly different things about one inbox.
 */
const CHANNELS = [
  { label: 'Support', value: SUPPORT.email, href: `mailto:${SUPPORT.email}` },
  ...visibleSupportPhones().map((entry) => ({
    label: entry.label,
    value: entry.number,
    // telHref() from lib/site-config.js, not a strip written here — one
    // place on the site builds every `tel:`, so the readable number and the
    // dialled one cannot drift. It returns null for anything masked.
    href: telHref(entry.number),
  })),
  { label: 'Sales', value: SUPPORT.salesEmail, href: `mailto:${SUPPORT.salesEmail}` },
  { label: 'Hours', value: SUPPORT.hours, href: null },
];

export default function SupportPage() {
  return (
    <PageShell>
      {/* No scroll reveal anywhere under /support: see components/Reveal.jsx.
          Support pages are read, not browsed, and a good share of this traffic
          is an in-app browser opened by a QR scan, where the bundle may never
          land. They are plain, static, visible markup. */}
      {/* A STILL FROM THE LOOP WE ALREADY SHIP, not new photography.

          The hub used to open on flat black — a heading, one line, then six
          tiles — which is what made a page about owning the product feel
          like a directory. The poster frame is a hand holding the unit,
          which suits "we've got you covered" better than a beauty render
          would. */}
      <PageHero
        eyebrow="Support"
        title="We've got you covered."
        subtitle={`Everything for your ${BRAND.model} in one place — warranty, answers, and a direct line to our team.`}
        image={MEDIA.heroLoop.poster}
        imagePosition="60% 45%"
      >
        {/* The search box is the first interactive thing on the page because
            "find the answer" is the commonest reason to be here, and it
            otherwise took two clicks and a page of scrolling to begin. */}
        <AnswerSearch
          faqs={ALL_FAQS}
          fixes={TROUBLESHOOTING}
          faqHref={ROUTES.faq}
          contactHref={ROUTES.contact}
        />
      </PageHero>

      <section className="border-b border-border-subtle bg-black py-16 sm:py-20">
        <div className="section-container">
          <SupportTiles />

          {/* THE CHANNELS. Addresses and hours, on the page people land on.

              In the SAME section as the tiles, not one of its own: it is the
              rest of "here is how to get help", and a section border between
              them would read as a change of subject. `mt-12` is the gap.

              A definition list, because that is what it is: four terms and
              their values. `sm:grid-cols-2 lg:grid-cols-4` rather than a flex
              row, so the long one — the hours string, at 48 characters —
              wraps inside its own column instead of pushing the others off a
              phone. */}
          <div className="glass-panel mt-12 p-8 sm:p-10">
            <p className="eyebrow mb-3">Reach us</p>
            <h2 className="text-2xl font-bold tracking-tighter text-white">
              Email us, or call during service hours
            </h2>

            <dl className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {CHANNELS.map((channel) => (
                <div key={channel.label}>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                    {channel.label}
                  </dt>
                  {/* `break-words`: an email address is a single unbroken
                      token and will widen a 390px column without it. */}
                  <dd className="mt-2 break-words text-sm font-semibold text-white">
                    {channel.href ? (
                      <a
                        href={channel.href}
                        className="underline underline-offset-4 decoration-white/25 transition-colors hover:decoration-white"
                      >
                        {channel.value}
                      </a>
                    ) : (
                      channel.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-7 text-sm leading-relaxed text-white/55">
              A message sent outside service hours is answered the next working day. For a hardware
              fault, the{' '}
              <a
                href={ROUTES.warrantyClaim}
                className="underline underline-offset-2 transition-colors hover:text-white"
              >
                warranty claim form
              </a>{' '}
              collects what we need up front and is faster than an email.
            </p>
          </div>
        </div>
      </section>

      {/* One destination repeated below the tiles, on purpose. Someone whose
          problem is not on any tile should not have to work out which tile is
          closest — "none of these" needs its own exit, and it is the last
          thing on the page where they will be looking for it. */}
      <section className="bg-black-soft py-16 sm:py-20">
        <div className="section-container">
          <div className="glass-panel flex flex-col gap-6 p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-lg">
              <h2 className="text-2xl font-bold tracking-tighter text-white">
                Not sure where to start?
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-white/55">
                Tell us what is happening and we will point you at the right thing — no bots, no
                ticket queue purgatory.
              </p>
            </div>
            <a href={ROUTES.contact} className="btn-primary shrink-0 justify-center">
              Contact support
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

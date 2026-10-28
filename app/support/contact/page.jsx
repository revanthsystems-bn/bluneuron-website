import PageShell from '@/components/PageShell';
import PageHero from '@/components/PageHero';
import DraftBanner from '@/components/DraftBanner';
import ContactForm from '@/components/ContactForm';
import { Briefcase, Clock, Mail, Phone } from 'lucide-react';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import {
  COMPANY,
  GRIEVANCE_OFFICER,
  SUPPORT,
  allKnown,
  hasGrievanceContact,
  isTBD,
  sellersOr,
  telHref,
  visibleSupportPhones,
} from '@/lib/site-config';
import { MEDIA } from '@/lib/iriz';

export const metadata = {
  ...pageMetadata({
    title: 'Contact Support — BluNeuron',
    description:
      'Customer care phone number, support and sales email, support hours, and the form that reaches the BluNeuron team directly.',
    path: ROUTES.contact,
  }),
  robots: routeRobots(ROUTES.contact),
};

/**
 * Contact, with the channels ABOVE the form.
 *
 * The form is the path of least resistance for us and the slowest for the
 * visitor: it is a one-way message with no reply time they can see. Someone
 * with a dead unit and an email address in front of them will use the email.
 * So the channels come first and the form is the fallback for people who would
 * rather not leave the page — not the other way round.
 */

/**
 * THE CHANNELS, in the order someone with a problem should try them.
 *
 * Email first, because it is the one that definitely answers and the one that
 * can carry a photograph, an invoice number and a serial number. The phones follow.
 * Sales is a different inbox for a different reader — a distributor enquiry
 * must not queue behind a broken unit, and a broken unit must not queue behind
 * a distributor enquiry. Hours last, because it qualifies all four above it.
 *
 * THE PHONE ROWS ARE DECIDED IN lib/site-config.js, NOT HERE.
 * `visibleSupportPhones()` returns every confirmed number and drops anything
 * masked, on every build — so a customer is never shown a number that does
 * not ring, and a reviewer sees exactly what a customer will. There is one
 * confirmed number today, so there is one phone row. No second rule on this
 * page could disagree with that, and no surface to forget if another line is
 * ever added.
 */
const CHANNELS = [
  {
    icon: Mail,
    label: 'Email',
    value: SUPPORT.email,
    href: isTBD(SUPPORT.email) ? null : `mailto:${SUPPORT.email}`,
    note: 'Best for anything with an invoice number, a photo or a serial number.',
  },
  ...visibleSupportPhones().map((entry) => ({
    icon: Phone,
    label: entry.label,
    value: entry.number,
    /*
     * telHref() FROM lib/site-config.js, not a strip written here. One place
     * on the site turns a readable number into a dialling string, so the two
     * cannot drift — and it is the place that knows not to build a `tel:`
     * from a masked number, which would strip to "+91" and place a real call
     * to a two-digit prefix. A confirmed number gets the link; anything
     * masked gets null, and the tile renders as plain text.
     */
    href: telHref(entry.number),
    note: 'Best for setup help you would rather have talked through.',
  })),
  {
    icon: Briefcase,
    label: 'Sales',
    value: SUPPORT.salesEmail,
    href: isTBD(SUPPORT.salesEmail) ? null : `mailto:${SUPPORT.salesEmail}`,
    note: 'Bulk orders, retail and distribution enquiries, partnerships.',
  },
  {
    icon: Clock,
    label: 'Customer service hours',
    value: SUPPORT.hours,
    href: null,
    note: 'Messages outside these hours are answered the next working day.',
  },
];

/** A channel we do not have is REMOVED, never rendered with its placeholder. */
const VISIBLE_CHANNELS = CHANNELS.filter((channel) => !isTBD(channel.value));

/**
 * THE TILE SPANS, as a table rather than a ternary.
 *
 * `bento-grid` is a 12-column board, and the number of tiles is no longer
 * fixed: three on production, five on a preview with both phone rows, four
 * the day one number is confirmed. A hardcoded `lg:col-span-4` left four
 * tiles as 3 + 1, with one stranded at a third of the width on its own row —
 * and five would have been worse. Each row of this table fills twelve
 * columns exactly, so no count leaves a hole.
 *
 * The literal class strings matter: Tailwind scans source text, so a span
 * assembled as `lg:col-span-${n}` would not be generated at all.
 */
const TILE_SPANS = {
  1: ['lg:col-span-12'],
  2: ['lg:col-span-6', 'lg:col-span-6'],
  3: ['lg:col-span-4', 'lg:col-span-4', 'lg:col-span-4'],
  4: ['lg:col-span-6', 'lg:col-span-6', 'lg:col-span-6', 'lg:col-span-6'],
  5: [
    'lg:col-span-4',
    'lg:col-span-4',
    'lg:col-span-4',
    'lg:col-span-6',
    'lg:col-span-6',
  ],
  6: [
    'lg:col-span-4',
    'lg:col-span-4',
    'lg:col-span-4',
    'lg:col-span-4',
    'lg:col-span-4',
    'lg:col-span-4',
  ],
};

const SPANS = TILE_SPANS[VISIBLE_CHANNELS.length] ?? VISIBLE_CHANNELS.map(() => 'lg:col-span-4');

/**
 * Is there a grievance contact point to publish?
 *
 * THE DESIGNATION AND THE EMAIL, not the name. This panel used to be gated on
 * `allKnown(GRIEVANCE_OFFICER.name, …)`, which meant a complete, legally
 * required escalation route — a designation, a registered address, an email
 * and published timelines — was hidden from every customer because one
 * optional field was blank. The name line below renders only when there is a
 * name; the rest of the disclosure no longer waits for it.
 */
const HAS_GRIEVANCE_CONTACT = hasGrievanceContact();
const HAS_OFFICER_NAME = allKnown(GRIEVANCE_OFFICER.name);
const HAS_OFFICER_ADDRESS = allKnown(COMPANY.legalName, COMPANY.registeredAddress);

/** The escalation panel's rows, built so a missing one leaves no label behind. */
const OFFICER_ROWS = [
  ...(HAS_OFFICER_NAME ? [{ term: 'Name', value: GRIEVANCE_OFFICER.name }] : []),
  { term: 'Designation', value: GRIEVANCE_OFFICER.designation },
  {
    term: 'Email',
    value: GRIEVANCE_OFFICER.email,
    href: isTBD(GRIEVANCE_OFFICER.email) ? null : `mailto:${GRIEVANCE_OFFICER.email}`,
  },
  ...(HAS_OFFICER_ADDRESS
    ? [
        { term: 'Entity', value: COMPANY.legalName },
        { term: 'Address', value: COMPANY.registeredAddress },
      ]
    : []),
  { term: 'Hours', value: GRIEVANCE_OFFICER.hours },
];

export default function ContactPage() {
  return (
    <PageShell>
      {/* No scroll reveal anywhere under /support: see components/Reveal.jsx.
          Support pages are read, not browsed, and a good share of this traffic
          is an in-app browser opened by a QR scan, where the bundle may never
          land. They are plain, static, visible markup. */}
      <PageHero
        eyebrow="Support"
        title="Talk to us."
        subtitle={`Order, delivery and refund questions go to ${sellersOr()}. Everything about the product itself comes to us.`}
        image={MEDIA.heroLoop.poster}
        imagePosition="55% 45%"
      />

      <section className="border-b border-border-subtle bg-black py-16 sm:py-20">
        <div className="section-container">
          <DraftBanner path={ROUTES.contact} className="mb-10 max-w-[680px]" />

          <div className="bento-grid">
            {VISIBLE_CHANNELS.map((channel, i) => {
              const Icon = channel.icon;

              return (
                <div key={channel.label} className={`bento-tile p-6 ${SPANS[i]}`}>
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-accent-soft">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>

                  <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                    {channel.label}
                  </h2>

                  {/* `break-words`: an email address is one unbroken token and
                      will push a 390px tile into horizontal scroll without it. */}
                  <p className="mt-2 break-words text-base font-semibold text-white">
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
                  </p>

                  <p className="mt-auto pt-4 text-sm leading-relaxed text-white/50">
                    {channel.note}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border-subtle bg-black-soft py-16 sm:py-20">
        <div className="section-container grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div className="max-w-md">
            <p className="eyebrow mb-3">Send a message</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tighter text-white sm:text-4xl">
              Write to our team
            </h2>
            <p className="text-sm leading-relaxed text-white/55">
              Tell us what is happening and we will get back to you. If it is a hardware fault on a
              unit you own, the{' '}
              <a
                href={ROUTES.warrantyClaim}
                className="underline underline-offset-2 transition-colors hover:text-white"
              >
                warranty claim form
              </a>{' '}
              collects what we need up front and is faster.
            </p>
          </div>

          <div>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Its own section, not a line in the footer of the page. A grievance is
          an escalation — someone using this has already tried the channels
          above and been let down by them — and burying the route to it under
          the contact form is how a required disclosure becomes a formality.

          RENDERED NOW. It used to be hidden until an officer was NAMED, which
          withheld the designation, the registered address, the email and the
          timelines as well — the whole disclosure, over one blank field. The
          name line appears here the moment GRIEVANCE_OFFICER.name is filled
          in; nothing else waits for it. */}
      {HAS_GRIEVANCE_CONTACT && (
        <section className="bg-black py-16 sm:py-20">
          <div className="section-container">
            <div className="glass-panel max-w-[680px] p-8 sm:p-10">
              <p className="eyebrow mb-3">Escalation</p>
              <h2 className="text-2xl font-bold tracking-tighter text-white">Grievance officer</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                If a complaint has not been resolved through the channels above, it can be escalated
                to our grievance officer, who is responsible for consumer complaints under
                India&apos;s Consumer Protection (E-Commerce) Rules.
              </p>

              <dl className="mt-6 space-y-3 text-sm">
                {OFFICER_ROWS.map((row) => (
                  <div key={row.term} className="flex flex-wrap gap-x-3 gap-y-1">
                    <dt className="text-white/55">{row.term}</dt>
                    <dd className="break-words font-medium text-white">
                      {row.href ? (
                        <a
                          href={row.href}
                          className="underline underline-offset-4 decoration-white/25 transition-colors hover:decoration-white"
                        >
                          {row.value}
                        </a>
                      ) : (
                        row.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-6 text-sm leading-relaxed text-white/60">
                {GRIEVANCE_OFFICER.responsePromise}
              </p>

              <a href={ROUTES.grievance} className="btn-secondary mt-7 inline-flex">
                Grievance redressal policy →
              </a>
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}

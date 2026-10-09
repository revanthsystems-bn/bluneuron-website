import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import DraftBanner from '@/components/DraftBanner';
import ContactForm from '@/components/ContactForm';
import Reveal from '@/components/Reveal';
import { Clock, Mail, Phone } from 'lucide-react';
import { ROUTES, routeRobots } from '@/lib/routes';
import { GRIEVANCE_OFFICER, SUPPORT, isTBD } from '@/lib/site-config';

export const metadata = {
  title: 'Contact Support — BluNeuron',
  description:
    'Email, phone and support hours for BluNeuron — plus our grievance officer and the form that reaches our team directly.',
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
 *
 * A channel whose value is still [TBD] renders with the placeholder VISIBLE
 * rather than being hidden: this page's whole job is to say how to reach us,
 * and a contact page that silently shows two of three channels looks finished
 * when it is not. The DRAFT banner and the noindex cover it in the meantime.
 * (The footer's identity line does the opposite, for the opposite reason —
 * see lib/site-config.js.)
 */
const CHANNELS = [
  {
    icon: Mail,
    label: 'Email',
    value: SUPPORT.email,
    href: isTBD(SUPPORT.email) ? null : `mailto:${SUPPORT.email}`,
    note: 'Best for anything with an order ID, a photo or a serial number.',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: SUPPORT.phone,
    // `tel:` wants no spaces or punctuation in the dialled string.
    href: isTBD(SUPPORT.phone) ? null : `tel:${String(SUPPORT.phone).replace(/[^+\d]/g, '')}`,
    note: 'Best for setup help you want talked through.',
  },
  {
    icon: Clock,
    label: 'Hours',
    value: SUPPORT.hours,
    href: null,
    note: 'Messages outside these hours are answered the next working day.',
  },
];

export default function ContactPage() {
  return (
    <PageShell>
      <PageHeading
        eyebrow="Support"
        title="Talk to us."
        subtitle="Order, delivery and refund questions go to Amazon or Flipkart. Everything about the product itself comes to us."
      />

      <section className="border-b border-border-subtle bg-black py-16 sm:py-20">
        <div className="section-container">
          <DraftBanner path={ROUTES.contact} className="mb-10 max-w-[680px]" />

          <div className="bento-grid">
            {CHANNELS.map((channel, i) => {
              const Icon = channel.icon;

              return (
                <Reveal
                  key={channel.label}
                  delay={Math.min(i, 3) * 0.05}
                  y={20}
                  className="bento-tile p-6 lg:col-span-4"
                >
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-accent-soft">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>

                  <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
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
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border-subtle bg-black-soft py-16 sm:py-20">
        <div className="section-container grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <Reveal className="max-w-md">
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
          </Reveal>

          <Reveal delay={0.05}>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      {/* Its own section, not a line in the footer of the page. A grievance is
          an escalation — someone using this has already tried the channels
          above and been let down by them — and burying the route to it under
          the contact form is how a required disclosure becomes a formality. */}
      <section className="bg-black py-16 sm:py-20">
        <div className="section-container">
          <Reveal className="glass-panel max-w-[680px] p-8 sm:p-10">
            <p className="eyebrow mb-3">Escalation</p>
            <h2 className="text-2xl font-bold tracking-tighter text-white">Grievance officer</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              If a complaint has not been resolved through the channels above, it can be escalated
              to our grievance officer, who is responsible for consumer complaints under India&apos;s
              Consumer Protection (E-Commerce) Rules.
            </p>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <dt className="text-white/45">Name</dt>
                <dd className="font-medium text-white">{GRIEVANCE_OFFICER.name}</dd>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <dt className="text-white/45">Email</dt>
                <dd className="break-words font-medium text-white">
                  {isTBD(GRIEVANCE_OFFICER.email) ? (
                    GRIEVANCE_OFFICER.email
                  ) : (
                    <a
                      href={`mailto:${GRIEVANCE_OFFICER.email}`}
                      className="underline underline-offset-4 decoration-white/25 transition-colors hover:decoration-white"
                    >
                      {GRIEVANCE_OFFICER.email}
                    </a>
                  )}
                </dd>
              </div>
            </dl>

            <a href={ROUTES.grievance} className="btn-secondary mt-7 inline-flex">
              Grievance redressal policy →
            </a>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}

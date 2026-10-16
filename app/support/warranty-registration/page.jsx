import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import Reveal from '@/components/Reveal';
import RegistrationForm from '@/components/warranty/RegistrationForm';
import { pageMetadata } from '@/lib/seo';
import { BRAND } from '@/lib/iriz';
import { WARRANTY } from '@/lib/warranty';

/**
 * Registration is OPTIONAL and the page says so in its first line.
 *
 * The statutory and contractual warranty both run from the invoice date
 * whether or not anything was registered. Registration records the purchase
 * details so a claim does not start with hunting for an invoice — that is
 * the whole of what it buys, and overstating it ("register to activate your
 * warranty") would be false.
 *
 * This is the page the QR code printed on the carton leads to, via the /warranty
 * redirect in next.config.js. It therefore has to keep working at this exact
 * path indefinitely; see the comment on that redirect.
 */

export const metadata = pageMetadata({
  title: 'Warranty Registration — BluNeuron IRIZ',
  description:
    'Register your BluNeuron IRIZ with your order ID, serial number and purchase date so a future warranty claim is quick.',
  path: '/support/warranty-registration',
});

/** A bullet in the "What you'll need" list. */
function Need({ children }) {
  return (
    <li className="flex gap-2.5">
      <span
        className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent-soft"
        aria-hidden="true"
      />
      <span>{children}</span>
    </li>
  );
}

export default function WarrantyRegistrationPage() {
  return (
    <PageShell>
      <PageHeading
        eyebrow="Support"
        title="Register your warranty"
        subtitle={`Optional, and takes a minute. Your ${BRAND.model} is covered from the date on your invoice either way — registering just means a claim does not start with paperwork.`}
      />

      <section className="bg-black py-16 sm:py-20">
        <div className="section-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          {/* `lg:sticky` so the list of what you need stays beside the form
              while you scroll it on a desktop — it is a checklist, and a
              checklist that scrolls away is a checklist you re-scroll for. */}
          <Reveal className="max-w-md lg:sticky lg:top-28">
            <p className="text-sm leading-relaxed text-white/60">
              Cover runs for{' '}
              <span className="font-semibold text-white/85">{WARRANTY.months} months</span> from
              the invoice date.
            </p>

            <h2 className="mt-8 text-2xl font-bold tracking-tighter text-white">
              What you&apos;ll need
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-white/60">
              <Need>
                Your <strong className="font-semibold text-white/85">order ID</strong> from your
                invoice or purchase confirmation.
              </Need>
              <Need>
                The <strong className="font-semibold text-white/85">serial number</strong> on the
                label underneath the projector.
              </Need>
              <Need>
                The <strong className="font-semibold text-white/85">purchase date</strong> — the
                invoice date, not the delivery date.
              </Need>
            </ul>

            <p className="mt-6 text-sm leading-relaxed text-white/50">
              Keep your invoice regardless. It is the proof of purchase date any claim is assessed
              against, and we cannot reconstruct it from a registration alone.
            </p>

            <p className="mt-4 text-sm leading-relaxed text-white/50">
              <a
                href="/legal/warranty"
                className="underline underline-offset-2 transition-colors hover:text-white"
              >
                What the warranty covers
              </a>
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <RegistrationForm />
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}

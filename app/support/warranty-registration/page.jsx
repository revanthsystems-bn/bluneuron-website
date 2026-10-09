import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import DraftBanner from '@/components/DraftBanner';
import SupportForm from '@/components/SupportForm';
import Reveal from '@/components/Reveal';
import { BRAND } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { WARRANTY } from '@/lib/site-config';

export const metadata = {
  title: 'Warranty Registration — BluNeuron IRIZ',
  description:
    'Register your BluNeuron IRIZ with your marketplace order ID and serial number so a future warranty claim is quick.',
  robots: routeRobots(ROUTES.warrantyRegistration),
};

/**
 * Registration is OPTIONAL and the page says so in the first line.
 *
 * Statutory warranty in India runs from the date of purchase whether or not
 * anything was registered, and a page that implies otherwise is pressuring
 * someone into handing over a serial number for a right they already have.
 * What registration actually buys is speed: the details are on file before
 * anything goes wrong, so a claim does not start with hunting for an invoice.
 */
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
          <Reveal className="max-w-md lg:sticky lg:top-28">
            <DraftBanner path={ROUTES.warrantyRegistration} className="mb-8" />

            <h2 className="text-2xl font-bold tracking-tighter text-white">
              What you&apos;ll need
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-white/60">
              <li className="flex gap-2.5">
                <span
                  className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent-soft"
                  aria-hidden="true"
                />
                Your Amazon or Flipkart <strong className="font-semibold text-white/85">order
                ID</strong>, from the invoice in your orders list.
              </li>
              <li className="flex gap-2.5">
                <span
                  className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent-soft"
                  aria-hidden="true"
                />
                The <strong className="font-semibold text-white/85">serial number</strong> on the
                label underneath the projector.
              </li>
              <li className="flex gap-2.5">
                <span
                  className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent-soft"
                  aria-hidden="true"
                />
                The <strong className="font-semibold text-white/85">purchase date</strong> — the
                invoice date, not the delivery date.
              </li>
            </ul>

            <p className="mt-6 text-sm leading-relaxed text-white/50">
              Cover runs for <span className="font-semibold text-white/80">{WARRANTY.months}</span>{' '}
              months from the purchase date.{' '}
              <a
                href={ROUTES.warranty}
                className="underline underline-offset-2 transition-colors hover:text-white"
              >
                What the warranty covers
              </a>
              .
            </p>

            <p className="mt-4 text-sm leading-relaxed text-white/50">
              Keep your invoice regardless — it is the proof of purchase date any claim is assessed
              against, and we cannot reconstruct it from a registration alone.
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <SupportForm kind="registration" />
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}

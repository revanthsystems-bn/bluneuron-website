import { Suspense } from 'react';
import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import DraftBanner from '@/components/DraftBanner';
import SupportForm from '@/components/SupportForm';
import { BRAND } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { WARRANTY } from '@/lib/site-config';

export const metadata = {
  ...pageMetadata({
    title: 'Warranty Registration — BluNeuron IRIZ',
    description:
      'Register your BluNeuron IRIZ with your purchase details so a future warranty claim is quick.',
    path: ROUTES.warrantyRegistration,
  }),
  robots: routeRobots(ROUTES.warrantyRegistration),
};

/**
 * Registration is OPTIONAL and the page says so in the first line.
 *
 * Statutory warranty in India runs from the date of purchase whether or not
 * anything was registered. Registration records the purchase details so a
 * claim does not start with hunting for an invoice.
 */
export default function WarrantyRegistrationPage() {
  return (
    <PageShell>
      {/* No scroll reveal anywhere under /support: see components/Reveal.jsx.
          Support pages are read, not browsed, and a good share of this traffic
          is an in-app browser opened by a QR scan, where the bundle may never
          land. They are plain, static, visible markup. */}
      <PageHeading
        eyebrow="Support"
        title="Register your warranty"
        subtitle={`Optional, and takes a minute. Your ${BRAND.model} is covered from the date on your invoice either way — registering just means a claim does not start with paperwork.`}
      />

      <section className="bg-black py-16 sm:py-20">
        <div className="section-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="max-w-md lg:sticky lg:top-28">
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
                Your <strong className="font-semibold text-white/85">order ID</strong> from your
                invoice or purchase confirmation.
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
              {/* `WARRANTY.label` ("1 year"), not the month count — see the
                  note on the same line in the claim page. */}
              Cover runs for <span className="font-semibold text-white/80">{WARRANTY.label}</span>{' '}
              from the purchase date.{' '}
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
          </div>

          <div>
            {/* `useSearchParams` inside SupportForm (the claim link from the
                account pre-fills the unit) is a request-time API, and a
                prerendered page containing one without a boundary pulls the
                WHOLE page out of static rendering. Wrapped, the page stays
                static and only the form waits for the params. */}
            <Suspense fallback={<div className="glass-panel h-96" aria-hidden="true" />}>
              <SupportForm kind="registration" />
            </Suspense>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

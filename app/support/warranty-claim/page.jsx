import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import DraftBanner from '@/components/DraftBanner';
import SupportForm from '@/components/SupportForm';
import Reveal from '@/components/Reveal';
import { ROUTES, routeRobots } from '@/lib/routes';
import { WARRANTY } from '@/lib/site-config';

export const metadata = {
  title: 'Warranty Claim — BluNeuron IRIZ',
  description:
    'Make a warranty claim on your BluNeuron IRIZ: order ID, serial number, purchase date and what is going wrong.',
  robots: routeRobots(ROUTES.warrantyClaim),
};

/**
 * A claim form that points people AWAY from itself first.
 *
 * Inside the marketplace's own return window, a replacement from Amazon or
 * Flipkart is faster than anything we can do and costs the owner nothing — so
 * the page says that before the form, even though it means fewer claims reach
 * us. Sending someone down a slower path because it is our path is the kind of
 * thing that turns a working product into a bad review.
 *
 * Troubleshooting comes first for the same reason: most of what arrives as "it
 * is broken" is auto-focus that has not re-triggered or an audio output set to
 * the wrong device, and both are a minute on /support/faq rather than a week
 * without a projector.
 */
export default function WarrantyClaimPage() {
  return (
    <PageShell>
      <PageHeading
        eyebrow="Support"
        title="Make a warranty claim"
        subtitle="Tell us what is happening, with the order and serial details, and we will take it from there."
      />

      <section className="bg-black py-16 sm:py-20">
        <div className="section-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal className="max-w-md lg:sticky lg:top-28">
            <DraftBanner path={ROUTES.warrantyClaim} className="mb-8" />

            <h2 className="text-2xl font-bold tracking-tighter text-white">Try these first</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Two things are quicker than a claim, and one of them is usually the answer:
            </p>

            <ol className="mt-5 space-y-4 text-sm leading-relaxed text-white/60">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                  1
                </span>
                <span>
                  Check{' '}
                  <a
                    href={`${ROUTES.faq}#troubleshooting`}
                    className="underline underline-offset-2 transition-colors hover:text-white"
                  >
                    troubleshooting
                  </a>
                  . Blurry images, a trapezoid picture, no sound and an unresponsive remote all
                  have a fix that takes a minute.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                  2
                </span>
                <span>
                  If you are still inside Amazon or Flipkart&apos;s own return window, open a
                  return or replacement <strong className="font-semibold text-white/85">there</strong>{' '}
                  — it is faster than a warranty claim and they collect the unit.{' '}
                  <a
                    href={ROUTES.returns}
                    className="underline underline-offset-2 transition-colors hover:text-white"
                  >
                    Returns &amp; refunds
                  </a>
                  .
                </span>
              </li>
            </ol>

            <div className="mt-8 border-t border-border-subtle pt-6">
              <p className="text-sm leading-relaxed text-white/50">
                Cover runs for{' '}
                <span className="font-semibold text-white/80">{WARRANTY.months}</span> months from
                the purchase date. Claims are handled{' '}
                <span className="font-semibold text-white/80">{WARRANTY.claimRoute}</span>.{' '}
                <a
                  href={ROUTES.warranty}
                  className="underline underline-offset-2 transition-colors hover:text-white"
                >
                  Full warranty policy
                </a>
                .
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <SupportForm kind="claim" />
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}

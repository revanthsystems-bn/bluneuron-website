import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import Reveal from '@/components/Reveal';
import ClaimForm from '@/components/warranty/ClaimForm';
import { pageMetadata } from '@/lib/seo';
import { SUPPORT, WARRANTY } from '@/lib/warranty';

/**
 * The claim form, and the page says the two things people get wrong about
 * claiming before it shows them a field.
 *
 * "Not registered yet? You can still claim" is first among them. Registration
 * is optional (/support/warranty-registration says so too), but a form headed
 * "warranty claim" reads to most people as something you are only entitled to
 * if you did the paperwork — and someone with a dead projector who believes
 * they forfeited their cover does not write in at all. Saying it plainly here
 * costs a line and prevents that.
 *
 * On a phone the form comes FIRST and all of that sits under it, for the
 * reason set out at length on /support/warranty-registration: someone filing
 * a claim from a phone has a broken projector in front of them and has
 * already decided to write in. The one point that must survive being moved
 * below the form — that you can claim without having registered — is also
 * the mobile subtitle, so it is read before the first field either way.
 *
 * From `lg` up nothing changes; `order-*` only bites while the grid is one
 * column.
 */

export const metadata = pageMetadata({
  title: 'Warranty Claim — BluNeuron IRIZ',
  description:
    'Make a warranty claim on your BluNeuron IRIZ: your order ID, serial number, and what is going wrong. You do not need to have registered first.',
  path: '/support/warranty-claim',
});

export default function WarrantyClaimPage() {
  return (
    <PageShell>
      {/* Two subtitles, one per breakpoint — see the registration page. The
          mobile line is not "takes about a minute": a claim is not a quick
          errand someone chose to run, and promising speed to a person whose
          projector has died would read as glib. It carries the fact that
          actually unblocks them instead. */}
      <PageHeading
        eyebrow="Support"
        title="Make a warranty claim"
        subtitle={
          <>
            <span className="lg:hidden">
              {WARRANTY.months} months cover from your invoice date. You do not need to have
              registered first.
            </span>
            <span className="hidden lg:inline">
              Tell us what is happening, with your order and serial details, and we will take it
              from there.
            </span>
          </>
        }
      />

      <section className="bg-black py-16 sm:py-20">
        <div className="section-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal className="order-2 max-w-md lg:order-1 lg:sticky lg:top-28">
            <h2 className="text-2xl font-bold tracking-tighter text-white">
              Something not right?
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Fill in the form and we will come back to you on the email address you give. You get
              a claim reference as soon as it is in.
            </p>

            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-white/60">
              <Point>
                <strong className="font-semibold text-white/85">Keep your invoice ready.</strong>{' '}
                It is the proof of purchase date the claim is assessed against.
              </Point>
              <Point>
                The <strong className="font-semibold text-white/85">serial number</strong> is on
                the label underneath the projector.
              </Point>
              <Point>
                Cover runs for{' '}
                <strong className="font-semibold text-white/85">{WARRANTY.months} months</strong>{' '}
                from the invoice date.
              </Point>
            </ul>

            <div className="mt-8 rounded-2xl border border-border-subtle bg-white/[0.03] p-5">
              <p className="text-sm font-semibold text-white">Not registered yet?</p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                You can still claim. Registering was always optional — your cover runs from the
                invoice date either way, and this form asks for everything a claim needs.
              </p>
            </div>

            <div className="mt-8 border-t border-border-subtle pt-6">
              <p className="text-sm leading-relaxed text-white/50">
                <a
                  href="/legal/warranty"
                  className="underline underline-offset-2 transition-colors hover:text-white"
                >
                  Full warranty policy
                </a>
                {' · '}
                <a
                  href={`mailto:${SUPPORT.email}`}
                  className="underline underline-offset-2 transition-colors hover:text-white"
                >
                  {SUPPORT.email}
                </a>
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.05} className="order-1 lg:order-2">
            <ClaimForm />
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}

/** A bullet in the left column's list. */
function Point({ children }) {
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

import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import Reveal from '@/components/Reveal';
import { pageMetadata } from '@/lib/seo';
import { BRAND } from '@/lib/iriz';
import { COMPANY, SUPPORT, WARRANTY } from '@/lib/warranty';

/**
 * The warranty policy — sections 1 and 2 of the supplied BluNeuron Warranty,
 * Return, Refund and Cancellation document, published as their own page.
 *
 * It does NOT go through components/LegalPage, for the same reason
 * /legal/privacy does not: that shell hard-codes the amber "DRAFT —
 * placeholder legal text, not reviewed by counsel" banner and the "Draft
 * prepared <date>" line, which are still true of /legal/terms,
 * /legal/shipping and /legal/returns and must stay on them. This document is
 * not a draft — it is the warranty printed on the card inside the box, and
 * the page a QR code on the carton leads to. Stamping DRAFT on it would be
 * false; stripping the banner out of the shell would quietly un-draft the
 * other three.
 *
 * So it uses the same chrome, measure and tokens as /legal/privacy:
 * PageShell + PageHeading, H2 sections, prose capped at 680px.
 *
 * Every number and every list item comes from WARRANTY in lib/warranty.js
 * rather than being typed here, so the cover period quoted on this page, on
 * /support/warranty-registration and on /support/warranty-claim is one value
 * in one place.
 *
 * TWO ADAPTATIONS from the source document, both forced by how the unit is
 * sold and both carried over from the `launch-site` branch:
 *
 *   1. "Purchased from Bluneuron" becomes "from BluNeuron or an authorised
 *      seller" — which today means the official Amazon and Flipkart
 *      listings, because that is the only way to buy one.
 *   2. Proof of purchase is the MARKETPLACE invoice. The source says "valid
 *      Tax Invoice/Bill"; on a marketplace order that document is issued by
 *      the marketplace, and saying so saves a buyer hunting for one of ours.
 *
 * The source's "+91-XXXXXXXXXX" helpline is omitted rather than printed —
 * see SUPPORT in lib/warranty.js.
 */

const LAST_UPDATED = '16 October 2026';

export const metadata = pageMetadata({
  title: 'Warranty Policy — BluNeuron IRIZ',
  description:
    'The BluNeuron IRIZ manufacturer warranty: 1 year of cover from the invoice date, what is covered, what is excluded, the service process, and how to make a claim.',
  path: '/legal/warranty',
});

/** Section heading. One level below the PageHeading h1. */
function H2({ children }) {
  return (
    <h2 className="mb-3 mt-10 text-xl font-semibold tracking-tight text-white first:mt-0">
      {children}
    </h2>
  );
}

function Mail({ address = SUPPORT.email }) {
  return (
    <a
      href={`mailto:${address}`}
      className="text-white underline underline-offset-2 transition-colors hover:text-white/70"
    >
      {address}
    </a>
  );
}

function Link({ href, children }) {
  return (
    <a
      href={href}
      className="text-white underline underline-offset-2 transition-colors hover:text-white/70"
    >
      {children}
    </a>
  );
}

/** A bulleted list in the same style the privacy policy uses. */
function List({ items }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-white/30">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function WarrantyPolicyPage() {
  return (
    <PageShell>
      <PageHeading
        eyebrow="Legal"
        title="Warranty Policy"
        subtitle={`Last updated: ${LAST_UPDATED}`}
      />

      <section className="bg-black py-16 sm:py-20">
        <div className="section-container">
          {/* `max-w-[680px]` on the prose itself, not on the container, so the
              page keeps the same left gutter as every other section. */}
          <Reveal className="max-w-[680px] text-base leading-relaxed text-white/70">
            <p>
              {WARRANTY.label} of manufacturer&rsquo;s cover on every genuine {BRAND.fullName},
              carried in to an authorised service centre.
            </p>

            <H2>What this warranty is</H2>
            <p>
              This is the manufacturer&rsquo;s warranty for the {BRAND.fullName}, given by{' '}
              {COMPANY.legalName} to the original purchaser. {BRAND.name} warrants that the
              hardware will be free from defects in materials and workmanship under normal usage
              conditions for the cover period below. It is a return-to-factory / authorised service
              centre warranty.
            </p>
            <p className="mt-4">
              This warranty is in addition to, and does not take away from, your rights under the
              Consumer Protection Act, 2019.
            </p>

            <H2>Cover period</H2>
            <p>
              <strong className="font-semibold text-white">
                {WARRANTY.label} from the date of purchase shown on your invoice.
              </strong>{' '}
              The invoice date is what counts — not the delivery date, and not the date you
              registered the product. The tenure is also printed on the warranty card inside the
              box.
            </p>

            <H2>What is covered</H2>
            <List items={WARRANTY.coverage} />
            <p className="mt-4">
              Where a manufacturing defect is verified by authorised company personnel, BluNeuron
              will repair or replace the defective unit or part. Which of the two is at
              BluNeuron&rsquo;s discretion.
            </p>

            <H2>What is not covered</H2>
            <List items={WARRANTY.exclusions} />
            <p className="mt-4">
              The warranty is void, or does not apply, in these circumstances. A unit in any of
              them can still be serviced — on a paid basis.
            </p>

            <H2>Which units this applies to</H2>
            <p>
              Genuine {BRAND.name} products bought within India, from {BRAND.name} or from an
              authorised seller — today, our official Amazon and Flipkart listings. A unit bought
              from any other seller cannot be verified as genuine or as new, so this warranty does
              not apply to it. The cover is non-transferable and applies only to the original
              purchaser.
            </p>

            <H2>Proof of purchase</H2>
            <p>
              Your Amazon or Flipkart tax invoice is the proof of purchase.{' '}
              <strong className="font-semibold text-white">Keep it</strong> — a warranty
              registration on its own does not establish the purchase date, and we cannot
              reconstruct it from marketplace records we are not given.
            </p>

            <H2>How to raise a service request</H2>
            <ul className="list-disc space-y-2 pl-5 marker:text-white/30">
              <li>
                Submit the claim form at{' '}
                <Link href="/support/warranty-claim">/support/warranty-claim</Link> with your order
                ID, serial number and a description of the fault.
              </li>
              <li>
                Or email <Mail /> with the same details. We reply to the email address on the
                claim.
              </li>
              <li>
                Support hours are {SUPPORT.hours}. A request sent outside them is picked up the
                next working day.
              </li>
            </ul>
            <p className="mt-4">
              Out-of-warranty repairs are raised the same way, and are quoted before any work is
              done.
            </p>

            <H2>Shipping a unit in for service</H2>
            <List
              items={[
                WARRANTY.inboundShipping,
                WARRANTY.returnShipping,
                'If a product is damaged in transit on its way TO us, that damage is treated as out-of-warranty physical damage, and repairing it is offered on a paid basis. Pack the unit well, and keep proof of despatch.',
                'Any defective part or component replaced during service is retained by BluNeuron.',
              ]}
            />

            <H2>If a unit cannot be repaired</H2>
            <List
              items={[
                'Where a product cannot be repaired and a direct replacement is unavailable — because of a technical change or stock — BluNeuron may offer an equivalent model. Equivalence is determined by BluNeuron.',
                'Alternatively, BluNeuron may issue a credit note for the invoice value of the product. All original accessories must be returned with the unit; where they are not, a reasonable deduction is made.',
              ]}
            />

            <H2>Where this warranty applies</H2>
            <p>
              India only. Service is carry-in: the unit goes to an authorised service centre or to
              our central warehouse at {COMPANY.registeredAddress}. There is no on-site service.
            </p>

            <H2>Registering your product</H2>
            <p>
              Registration is{' '}
              <strong className="font-semibold text-white">optional</strong>, and your cover runs
              from the invoice date whether or not you register. Registering simply records the
              purchase details so a later claim does not start with paperwork. You can register at{' '}
              <Link href="/support/warranty-registration">/support/warranty-registration</Link>.
            </p>

            <H2>Limitation of liability and jurisdiction</H2>
            <p>
              {BRAND.name}&rsquo;s total liability for any claim under this warranty shall not
              exceed the original purchase price paid for the product, and {BRAND.name} is not
              liable for indirect, incidental or consequential damages, including loss of business,
              profits or goodwill. Any dispute relating to this warranty is subject to the
              exclusive jurisdiction of the competent courts at {COMPANY.jurisdiction}.
            </p>
            <p className="mt-4">
              Nothing here limits any liability that cannot be limited under Indian law, including
              your rights under the Consumer Protection Act, 2019.
            </p>

            <H2>Questions</H2>
            <p>
              Email <Mail />, or see <Link href="/support">Support</Link>.
            </p>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}

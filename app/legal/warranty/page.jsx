import LegalPage from '@/components/LegalPage';
import { BRAND } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { COMPANY, POLICY_LAST_UPDATED, SUPPORT, WARRANTY } from '@/lib/site-config';

/**
 * The warranty policy — sections 1 and 2 of the supplied Warranty, Return,
 * Refund and Cancellation document, published as their own page.
 *
 * The source document covers warranty, DOA replacement, cancellation and
 * refunds in one file. It is published here as TWO pages, because the two
 * halves answer different questions at different moments: "my unit has
 * failed, what now" is this page, and "it arrived broken / I want to send it
 * back" is /legal/returns. A single page would bury each half in the other,
 * and the warranty half is the one someone reads two years after buying.
 *
 * Every number and every list item comes from WARRANTY in lib/site-config.js
 * rather than being typed here, so the cover period quoted on this page, on
 * /support/warranty-registration and on /support/warranty-claim is one value
 * in one place.
 *
 * THREE ADAPTATIONS from the source, all forced by how the product is sold:
 *
 *   1. "Purchased from Bluneuron" becomes "from BluNeuron or an authorised
 *      seller listed on /where-to-buy" — which today means the official
 *      Amazon and Flipkart listings, because that is the only way to buy one.
 *   2. Proof of purchase is the MARKETPLACE invoice. The source says "valid
 *      Tax Invoice/Bill"; on a marketplace order that document is issued by
 *      the marketplace, and saying so saves a buyer hunting for one of ours.
 *   3. The helpline is omitted entirely rather than printed as the source's
 *      "+91-XXXXXXXXXX". See SUPPORT.phone in lib/site-config.js.
 *
 * Jurisdiction is Coimbatore — the source document's own bracketed
 * "[Coimbatore], India", resolved, and the same clause as every other policy
 * page (COMPANY.jurisdiction).
 */
const SECTIONS = [
  {
    heading: 'What this warranty is',
    body: `This is the manufacturer's warranty for the ${BRAND.fullName}, given by ${COMPANY.legalName} to the original purchaser. ${BRAND.name} warrants that the hardware will be free from defects in materials and workmanship under normal usage conditions for the cover period below. It is a return-to-factory / authorised service centre warranty.`,
    note: 'This warranty is in addition to, and does not take away from, your rights under the Consumer Protection Act, 2019.',
  },
  {
    heading: 'Cover period',
    body: `${WARRANTY.label} from the date of purchase shown on your invoice. The invoice date is what counts — not the delivery date, and not the date you registered the product. The tenure is also printed on the warranty card inside the box.`,
    // A PULL-QUOTE, not a second source of truth. Both halves are read from
    // the same WARRANTY object the paragraph above interpolates, so the box
    // cannot drift from the policy and no wording was added to produce it.
    highlight: {
      label: `${WARRANTY.label} from the invoice date`,
      value: 'Not the delivery date, and not the date you registered the product.',
    },
  },
  {
    heading: 'What is covered',
    body: WARRANTY.coverage,
    note: 'Where a manufacturing defect is verified by authorised company personnel, BluNeuron will repair or replace the defective unit or part. Which of the two is at BluNeuron’s discretion.',
  },
  {
    heading: 'What is not covered',
    body: WARRANTY.exclusions,
    note: 'The warranty is void, or does not apply, in these circumstances. A unit in any of them can still be serviced — on a paid basis.',
  },
  {
    heading: 'Which units this applies to',
    body: `Genuine ${BRAND.name} products bought within India, from ${BRAND.name} or from an authorised seller listed at ${ROUTES.whereToBuy} — today, our official Amazon and Flipkart listings. A unit bought from any other seller cannot be verified as genuine or as new, so this warranty does not apply to it. The cover is non-transferable and applies only to the original purchaser.`,
  },
  {
    heading: 'Proof of purchase',
    body: 'Your Amazon or Flipkart tax invoice is the proof of purchase. Keep it — a warranty registration on its own does not establish the purchase date, and we cannot reconstruct it from marketplace records we are not given.',
  },
  {
    heading: 'How to raise a service request',
    body: [
      `Submit the claim form at ${ROUTES.warrantyClaim} with your order ID, serial number, purchase date and a description of the fault.`,
      `Or email ${SUPPORT.email} with the same details. We reply to the email address on the claim.`,
      `Support hours are ${SUPPORT.hours}. A request sent outside them is picked up the next working day.`,
    ],
    note: 'Out-of-warranty repairs are raised the same way, and are quoted before any work is done.',
  },
  {
    heading: 'Shipping a unit in for service',
    body: [
      WARRANTY.inboundShipping,
      WARRANTY.returnShipping,
      'If a product is damaged in transit on its way TO us, that damage is treated as out-of-warranty physical damage, and repairing it is offered on a paid basis. Pack the unit well, and keep proof of despatch.',
      'Any defective part or component replaced during service is retained by BluNeuron.',
    ],
  },
  {
    heading: 'If a unit cannot be repaired',
    body: [
      'Where a product cannot be repaired and a direct replacement is unavailable — because of a technical change or stock — BluNeuron may offer an equivalent model. Equivalence is determined by BluNeuron.',
      'Alternatively, BluNeuron may issue a credit note for the invoice value of the product. All original accessories must be returned with the unit; where they are not, a reasonable deduction is made.',
    ],
  },
  {
    heading: 'Where this warranty applies',
    body: `India only. Service is carry-in: the unit goes to an authorised service centre or to our central warehouse at ${COMPANY.registeredAddress}. There is no on-site service.`,
  },
  {
    heading: 'Limitation of liability and jurisdiction',
    body: `${BRAND.name}'s total liability for any claim under this warranty shall not exceed the original purchase price paid for the product, and ${BRAND.name} is not liable for indirect, incidental or consequential damages, including loss of business, profits or goodwill. Any dispute relating to this warranty is subject to the exclusive jurisdiction of the competent courts at ${COMPANY.jurisdiction}.`,
    note: 'Nothing here limits any liability that cannot be limited under Indian law, including your rights under the Consumer Protection Act, 2019.',
  },
  {
    heading: 'Questions',
    body: `Email ${SUPPORT.email}, or use the form at ${ROUTES.contact}.`,
  },
];

export const metadata = {
  ...pageMetadata({
    title: 'Warranty Policy — BluNeuron IRIZ',
    description:
      'The BluNeuron IRIZ manufacturer warranty: 1 year cover, what is covered, exclusions, the service process, and how to make a claim.',
    path: ROUTES.warranty,
  }),
  robots: routeRobots(ROUTES.warranty),
};

export default function WarrantyPolicyPage() {
  return (
    <LegalPage
      title="Warranty Policy"
      path={ROUTES.warranty}
      intro={`${WARRANTY.label} of manufacturer's cover on every genuine ${BRAND.fullName}, carried in to an authorised service centre.`}
      sections={SECTIONS}
      lastUpdated={POLICY_LAST_UPDATED}
    />
  );
}

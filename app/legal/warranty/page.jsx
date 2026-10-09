import LegalPage from '@/components/LegalPage';
import { BRAND } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { SUPPORT, TBD, WARRANTY } from '@/lib/site-config';

/**
 * The warranty policy.
 *
 * Every number and every list item comes from WARRANTY in lib/site-config.js,
 * so the cover period quoted here, on /support/warranty-registration and on
 * /support/warranty-claim is one value in one place. The headings are the
 * structure a reviewed policy needs; the [TBD]s are where the reviewed text
 * goes. Nothing here invents a term we have not agreed to.
 */
const SECTIONS = [
  {
    heading: 'What this covers',
    body: `This is the manufacturer's warranty for the ${BRAND.fullName}, given by ${BRAND.name} to the original purchaser. It applies to units bought from our official Amazon or Flipkart listings.`,
    note: 'This warranty is in addition to, and does not take away from, your rights under the Consumer Protection Act 2019.',
  },
  {
    heading: 'Cover period',
    body: `${WARRANTY.months} months from the date of purchase shown on your marketplace invoice. The invoice date is what counts — not the delivery date, and not the date you registered the product.`,
  },
  {
    heading: 'What is covered',
    body: WARRANTY.coverage,
    note: 'Each line of the final policy must name a specific failure mode. "Manufacturing defects" alone is not a term anyone can hold either side to.',
  },
  {
    heading: 'What is not covered',
    body: WARRANTY.exclusions,
    note: 'Exclusions to be confirmed before this page is published — the list must be exhaustive, because anything not excluded is covered.',
  },
  {
    heading: 'How to make a claim',
    body: [
      `Claims are handled ${WARRANTY.claimRoute}.`,
      `Submit the claim form at ${ROUTES.warrantyClaim} with your order ID, serial number, purchase date and a description of the fault.`,
      `We will reply to the email address on the claim. Response and resolution timelines: ${TBD}.`,
      `Who pays for shipping a unit in for service, in each direction: ${TBD}.`,
    ],
  },
  {
    heading: 'Proof of purchase',
    body: 'Your Amazon or Flipkart invoice is the proof of purchase. Keep it — a warranty registration on its own does not establish the purchase date, and we cannot reconstruct it from our records.',
  },
  {
    heading: 'Where this warranty applies',
    body: `India only. Service locations and whether on-site or carry-in service applies: ${TBD}.`,
  },
  {
    heading: 'Units bought elsewhere',
    body: 'A unit bought from a seller other than our official Amazon or Flipkart listings cannot be verified as genuine or as new, so this warranty does not apply to it.',
  },
  {
    heading: 'Questions',
    body: `Email ${SUPPORT.email}, or use the form at ${ROUTES.contact}.`,
  },
];

export const metadata = {
  title: 'Warranty Policy — BluNeuron IRIZ',
  description:
    'The BluNeuron IRIZ manufacturer warranty: cover period, what is covered, exclusions, and how to make a claim.',
  robots: routeRobots(ROUTES.warranty),
};

export default function WarrantyPolicyPage() {
  return (
    <LegalPage
      title="Warranty Policy"
      path={ROUTES.warranty}
      intro={`The manufacturer's warranty for the ${BRAND.fullName}.`}
      sections={SECTIONS}
    />
  );
}

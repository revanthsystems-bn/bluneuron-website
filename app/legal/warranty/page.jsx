import LegalPage from '@/components/LegalPage';
import { BRAND } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import {
  COMPANY,
  DELIVERY_WINDOWS,
  SUPPORT,
  WARRANTY,
  WARRANTY_CLAIM_STEPS,
  authorisedSellersPhrase,
  sellersOr,
} from '@/lib/site-config';

/**
 * THE WARRANTY POLICY — the published terms, not a draft of them.
 *
 * This replaces an adaptation of a supplied warranty document that was
 * written for a different service model: it promised an authorised
 * service-centre network, carry-in service, credit notes and a published
 * central-warehouse address, several of which do not exist. The terms below
 * are this product's own, in our own words.
 *
 * EVERY STRING COMES FROM `WARRANTY` in lib/site-config.js rather than being
 * typed here, so the cover period quoted on this page, on /shop/iriz, on
 * /shop, on /about, on both warranty forms and in the "covered until" date on
 * the registration success screen is one value in one place. Say "1 year"
 * (WARRANTY.label), never "12 months".
 *
 * THE COMPANION PAGE is /legal/returns, and the split is not cosmetic: "my
 * unit has failed, what now" is this page, and "it arrived broken / I want to
 * send it back" is that one. One page would bury each half in the other, and
 * this is the half someone reads two years after buying.
 *
 * THE TWO DELIVERY CLOCKS BELONG TO BOTH PAGES, so neither page writes them:
 * both interpolate DELIVERY_WINDOWS from lib/site-config.js and therefore
 * state them in identical words. They used to be separate prose and they
 * disagreed — 48 hours here against 7 days there, for the same dead unit.
 *
 * WHAT IS DELIBERATELY NOT HERE:
 *   - No helpline, and the reason has changed. It used to be that there was
 *     no number to print: both SUPPORT_PHONES rows were placeholders, and a
 *     warranty page is the last place to print a number that does not ring.
 *     There is a real customer care line now, published on /support,
 *     /support/contact and the grievance disclosure. It is still not here,
 *     because a warranty claim has to be RAISED — it needs a serial number,
 *     an invoice and a written record — so this page routes to the claim
 *     form, and sending a claimant to a phone call that will only ask them
 *     to fill the form in is a slower path, not a warmer one.
 *   - No service-centre address. It is given when a ticket is raised, because
 *     a published one invites units to arrive with no ticket and nothing to
 *     match them to. See WARRANTY.inboundShipping.
 *
 * Jurisdiction is Coimbatore, where the entity is registered, and is the same
 * clause as every other policy page (COMPANY.jurisdiction).
 */
const SECTIONS = [
  {
    heading: 'What this warranty is',
    body: `This is the manufacturer's warranty for the ${BRAND.fullName}, given by ${COMPANY.legalName} to the first purchaser. We warrant that the projector is free of manufacturing defects and that it will work as it is meant to, under normal use in a home, for the cover period below.`,
    note: 'This warranty is in addition to your rights under the Consumer Protection Act, 2019. It does not take any of them away.',
  },
  {
    heading: 'Cover period',
    body: [
      `${WARRANTY.label} from the date of purchase shown on your invoice. The invoice date is what counts — not the delivery date, and not the date you registered the product.`,
      WARRANTY.afterService,
    ],
    // A PULL-QUOTE, not a second source of truth: both halves read the same
    // WARRANTY object the bullets above interpolate, so the box cannot drift
    // from the policy and no new wording was written to produce it.
    highlight: {
      label: `${WARRANTY.label} from the invoice date`,
      value: 'Not the delivery date, and not the date you registered the product.',
    },
  },
  {
    heading: 'Who and what is covered',
    body: WARRANTY.eligibility,
    note: `An authorised seller means BluNeuron, or a marketplace listing we run ourselves — ${authorisedSellersPhrase()}. A unit bought anywhere else cannot be verified as genuine or as new, so this warranty does not apply to it. See ${ROUTES.whereToBuy}.`,
  },
  {
    heading: 'What is covered',
    body: WARRANTY.coverage,
    note: 'We repair first. Whether a verified defect is repaired or the unit replaced is our decision — and a replacement is the same model where one is available, an equivalent one where it is not.',
  },
  {
    heading: 'What is not covered',
    body: WARRANTY.exclusions,
    note: 'A unit in any of these states can still be serviced — on a paid basis, quoted before any work is done.',
  },
  {
    heading: 'Accessories',
    body: WARRANTY.accessories,
    note: 'A faulty remote, cable or adapter inside the cover period is still worth telling us about. Write to us and we will say what we can do, even where the standard warranty does not reach it.',
  },
  {
    // THE SAME THREE STRINGS /legal/returns renders. See DELIVERY_WINDOWS in
    // lib/site-config.js, and do not reword either of them here.
    heading: 'On delivery, and in the first week',
    body: [
      DELIVERY_WINDOWS.damaged,
      DELIVERY_WINDOWS.earlyFailure,
      DELIVERY_WINDOWS.marketplaceNote,
    ],
    note: `Photograph the outer packaging before you open it, and the unit before you set it up. Whether a projector arrived damaged stops being answerable almost immediately, which is why that window is short and why the photographs matter. The full replacement terms are at ${ROUTES.returns}.`,
  },
  {
    heading: 'How to make a claim',
    body: WARRANTY_CLAIM_STEPS,
    note: `The serial number is on the carton and on the sticker on the product itself. Support hours are ${SUPPORT.hours} — a claim raised outside them is picked up the next working day. The claim form is at ${ROUTES.warrantyClaim}, and registration is at ${ROUTES.warrantyRegistration}.`,
  },
  {
    heading: 'Sending a unit in for service',
    body: [
      WARRANTY.inboundShipping,
      WARRANTY.returnShipping,
      'Damage caused in transit on the way TO us is physical damage and is not covered. Pack the unit well, use the original carton if you still have it, and keep proof of despatch.',
      'Any part replaced during service is retained by BluNeuron.',
    ],
  },
  {
    heading: 'Where this warranty applies',
    body: 'India only, on units bought in India. Service is return-to-base: the unit is sent in and sent back. There is no on-site service.',
  },
  {
    heading: 'Limits, and where a dispute is heard',
    body: [
      WARRANTY.liability,
      'We are not liable for anything beyond that — including loss of use, loss of business, loss of profit, or any other consequential loss.',
      `Any dispute relating to this warranty is subject to the exclusive jurisdiction of the competent courts at ${COMPANY.jurisdiction}.`,
    ],
    note: 'Nothing here limits any liability that cannot be limited under Indian law, including your rights under the Consumer Protection Act, 2019.',
  },
  {
    heading: 'Questions',
    body: `Email ${SUPPORT.email}, or use the form at ${ROUTES.contact}. A ${sellersOr()} order also carries the marketplace's own return and replacement policy, which runs alongside this warranty rather than instead of it.`,
  },
];

export const metadata = {
  ...pageMetadata({
    title: 'Warranty Policy — BluNeuron IRIZ',
    description: `The BluNeuron IRIZ manufacturer warranty: ${WARRANTY.label} from the invoice date, what is covered, what is not, and how to make a claim.`,
    path: ROUTES.warranty,
  }),
  robots: routeRobots(ROUTES.warranty),
};

export default function WarrantyPolicyPage() {
  return (
    <LegalPage
      title="Warranty Policy"
      path={ROUTES.warranty}
      intro={`${WARRANTY.label} of manufacturer's cover on every genuine ${BRAND.fullName}, from the date on your invoice.`}
      sections={SECTIONS}
      /*
       * `effectiveFrom`, NOT `lastUpdated` — see the note on LegalPage. These
       * are new terms rather than a revision of the old ones, and what a
       * holder needs to know is which terms their unit was sold under.
       * POLICY_LAST_UPDATED (14 October 2026) belongs to the other four
       * policies, which were written together on that day; this page is no
       * longer one of them, and printing their date here would date these
       * terms to before they existed.
       */
      effectiveFrom={WARRANTY.effectiveFrom}
    />
  );
}

import LegalPage from '@/components/LegalPage';
import { BRAND } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import {
  COMPANY,
  SUPPORT,
  WARRANTY,
  WARRANTY_CLAIM_STEPS,
  authorisedSellersPhrase,
  primarySupportPhone,
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
 * THERE ARE NO DELIVERY CLOCKS LEFT. This page and /legal/returns used to
 * share two — 48 hours to report damage on arrival, 7 days for an early
 * failure — written once in DELIVERY_WINDOWS so the two pages could not
 * disagree. The sale invoice grants neither: an online order's returns are
 * governed strictly by the marketplace's own policy, and a store sale is not
 * taken back at all. Both windows are deleted rather than reworded, and
 * WARRANTY.onArrival routes by CHANNEL instead.
 *
 * WHAT IS DELIBERATELY NOT HERE:
 *   - No service-centre address. It is given when a ticket is raised, because
 *     a published one invites units to arrive with no ticket and nothing to
 *     match them to. See WARRANTY.inboundShipping.
 *
 * THE PHONE NUMBER IS HERE NOW, beside the email in "How to make a claim"
 * and in "Questions". It was deliberately left off while this page routed
 * every claimant to a form — a call that only asks you to fill the form in
 * is a slower path, not a warmer one. The sale invoice publishes the number
 * as the support contact, so the page that the invoice points at has to
 * carry it too. The form is still named first; the number is the second
 * option on the same line, not a replacement for it.
 *
 * Jurisdiction is Coimbatore, where the entity is registered, and is the same
 * clause as every other policy page (COMPANY.jurisdiction).
 */
/**
 * The customer care line, or null. Read through primarySupportPhone() so this
 * page cannot publish a number the rest of the site is withholding — if the
 * number is ever withdrawn, both sentences below lose it with no edit here.
 */
const PHONE = primarySupportPhone();
const PHONE_SUFFIX = PHONE ? ` or call ${PHONE.number}` : '';

const SECTIONS = [
  {
    heading: 'What this warranty is',
    body: `This is the manufacturer's warranty for the ${BRAND.fullName}, given by ${COMPANY.legalName} to the first purchaser. We warrant that the projector is free of manufacturing defects and that it will work as it is meant to, under normal use in a home, for the cover period below.`,
    note: 'This warranty is in addition to your rights under the Consumer Protection Act, 2019. It does not take any of them away.',
  },
  {
    heading: 'Cover period',
    body: [
      `${WARRANTY.labelFull} from the date of purchase shown on your invoice. The invoice date is what counts — not the delivery date, and not the date you registered the product.`,
      WARRANTY.afterService,
    ],
    // A PULL-QUOTE, not a second source of truth: both halves read the same
    // WARRANTY object the bullets above interpolate, so the box cannot drift
    // from the policy and no new wording was written to produce it.
    highlight: {
      label: `${WARRANTY.labelFull} from the invoice date`,
      value: 'Not the delivery date, and not the date you registered the product.',
    },
  },
  {
    heading: 'Who and what is covered',
    body: WARRANTY.eligibility,
    /*
     * STATED POSITIVELY — this warranty APPLIES TO purchases from an
     * authorised seller with a valid invoice.
     *
     * It used to end "a unit bought anywhere else cannot be verified as
     * genuine or as new, so this warranty does not apply to it", which is a
     * broader exclusion than the sale invoice makes and reads as an
     * accusation aimed at the customer rather than a statement of scope. The
     * invoice defines who is covered; it does not undertake to tell a
     * grey-market buyer what they have bought. Saying which purchases are
     * covered leaves the same units outside the cover without the site
     * passing judgement on them.
     */
    note: `An authorised seller means BluNeuron, a marketplace listing we run ourselves, or an authorised BluNeuron dealer — ${authorisedSellersPhrase()}. This warranty applies to units bought from those sellers, with a valid invoice. See ${ROUTES.whereToBuy}.`,
  },
  {
    heading: 'Who provides this warranty',
    body: WARRANTY.soleProvider,
    note: `If you bought from a dealer or a shop, their part of the transaction ended at the sale — they cannot process a claim, authorise a repair or issue a refund on our behalf. Bring the claim to us with your invoice and we will handle it from there. Start at ${ROUTES.warrantyClaim}.`,
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
    /*
     * THIS SECTION NO LONGER STATES A WINDOW OF OURS, because there is not
     * one to state: the two clocks that used to live here (48 hours for
     * damage on arrival, 7 days for an early failure) are gone. What a
     * customer needs instead is to be sent to the right counter, and that
     * depends on where they bought — so WARRANTY.onArrival routes by channel.
     */
    heading: 'If a unit arrives damaged or faulty',
    body: WARRANTY.onArrival,
    note: `A marketplace return and this warranty are different things with different processes — the full split is at ${ROUTES.returns}. If a marketplace return window has already closed and the unit has a manufacturing defect, this warranty still runs for ${WARRANTY.label} from the invoice date.`,
  },
  {
    heading: 'How to make a claim',
    body: WARRANTY_CLAIM_STEPS,
    note: `The serial number is on the carton and on the sticker on the product itself. Write to ${SUPPORT.email}${PHONE_SUFFIX} — support hours are ${SUPPORT.hours}, and a claim raised outside them is picked up the next working day. The claim form is at ${ROUTES.warrantyClaim}, and registration is at ${ROUTES.warrantyRegistration}.`,
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
    body: `Email ${SUPPORT.email}${PHONE_SUFFIX}, or use the form at ${ROUTES.contact}. Support hours are ${SUPPORT.hours}. A ${sellersOr()} order also carries the marketplace's own return and replacement policy, which runs alongside this warranty rather than instead of it.`,
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

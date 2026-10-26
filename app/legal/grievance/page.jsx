import LegalPage from '@/components/LegalPage';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import {
  COMPANY,
  GRIEVANCE_OFFICER,
  SUPPORT,
  allKnown,
  sellersOr,
} from '@/lib/site-config';

/**
 * Grievance redressal.
 *
 * Required of an e-commerce entity by India's Consumer Protection
 * (E-Commerce) Rules, 2020: a grievance contact point, a reachable address,
 * and published timelines for acknowledging and resolving a complaint. The
 * same details appear on /support/contact — this page is the policy, that
 * page is the route to it, and both read GRIEVANCE_OFFICER from
 * lib/site-config.js so there is one disclosure in one place.
 *
 * ================================================================
 * A NAMED PERSON IS RECOMMENDED, AND IS NOT YET APPOINTED.
 * ================================================================
 * Rule 4(5) of the Consumer Protection (E-Commerce) Rules, 2020 contemplates
 * an e-commerce entity APPOINTING a Grievance Officer and displaying that
 * officer's NAME along with their contact details. We publish the
 * designation, the entity, the registered address, the email and the
 * timelines; we do not yet publish a name.
 *
 * So `GRIEVANCE_OFFICER.name` is EMPTY, and this page renders NO name line
 * at all — not "Name: [TBD]", and not a placeholder person. A disclosure that
 * names nobody is weaker than the Rules intend; a disclosure that names a
 * fiction is worse, and one held back entirely until a name exists is worst
 * of all, which is what used to happen here: the whole page sat `noindex`,
 * out of the sitemap and dropped from the footer over that one blank field,
 * so an unhappy customer had no published escalation route whatsoever.
 *
 * TODO(compliance): appoint a named officer and set GRIEVANCE_OFFICER.name in
 * lib/site-config.js. The line appears here and on /support/contact with no
 * other edit.
 *
 * THE ESCALATION LADDER is deliberately explicit, including the step that
 * sends people to the marketplace. A buyer whose complaint is about delivery
 * or a refund needs the marketplace's grievance process, not ours, and
 * routing them here first would only add a week to it.
 */

/** The address block is omitted rather than invented if it is ever unset. */
const HAS_ADDRESS = allKnown(COMPANY.legalName, COMPANY.registeredAddress);

/**
 * The officer block, built row by row, because two of its rows are
 * conditional and a missing row must leave no trace.
 *
 * `name` first when there is one — it is the thing a reader is looking for —
 * and simply absent when there is not. No label with nothing after it.
 */
const OFFICER_ROWS = [
  ...(allKnown(GRIEVANCE_OFFICER.name) ? [`Name: ${GRIEVANCE_OFFICER.name}`] : []),
  `Designation: ${GRIEVANCE_OFFICER.designation}`,
  `Email: ${GRIEVANCE_OFFICER.email}`,
  ...(HAS_ADDRESS
    ? [`Entity: ${COMPANY.legalName}`, `Address: ${COMPANY.registeredAddress}`]
    : []),
  // NO phone line. Both numbers in SUPPORT_PHONES are still placeholders and
  // render on preview builds only — a published number that does not ring is
  // the one thing a grievance disclosure must not contain, because the person
  // reading it has already been let down once.
  `Hours: ${GRIEVANCE_OFFICER.hours}`,
];

const SECTIONS = [
  {
    heading: 'Who to complain to first',
    body: [
      `A problem with delivery, payment, invoicing, a return or a refund is the marketplace's to resolve — raise it with ${sellersOr()}, who hold the order and the payment.`,
      `A problem with the product, the warranty, our support or anything published on this site is ours — raise it at ${ROUTES.contact} first, so it reaches the team who can fix it fastest.`,
      'If either route does not resolve it, escalate to our grievance officer below.',
    ],
  },
  {
    heading: 'Grievance officer',
    body: OFFICER_ROWS,
    note: GRIEVANCE_OFFICER.responsePromise,
  },
  {
    heading: 'What to include',
    body: [
      'Your name, email and phone number.',
      `Your ${sellersOr()} invoice number, and the serial number if the complaint is about a unit.`,
      'What happened, what you have already tried, and what you are asking for.',
      'Any reference number from an earlier support message, so the history is not lost.',
    ],
  },
  {
    heading: 'Acknowledgement and resolution timelines',
    body: [
      'Acknowledgement of a grievance: within 48 hours of receiving it.',
      'Resolution, or a written explanation of the delay: within 30 days.',
    ],
    // The statutory maximums, stated so a reader can see that the commitment
    // above sits at or inside them rather than having to look them up.
    note: 'These are at or inside the statutory maximums under the Consumer Protection (E-Commerce) Rules, 2020 — 48 hours to acknowledge and one month to resolve. Where a complaint needs a unit inspected, the 30 days runs from the day the unit reaches our service centre, and we will say so in the acknowledgement.',
  },
  {
    heading: 'If you are still not satisfied',
    body: 'You may take a consumer complaint to the National Consumer Helpline (consumerhelpline.gov.in, 1915) or to the appropriate District, State or National Consumer Disputes Redressal Commission. Nothing in this policy limits that right.',
  },
  {
    heading: 'Records',
    body: `Grievance correspondence is support correspondence, and is kept for as long as it takes to resolve the matter and handle any follow-up — the same basis as every other message you send us, set out under "How long we keep it" in our privacy policy at ${ROUTES.privacy}. Where the complaint concerns a registered unit, the registration and claim record it is attached to is kept for the length of the warranty and a reasonable period after it, because a later claim is assessed against it.`,
    note: `You can ask us to show you, correct or delete what we hold about you by emailing ${SUPPORT.email}.`,
  },
];

export const metadata = {
  ...pageMetadata({
    title: 'Grievance Redressal — BluNeuron',
    description:
      'How to escalate a complaint to BluNeuron: our grievance officer, what to include, and the timelines for acknowledgement and resolution.',
    path: ROUTES.grievance,
  }),
  robots: routeRobots(ROUTES.grievance),
};

export default function GrievancePage() {
  return (
    <LegalPage
      title="Grievance Redressal"
      path={ROUTES.grievance}
      intro="If something has gone wrong and the usual channels have not fixed it, this is how to escalate it."
      sections={SECTIONS}
    />
  );
}

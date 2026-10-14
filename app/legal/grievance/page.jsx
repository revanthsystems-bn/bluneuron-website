import LegalPage from '@/components/LegalPage';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { COMPANY, GRIEVANCE_OFFICER, SUPPORT, TBD } from '@/lib/site-config';

/**
 * Grievance redressal.
 *
 * Required of an e-commerce entity by India's Consumer Protection
 * (E-Commerce) Rules 2020: a named officer, a reachable address, and a stated
 * timeline for acknowledging and resolving a complaint. The officer's details
 * also appear on /support/contact — this page is the policy, that page is the
 * route to it, and both read GRIEVANCE_OFFICER from lib/site-config.js so
 * there is one name in one place.
 *
 * The escalation LADDER is deliberately explicit, including the step that
 * sends people to the marketplace. A buyer whose complaint is about delivery
 * or a refund needs Amazon's or Flipkart's grievance process, not ours, and
 * routing them here first would only add a week to it.
 */
const SECTIONS = [
  {
    heading: 'Who to complain to first',
    body: [
      'A problem with delivery, payment, invoicing, a return or a refund is the marketplace\'s to resolve — raise it with Amazon or Flipkart, who hold the order and the payment.',
      `A problem with the product, the warranty, our support or anything published on this site is ours — raise it at ${ROUTES.contact} first, so it reaches the team who can fix it fastest.`,
      'If either route does not resolve it, escalate to our grievance officer below.',
    ],
  },
  {
    heading: 'Grievance officer',
    body: [
      `Name: ${GRIEVANCE_OFFICER.name}`,
      `Email: ${GRIEVANCE_OFFICER.email}`,
      `Entity: ${COMPANY.legalName}`,
      `Address: ${COMPANY.registeredAddress}`,
      `Phone and calling hours: ${SUPPORT.phone} — ${SUPPORT.hours}`,
    ],
  },
  {
    heading: 'What to include',
    body: [
      'Your name, email and phone number.',
      'Your Amazon or Flipkart order ID, and the serial number if the complaint is about a unit.',
      'What happened, what you have already tried, and what you are asking for.',
      'Any reference number from an earlier support message, so the history is not lost.',
    ],
  },
  {
    heading: 'Acknowledgement and resolution timelines',
    body: [
      `Acknowledgement of a grievance: ${TBD}.`,
      `Resolution, or a written explanation of the delay: ${TBD}.`,
    ],
    note: 'These must be set at or inside the statutory maximums — 48 hours to acknowledge and one month to resolve under the Consumer Protection (E-Commerce) Rules 2020 — before this page is published.',
  },
  {
    heading: 'If you are still not satisfied',
    body: 'You may take a consumer complaint to the National Consumer Helpline (consumerhelpline.gov.in, 1915) or to the appropriate District, State or National Consumer Disputes Redressal Commission. Nothing in this policy limits that right.',
  },
  {
    heading: 'Records',
    body: `How long grievance correspondence is retained, and where: ${TBD}.`,
    note: `Must be consistent with the retention statement in the privacy policy at ${ROUTES.privacy}.`,
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

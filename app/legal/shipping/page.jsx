import LegalPage from '@/components/LegalPage';
import { BRAND } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { COMPANY, POLICY_LAST_UPDATED, SUPPORT, WARRANTY } from '@/lib/site-config';

/**
 * Shipping.
 *
 * The source Terms document has a shipping section — "standard delivery
 * across India typically takes 3 to 7 business days following order
 * dispatch", courier partners, tracking, delivery regions — written for
 * orders placed on bluneuron.com. We do not dispatch those orders and never
 * have: Amazon and Flipkart pick, pack and deliver every IRIZ, on their own
 * estimates. Quoting a 3-7 day window we neither control nor measure would
 * be a delivery promise made on someone else's behalf, so it is gone rather
 * than restated.
 *
 * What is left is the shipping this company actually does, which is the
 * service leg out of the warranty document: a unit coming in for repair, and
 * the repaired unit going back. Those terms are real, they are ours, and
 * they are the ones a reader of this page needs — so they are stated here in
 * full rather than left as a cross-reference, and they read from WARRANTY in
 * lib/site-config.js so they cannot drift from /legal/warranty.
 */
const SECTIONS = [
  {
    heading: 'We do not ship your order',
    body: `The ${BRAND.fullName} is fulfilled by Amazon or Flipkart, depending on where you bought it. They pick, pack, dispatch and deliver, and their delivery estimate, shipping charge and tracking are the ones that apply to your order.`,
    note: 'There is no checkout on this site, so there is no order of ours to dispatch and no shipping charge of ours to quote.',
  },
  {
    heading: 'Delivery estimates and charges',
    body: 'Shown on the product listing and at checkout on Amazon or Flipkart, before you pay. They vary by pincode, by the delivery speed you choose, and by whether you hold a marketplace membership. We do not set them and cannot change them.',
  },
  {
    heading: 'Tracking your order',
    body: 'Track the order in your Amazon or Flipkart orders list. We have no visibility of it — marketplace sellers are not given tracking numbers, delivery dates or courier details for individual orders.',
  },
  {
    heading: 'Where the IRIZ ships',
    body: 'India only. The IRIZ is sold with an Indian power adapter and Indian warranty cover, and is not listed for export.',
  },
  {
    heading: 'Delays, damage in transit and lost shipments',
    body: [
      "Raise all three with the marketplace that delivered the order. They are the courier's customer, not you, and only they can file a claim against the carrier.",
      'If the parcel arrives visibly damaged, photograph the outer packaging before opening it, and the unit immediately after.',
      `Damage found on delivery must reach us within 24 hours as well if you want it treated as a transit-damage claim on our side — see ${ROUTES.returns}.`,
    ],
  },
  {
    heading: 'Sending a unit in for service',
    body: [
      WARRANTY.inboundShipping,
      `The destination is an authorised service centre, or our central warehouse at ${COMPANY.registeredAddress}. Raise the claim at ${ROUTES.warrantyClaim} first — we will confirm where to send it before you ship anything.`,
      'A unit damaged in transit on its way to us is treated as out-of-warranty physical damage and quoted for paid repair, so pack it in its original box where you still have it.',
    ],
  },
  {
    heading: 'Getting your unit back',
    body: WARRANTY.returnShipping,
    note: 'The same applies to a replacement unit and to any spare part or accessory we send you directly as part of a service request.',
  },
  {
    heading: 'Questions',
    body: `Email ${SUPPORT.email} within support hours (${SUPPORT.hours}), or use the form at ${ROUTES.contact}.`,
  },
];

export const metadata = {
  ...pageMetadata({
    title: 'Shipping — BluNeuron',
    description:
      'How shipping works for the BluNeuron IRIZ: Amazon and Flipkart deliver every order, and BluNeuron pays the return leg on a service repair.',
    path: ROUTES.shipping,
  }),
  robots: routeRobots(ROUTES.shipping),
};

export default function ShippingPage() {
  return (
    <LegalPage
      title="Shipping"
      path={ROUTES.shipping}
      intro="Amazon and Flipkart deliver every IRIZ order. The shipping we do handle is the service leg — a unit coming in for repair, and the repaired unit going back."
      sections={SECTIONS}
      lastUpdated={POLICY_LAST_UPDATED}
    />
  );
}

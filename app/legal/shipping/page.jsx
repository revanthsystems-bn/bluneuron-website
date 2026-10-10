import LegalPage from '@/components/LegalPage';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { SHIPPING, SUPPORT, TBD } from '@/lib/site-config';

/**
 * Shipping — rewritten for marketplace selling.
 *
 * The previous version described our own dispatch ("within 24 hours") and a
 * region list taken from a footer <select> that no longer exists (United
 * States, Canada, United Kingdom, European Union, Australia). We do not ship
 * anything: Amazon and Flipkart do, to India only. Both of those claims are
 * gone rather than restated, and SHIPPING.notes in lib/site-config.js is where
 * anything we actually promise will go.
 */
const SECTIONS = [
  {
    heading: 'We do not ship your order',
    body: 'The BluNeuron IRIZ is fulfilled by Amazon or Flipkart, depending on where you bought it. They pick, pack, dispatch and deliver, and their delivery estimate, shipping charge and tracking are the ones that apply to your order.',
    note: 'There is no checkout on this site, so there is no order of ours to dispatch and no shipping charge of ours to quote.',
  },
  {
    heading: 'Delivery estimates and charges',
    body: 'Shown on the product listing and at checkout on Amazon or Flipkart, before you pay. They vary by pincode, by the delivery speed you choose, and by whether you hold a marketplace membership.',
  },
  {
    heading: 'Tracking your order',
    body: 'Track the order in your Amazon or Flipkart orders list. We have no visibility of it — we are not given tracking numbers, delivery dates or courier details for marketplace orders.',
  },
  {
    heading: 'Where the IRIZ ships',
    body: 'India only. The IRIZ is sold with an Indian power adapter and Indian warranty cover, and is not listed for export.',
  },
  {
    heading: 'Delays, damage in transit and lost shipments',
    body: [
      'Raise all three with the marketplace that delivered the order — they are the carrier\'s customer, not you, and only they can file a claim.',
      'Photograph the outer packaging before opening it if it arrives visibly damaged.',
      `If a delivery problem is not resolved by the marketplace, escalate to our grievance officer at ${ROUTES.grievance}.`,
    ],
  },
  {
    heading: 'Parts and accessories sent directly by us',
    body: `Where we send a replacement remote, adapter or part directly, the terms are: ${SHIPPING.notes}`,
    note: `Dispatch time, courier, charge and serviceable pincodes: ${TBD}.`,
  },
  {
    heading: 'Questions',
    body: `Email ${SUPPORT.email}, or use the form at ${ROUTES.contact}.`,
  },
];

export const metadata = {
  ...pageMetadata({
    title: 'Shipping — BluNeuron',
    description:
      'How shipping works for the BluNeuron IRIZ: orders are fulfilled and delivered by Amazon or Flipkart.',
    path: ROUTES.shipping,
  }),
  robots: routeRobots(ROUTES.shipping),
};

export default function ShippingPage() {
  return (
    <LegalPage
      title="Shipping"
      path={ROUTES.shipping}
      intro="Amazon and Flipkart fulfil and deliver every IRIZ order. Here is what that means for delivery, tracking and anything that goes wrong on the way."
      sections={SECTIONS}
    />
  );
}

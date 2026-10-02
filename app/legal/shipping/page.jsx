import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Shipping Policy (Draft) — BluNeuron',
  description: 'Draft shipping policy for BluNeuron — placeholder text, not reviewed by counsel.',
};

const sections = [
  {
    heading: 'Overview',
    body: 'This is placeholder shipping-policy text for the BluNeuron IRIZ launch site. Actual carriers, rates, and timelines must be finalized with logistics/fulfillment before this page goes live.',
  },
  {
    heading: 'Processing time',
    body: 'Orders are intended to be dispatched within 24 hours of purchase (see the "Express Delivery" trust badge on the homepage) — a production version of this page must confirm this against actual fulfillment capacity.',
  },
  {
    heading: 'Shipping regions',
    body: 'The footer region selector currently lists United States, Canada, United Kingdom, European Union, and Australia as placeholder regions. Actual supported shipping destinations, rates, and customs/duties handling need to be confirmed before launch.',
  },
  {
    heading: 'Tracking',
    body: 'Customers should receive a tracking number by email once an order ships. The specific carrier(s) and tracking integration are not yet finalized.',
  },
  {
    heading: 'Delays and lost shipments',
    body: 'A production policy needs to define how delays, damage in transit, and lost shipments are handled, including timeframes for filing a claim.',
  },
];

export default function ShippingPage() {
  return <LegalPage title="Shipping Policy" sections={sections} draftDate="2026-09-27" />;
}

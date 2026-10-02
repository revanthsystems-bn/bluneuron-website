import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Terms of Service (Draft) — BluNeuron',
  description: 'Draft terms of service for BluNeuron — placeholder text, not reviewed by counsel.',
};

const sections = [
  {
    heading: 'Overview',
    body: 'This is placeholder terms-of-service text for the BluNeuron IRIZ launch site, describing in general terms what such an agreement typically covers. It has not been drafted or reviewed by legal counsel and must not be treated as binding.',
  },
  {
    heading: 'Use of this site',
    body: 'By using this site you agree to use it only for lawful purposes and in a way that does not infringe the rights of, or restrict or inhibit the use of, this site by any third party.',
  },
  {
    heading: 'Orders and payment',
    body: [
      'All orders are subject to acceptance and availability.',
      'Prices are shown at checkout and are subject to change prior to order confirmation.',
      'Payment terms, currency, and accepted methods will be finalized before launch.',
    ],
  },
  {
    heading: 'Product descriptions',
    body: 'We aim for accuracy in all specifications and descriptions, but do not warrant that product descriptions are error-free. See /specs for the full technical spec sheet.',
  },
  {
    heading: 'Limitation of liability',
    body: 'A production terms document needs a real limitation-of-liability clause drafted by counsel, appropriate to the jurisdictions this product ships to.',
  },
  {
    heading: 'Changes to these terms',
    body: 'We may update these terms from time to time. A final version should specify how and when customers are notified of material changes.',
  },
];

export default function TermsPage() {
  return <LegalPage title="Terms of Service" sections={sections} draftDate="2026-09-27" />;
}

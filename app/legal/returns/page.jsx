import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Returns Policy (Draft) — BluNeuron',
  description: 'Draft returns policy for BluNeuron — placeholder text, not reviewed by counsel.',
};

const sections = [
  {
    heading: 'Overview',
    body: 'This is placeholder returns-policy text for the BluNeuron IRIZ launch site. The homepage advertises a "30-Day Risk-Free Trial" trust badge — this page drafts what that promise would typically mean, pending confirmation from the actual returns/refunds process.',
  },
  {
    heading: 'Return window',
    body: 'Returns are intended to be accepted within 30 days of delivery, for a full refund, provided the unit is returned in its original condition with all included accessories.',
  },
  {
    heading: 'How to start a return',
    body: [
      'Contact support via the form at /support#contact with your order number.',
      'A return authorization and shipping instructions will be provided.',
      'Refunds are intended to be issued to the original payment method once the returned unit is received and inspected.',
    ],
  },
  {
    heading: 'Non-returnable situations',
    body: 'A production policy needs to define exclusions (e.g. damage from misuse, missing accessories) and who covers return shipping cost.',
  },
  {
    heading: 'Warranty vs. returns',
    body: 'Returns within the 30-day window are separate from the product warranty (see /specs). Warranty terms have not been finalized — see the spec sheet for the current placeholder note.',
  },
];

export default function ReturnsPage() {
  return <LegalPage title="Returns Policy" sections={sections} draftDate="2026-09-27" />;
}

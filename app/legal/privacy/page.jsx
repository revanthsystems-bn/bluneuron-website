import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Privacy Policy (Draft) — BluNeuron',
  description: 'Draft privacy policy for BluNeuron — placeholder text, not reviewed by counsel.',
};

const sections = [
  {
    heading: 'Overview',
    body: 'This is placeholder privacy policy text for the BluNeuron IRIZ launch site. It describes, in general terms, what a privacy policy for this kind of e-commerce and email-signup site would typically cover — it has not been drafted or reviewed by legal counsel and must not be treated as binding.',
  },
  {
    heading: 'Information we collect',
    body: [
      'Contact information you provide, such as your name and email address, when you sign up for updates or contact support.',
      'Order and shipping information if you make a purchase.',
      'Basic usage data (such as pages visited) collected automatically when you browse the site.',
    ],
  },
  {
    heading: 'How we use your information',
    body: [
      'To send product availability updates and firmware notifications you sign up for.',
      'To process and fulfill orders, and to provide customer support.',
      'To improve the site and our products.',
    ],
  },
  {
    heading: 'Third-party services',
    body: 'This site uses a third-party form service to process signup and contact form submissions. A production privacy policy must name every processor actually in use and describe what data each one receives.',
  },
  {
    heading: 'Your choices',
    body: 'You can unsubscribe from email updates at any time. Contact support to request access to, correction of, or deletion of your personal data.',
  },
  {
    heading: 'Contact',
    body: 'Questions about this draft policy should be directed to legal counsel before publishing a final version — see the /support contact form for general inquiries.',
  },
];

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" sections={sections} draftDate="2026-09-27" />;
}

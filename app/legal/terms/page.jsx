import LegalPage from '@/components/LegalPage';
import { BRAND } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { COMPANY, SUPPORT, TBD } from '@/lib/site-config';

/**
 * Terms of service — rewritten for a brand site that does not transact.
 *
 * The previous version had an "Orders and payment" section ("prices are shown
 * at checkout", "payment terms will be finalized"). There is no checkout and
 * there never will be on this domain, so terms covering a sale we do not make
 * were describing someone else's contract. The sale is between the buyer and
 * the marketplace under the marketplace's terms, and that is now the first
 * thing this page says.
 *
 * What is left is what these terms can honestly govern: use of this website,
 * the accuracy of what is published on it, and our own liability for it.
 */
const SECTIONS = [
  {
    heading: 'Who these terms are between',
    body: `This website is operated by ${COMPANY.legalName} ("${BRAND.name}", "we", "us"). These terms govern your use of this website. They are not a contract of sale.`,
  },
  {
    heading: 'We do not sell on this website',
    body: 'The IRIZ is sold on Amazon and Flipkart. Your purchase contract, payment terms, delivery terms and return rights for an order are with the marketplace you bought from and are governed by their terms, not these. Nothing on this site is an offer to sell.',
    note: `Our own warranty is separate from the marketplace's terms and is set out at ${ROUTES.warranty}.`,
  },
  {
    heading: 'Use of this website',
    body: 'You may use this site for lawful purposes only, and in a way that does not restrict or inhibit anyone else\'s use of it. You may not attempt to gain unauthorised access to it, interfere with its operation, or scrape it at a rate that degrades it for other visitors.',
  },
  {
    heading: 'Accuracy of product information',
    body: `Specifications on this site come from the manufacturer's own documentation and are published in good faith. Brightness is stated in ANSI lumens and display resolution as native 1080p — where supplied material used "4K" to describe video decoding rather than display resolution, this site says so explicitly. Full specifications are at ${ROUTES.specs}.`,
    note: 'Product photography is representative. Colours vary by display, and bundled accessories can change between production runs.',
  },
  {
    heading: 'Prices shown on this site',
    body: 'Any price on this site is indicative and is published for information. Amazon and Flipkart set their own prices and run their own offers, so the price on the listing is the price that applies to your order and may differ from the one shown here.',
  },
  {
    heading: 'Intellectual property',
    body: `The ${BRAND.name} name, the wordmark, the IRIZ name, and the text, photography and design of this site belong to ${COMPANY.legalName} and may not be reproduced without written permission.`,
  },
  {
    heading: 'Links to other sites',
    body: 'This site links to Amazon and Flipkart, and to the services named in our privacy policy. We do not control those sites and are not responsible for their content or their terms.',
  },
  {
    heading: 'Limitation of liability',
    body: [TBD],
    note: 'To be drafted by counsel. It must not attempt to exclude liability that cannot be excluded under Indian law — a clause that overreaches is unenforceable in full, which is worse than a narrower one that holds.',
  },
  {
    heading: 'Governing law and jurisdiction',
    body: `These terms are governed by the laws of India. Courts of exclusive jurisdiction: ${TBD}.`,
  },
  {
    heading: 'Changes to these terms',
    body: `We may update these terms. The current version is always the one on this page, and material changes will be noted by the "last updated" date below. How registered customers are notified of a material change: ${TBD}.`,
  },
  {
    heading: 'Grievances and contact',
    body: `For a complaint, see the grievance redressal policy at ${ROUTES.grievance}. For anything else, email ${SUPPORT.email} or use the form at ${ROUTES.contact}.`,
  },
];

export const metadata = {
  title: 'Terms of Service — BluNeuron',
  description:
    'Terms governing use of the BluNeuron website. The IRIZ is sold on Amazon and Flipkart under their terms.',
  robots: routeRobots(ROUTES.terms),
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      path={ROUTES.terms}
      intro="These terms cover your use of this website. The sale itself happens on Amazon or Flipkart, under their terms."
      sections={SECTIONS}
    />
  );
}

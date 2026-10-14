import LegalPage from '@/components/LegalPage';
import { BRAND } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { COMPANY, POLICY_LAST_UPDATED, SUPPORT } from '@/lib/site-config';

/**
 * Terms of service — the supplied Terms & Conditions, adapted to how the
 * product is actually sold.
 *
 * WHAT WAS KEPT, and it is most of it: eligibility, service modifications,
 * accuracy of information, intellectual property, prohibited uses,
 * limitation of liability, indemnification, governing law, changes, and the
 * contact block. The structure and, wherever it survives the adaptation, the
 * wording are the source document's.
 *
 * WHAT WAS CHANGED, and why. The source was written for a storefront on this
 * domain: orders "placed through bluneuron.com", acceptance or cancellation
 * of those orders, payment processing "via certified third-party payment
 * gateways (including Razorpay)", card and UPI handling, SSL on our
 * transactions, and our own shipping timelines. None of that exists. There is
 * no checkout here, no payment gateway, and nothing this site can dispatch —
 * the IRIZ sells on Amazon and Flipkart, and the contract of sale is between
 * the buyer and the marketplace. Terms describing a sale we do not make are
 * not merely redundant: they are a representation that we accept orders and
 * take payments, which is a claim a buyer could rely on.
 *
 * So those clauses are rewritten to say where the sale really happens, and
 * the section on prices says the listing price governs. A placeholder for
 * direct selling is kept, because the right answer to "what if you sell
 * direct later" is to publish terms for it then, not to leave terms for it
 * standing now.
 *
 * Two clauses the source did not have are added, both for the same reason a
 * liability cap has to be bounded in India: a savings clause for the
 * Consumer Protection Act 2019 under limitation of liability, and the named
 * jurisdiction (COMPANY.jurisdiction) rather than the source's unqualified
 * "competent courts in India".
 */
const SECTIONS = [
  {
    heading: 'Who these terms are between',
    body: `This website (bluneuron.com) is owned and operated by ${COMPANY.legalName} ("${BRAND.name}", "we", "us", "our"). By accessing or using this website, or by using our support and warranty services, you agree to be bound by these Terms & Conditions. If you do not agree to all of them, please do not use the site.`,
    note: 'These terms govern your use of this website and our support services. They are not a contract of sale — see the next section.',
  },
  {
    heading: 'We do not sell on this website',
    body: `The ${BRAND.fullName} is sold on Amazon and Flipkart. Your purchase contract, payment, invoicing, delivery and marketplace return rights are with the marketplace you bought from and are governed by their terms, not these. Nothing on this site is an offer to sell, and there is no checkout here to accept or decline an order.`,
    note: `What we provide directly is the manufacturer's warranty on a genuine unit, and support for it — set out at ${ROUTES.warranty}. If we begin selling directly from this website in future, terms for direct sale will be published here before any order can be placed.`,
  },
  {
    heading: 'Eligibility',
    body: 'By agreeing to these Terms, you represent that you are at least the age of majority in your state or territory of residence, or that you have given us your consent to allow any of your minor dependents to use this site.',
  },
  {
    heading: 'Changes to the site and the product range',
    body: 'We reserve the right to modify or discontinue products, and to change or withdraw any part of this website, at any time and without prior notice.',
  },
  {
    heading: 'Accuracy of product information',
    body: `We make every effort to display product specifications, images and colours accurately. Actual visual output and features may vary with display settings, screen or wall surface, throw distance, and ambient lighting. Specifications on this site come from the manufacturer's own documentation and are published in good faith; brightness is stated in ANSI lumens, and display resolution as native 1080p — where supplied material used "4K" to describe video decoding rather than display resolution, this site says so explicitly. Full specifications are at ${ROUTES.specs}.`,
    note: 'Product photography is representative. Bundled accessories can change between production runs.',
  },
  {
    heading: 'Prices shown on this site',
    body: 'Prices are shown in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. Any price on this site is indicative and published for information only: Amazon and Flipkart set their own prices and run their own offers, so the price on the listing at the time you order is the price that applies, and it may differ from the one shown here.',
  },
  {
    heading: 'Cancellations, returns, refunds and warranty',
    body: [
      `Cancellations, returns, replacements and refunds for a marketplace order are governed by Amazon's or Flipkart's policies and are handled in your orders list there. Our own replacement windows and what they cover are set out at ${ROUTES.returns}.`,
      `Warranty claims for manufacturing defects on IRIZ projectors are processed in accordance with the warranty policy at ${ROUTES.warranty} and the warranty card supplied in the box.`,
      `What we ship, and who pays for which leg of a service shipment, is at ${ROUTES.shipping}.`,
    ],
  },
  {
    heading: 'Intellectual property',
    body: `All content on bluneuron.com — including trademarks, logos, product design aesthetics, software code, graphic elements, user interfaces, text, audio clips and media downloads — is the exclusive intellectual property of ${COMPANY.legalName} and is protected by Indian and international copyright and trademark law. You may not reproduce, duplicate, copy, sell or exploit any portion of this website or our brand assets without our explicit written permission.`,
  },
  {
    heading: 'Prohibited uses',
    body: [
      'Using the site for any unlawful purpose, or to solicit others to perform unlawful acts.',
      'Violating any international, federal, state or local regulation, rule or law.',
      'Transmitting viruses, malware or any destructive code.',
      'Scraping, crawling or harvesting data or intellectual assets from bluneuron.com without prior written authorisation, or at a rate that degrades the site for other visitors.',
      'Attempting unauthorised access to our customer records, support systems or server infrastructure.',
    ],
  },
  {
    heading: 'Links to other sites',
    body: 'This site links to Amazon and Flipkart, and to the services named in our privacy policy. We do not control those sites and are not responsible for their content, their availability or their terms.',
  },
  {
    heading: 'Limitation of liability',
    body: `To the maximum extent permitted by applicable law, ${COMPANY.legalName}, its founders, officers, employees and suppliers shall not be liable for any indirect, incidental, punitive, special or consequential damages arising from your use of, or inability to use, this website or our products; from unauthorised access to or alteration of your transmissions or data; or from temporary site downtime caused by third-party infrastructure. In no event shall our total cumulative liability exceed the amount you paid for the specific product giving rise to the claim.`,
    note: 'Nothing in this clause limits or excludes any liability that cannot be limited or excluded under Indian law, including your rights under the Consumer Protection Act, 2019.',
  },
  {
    heading: 'Indemnification',
    body: `You agree to indemnify, defend and hold harmless ${COMPANY.legalName} and its officers, partners, employees and service providers from any claim, demand or damages (including reasonable legal fees) brought by a third party arising out of your breach of these Terms, or your violation of any law or of the rights of a third party.`,
  },
  {
    heading: 'Governing law and jurisdiction',
    body: `These Terms are governed by and construed in accordance with the laws of India. Any dispute or legal proceeding arising out of or relating to bluneuron.com, or to products purchased from our authorised listings, is subject to the exclusive jurisdiction of the competent courts at ${COMPANY.jurisdiction}.`,
  },
  {
    heading: 'Changes to these Terms',
    body: `We may update, modify or replace any part of these Terms at our discretion by posting the updated version at ${ROUTES.terms}. The version on this page is always the current one, and the date below shows when it last changed. Your continued use of the site after a change constitutes acceptance of it.`,
  },
  {
    heading: 'Electronic record',
    body: 'This document is an electronic record generated in accordance with the Information Technology Act, 2000 and the rules made under it. It does not require a physical or digital signature.',
  },
  {
    heading: 'Contact',
    body: [
      `Brand: ${COMPANY.brandName} — a brand of ${COMPANY.legalName}`,
      `Registered and service address: ${COMPANY.registeredAddress}`,
      `Customer support: ${SUPPORT.email}`,
      `Sales and partnerships: ${SUPPORT.salesEmail}`,
      `Support hours: ${SUPPORT.hours}`,
    ],
    note: `You can also use the contact form at ${ROUTES.contact}.`,
  },
];

export const metadata = {
  ...pageMetadata({
    title: 'Terms & Conditions — BluNeuron',
    description:
      'Terms governing use of the BluNeuron website and our support services. The IRIZ is sold on Amazon and Flipkart under their terms.',
    path: ROUTES.terms,
  }),
  robots: routeRobots(ROUTES.terms),
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      path={ROUTES.terms}
      intro="These terms cover your use of this website and our support services. The sale itself happens on Amazon or Flipkart, under their terms."
      sections={SECTIONS}
      lastUpdated={POLICY_LAST_UPDATED}
    />
  );
}

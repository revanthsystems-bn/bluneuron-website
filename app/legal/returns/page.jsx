import LegalPage from '@/components/LegalPage';
import { ROUTES, routeRobots } from '@/lib/routes';
import { RETURNS, SUPPORT, TBD } from '@/lib/site-config';

/**
 * Returns and refunds — rewritten for marketplace selling.
 *
 * The previous version of this page described returning a unit to US: a return
 * authorisation, a 30-day window, a refund to the original payment method.
 * None of that exists. There is no checkout on this site, so there is no
 * payment method to refund and no order of ours to authorise a return against.
 * Every return runs through Amazon or Flipkart, and the only honest thing this
 * page can do is say so first and then state where our own terms go further.
 *
 * The 30-day figure went with it. It came from the homepage's "30-Day
 * Risk-Free Trial" trust badge, which does not render while commerce is off
 * (see COMMERCE_ENABLED in lib/launch.js) and was never a commitment anyone
 * had signed off. RETURNS.windowDays in lib/site-config.js is the one place a
 * real number will go.
 */
const SECTIONS = [
  {
    heading: 'Returns run through the marketplace',
    body: 'The BluNeuron IRIZ is sold on Amazon and Flipkart. Your order, your payment and your return are all with the marketplace you bought from, so a return or a refund is started in your orders list there — not here. Their return window, their process and their refund timelines apply to the purchase.',
    note: 'We cannot start, authorise or refund a marketplace return on your behalf. We also cannot see your order unless you tell us the order ID.',
  },
  {
    heading: 'How to start a return',
    body: [
      'Open your orders on Amazon or Flipkart and choose the return or replacement option on the IRIZ order.',
      'Follow their instructions for pickup or drop-off. Keep all original accessories and packaging with the unit.',
      `If the marketplace window has closed and the unit has a fault, use the warranty claim form at ${ROUTES.warrantyClaim} instead.`,
    ],
  },
  {
    heading: 'Our own return window',
    body: `Where we offer a return beyond the marketplace's own window, it is ${RETURNS.windowDays} days from delivery. Which purchases this applies to, and how it is claimed: ${TBD}.`,
    note: 'If we are not offering anything beyond the marketplace window, this section must say so plainly rather than be deleted — a missing section reads as an unstated promise.',
  },
  {
    heading: 'Condition of a returned unit',
    body: `A returned unit is expected in its original condition with all included accessories and its original packaging. What counts as a deduction or a refusal, and who bears return shipping: ${TBD}.`,
  },
  {
    heading: 'Refund timelines',
    body: `Marketplace refunds follow Amazon's or Flipkart's own timelines and are credited by them. Where we refund directly, it is within ${RETURNS.refundDays} days of receiving and inspecting the returned unit.`,
  },
  {
    heading: 'Non-returnable situations',
    body: [TBD],
    note: 'The final list must be exhaustive and must not restate a right the Consumer Protection Act gives the buyer regardless.',
  },
  {
    heading: 'Returns and the warranty are not the same thing',
    body: `A return gives your money back and ends the sale. The warranty repairs or replaces a faulty unit and keeps it. They have different windows and different processes — see the warranty policy at ${ROUTES.warranty}.`,
  },
  {
    heading: 'Damaged or wrong item on arrival',
    body: 'Raise this with the marketplace immediately — they handle delivery, and a damaged-in-transit or wrong-item claim is theirs to resolve. Photograph the packaging and the unit before you do anything else.',
  },
  {
    heading: 'Questions',
    body: `Email ${SUPPORT.email}, or use the form at ${ROUTES.contact}.`,
  },
];

export const metadata = {
  title: 'Returns & Refunds — BluNeuron',
  description:
    'How returns and refunds work for the BluNeuron IRIZ, which is sold on Amazon and Flipkart.',
  robots: routeRobots(ROUTES.returns),
};

export default function ReturnsPage() {
  return (
    <LegalPage
      title="Returns & Refunds"
      path={ROUTES.returns}
      intro="The IRIZ is sold on Amazon and Flipkart, so returns start there. Here is what that means, and where our own terms go further."
      sections={SECTIONS}
    />
  );
}

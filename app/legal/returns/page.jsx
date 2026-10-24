import LegalPage from '@/components/LegalPage';
import { BRAND } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import {
  DELIVERY_WINDOWS,
  POLICY_LAST_UPDATED,
  RETURNS,
  SUPPORT,
  WARRANTY,
  sellersAnd,
  sellersOr,
} from '@/lib/site-config';

/**
 * Returns, refunds and cancellations — sections 3, 4 and 5 of the supplied
 * Warranty, Return, Refund and Cancellation document. (Sections 1 and 2, the
 * warranty itself and the service process, are at /legal/warranty.)
 *
 * WHAT IS KEPT, deliberately and in the source's own terms: the replacement
 * windows and the exact difference between them — 7 days for a unit that is
 * defective or non-functioning on arrival, 24 hours for physical or transit
 * damage and for a specification mismatch; the non-replacement conditions,
 * including the one that matters most commercially, that dissatisfaction
 * with a DEFECT-FREE product's appearance, audio/visual characteristics or
 * room-brightness performance is not a replacement; the requirement that a
 * returned unit be unused and complete; and repair-or-replace as the remedy
 * for a manufacturing defect.
 *
 * THE ONE SUBSTANTIVE CHANGE. The source says "No monetary refunds will be
 * issued under any circumstances" and "Bluneuron maintains a strict No Refund
 * Policy". That sentence is not enforceable in India as written: the
 * Consumer Protection Act, 2019 gives a buyer rights a seller's policy cannot
 * contract away, and a marketplace order additionally carries Amazon's or
 * Flipkart's own refund policy, which we have agreed to as a seller on their
 * platform. A blanket exclusion is also the kind of clause that gets a whole
 * policy read down rather than just the offending line.
 *
 * So the substance is kept and the absolute is dropped: we do not refund for
 * change of mind, and we do not refund a defect-free unit because of its
 * appearance or brightness — which is what the no-refund rule is actually
 * for — while the savings clause states plainly that statutory and
 * marketplace rights are unaffected. That is the same commercial position,
 * stated in a way that survives being tested.
 *
 * The cancellation section is rewritten for marketplace selling: we do not
 * accept orders on this domain, so there is nothing here to cancel, and
 * cancellation runs on the marketplace's rules.
 */
const SECTIONS = [
  {
    heading: 'Where a return starts',
    body: `The ${BRAND.fullName} is sold on ${sellersAnd()}. Your order, your payment and your invoice are with the marketplace you bought from, so a return, a replacement or a refund is started in your orders list there — not here. Their window, their process and their refund timelines apply to the purchase, and they are usually wider than ours.`,
    note: 'We cannot start, authorise or refund a marketplace return on your behalf, and we cannot see your order unless you give us the order ID.',
  },
  {
    heading: 'How to start a marketplace return',
    body: [
      `Open your orders on ${sellersOr()} and choose the return or replacement option on the IRIZ order.`,
      'Follow their instructions for pickup or drop-off. Send the unit back with all original accessories and packaging.',
      `If the marketplace window has closed and the unit has a fault, use the warranty claim form at ${ROUTES.warrantyClaim} instead — the warranty runs for ${WARRANTY.label} and is separate from any return window.`,
    ],
  },
  {
    heading: 'Our replacement windows, and the clock on each',
    body: [
      // THE SAME TWO STRINGS /legal/warranty renders, from the same
      // constants. Do not reword one of them here: two policy pages
      // disagreeing about a deadline a buyer can miss is the exact bug
      // DELIVERY_WINDOWS exists to prevent, and it is the bug that was here.
      DELIVERY_WINDOWS.damaged,
      DELIVERY_WINDOWS.earlyFailure,
      `Wrong item or a specification mismatch — the unit delivered is not what was ordered: report within ${RETURNS.damageReportHours} hours of delivery.`,
      `${DELIVERY_WINDOWS.marketplaceNote} The warranty policy at ${ROUTES.warranty} states the first two in the same words.`,
    ],
    // The two figures restated from RETURNS, the same constants the bullets
    // above interpolate. No new wording.
    highlight: {
      label: `${RETURNS.damageReportHours} hours for damage on arrival · ${RETURNS.replacementDays} days for an early failure`,
      value: 'Both clocks start at delivery. The marketplace you bought from also has its own window, usually wider.',
    },
    note: 'The two clocks differ because the questions differ. Whether a unit ARRIVED damaged stops being answerable almost immediately, which is why that one is short and wants photographs. Whether a unit is RELIABLE is answerable over a week of use — and a failure inside that week is replaced rather than repaired, because a unit that dies in its first week should not come back mended. Photograph the outer packaging and the unit before anything else.',
  },
  {
    heading: 'Condition of a returned unit',
    body: 'For a replacement to be processed, the product must be unused and in its original brand packaging, with all manuals, accessories, warranty card and the purchase invoice, free of marks, scratches or alterations.',
  },
  {
    heading: 'When a replacement is not given',
    body: [
      "Dissatisfaction with a defect-free product's appearance, audio or visual characteristics, or its brightness in your room. A projector's picture depends on ambient light, surface and throw distance; a unit performing to specification is not a defective one.",
      `Physical damage reported more than ${RETURNS.damageReportHours} hours after delivery.`,
      'Damage caused by power surges, improper operation or negligence.',
    ],
    note: `Every IRIZ is inspected and tested by our quality control team before it ships, which is why these cases are narrow rather than routine. If you think a unit is genuinely faulty, raise it at ${ROUTES.warrantyClaim} and we will look at it.`,
  },
  {
    heading: 'Refunds',
    body: `We do not refund for change of mind, and we do not refund a defect-free unit on the basis of its appearance or its brightness performance. Where a unit has a manufacturing defect, the remedy under our warranty is repair or replacement — see ${ROUTES.warranty}. A refund on a marketplace order, where one is due, is issued by ${sellersOr()} under their policy and on their timeline, since they took the payment.`,
    note: 'Nothing in this policy limits your rights under the Consumer Protection Act, 2019 or the return and refund policy of the marketplace you purchased from.',
  },
  {
    heading: 'If a unit cannot be repaired',
    body: `Where a product cannot be repaired and no direct replacement is available, ${BRAND.name} may offer an equivalent model, or issue a credit note for the invoice value. All original accessories must be returned; where they are not, a reasonable deduction is made. The full terms are in the warranty policy at ${ROUTES.warranty}.`,
  },
  {
    heading: 'Cancellations',
    body: `An order placed on ${sellersOr()} is cancelled through that marketplace, under their rules — generally before the order is dispatched, and not at all once it has shipped. Same-day delivery orders and orders placed during limited-time promotional or holiday sales are often non-cancellable on their side; their listing says which.`,
    note: 'There is no checkout on this website, so there is no order of ours for you to cancel. If we begin selling directly in future, cancellation terms for direct orders will be published here.',
  },
  {
    heading: 'Returns and the warranty are not the same thing',
    body: `A return ends the sale and is the marketplace's to process. The warranty keeps the unit and repairs or replaces it, runs for a year from the invoice date, and is ours. They have different windows and different processes — see ${ROUTES.warranty}.`,
  },
  {
    heading: 'Questions',
    body: `Email ${SUPPORT.email} within support hours (${SUPPORT.hours}), or use the form at ${ROUTES.contact}.`,
  },
];

export const metadata = {
  ...pageMetadata({
    title: 'Returns, Refunds & Cancellations — BluNeuron',
    description:
      `Replacement windows, refunds and cancellations for the BluNeuron IRIZ, which is sold on ${sellersAnd()}.`,
    path: ROUTES.returns,
  }),
  robots: routeRobots(ROUTES.returns),
};

export default function ReturnsPage() {
  return (
    <LegalPage
      title="Returns, Refunds & Cancellations"
      path={ROUTES.returns}
      intro={`The IRIZ is sold on ${sellersAnd()}, so returns start there. Here is what that means, and where our own replacement terms apply.`}
      sections={SECTIONS}
      lastUpdated={POLICY_LAST_UPDATED}
    />
  );
}

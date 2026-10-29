import LegalPage from '@/components/LegalPage';
import { BRAND } from '@/lib/iriz';
import { ROUTES, routeRobots } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import {
  POLICY_LAST_UPDATED,
  SUPPORT,
  WARRANTY,
  primarySupportPhone,
  sellersAnd,
  sellersOr,
} from '@/lib/site-config';

/**
 * Returns, refunds and cancellations.
 *
 * ================================================================
 * THIS PAGE NO LONGER PUBLISHES A RETURN WINDOW OF OUR OWN.
 * ================================================================
 * It used to publish two - 48 hours to report damage on arrival, 7 days to
 * report an early failure - shared verbatim with /legal/warranty through
 * DELIVERY_WINDOWS so the two pages could not disagree with each other. They
 * disagreed with something else instead: the sale invoice, which grants
 * neither. Under it,
 *
 *   ONLINE    returns and replacements are governed STRICTLY by the return
 *             policy of the marketplace the purchase was made on.
 *   OFFLINE   goods once sold are not taken back or refunded; only warranty
 *             service or replacement applies, and only for a manufacturing
 *             defect.
 *
 * A window published here could only have been narrower than the
 * marketplace's, which is unenforceable, or wider, which is a promise we
 * cannot keep - we hold neither the order, the payment nor the reverse
 * logistics. So the page is restructured around the two channels rather than
 * around our clocks, which is also how a customer actually arrives at it:
 * they know where they bought it.
 *
 * THE "UNUSED AND IN ORIGINAL PACKAGING" CONDITION WENT WITH THEM. It
 * contradicted the windows it sat beside - a unit that failed on day six has
 * self-evidently been used - and it is not ours to impose on an online
 * return, where the marketplace sets the condition rules. Nothing replaced
 * it here; the accessories-returned requirement survives where it still
 * belongs, in the credit-note case.
 *
 * WHAT IS KEPT, deliberately: no refunds for change of mind; a defect-free
 * unit's appearance or brightness is not grounds for replacement (the
 * commercially important one - a projector's picture depends on ambient
 * light, surface and throw distance); repair-or-replace as the remedy for a
 * manufacturing defect; an equivalent model or a credit note for the invoice
 * value where a unit cannot be repaired; and the savings clause for the
 * Consumer Protection Act, 2019.
 *
 * THE ABSOLUTE IS STILL DROPPED. The supplied source said "No monetary
 * refunds will be issued under any circumstances". That is not enforceable
 * in India as written, and a blanket exclusion is the kind of clause that
 * gets a whole policy read down rather than just the offending line. The
 * commercial substance survives without it.
 */

/** The customer care line, or null. See the note on the warranty page. */
const PHONE = primarySupportPhone();
const PHONE_SUFFIX = PHONE ? ` or call ${PHONE.number}` : '';

const SECTIONS = [
  {
    heading: 'Where you bought it decides everything',
    body: `There are two routes, and they are not variations of one policy — they are different policies with different owners. A ${BRAND.fullName} bought online is returned under the return policy of the marketplace you bought it on. One bought from a shop or an authorised dealer is not returned at all; a manufacturing defect on it is handled under our warranty. Find your route below.`,
    note: 'Whichever applies, a manufacturing defect inside the cover period is always ours to put right — see the warranty sections below.',
  },
  {
    heading: `Bought online (${sellersAnd()})`,
    body: [
      'Returns, replacements and refunds are governed strictly by the official return policy of the marketplace you bought from. Their window, their conditions, their process and their refund timelines apply to the purchase.',
      `To start one: open your orders on ${sellersOr()}, choose the return or replacement option on the IRIZ order, and follow their instructions for pickup or drop-off. Send the unit back with all original accessories and packaging.`,
      'If the unit arrived damaged or will not power on, report it to the marketplace straight away, inside their window, with photographs.',
      `If their window has closed and the unit has a manufacturing defect, use the warranty claim form at ${ROUTES.warrantyClaim} instead. The warranty runs for ${WARRANTY.label} from the invoice date and is separate from any return window.`,
    ],
    note: 'We cannot start, authorise or refund a marketplace return on your behalf, and we cannot see your order unless you give us the invoice number. This is not us passing you around: the marketplace holds the order and the payment, so they are the only party who can reverse it.',
  },
  {
    heading: 'Bought from a store or an authorised dealer',
    body: [
      'Goods once sold are not taken back or refunded. There is no return window and no change-of-mind return on a store or dealer purchase.',
      `What does apply is the warranty: a manufacturing defect is repaired or replaced under the terms at ${ROUTES.warranty}, for ${WARRANTY.label} from the invoice date.`,
      WARRANTY.soleProvider,
    ],
    note: `Keep your BluNeuron invoice. It is what establishes the purchase date, and a claim cannot be processed without it. Start a claim at ${ROUTES.warrantyClaim}.`,
  },
  {
    heading: 'When a replacement is not given',
    body: [
      "Dissatisfaction with a defect-free product's appearance, audio or visual characteristics, or its brightness in your room. A projector's picture depends on ambient light, surface and throw distance; a unit performing to specification is not a defective one.",
      'Physical damage, liquid ingress, damage from power surges, improper operation or negligence. These are outside the warranty and void it.',
      'A unit opened, repaired or modified by anyone other than BluNeuron.',
    ],
    note: `Every IRIZ is inspected and tested before it ships, which is why these cases are narrow rather than routine. If you think a unit is genuinely faulty, raise it at ${ROUTES.warrantyClaim} and we will look at it.`,
  },
  {
    heading: 'Refunds',
    body: `We do not refund for change of mind, and we do not refund a defect-free unit on the basis of its appearance or its brightness performance. Where a unit has a manufacturing defect, the remedy under our warranty is repair or replacement — see ${ROUTES.warranty}. A refund on a marketplace order, where one is due, is issued by ${sellersOr()} under their policy and on their timeline, since they took the payment. A store or dealer purchase is not refunded.`,
    note: 'Nothing in this policy limits your rights under the Consumer Protection Act, 2019 or the return and refund policy of the marketplace you purchased from.',
  },
  {
    heading: 'If a unit cannot be repaired',
    body: `Where a product cannot be repaired and no direct replacement is available, ${BRAND.name} may offer an equivalent model, or issue a credit note for the invoice value. All original accessories must be returned; where they are not, a reasonable deduction is made. The full terms are in the warranty policy at ${ROUTES.warranty}.`,
  },
  {
    heading: 'Cancellations',
    body: [
      `An order placed on ${sellersOr()} is cancelled through that marketplace, under their rules — generally before the order is dispatched, and not at all once it has shipped. Same-day delivery orders and orders placed during limited-time promotional or holiday sales are often non-cancellable on their side; their listing says which.`,
      'A purchase from a store or an authorised dealer cannot be cancelled once it has been billed.',
    ],
    note: 'There is no checkout on this website, so there is no order of ours for you to cancel. If we begin selling directly in future, cancellation terms for direct orders will be published here.',
  },
  {
    heading: 'Returns and the warranty are not the same thing',
    body: `A return ends the sale. It is the marketplace's to process, and it does not exist on a store purchase. The warranty keeps the unit and repairs or replaces it, runs for ${WARRANTY.label} from the invoice date, applies however you bought, and is ours — see ${ROUTES.warranty}.`,
  },
  {
    heading: 'Questions',
    body: `Email ${SUPPORT.email}${PHONE_SUFFIX} within support hours (${SUPPORT.hours}), or use the form at ${ROUTES.contact}.`,
  },
];

export const metadata = {
  ...pageMetadata({
    title: 'Returns, Refunds & Cancellations — BluNeuron',
    description:
      `Returns, refunds and cancellations for the BluNeuron IRIZ: online orders follow the marketplace's return policy, and store purchases are covered by the warranty.`,
    path: ROUTES.returns,
  }),
  robots: routeRobots(ROUTES.returns),
};

export default function ReturnsPage() {
  return (
    <LegalPage
      title="Returns, Refunds & Cancellations"
      path={ROUTES.returns}
      intro={`Where you bought your IRIZ decides how a return works. Online, the marketplace’s own return policy applies. From a store or dealer, goods are not taken back — but the ${WARRANTY.label} warranty still covers a manufacturing defect.`}
      sections={SECTIONS}
      lastUpdated={POLICY_LAST_UPDATED}
    />
  );
}

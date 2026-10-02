import { formatPrice } from './iriz';

/**
 * Web3Forms powers every form that reaches us — the "Notify Me" signup and
 * the checkout reservation — submitted straight from the client with no
 * backend of our own. See https://web3forms.com/ for the API contract.
 *
 * The key comes from `NEXT_PUBLIC_WEB3FORMS_KEY` in `.env.local`. It is a
 * NEXT_PUBLIC_ var because these submissions are client-side, so the key ends
 * up in the bundle either way — Web3Forms access keys are designed for that
 * and carry no account privileges beyond "deliver a form to this inbox".
 * Reading it from the environment rather than from source is still the right
 * call: the value stays out of version control and can be rotated or pointed
 * at a different inbox per deployment without a code change.
 *
 * NOTE: an earlier working copy of this file had a key hardcoded in it.
 * That value should be treated as exposed and rotated in the Web3Forms
 * dashboard before launch, even though it is not in this repository.
 */
export const WEB3FORMS_ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY || '';

let warned = false;

/**
 * Fail loudly in the console, clearly, once — and never silently swallow a
 * submission. A form that appears to succeed while the key is missing is the
 * worst outcome: the visitor believes they are on the list and no one is.
 */
function assertAccessKey() {
  if (WEB3FORMS_ACCESS_KEY) return;

  if (!warned) {
    warned = true;
    // eslint-disable-next-line no-console
    console.warn(
      '[BluNeuron] NEXT_PUBLIC_WEB3FORMS_KEY is not set, so form submissions ' +
        'cannot be delivered. Add NEXT_PUBLIC_WEB3FORMS_KEY=<your access key> ' +
        'to .env.local and restart `next dev`. Get a key at ' +
        'https://web3forms.com/ — it is the access key for the inbox these ' +
        'forms should land in.'
    );
  }

  // The visitor sees the same one sentence as every other failure — they can
  // do nothing with "the key is missing", and the console warning above is
  // addressed to the person who can.
  throw new Error('Something went wrong. Please try again.');
}

// The dummy checkout has no backend, so sessionStorage is the only record of
// an order — it never leaves the customer's browser. This is the one place
// that reaches us, so it doubles as the lead capture until a real payment
// gateway (see PURCHASE_MODE in lib/commerce.js) replaces the dummy flow.
export async function submitCheckoutOrder(order) {
  assertAccessKey();

  const { address } = order;
  const shippingLine = [address.address, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(', ');

  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: `New BluNeuron IRIZ reservation — ${order.orderNumber}`,
      from_name: address.name,
      name: address.name,
      email: address.email,
      phone: address.phone,
      reservation_number: order.orderNumber,
      product: order.product.name,
      quantity: order.qty,
      unit_price: formatPrice(order.unitPrice),
      subtotal: formatPrice(order.subtotal),
      shipping: order.shipping === 0 ? 'Free' : formatPrice(order.shipping),
      total: formatPrice(order.total),
      payment_method: order.paymentMethod,
      shipping_address: shippingLine,
      message:
        `Pre-order reservation captured via the dummy checkout flow — no payment has been collected yet.\n\n` +
        `Contact ${address.name} at ${address.phone} / ${address.email} to confirm and complete payment.\n\n` +
        `Product: ${order.product.name} × ${order.qty}\n` +
        `Total: ${formatPrice(order.total)}\n` +
        `Payment method selected: ${order.paymentMethod}\n` +
        `Ship to: ${shippingLine}`,
      source: 'checkout-dummy-flow',
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'Could not send your reservation. Please try again.');
  }
  return data;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_PATTERN.test(email.trim());
}

/**
 * INDIAN MOBILE NUMBERS.
 *
 * The field is a 10-digit national number with a fixed, non-editable "+91"
 * prefix rendered beside it, so the only thing a visitor can type is the
 * national part. This accepts what people actually type into that box —
 * "98765 43210", "9876543210", and, forgivingly, a pasted "+91 98765 43210"
 * or a leading-zero "098765 43210" — and normalises all of them to the single
 * form that goes to Web3Forms.
 *
 * Indian mobile numbers start 6-9; anything else is a landline or a typo and
 * is rejected rather than delivered as a number nobody can call back.
 */
export function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  // Tolerate the country code or a trunk zero if either was pasted in.
  const national = digits.startsWith('91') && digits.length === 12
    ? digits.slice(2)
    : digits.startsWith('0') && digits.length === 11
      ? digits.slice(1)
      : digits;

  if (!/^[6-9]\d{9}$/.test(national)) return null;
  return `+91${national}`;
}

/** Empty is valid — the field is optional and must never block a signup. */
export function isValidPhone(phone) {
  const trimmed = String(phone || '').trim();
  if (!trimmed) return true;
  return normalizePhone(trimmed) !== null;
}

/**
 * Where a signup came from. One vocabulary, so the inbox reads consistently
 * and a new surface cannot invent a label that means the same as an existing
 * one. Every caller passes one of these.
 */
export const NOTIFY_SOURCES = {
  masthead: 'masthead',
  mobileMenu: 'mobile menu',
  stickyBar: 'sticky bar',
  inlineForm: 'inline form',
  timedInvitation: 'timed invitation',
};

/**
 * Submit a "Notify Me" signup.
 *
 * `botcheck` is Web3Forms' own honeypot convention: the form renders a hidden
 * checkbox of that name, a human never sees or toggles it, and a bot that
 * fills every field in the DOM ticks it. Web3Forms silently drops a submission
 * whose `botcheck` is true — but this rejects it here as well, before the
 * request is made, so a trapped submission costs nothing and cannot be
 * mistaken for a delivery failure by the caller.
 */
export async function submitNotifySignup(email, { phone, source, botcheck } = {}) {
  if (botcheck) {
    throw new Error('Submission blocked.');
  }

  assertAccessKey();

  // Omitted entirely when blank — Web3Forms renders every key it is given, and
  // an empty "phone" row in the email is noise.
  const normalizedPhone = phone ? normalizePhone(phone) : null;

  let res;
  try {
    res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: 'New IRIZ launch signup',
        from_name: 'BluNeuron website',
        email: String(email).trim(),
        ...(normalizedPhone ? { phone: normalizedPhone } : {}),
        source: source || 'unknown',
        botcheck: false,
      }),
    });
  } catch (networkError) {
    // `fetch` rejects for a dropped connection, a blocked request, and a
    // failed CORS preflight alike, and its message is whatever the browser
    // chose — "Failed to fetch", "NetworkError when attempting to fetch
    // resource", "Load failed". None of those are for a visitor to read, and
    // showing them leaks the transport into the UI. One sentence instead; the
    // real reason stays in the console for whoever is debugging.
    // eslint-disable-next-line no-console
    console.error('[BluNeuron] Web3Forms request failed:', networkError);
    throw new Error('Something went wrong. Please try again.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'Something went wrong. Please try again.');
  }
  return data;
}

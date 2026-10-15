import { NextResponse } from 'next/server';
import { isValidEmail, normalizePhone } from '@/lib/web3forms';
import {
  SUPPORT_PURCHASE_SOURCES,
  purchaseSourceNeedsVerification,
} from '@/lib/site-config';

/**
 * RUNTIME: the default (edge-compatible), NOT 'nodejs'.
 *
 * This route arrived with `export const runtime = 'nodejs'` and
 * `import { randomUUID } from 'node:crypto'`, which is correct on Vercel and
 * on the GoDaddy Node host. The live site is neither: it runs on Cloudflare
 * Workers through OpenNext, where pinning the Node runtime asks for a
 * container that does not exist. `crypto.randomUUID()` is a global in
 * Workers, in Node 19+, and in every browser — so dropping both lines makes
 * the route run unchanged on all three hosts rather than two.
 *
 * Everything else about the original is kept deliberately: the body cap, the
 * honeypot, the field-by-field revalidation, the Apps Script URL allow-list
 * and the Asia/Kolkata date check. Those are the parts that matter, and they
 * are host-independent.
 */

const MAX_REQUEST_BYTES = 10 * 1024;

function errorResponse(message, status) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function isValidPurchaseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    return false;
  }

  const todayInIndia = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  return value <= todayInIndia;
}

/**
 * A v4 UUID, as `crypto.randomUUID()` produces.
 *
 * The id is accepted FROM THE CLIENT rather than minted here, and that is
 * the whole mechanism preventing one registration from becoming two records.
 * A signed-in customer's registration is written twice — once to Supabase
 * from the browser (under Row Level Security) and once to the Sheet through
 * this route — and the two have to agree on an identifier or support ends up
 * reconciling a spreadsheet row against an account row by eye.
 *
 * Trusting a client-supplied id is safe here because the id is not a
 * capability: it grants nothing, reads nothing, and the Apps Script
 * de-duplicates on it. The worst a forged one can do is collide with an
 * existing row and overwrite the caller's own registration.
 */
function isValidUuid(value) {
  return (
    typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function isValidText(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 200;
}

function getAppsScriptUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'script.google.com' ||
      !/^\/macros\/s\/[^/]+\/exec\/?$/.test(url.pathname)
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request) {
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return errorResponse('The registration form is too large.', 413);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid registration data.', 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return errorResponse('Invalid registration data.', 400);
  }
  if (body.botcheck) {
    return errorResponse('Submission blocked.', 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const purchaseSource = body.marketplace;
  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
  const purchaseDate = body.purchaseDate;
  const serialNumber =
    typeof body.serialNumber === 'string' ? body.serialNumber.trim() : '';

  // The browser sends one so the Supabase row and the Sheet row match. A
  // request without one (or with a malformed one) still works — it just gets
  // a fresh id, which is the right answer for a signed-out registration that
  // has nothing to match against.
  const registrationId = isValidUuid(body.registrationId)
    ? body.registrationId
    : crypto.randomUUID();

  if (
    !isValidText(name) ||
    !isValidEmail(email) ||
    !normalizePhone(phone) ||
    !SUPPORT_PURCHASE_SOURCES.includes(purchaseSource) ||
    !isValidText(orderId) ||
    !isValidPurchaseDate(purchaseDate) ||
    !isValidText(serialNumber)
  ) {
    return errorResponse('Please check the required registration details and try again.', 400);
  }

  const appsScriptUrl = getAppsScriptUrl(process.env.GOOGLE_APPS_SCRIPT_URL);
  const apiToken = process.env.GOOGLE_APPS_SCRIPT_TOKEN;
  if (!appsScriptUrl || !apiToken) {
    console.error(
      '[BluNeuron] Warranty registration is unavailable: configure GOOGLE_APPS_SCRIPT_URL and GOOGLE_APPS_SCRIPT_TOKEN on the server.'
    );
    return errorResponse('Registration is temporarily unavailable. Please try again later.', 503);
  }

  let response;
  try {
    response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        apiToken,
        registrationId,
        fullName: name,
        email,
        phoneNumber: normalizePhone(phone),
        purchaseSource,
        orderId,
        purchaseDate,
        serialNumber,
        // "Other seller" is accepted and FLAGGED rather than refused. The
        // warranty covers units from BluNeuron or an authorised seller
        // (/legal/warranty), so provenance has to be checked by a human
        // before a claim is honoured — but refusing the registration at the
        // form would only teach people to pick "Amazon" and record a
        // confident falsehood. See AUTHORISED_PURCHASE_SOURCES.
        needsVerification: purchaseSourceNeedsVerification(purchaseSource),
      }),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('[BluNeuron] Apps Script registration request failed:', error);
    return errorResponse('Could not save your registration. Please try again.', 502);
  }

  let result;
  try {
    result = await response.json();
  } catch (error) {
    console.error('[BluNeuron] Apps Script returned a non-JSON response:', error);
    return errorResponse('Could not save your registration. Please try again.', 502);
  }

  if (!response.ok || result?.saved !== true) {
    console.error(
      '[BluNeuron] Apps Script could not save the warranty registration:',
      typeof result?.error === 'string' ? result.error : `HTTP ${response.status}`
    );
    return errorResponse(
      typeof result?.error === 'string'
        ? result.error
        : 'Could not save your registration. Please try again.',
      502
    );
  }

  // The id goes back so the browser can log or correlate it. It is not a
  // secret and not a capability — see isValidUuid above.
  return NextResponse.json({ success: true, registrationId });
}

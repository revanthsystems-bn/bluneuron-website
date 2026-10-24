import { NextResponse } from 'next/server';
import { readJsonBody } from '@/lib/request-body';
import { isValidEmail, normalizePhone } from '@/lib/web3forms';
import {
  CLAIM_DESCRIPTION_MIN,
  SUPPORT,
  WARRANTY_ISSUE_TYPES,
  isValidClaimReference,
  newClaimReference,
} from '@/lib/warranty';

/**
 * Warranty claim → the Sheet, and if that fails → email. A claim is not lost.
 *
 * ---------------------------------------------------------------------------
 * TWO DESTINATIONS, AND WHY
 * ---------------------------------------------------------------------------
 * A warranty registration can afford to fail: it is optional, the cover
 * exists without it, and the customer can simply register again later. A
 * CLAIM cannot. It is filed by someone whose projector has stopped working,
 * it is often the only message they will send, and a claim that evaporates
 * into a 502 is a customer who concludes the warranty is a fiction.
 *
 * So this route tries the Apps Script first — the Sheet is where support
 * actually works, with a status column and a Claims tab — and falls back to
 * delivering the same claim as an email through Web3Forms, the mechanism
 * every other form on this site already uses. Either one landing is enough
 * to tell the customer their claim is in.
 *
 * It reports success if, and only if, at least ONE of the two accepted it.
 * Both failing is an honest error with the support address in it, never a
 * success screen over nothing. See the note on `delivered` below.
 *
 * Same security as the registration route, for the same reasons: a 10 KB
 * body cap enforced while the body is read (lib/request-body.js), the
 * honeypot, server-side revalidation of every field, and an allow-list on
 * the Apps Script URL so a misconfigured env var cannot turn this into an
 * open proxy for customer data.
 */

const MAX_REQUEST_BYTES = 10 * 1024;

/** Room for a real account of a fault, and a ceiling so a cell stays a cell. */
const MAX_DESCRIPTION_CHARS = 4000;

function errorResponse(message, status) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function isValidText(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 200;
}

/** The same allow-list as app/api/warranty-registration/route.js. */
function getAppsScriptUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:'
      || url.hostname !== 'script.google.com'
      || !/^\/macros\/s\/[^/]+\/exec\/?$/.test(url.pathname)
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Write the claim to the Claims tab. Returns true only on a confirmed save.
 *
 * Every failure path — not configured, network, non-JSON, `saved !== true` —
 * is logged and returns false rather than throwing, because the caller's
 * whole job is to try the other destination next.
 */
async function saveToSheet(claim) {
  const appsScriptUrl = getAppsScriptUrl(process.env.GOOGLE_APPS_SCRIPT_URL);
  const apiToken = process.env.GOOGLE_APPS_SCRIPT_TOKEN;

  if (!appsScriptUrl || !apiToken) {
    console.error(
      '[BluNeuron] Claims sheet is not configured (GOOGLE_APPS_SCRIPT_URL / GOOGLE_APPS_SCRIPT_TOKEN); falling back to email.'
    );
    return false;
  }

  try {
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        apiToken,
        // The discriminator the updated Code.gs branches on. A deployment of
        // the OLD script ignores it and treats the payload as a
        // registration — which it would then reject as invalid, because a
        // claim has no purchase date or purchase source. That is the
        // intended behaviour: the email fallback below catches it, and no
        // claim is written into the Registrations tab by mistake.
        type: 'claim',
        claimRef: claim.claimRef,
        fullName: claim.name,
        email: claim.email,
        phoneNumber: claim.phone,
        orderId: claim.orderId,
        serialNumber: claim.serialNumber,
        issueType: claim.issueType,
        description: claim.description,
      }),
      cache: 'no-store',
    });

    const result = await response.json();
    if (!response.ok || result?.saved !== true) {
      console.error(
        '[BluNeuron] Apps Script could not save the warranty claim:',
        typeof result?.error === 'string' ? result.error : `HTTP ${response.status}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('[BluNeuron] Apps Script claim request failed:', error);
    return false;
  }
}

/**
 * Deliver the claim to the support inbox through Web3Forms.
 *
 * The access key is `NEXT_PUBLIC_WEB3FORMS_KEY` — inlined by `next build`, so
 * it is readable here on the server exactly as it is in the browser bundle.
 * That is fine and is what the variable is for: a Web3Forms access key
 * carries no privilege beyond "deliver a form to this inbox", which is why
 * every other form on this site posts to it straight from the client.
 */
async function sendByEmail(claim) {
  const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;
  if (!accessKey) {
    console.error('[BluNeuron] NEXT_PUBLIC_WEB3FORMS_KEY is not set; cannot email the claim.');
    return false;
  }

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `Warranty claim ${claim.claimRef} — ${claim.issueType}`,
        from_name: 'BluNeuron website',
        name: claim.name,
        email: claim.email,
        phone: claim.phone,
        claim_reference: claim.claimRef,
        order_id: claim.orderId,
        serial_number: claim.serialNumber,
        issue_type: claim.issueType,
        message:
          `Warranty claim ${claim.claimRef}\n\n`
          + `This claim could NOT be written to the Claims sheet and was delivered by email `
          + `instead. Add it to the sheet by hand so it is not lost.\n\n`
          + `Name: ${claim.name}\n`
          + `Email: ${claim.email}\n`
          + `Phone: ${claim.phone}\n`
          + `Order ID: ${claim.orderId}\n`
          + `Serial number: ${claim.serialNumber}\n`
          + `Issue: ${claim.issueType}\n\n`
          + `Description:\n${claim.description}`,
        source: 'warranty-claim-fallback',
        botcheck: false,
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      console.error(
        '[BluNeuron] Web3Forms could not deliver the warranty claim:',
        result?.message || `HTTP ${response.status}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('[BluNeuron] Web3Forms claim request failed:', error);
    return false;
  }
}

export async function POST(request) {
  // Counted off the stream, not taken from `content-length` — same cap, same
  // 10 KB, but a chunked request with no length header can no longer skip
  // it. See lib/request-body.js.
  const read = await readJsonBody(request, MAX_REQUEST_BYTES);
  if (!read.ok) {
    return read.status === 413
      ? errorResponse('The claim form is too large.', 413)
      : errorResponse('Invalid claim data.', 400);
  }
  const body = read.value;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return errorResponse('Invalid claim data.', 400);
  }
  if (body.botcheck) {
    return errorResponse('Submission blocked.', 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
  const serialNumber = typeof body.serialNumber === 'string' ? body.serialNumber.trim() : '';
  const issueType = body.issueType;
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  // Minted here when the browser's is missing or malformed, exactly as the
  // registration id is. The reference is not a capability — see
  // newClaimReference in lib/warranty.js.
  const claimRef = isValidClaimReference(body.claimRef) ? body.claimRef : newClaimReference();

  if (
    !isValidText(name)
    || !isValidEmail(email)
    || !normalizePhone(phone)
    || !isValidText(orderId)
    || !isValidText(serialNumber)
    || !WARRANTY_ISSUE_TYPES.includes(issueType)
    || description.length < CLAIM_DESCRIPTION_MIN
    || description.length > MAX_DESCRIPTION_CHARS
  ) {
    return errorResponse('Please check the required claim details and try again.', 400);
  }

  const claim = {
    claimRef,
    name,
    email,
    phone: normalizePhone(phone),
    orderId,
    serialNumber,
    issueType,
    description,
  };

  /**
   * SHEET FIRST, THEN EMAIL — and the email is only attempted if the Sheet
   * did not take it.
   *
   * Sending both every time would double every claim in the support inbox
   * and train whoever reads it to ignore the mail, which is exactly the
   * habit that loses the one claim the Sheet dropped.
   */
  const savedToSheet = await saveToSheet(claim);
  const emailed = savedToSheet ? false : await sendByEmail(claim);

  if (!savedToSheet && !emailed) {
    // Both destinations failed. The customer is told the truth and given a
    // channel that does not depend on either, with their reference so the
    // conversation can start from it. NEVER a success screen over this.
    console.error(`[BluNeuron] Warranty claim ${claimRef} could not be delivered by any route.`);
    return errorResponse(
      `We could not submit your claim just now. Please email ${SUPPORT.email} with your order ID and serial number, and quote ${claimRef}.`,
      502
    );
  }

  return NextResponse.json({ success: true, claimRef });
}

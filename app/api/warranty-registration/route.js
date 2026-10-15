import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isValidEmail, normalizePhone } from '@/lib/web3forms';
import { SUPPORT_PURCHASE_SOURCES } from '@/lib/site-config';

export const runtime = 'nodejs';

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
        registrationId: randomUUID(),
        fullName: name,
        email,
        phoneNumber: normalizePhone(phone),
        purchaseSource,
        orderId,
        purchaseDate,
        serialNumber,
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

  return NextResponse.json({ success: true });
}

import { parseSerial } from './club-serial';

/**
 * Warranty facts — the cover period, the lists the policy page renders, the
 * purchase sources the forms offer, and the issue types a claim can name.
 *
 * ONE source of truth, deliberately. The cover period is quoted on
 * /legal/warranty, on /support/warranty-registration, on
 * /support/warranty-claim and in the "Covered until" date on the registration
 * success screen. Four surfaces, one number — a warranty whose length differs
 * between two pages of the same site is not a document anyone can rely on.
 *
 * The prose in COVERAGE and EXCLUSIONS is the text of the supplied BluNeuron
 * warranty document, carried over from the `launch-site` branch verbatim.
 * It is not to be paraphrased, trimmed or "tightened" here: it is the term a
 * buyer is held to, and the printed warranty card in the box says the same
 * thing. Changing it is a legal decision, not an editorial one.
 *
 * WHY THIS FILE AND NOT lib/site-config.js. The `launch-site` branch keeps
 * these values in a ~600-line lib/site-config.js alongside pricing, manuals,
 * direct-sales flags and marketplace config, none of which this branch has or
 * needs. Porting the whole file would drag that surface onto the live site to
 * get at one object. This is the warranty subset, with the same values under
 * the same names, so the two branches can be diffed field by field.
 */

/**
 * ===================================================================
 * NOT THE PUBLISHED WARRANTY. lib/site-config.js holds that one.
 * ===================================================================
 *
 * Nothing renders this object any more. /legal/warranty, /shop/iriz, /shop,
 * /about, /specs and both warranty forms all read WARRANTY from
 * lib/site-config.js, which carries the terms that were published on
 * 24 October 2026 — a different document from the one below, with different
 * exclusions, a different service model and a 48-hour on-arrival window.
 *
 * WHY IT IS STILL HERE: this file is the warranty subset the `cloudflare`
 * branch carries so the two branches can be diffed field by field, and
 * app/api/warranty-claim/route.js imports WARRANTY_ISSUE_TYPES, SUPPORT and
 * the claim-reference helpers further down. Deleting the object would be
 * tidier and would also delete the record of what the live site said before.
 *
 * DO NOT RENDER IT, and do not "sync" it by hand. If a page needs the
 * warranty, it imports from lib/site-config.js. Two objects both claiming to
 * be the warranty is how two pages of one site come to disagree about how
 * long the cover runs — which is the exact bug this go-live fixed.
 */
export const WARRANTY = {
  months: 12,
  /** The tenure as a reader says it, for prose that would rather not say "12 months". */
  label: '1 year',
  coverage: [
    'Defects in materials and workmanship under normal use, for the whole cover period.',
    'Repair or replacement of the defective unit or part, once the defect is verified by authorised BluNeuron personnel — which of the two is at BluNeuron’s discretion.',
    'Genuine BluNeuron units bought in India from BluNeuron or an authorised seller.',
    'The original purchaser, holding a valid tax invoice. The cover is not transferable.',
  ],
  exclusions: [
    'Physical damage, scratches, liquid ingress, or modification of the body, software or internal circuitry.',
    'Damage from improper installation, neglect, misuse, mishandling, electrical surges, abnormal voltage, lightning, or acts of God.',
    'Repairs or service attempted by anyone other than an authorised technician.',
    'Use of non-standard, substandard or incompatible accessories — adapters and power cables that do not meet the specified electrical ratings in particular.',
    'Units whose serial number has been altered, defaced or removed.',
    'Standard wear and tear, and consumables such as remote controls, batteries, power cords and connecting cables, unless they were dead on arrival.',
  ],
  /** Where a claim is handled: by us, or through the marketplace's process. */
  claimRoute:
    'by BluNeuron directly — this is a return-to-factory warranty, carried in to an authorised service centre or our central warehouse',
  /**
   * Who pays which leg of a service shipment. Two separate answers, so the
   * page cannot state one and imply the other.
   */
  inboundShipping:
    'The customer sends or carries the unit to the authorised service centre or central warehouse, at their own cost and risk.',
  returnShipping:
    'BluNeuron pays to send the repaired or replaced unit back, and carries the transit risk on that leg.',
};

/** The registered entity, as the policy pages name it. */
export const COMPANY = {
  legalName: 'Bluneuron Technologies',
  registeredAddress:
    '319, Sri Ram Nagar 3rd Street, V.K. Village, Peelamedu, Coimbatore, Tamil Nadu 641004, India',
  jurisdiction: 'Coimbatore, Tamil Nadu, India',
};

/**
 * Support channels. There is NO helpline, and nothing here may imply one —
 * a masked number on a live support page reads as a real channel that is
 * merely hard to dial, and someone with a dead unit will waste an evening on
 * it. Email only, until there is a number that answers.
 */
export const SUPPORT = {
  email: 'support@bluneuron.com',
  hours: 'Monday–Saturday, 10:00 AM – 6:00 PM IST',
};

/** The product a registration is for. One model, so it is not a form field. */
export const PRODUCT_LABEL = 'IRIZ · BNA-510SH';

/**
 * Where a customer could have bought the unit, as the forms offer it.
 *
 * "Other seller" is kept, and it matters. Dropping it leaves anyone who
 * bought from an unauthorised reseller with no truthful option — so they pick
 * Amazon, and the registration becomes worse than useless: a wrong provenance
 * recorded with conviction. The policy covers units from BluNeuron or an
 * authorised seller only, so an "Other seller" registration is ACCEPTED and
 * FLAGGED for a human to verify rather than refused at the form. Refusing it
 * at the form teaches people to lie to it.
 *
 * Mirrored by PURCHASE_SOURCES in Code.gs and revalidated in
 * app/api/warranty-registration/route.js, so an option cannot be smuggled
 * past the form by posting the value directly.
 */
export const SUPPORT_PURCHASE_SOURCES = ['Amazon', 'Flipkart', 'Other seller'];

/** Sources whose provenance we can verify from our own records. */
export const AUTHORISED_PURCHASE_SOURCES = ['Amazon', 'Flipkart'];

/** Does this registration need a human to confirm where it came from? */
export function purchaseSourceNeedsVerification(source) {
  return !AUTHORISED_PURCHASE_SOURCES.includes(source);
}

/**
 * What a claim says is wrong, as a closed list.
 *
 * A controlled vocabulary rather than free text for the category, because
 * this column is what support sorts the Claims tab by. The free-text
 * description beside it is where the actual detail goes, and it is required —
 * a row reading only "Picture" is not a claim anyone can act on.
 *
 * Mirrored by ISSUE_TYPES in Code.gs and revalidated in
 * app/api/warranty-claim/route.js.
 */
export const WARRANTY_ISSUE_TYPES = [
  'No power',
  'Picture',
  'Sound',
  'Remote',
  'Wi-Fi',
  'Other',
];

/** A claim description shorter than this is not a claim anyone can act on. */
export const CLAIM_DESCRIPTION_MIN = 20;

/**
 * Claim references: `CLM-XXXX-XXXX`.
 *
 * Short enough to read down a phone, type into an email and quote back, which
 * a UUID is not — this is the string a customer will be asked for, so it is
 * built for a human rather than for a database.
 *
 * The alphabet omits I, O, 0 and 1. Those four are the entire reason a
 * reference gets mistyped when it is read off a screen and typed into a
 * reply, and dropping them costs 4 of 36 symbols: 32^8 is still ~1.1 trillion
 * combinations, so a collision across the whole life of the product is
 * negligible. Digits of entropy, not a counter, so a reference also reveals
 * nothing about how many claims have been filed.
 *
 * It is NOT a secret and NOT a capability. It grants nothing, reads nothing,
 * and the Sheet row it names can only be reached by someone with access to
 * the Sheet. The server revalidates the shape (see
 * app/api/warranty-claim/route.js) and falls back to minting its own.
 */
const CLAIM_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const CLAIM_REFERENCE_PATTERN = /^CLM-[23456789A-HJ-NP-Z]{4}-[23456789A-HJ-NP-Z]{4}$/;

export function newClaimReference() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  // `% 32` is unbiased here precisely because the alphabet is 32 long and
  // 256 is a whole multiple of it — the usual modulo-bias caveat does not
  // apply. Shortening the alphabet would reintroduce it.
  const chars = [...bytes].map((b) => CLAIM_ALPHABET[b % CLAIM_ALPHABET.length]);
  return `CLM-${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
}

export function isValidClaimReference(value) {
  return typeof value === 'string' && CLAIM_REFERENCE_PATTERN.test(value);
}

/**
 * When cover ends: the purchase date plus the cover period, MINUS A DAY.
 *
 * The minus-a-day is the whole point of the function. Cover bought on
 * 1 Jan 2026 runs through 31 Dec 2026, not into 1 Jan 2027 — a year from a
 * date is the day before the same date next year, and printing the anniversary
 * itself over-promises by a day on the one screen a customer screenshots.
 *
 * Built in UTC from a `yyyy-mm-dd` string and read back the same way, so it
 * cannot drift by a day for a visitor in a timezone behind or ahead of India.
 * Returns null for anything that is not a real date, and every caller is
 * expected to render nothing rather than guess.
 */
export function coveredUntil(purchaseDate, months = WARRANTY.months) {
  if (typeof purchaseDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
    return null;
  }
  const start = new Date(`${purchaseDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start);
  // setUTCMonth clamps a short month for us: 31 Aug + 6 months is 28/29 Feb,
  // not 2/3 March, which is the answer a reader expects from "six months".
  end.setUTCMonth(end.getUTCMonth() + months);
  end.setUTCDate(end.getUTCDate() - 1);
  return end;
}

/** "14 October 2027" — the long form the success screen and policy pages use. */
export function formatLongDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * ===========================================================================
 * THE INVOICE NUMBER — what used to be called the "order ID".
 * ===========================================================================
 * One rule, in one place, because four callers have to agree on it exactly:
 * components/SupportForm (what the visitor is told), the two API routes
 * (what the server accepts), and Code.gs (what the Sheet accepts). Any one of
 * them being looser than the others is a row the next one rejects.
 *
 * WHY THE RENAME. "Order ID" is Amazon's and Flipkart's word for the order,
 * and an order can contain several items and several invoices. What a claim
 * is actually assessed against is the TAX INVOICE — /legal/warranty says so
 * — and the number printed on it is what support needs to find the purchase.
 * People were typing order IDs, which are not on the invoice, and support was
 * asking for the invoice number a second time by email.
 *
 * THE CHARSET: letters, digits, and `-` `/` `.` only. That covers an Amazon
 * invoice number, a Flipkart `FAABCD2601234567`, and the `BN/2026-27/0042`
 * shape a dealer's book uses. It deliberately excludes spaces and everything
 * else: a value with a space in it is almost always two fields pasted into
 * one, and the Sheet column is read by a human looking for an exact match.
 *
 * 4 TO 40 CHARACTERS. Four, because nothing shorter is a real invoice number
 * and a one-character value was being accepted before this. Forty, because
 * the longest real one seen is sixteen and the cap is a cell, not a document.
 */
export const INVOICE_NO_MIN = 4;
export const INVOICE_NO_MAX = 40;
export const INVOICE_NO_PATTERN = /^[A-Za-z0-9\-/.]+$/;

/**
 * A generic example, in the shape of a Flipkart invoice number.
 *
 * NOT A REAL ONE. It is a plausible-looking string with no order behind it,
 * for the same reason SERIAL_EXAMPLE in lib/club-serial.js is a serial that
 * is not in `club_serials`: a placeholder that is somebody's actual invoice
 * number is somebody's actual purchase on a public page.
 */
export const INVOICE_NO_EXAMPLE = 'FAABCD2601234567';

/** What the field says under itself, on every surface that renders it. */
export const INVOICE_NO_HINT =
  'Printed on your invoice from Flipkart, Amazon or the dealer you bought from.';

/**
 * The trimmed invoice number if it is acceptable, otherwise null.
 *
 * Trimming is part of the rule rather than something each caller does first:
 * a value pasted out of a PDF arrives with a trailing space surprisingly
 * often, and refusing it over whitespace is refusing a correct number.
 */
export function parseInvoiceNo(raw) {
  const value = String(raw ?? '').trim();
  if (value.length < INVOICE_NO_MIN || value.length > INVOICE_NO_MAX) return null;
  return INVOICE_NO_PATTERN.test(value) ? value : null;
}

/** The one sentence a bad invoice number gets, on every surface. */
export function invoiceNoError(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return 'Enter the invoice number from your invoice.';
  if (value.length < INVOICE_NO_MIN || value.length > INVOICE_NO_MAX) {
    return `An invoice number is ${INVOICE_NO_MIN}–${INVOICE_NO_MAX} characters.`;
  }
  return 'Use letters, digits, and - / . only.';
}

/**
 * ===========================================================================
 * THE SERIAL NUMBER ON A WARRANTY FORM — optional, and checked when given.
 * ===========================================================================
 * It was REQUIRED until now, and that was wrong in a way nobody noticed until
 * the Club shipped: units sold before the carton labels existed have no
 * printed serial at all, and their owners were being told to enter one. A
 * registration without a serial is still a useful registration — the invoice
 * number and the purchase date are what a claim is assessed against.
 *
 * So: optional. And when it IS given, it is held to the same check letter the
 * Club uses (lib/club-serial.js), because a serial recorded with a typo in it
 * is worse than a blank — support matches on it, and a wrong one sends them
 * looking for a unit that does not exist.
 *
 * THE RETURN SHAPE distinguishes the two kinds of "no serial":
 *   { ok: true,  value: null }      nothing was typed. Fine.
 *   { ok: true,  value: 'IRZ…' }    normalised, upper case, no spaces.
 *   { ok: false, value: null }      something was typed and it does not check.
 *
 * A bare `string | null` would collapse the first and the third, which is how
 * a mistyped serial becomes a silently empty cell.
 */
export function parseOptionalSerial(raw) {
  const typed = String(raw ?? '').trim();
  if (!typed) return { ok: true, value: null };

  const serial = parseSerial(typed);
  return serial ? { ok: true, value: serial } : { ok: false, value: null };
}

/** The one sentence a serial that does not check gets. */
export const SERIAL_ERROR =
  'That does not look right. Check each character against the sticker, or leave it blank.';

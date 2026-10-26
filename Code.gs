/**
 * BluNeuron warranty Sheet — registrations and claims.
 *
 * TWO request types arrive at this one deployment, discriminated by
 * `type` in the posted body:
 *
 *   "registration" (or ABSENT)  -> the "Warranty Registrations" tab
 *   "claim"                     -> the "Claims" tab
 *
 * `type` being optional is what makes this change safe to deploy. The site's
 * registration route has always posted a body with no `type` field, and a
 * body with no `type` is still treated as a registration — so the moment
 * this version goes live, every registration already in flight keeps working
 * exactly as it did.
 *
 * ===========================================================================
 * WHAT CHANGED IN THIS VERSION, AND WHY NONE OF IT BREAKS THE LIVE SITE
 * ===========================================================================
 * The site renamed its "Order ID" field to "Invoice number" — see
 * parseInvoiceNo in lib/warranty.js for why. The LIVE site at
 * www.bluneuron.com is a separate build deployed by hand, so for a while the
 * two will disagree about what the field is called. This script therefore:
 *
 *   1. ACCEPTS BOTH `invoiceNo` (the new site) and `orderId` (the live one)
 *      and writes either into the SAME column. Neither side has to be
 *      deployed in lockstep with the other.
 *
 *   2. VALIDATES THEM DIFFERENTLY, deliberately. `invoiceNo` is held to the
 *      new rule (4-40 characters, letters digits and - / . only) because the
 *      site that sends it enforces exactly that rule first. A payload that
 *      carries only `orderId` is a LEGACY payload and keeps the old, lenient
 *      rule (non-empty, at most 200 characters) — tightening it here would
 *      reject live submissions whose order IDs this script has been happily
 *      accepting for months, which is precisely the breakage to avoid.
 *
 *   3. TREATS THE SERIAL NUMBER AS OPTIONAL. It used to be required. Units
 *      sold before the carton labels existed have no printed serial, and
 *      their owners were being asked for one that does not exist. On a
 *      payload that carries `invoiceNo` — i.e. from the new site — a serial
 *      that IS given is held to the IRIZ check letter, the same arithmetic
 *      the Club uses (lib/club-serial.js). On a legacy payload it is stored
 *      as sent, for the same reason as (2).
 *
 *   4. RENAMES TWO COLUMN HEADERS IN PLACE: "Order ID" becomes "Invoice No"
 *      and "Serial number" becomes "Serial No". IN PLACE. No column moves,
 *      none is inserted in the middle, and nothing is appended at the end —
 *      the data those two columns already hold is the same data the renamed
 *      fields produce, and splitting one field across an old column and a
 *      new one would leave support looking in two places for one value.
 *      ensureHeaders() performs the rename itself on the first write after
 *      this version goes live; see the note on LEGACY_HEADER_ALIASES.
 *
 * DEPLOY THIS AS A NEW VERSION OF THE EXISTING DEPLOYMENT, never as a new
 * deployment. The /exec URL is stored in the site's GOOGLE_APPS_SCRIPT_URL
 * secret; a new deployment mints a new URL and the site would keep posting
 * at the old one.
 */

const SHEET_NAME = "Warranty Registrations";
const HEADERS = [
  "Registration ID",
  "Full name",
  "Email",
  "Phone number",
  "Where you bought it",
  "Invoice No",
  "Purchase date",
  "Serial No",
  "Needs verification",
  "Registered at"
];
// Kept in step with SUPPORT_PURCHASE_SOURCES in lib/site-config.js. "Other
// seller" is accepted and flagged rather than refused — the warranty covers
// units from BluNeuron or an authorised seller, so provenance needs a human
// check, but refusing the registration here would only teach people to pick
// "Amazon" and record a confident falsehood.
//
// "BluNeuron Website" stays listed so a direct sale validates the day the
// site takes payments (DIRECT_SALES_ENABLED in lib/site-config.js); until
// then the form never offers it.
const PURCHASE_SOURCES = ["Amazon", "Flipkart", "Other seller", "BluNeuron Website"];

/* ------------------------------------------------------------------ *
 * THE INVOICE NUMBER
 * ------------------------------------------------------------------ */

// Mirrors INVOICE_NO_MIN / MAX / PATTERN in lib/warranty.js. Letters, digits
// and `- / .` — enough for an Amazon invoice number, a Flipkart
// FAABCD2601234567, and the BN/2026-27/0042 shape a dealer's book uses.
const INVOICE_NO_MIN = 4;
const INVOICE_NO_MAX = 40;
const INVOICE_NO_PATTERN = /^[A-Za-z0-9\-/.]+$/;

/* ------------------------------------------------------------------ *
 * THE SERIAL NUMBER, AND ITS CHECK LETTER
 * ------------------------------------------------------------------ */

// A TRANSCRIPTION of checkLetter() in lib/club-serial.js, which is itself a
// transcription of the label script that PRINTS the serial on the carton
// sticker. Four copies of one algorithm now exist — the label script, the
// browser, the Worker, and this — and they must agree exactly, or a customer
// holding a real box is told their serial is wrong.
//
// Position-weighted sum modulo 23, weights 1..10 over the first ten
// characters. DO NOT "simplify" the weights: starting them at 0 produces a
// different letter for every serial and invalidates every carton printed.
const SERIAL_FULL_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SERIAL_CHECK_ALPHABET = "ABCDEFGHJKLMNPRSTUVWXYZ";  // no I, O or Q
const SERIAL_LENGTH = 11;

/* ------------------------------------------------------------------ *
 * CLAIMS
 * ------------------------------------------------------------------ */

const CLAIMS_SHEET_NAME = "Claims";
const CLAIM_HEADERS = [
  "Timestamp",
  "Claim reference",
  "Full name",
  "Email",
  "Phone number",
  "Invoice No",
  "Serial No",
  "Issue type",
  "Description",
  "Status"
];

// Kept in step with WARRANTY_ISSUE_TYPES in lib/warranty.js. A closed list,
// because this column is what support sorts the tab by; the free-text
// Description beside it is where the detail goes.
const ISSUE_TYPES = ["No power", "Picture", "Sound", "Remote", "Wi-Fi", "Other"];

// Every new claim lands as "New". The column is here so support can move it
// along by hand (In progress / Resolved / Rejected) — a claims tab with no
// state is a list nobody can work from. Nothing in the site reads it back.
const CLAIM_INITIAL_STATUS = "New";

// Matches newClaimReference() in lib/warranty.js: CLM- plus two groups of
// four, from an alphabet with I, O, 0 and 1 removed so a reference read off
// a screen and typed into an email does not get mistyped.
const CLAIM_REFERENCE_PATTERN = /^CLM-[23456789A-HJ-NP-Z]{4}-[23456789A-HJ-NP-Z]{4}$/;

// A real account of a fault needs room; a cell still needs a ceiling.
const MAX_DESCRIPTION_CHARS = 4000;
const MIN_DESCRIPTION_CHARS = 20;

/**
 * OLD HEADER TEXT -> the header it is called now.
 *
 * This map IS the column rename. ensureHeaders() — and, since this version,
 * ensureClaimHeaders() too — reads every header currently in the sheet,
 * translates it through this map, and rewrites the header row with the
 * canonical names, carrying each existing row's values across BY NAME. So
 * nothing moves and nothing is lost: a sheet whose sixth column still says
 * "Order ID" is migrated to "Invoice No" on the next write, in place, with
 * no manual edit.
 *
 * "Invoice number" is in here as well as "Order ID": an even older revision
 * of this sheet used that spelling, and both now land on the same column.
 *
 * ADDING a column needs nothing here — the migration maps every existing row
 * onto the new HEADERS by name and fills anything it cannot find with "", so
 * a sheet created before a column existed is backfilled in place. RENAMING
 * one needs a line here, or the migration refuses rather than guessing which
 * old column the new name means.
 */
const LEGACY_HEADER_ALIASES = {
  "Order ID": "Invoice No",
  "Invoice number": "Invoice No",
  "Serial number": "Serial No",
  "Updated at": "Registered at"
};

function setup() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("Open this script from the target spreadsheet.");

  const properties = PropertiesService.getScriptProperties();
  properties.setProperty("SPREADSHEET_ID", spreadsheet.getId());

  let apiToken = properties.getProperty("API_TOKEN");
  if (!apiToken) {
    apiToken = Utilities.getUuid() + Utilities.getUuid();
    properties.setProperty("API_TOKEN", apiToken);
  }
  console.log("Set GOOGLE_APPS_SCRIPT_TOKEN in .env to: " + apiToken);
}

function doPost(event) {
  try {
    if (!event || !event.postData || !event.postData.contents) {
      return jsonResponse({ saved: false, error: "Missing registration data." });
    }

    const draft = JSON.parse(event.postData.contents);
    const properties = PropertiesService.getScriptProperties();
    if (!draft || draft.apiToken !== properties.getProperty("API_TOKEN")) {
      return jsonResponse({ saved: false, error: "Unauthorized request." });
    }

    // The branch. An ABSENT `type` is a registration — see the file header
    // for why that fallback is what makes this version safe to deploy.
    if (draft.type === "claim") {
      return handleClaim(draft, properties);
    }

    const invoiceNo = readInvoiceNo(draft);
    const serialNumber = readSerialNumber(draft);
    if (invoiceNo === null || serialNumber === null || !isValidDraft(draft)) {
      return jsonResponse({ saved: false, error: "Invalid registration data." });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const spreadsheetId = properties.getProperty("SPREADSHEET_ID");
      if (!spreadsheetId) throw new Error("Run setup() from the spreadsheet before deploying.");

      const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
      const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
      ensureHeaders(sheet);

      let rowNumber = 0;
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const match = sheet.getRange(2, 1, lastRow - 1, 1)
          .createTextFinder(draft.registrationId)
          .matchEntireCell(true)
          .findNext();
        if (match) rowNumber = match.getRow();
      }

      if (!rowNumber) {
        rowNumber = lastRow + 1;
      }

      const values = [[
        draft.registrationId,
        asPlainText(draft.fullName.trim()),
        asPlainText(draft.email.trim()),
        asPlainText(draft.phoneNumber.trim()),
        asPlainText(draft.purchaseSource),
        asPlainText(invoiceNo),
        asPlainText(draft.purchaseDate),
        // May be "" — the serial is optional now. An empty cell is the
        // honest record of a unit whose carton had no sticker.
        asPlainText(serialNumber),
        // "Yes"/"" rather than TRUE/FALSE: the column is forced to plain
        // text (setNumberFormat("@") below), so a boolean would land as the
        // string "true" and read as noise. A filled cell is scannable down a
        // column; an empty one is silent, which is the common case.
        draft.needsVerification ? "Yes" : "",
        new Date().toISOString()
      ]];
      const range = sheet.getRange(rowNumber, 1, 1, HEADERS.length);
      range.setNumberFormat("@");
      range.setValues(values);
      return jsonResponse({ saved: true });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return jsonResponse({ saved: false, error: "Could not write to the warranty sheet." });
  }
}

/**
 * Append one claim to the Claims tab, creating the tab and its header row
 * the first time.
 *
 * APPEND-ONLY, unlike a registration. A registration is de-duplicated on its
 * Registration ID so a retry overwrites its own row — the right behaviour
 * for a record of a fact that does not change. A claim is an EVENT: the same
 * unit can be claimed on twice, and the second claim must not silently
 * replace the first. So each one gets a new row, and the reference is there
 * to tell them apart rather than to collapse them.
 *
 * Takes the same script lock the registration path does, so two submissions
 * arriving together cannot compute the same target row and have one
 * overwrite the other.
 */
function handleClaim(draft, properties) {
  const invoiceNo = readInvoiceNo(draft);
  const serialNumber = readSerialNumber(draft);
  if (invoiceNo === null || serialNumber === null || !isValidClaim(draft)) {
    return jsonResponse({ saved: false, error: "Invalid claim data." });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const spreadsheetId = properties.getProperty("SPREADSHEET_ID");
    if (!spreadsheetId) throw new Error("Run setup() from the spreadsheet before deploying.");

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(CLAIMS_SHEET_NAME)
      || spreadsheet.insertSheet(CLAIMS_SHEET_NAME);
    ensureClaimHeaders(sheet);

    const rowNumber = Math.max(sheet.getLastRow(), 1) + 1;
    const values = [[
      // Asia/Kolkata, not the script's own timezone and not an ISO UTC
      // string: this column is read by a person in India deciding how old a
      // claim is, and a UTC timestamp is five and a half hours of mental
      // arithmetic on every row.
      Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss"),
      asPlainText(draft.claimRef),
      asPlainText(String(draft.fullName).trim()),
      asPlainText(String(draft.email).trim()),
      asPlainText(String(draft.phoneNumber).trim()),
      asPlainText(invoiceNo),
      asPlainText(serialNumber),
      asPlainText(draft.issueType),
      asPlainText(String(draft.description).trim()),
      CLAIM_INITIAL_STATUS
    ]];

    const range = sheet.getRange(rowNumber, 1, 1, CLAIM_HEADERS.length);
    // Plain text for the whole row, as the registration path does. Without
    // it a serial number like 00123 loses its leading zeros and an invoice
    // number that looks like a date is reformatted into one.
    range.setNumberFormat("@");
    range.setValues(values);
    return jsonResponse({ saved: true, claimRef: draft.claimRef });
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------ *
 * READING THE TWO FIELDS THAT CHANGED
 * ------------------------------------------------------------------ */

/**
 * The invoice number, under either name, or null if it is unacceptable.
 *
 * `invoiceNo` wins when both are present — the updated site sends both, with
 * the same value, precisely so that this script and the site can be deployed
 * independently of each other.
 *
 * TWO RULES, ONE FIELD, and that is the point:
 *
 *   `invoiceNo` present   STRICT. 4-40 characters, letters digits and - / .
 *                         The site that sends this key has already applied
 *                         exactly this rule (parseInvoiceNo in
 *                         lib/warranty.js), so anything failing here is a
 *                         direct POST rather than a customer.
 *
 *   `orderId` only        LEGACY, and lenient: non-empty, at most 200
 *                         characters, as this script has always accepted.
 *                         The live site has been sending order IDs under the
 *                         old rule for months and some of them will not pass
 *                         the strict one. Applying it to them would reject
 *                         real registrations from a site nobody had changed.
 *
 * Returns the trimmed string, or null to reject.
 */
function readInvoiceNo(draft) {
  if (typeof draft.invoiceNo === "string") {
    const value = draft.invoiceNo.trim();
    if (value.length < INVOICE_NO_MIN || value.length > INVOICE_NO_MAX) return null;
    return INVOICE_NO_PATTERN.test(value) ? value : null;
  }

  if (typeof draft.orderId === "string") {
    const value = draft.orderId.trim();
    if (!value || draft.orderId.length > 200) return null;
    return value;
  }

  return null;
}

/**
 * The serial number — OPTIONAL — or null if what was sent is unacceptable.
 *
 * Returns "" when nothing was sent, which is a valid answer and lands as an
 * empty cell. Returns null only to REJECT the whole submission.
 *
 * The check letter is enforced only on a payload that carries `invoiceNo`,
 * i.e. one from the updated site. A legacy payload's serial is stored as
 * sent: the live site requires a serial and has never check-lettered it, so
 * some of what it has been sending is a factory serial in another format
 * entirely, and refusing those would break the live site to enforce a rule
 * it has never been told about.
 */
function readSerialNumber(draft) {
  const raw = typeof draft.serialNumber === "string" ? draft.serialNumber.trim() : "";
  if (!raw) return "";
  if (raw.length > 200) return null;

  const isFromUpdatedSite = typeof draft.invoiceNo === "string";
  if (!isFromUpdatedSite) return raw;

  const serial = normalizeSerial(raw);
  return isValidSerial(serial) ? serial : null;
}

/** Upper case, with spaces and dashes thrown away. Mirrors lib/club-serial.js. */
function normalizeSerial(raw) {
  return String(raw === null || raw === undefined ? "" : raw)
    .toUpperCase()
    .replace(/[\s-]+/g, "");
}

/** The check letter for the first ten characters of a serial, or null. */
function serialCheckLetter(firstTen) {
  if (typeof firstTen !== "string" || firstTen.length !== SERIAL_LENGTH - 1) return null;

  let sum = 0;
  for (let i = 0; i < SERIAL_LENGTH - 1; i += 1) {
    const value = SERIAL_FULL_ALPHABET.indexOf(firstTen.charAt(i));
    if (value === -1) return null;
    sum += (i + 1) * value;
  }
  return SERIAL_CHECK_ALPHABET.charAt(sum % SERIAL_CHECK_ALPHABET.length);
}

/** Is this a well-formed IRIZ serial? Takes an already-normalised string. */
function isValidSerial(serial) {
  if (typeof serial !== "string" || serial.length !== SERIAL_LENGTH) return false;
  const expected = serialCheckLetter(serial.slice(0, SERIAL_LENGTH - 1));
  return expected !== null && serial.charAt(SERIAL_LENGTH - 1) === expected;
}

/**
 * Revalidate the claim here, independently of the site.
 *
 * The web route checks the same things, and this checks them again — the
 * deployment is reachable by anyone holding the token, so "the site already
 * validated it" is an assumption this script cannot make.
 *
 * The invoice number and the serial are NOT checked here: readInvoiceNo and
 * readSerialNumber own those two, because each has a legacy spelling and a
 * current one and the rule differs between them. The caller runs all three.
 */
function isValidClaim(draft) {
  const shortFields = [draft.fullName, draft.email, draft.phoneNumber];
  const shortFieldsAreValid = shortFields.every(function (value) {
    return typeof value === "string" && value.trim().length > 0 && value.length <= 200;
  });

  const hasValidRef = typeof draft.claimRef === "string"
    && CLAIM_REFERENCE_PATTERN.test(draft.claimRef);
  const hasValidEmail = typeof draft.email === "string"
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim());
  const hasValidPhone = typeof draft.phoneNumber === "string"
    && /^(?:[6-9]\d{9}|0[6-9]\d{9}|91[6-9]\d{9})$/.test(draft.phoneNumber.replace(/\D/g, ""));
  const hasValidIssue = ISSUE_TYPES.indexOf(draft.issueType) !== -1;
  const description = typeof draft.description === "string" ? draft.description.trim() : "";
  const hasValidDescription = description.length >= MIN_DESCRIPTION_CHARS
    && description.length <= MAX_DESCRIPTION_CHARS;

  return hasValidRef
    && shortFieldsAreValid
    && hasValidEmail
    && hasValidPhone
    && hasValidIssue
    && hasValidDescription;
}

/* ------------------------------------------------------------------ *
 * HEADER MIGRATION
 * ------------------------------------------------------------------ */

/**
 * Bring one sheet's header row up to `headers`, carrying existing rows
 * across BY NAME.
 *
 * SHARED BY BOTH TABS SINCE THIS VERSION. The Claims tab used to REFUSE any
 * header row that did not match exactly — reasonable while this script was
 * the only thing that had ever written it, and wrong the moment a column is
 * renamed, because it would then throw on every claim instead of migrating.
 *
 * What it does:
 *   - an empty sheet gets the header row written;
 *   - each existing header is translated through LEGACY_HEADER_ALIASES, so a
 *     renamed column is recognised as the column it used to be;
 *   - every data row is remapped onto the new header order BY NAME, with ""
 *     for a column that did not exist before;
 *   - any columns past the end of `headers` are cleared;
 *   - an unrecognised header, a duplicate, or a missing one of
 *     `requiredHeaders` throws rather than guessing — losing a column of
 *     customer data to a clever guess is not a recoverable mistake.
 */
function ensureSheetHeaders(sheet, headers, requiredHeaders, label) {
  const lastColumn = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();

  if (!lastColumn) {
    if (lastRow > 1) throw new Error("The " + label + " sheet has data but no header row.");
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return;
  }

  const existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  const allHeadersEmpty = existingHeaders.every(function (value) { return !value; });
  if (allHeadersEmpty) {
    if (lastRow > 1) throw new Error("The " + label + " sheet has data but no header row.");
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return;
  }

  const sourceIndexes = {};
  existingHeaders.forEach(function (header, index) {
    const canonicalHeader = LEGACY_HEADER_ALIASES[header] || header;
    if (!canonicalHeader || canonicalHeader === "Revision") return;
    if (headers.indexOf(canonicalHeader) === -1) {
      throw new Error("The " + label + " sheet has unexpected column headers.");
    }
    if (sourceIndexes[canonicalHeader] !== undefined) {
      throw new Error("The " + label + " sheet has duplicate column headers.");
    }
    sourceIndexes[canonicalHeader] = index;
  });

  const hasRequired = requiredHeaders.every(function (header) {
    return sourceIndexes[header] !== undefined;
  });
  if (!hasRequired) {
    throw new Error("The " + label + " sheet has unexpected column headers.");
  }

  const headersMatch = existingHeaders.length === headers.length
    && headers.every(function (header, index) { return existingHeaders[index] === header; });
  if (headersMatch) return;

  const previousRows = lastRow > 1
    ? sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues()
    : [];
  const migratedRows = previousRows.map(function (row) {
    return headers.map(function (header) {
      const sourceIndex = sourceIndexes[header];
      return sourceIndex === undefined ? "" : row[sourceIndex];
    });
  });
  sheet.getRange(1, 1, 1 + migratedRows.length, headers.length)
    .setValues([headers].concat(migratedRows));
  if (lastColumn > headers.length) {
    sheet.getRange(1, headers.length + 1, Math.max(lastRow, 1), lastColumn - headers.length)
      .clearContent();
  }
}

/**
 * The registration tab's headers.
 *
 * `requiredHeaders` is the set that must already be present for the sheet to
 * be recognised as this sheet at all. "Invoice No" appears under its NEW
 * name because the alias map translates "Order ID" to it before this check
 * runs — so an un-migrated sheet satisfies it, and a sheet belonging to some
 * other purpose does not.
 */
function ensureHeaders(sheet) {
  ensureSheetHeaders(
    sheet,
    HEADERS,
    ["Registration ID", "Full name", "Purchase date", "Invoice No", "Registered at"],
    "warranty"
  );
}

/** The Claims tab's headers, through the same migration. */
function ensureClaimHeaders(sheet) {
  ensureSheetHeaders(
    sheet,
    CLAIM_HEADERS,
    ["Timestamp", "Claim reference", "Full name", "Invoice No"],
    "Claims"
  );
}

/**
 * Revalidate the registration here, independently of the site.
 *
 * The invoice number and the serial are NOT checked here — readInvoiceNo and
 * readSerialNumber own those two. See the note on isValidClaim.
 */
function isValidDraft(draft) {
  const isUuid = typeof draft.registrationId === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draft.registrationId);
  const requiredFields = [
    draft.fullName,
    draft.email,
    draft.phoneNumber,
    draft.purchaseSource,
    draft.purchaseDate
  ];
  const fieldsAreValid = requiredFields.every(value =>
    typeof value === "string" && value.trim().length > 0 && value.length <= 200
  );
  const isValidEmail = typeof draft.email === "string"
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim());
  const isValidPhone = typeof draft.phoneNumber === "string"
    && /^(?:[6-9]\d{9}|0[6-9]\d{9}|91[6-9]\d{9})$/.test(draft.phoneNumber.replace(/\D/g, ""));
  const isValidPurchaseDate = typeof draft.purchaseDate === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(draft.purchaseDate)
    && !isNaN(new Date(draft.purchaseDate + "T00:00:00Z").getTime())
    && Utilities.formatDate(
      new Date(draft.purchaseDate + "T00:00:00Z"),
      "UTC",
      "yyyy-MM-dd"
    ) === draft.purchaseDate
    && draft.purchaseDate <= Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  return isUuid
    && fieldsAreValid
    && isValidEmail
    && isValidPhone
    && PURCHASE_SOURCES.includes(draft.purchaseSource)
    && isValidPurchaseDate;
}

function asPlainText(value) {
  return /^[=+@\-]/.test(value) ? "'" + value : value;
}

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

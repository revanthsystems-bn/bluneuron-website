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
 * exactly as it did. Nothing about the registration path below has changed:
 * same headers, same validation, same de-duplication on Registration ID,
 * same migration in ensureHeaders().
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
  "Order ID",
  "Purchase date",
  "Serial number",
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
 * CLAIMS
 * ------------------------------------------------------------------ */

const CLAIMS_SHEET_NAME = "Claims";
const CLAIM_HEADERS = [
  "Timestamp",
  "Claim reference",
  "Full name",
  "Email",
  "Phone number",
  "Order ID",
  "Serial number",
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
const LEGACY_HEADER_ALIASES = {
  "Invoice number": "Order ID",
  "Updated at": "Registered at"
};
// NOTE on adding a column, as "Needs verification" was: ensureHeaders()
// already migrates for you. It maps every existing row onto the new HEADERS
// by name and fills anything it cannot find with "", so a sheet created
// before the column existed is backfilled in place on the next write. No
// manual edit, and no separate list of optional headers to maintain.

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

    if (!isValidDraft(draft)) {
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
        asPlainText(draft.orderId.trim()),
        asPlainText(draft.purchaseDate),
        asPlainText(draft.serialNumber.trim()),
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
  if (!isValidClaim(draft)) {
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
      asPlainText(String(draft.orderId).trim()),
      asPlainText(String(draft.serialNumber).trim()),
      asPlainText(draft.issueType),
      asPlainText(String(draft.description).trim()),
      CLAIM_INITIAL_STATUS
    ]];

    const range = sheet.getRange(rowNumber, 1, 1, CLAIM_HEADERS.length);
    // Plain text for the whole row, as the registration path does. Without
    // it a serial number like 00123 loses its leading zeros and an order ID
    // that looks like a date is reformatted into one.
    range.setNumberFormat("@");
    range.setValues(values);
    return jsonResponse({ saved: true, claimRef: draft.claimRef });
  } finally {
    lock.releaseLock();
  }
}

/**
 * The Claims header row, written once.
 *
 * Deliberately simpler than ensureHeaders() for registrations: that one
 * migrates existing rows across a changed column set, because the
 * registration sheet predates several of its columns. The Claims tab is
 * created by this script with the headers it has, so there is no older
 * shape to migrate from. If a column is ever ADDED here, this will need the
 * same treatment — it currently refuses rather than guessing.
 */
function ensureClaimHeaders(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (!lastColumn || lastRow === 0) {
    sheet.getRange(1, 1, 1, CLAIM_HEADERS.length).setValues([CLAIM_HEADERS]);
    sheet.setFrozenRows(1);
    return;
  }

  const existing = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  if (existing.every(function (value) { return !value; })) {
    if (lastRow > 1) throw new Error("The Claims sheet has data but no header row.");
    sheet.getRange(1, 1, 1, CLAIM_HEADERS.length).setValues([CLAIM_HEADERS]);
    sheet.setFrozenRows(1);
    return;
  }

  const matches = CLAIM_HEADERS.every(function (header, index) {
    return existing[index] === header;
  });
  if (!matches) {
    throw new Error(
      "The Claims sheet has unexpected column headers. Expected: " + CLAIM_HEADERS.join(", ")
    );
  }
}

/**
 * Revalidate the claim here, independently of the site.
 *
 * The web route checks the same things, and this checks them again — the
 * deployment is reachable by anyone holding the token, so "the site already
 * validated it" is an assumption this script cannot make.
 */
function isValidClaim(draft) {
  const shortFields = [
    draft.fullName,
    draft.email,
    draft.phoneNumber,
    draft.orderId,
    draft.serialNumber
  ];
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

function ensureHeaders(sheet) {
  const lastColumn = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();
  if (!lastColumn) {
    if (lastRow > 1) throw new Error("The warranty sheet has data but no header row.");
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    return;
  }

  const existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  const allHeadersEmpty = existingHeaders.every(value => !value);
  if (allHeadersEmpty) {
    if (lastRow > 1) throw new Error("The warranty sheet has data but no header row.");
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    return;
  }

  const sourceIndexes = {};
  existingHeaders.forEach((header, index) => {
    const canonicalHeader = LEGACY_HEADER_ALIASES[header] || header;
    if (!canonicalHeader || canonicalHeader === "Revision") return;
    if (!HEADERS.includes(canonicalHeader)) {
      throw new Error("The warranty sheet has unexpected column headers.");
    }
    if (sourceIndexes[canonicalHeader] !== undefined) {
      throw new Error("The warranty sheet has duplicate column headers.");
    }
    sourceIndexes[canonicalHeader] = index;
  });

  const requiredExistingHeaders = [
    "Registration ID",
    "Full name",
    "Purchase date",
    "Order ID",
    "Registered at"
  ];
  if (!requiredExistingHeaders.every(header => sourceIndexes[header] !== undefined)) {
    throw new Error("The warranty sheet has unexpected column headers.");
  }

  const headersMatch = HEADERS.every((header, index) => existingHeaders[index] === header)
    && existingHeaders.length === HEADERS.length;
  if (headersMatch) return;

  const previousRows = lastRow > 1
    ? sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues()
    : [];
  const migratedRows = previousRows.map(row =>
    HEADERS.map(header => {
      const sourceIndex = sourceIndexes[header];
      return sourceIndex === undefined ? "" : row[sourceIndex];
    })
  );
  sheet.getRange(1, 1, 1 + migratedRows.length, HEADERS.length)
    .setValues([HEADERS, ...migratedRows]);
  if (lastColumn > HEADERS.length) {
    sheet.getRange(1, HEADERS.length + 1, Math.max(lastRow, 1), lastColumn - HEADERS.length)
      .clearContent();
  }
}

function isValidDraft(draft) {
  const isUuid = typeof draft.registrationId === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draft.registrationId);
  const requiredFields = [
    draft.fullName,
    draft.email,
    draft.phoneNumber,
    draft.purchaseSource,
    draft.orderId,
    draft.purchaseDate,
    draft.serialNumber
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

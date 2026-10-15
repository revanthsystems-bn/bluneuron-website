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

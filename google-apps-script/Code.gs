function doPost(e) {
  var payload = normalizePayload_(e);

  var name = (payload.name || "").trim();
  var emailPhone = (payload.email_phone || payload.contact || "").trim();
  var interest = (payload.interest || "").trim();
  var redirectUrl = (payload.redirect_url || "").trim();

  if (!name || !emailPhone || !interest) {
    return respondHtml_(
      "<h3>Missing required fields.</h3><p>Please go back and complete all required inputs.</p>"
    );
  }

  var sheet = getApplicantsSheet_();
  ensureHeaders_(sheet);

  var timestamp = new Date();
  var score = "";
  var status = "new";
  var notes = "";

  sheet.appendRow([name, emailPhone, interest, timestamp, score, status, notes]);

  if (redirectUrl) {
    return HtmlService.createHtmlOutput(
      '<!doctype html><html><head><meta http-equiv="refresh" content="0;url=' +
        sanitizeUrl_(redirectUrl) +
        '"></head><body>Redirecting...</body></html>'
    );
  }

  return respondJson_({
    success: true,
    message: "Submission recorded."
  });
}

function normalizePayload_(e) {
  if (!e) return {};

  if (e.parameter && Object.keys(e.parameter).length) {
    return e.parameter;
  }

  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      return {};
    }
  }

  return {};
}

function getApplicantsSheet_() {
  var ssId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!ssId) {
    throw new Error("Missing SPREADSHEET_ID script property.");
  }

  var ss = SpreadsheetApp.openById(ssId);
  var sheetName =
    PropertiesService.getScriptProperties().getProperty("SHEET_NAME") || "Applicants";
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  return sheet;
}

function ensureHeaders_(sheet) {
  var expected = ["Name", "Email/Phone", "Interest", "Timestamp", "Score", "Status", "Notes"];
  var firstRow = sheet.getRange(1, 1, 1, expected.length).getValues()[0];
  var hasHeaders = expected.every(function (value, idx) {
    return firstRow[idx] === value;
  });

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, expected.length).setValues([expected]);
  }
}

function sanitizeUrl_(url) {
  return String(url).replace(/"/g, "&quot;");
}

function respondHtml_(html) {
  return HtmlService.createHtmlOutput("<!doctype html><html><body>" + html + "</body></html>");
}

function respondJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

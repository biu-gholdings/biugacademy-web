# BIU.G Academy Applicant Pipeline (Google Sheets)

This pipeline logs waitlist form submissions into Google Sheets with these columns:

- Name
- Email/Phone
- Interest
- Timestamp
- Score
- Status
- Notes

`Score`, `Status`, and `Notes` are auto-created in the sheet header.

## 1) Create the Google Sheet

1. Create a Google Sheet for applicants.
2. Copy the spreadsheet ID from the URL.

## 2) Create Apps Script Web App

1. Go to [script.new](https://script.new).
2. Replace default code with `Code.gs` from this folder.
3. Open **Project Settings** -> **Script properties** and add:
   - `SPREADSHEET_ID` = your Google Sheet ID
   - `SHEET_NAME` = `Applicants` (or your preferred tab name)

## 3) Deploy

1. Click **Deploy** -> **New deployment**.
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Deploy and copy the Web App URL.

## 4) Connect Website Form

In `waitlist.html`, set:

```html
<form action="https://script.google.com/macros/s/REPLACE_WITH_DEPLOYED_SCRIPT_ID/exec" method="POST"></form>
```

Replace `REPLACE_WITH_DEPLOYED_SCRIPT_ID` with your deployment ID.

## 5) Redirect

The form includes:

```html
<input type="hidden" name="redirect_url" value="https://biugacademy.org/thank-you.html" />
```

After a successful write, the web app redirects users to that URL.

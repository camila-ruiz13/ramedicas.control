import "server-only";
import { google } from "googleapis";

// Service account JWT — the sheet must be shared with GOOGLE_SHEETS_CLIENT_EMAIL
// as Viewer for this to have read access. Read-only scope is enough since
// every module using this only ever reads report data, never writes back.
function getAuth() {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (!email || !key) {
    throw new Error(
      "Faltan GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SHEETS_PRIVATE_KEY en el .env",
    );
  }
  return new google.auth.JWT({
    email,
    // .env stores the key with literal "\n" escapes — real newlines are
    // required for the PEM to parse.
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

// Returns the raw grid (row 0 = headers) for one sheet tab, same shape as
// Google Apps Script's Sheet.getDataRange().getValues().
export async function getSheetValues(
  spreadsheetId: string,
  sheetName: string,
  // UNFORMATTED_VALUE (default): numbers stay numbers and dates come back as
  // Google Sheets serial-day numbers, which callers convert themselves (see
  // excelSerialToISODate in autorizacion-compras.ts) — safer than trusting a
  // per-cell display format to be ISO-sortable. FORMATTED_VALUE instead
  // returns everything as the string the sheet displays, which is what
  // cambios-precios.ts wants since its parsing (ported from the original
  // Apps Script's getDisplayValues()) already expects display strings.
  valueRenderOption: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" = "UNFORMATTED_VALUE",
): Promise<unknown[][]> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
    valueRenderOption,
  });
  return res.data.values ?? [];
}

// Lists tab names in sheet-order (matches ExcelJS's workbook.worksheets
// order) — callers use this to find "the first tab" or a tab by name
// without needing to hardcode gid/index, which shifts if tabs are reordered.
export async function getSheetTitles(spreadsheetId: string): Promise<string[]> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });
  return (res.data.sheets ?? []).map((s) => s.properties?.title ?? "").filter(Boolean);
}

# spec.md — CSV export for the report dashboard

## Goal
Let dashboard users download the current report as a CSV that opens cleanly in Excel and Google Sheets.

## Requirements

1. **Export button** appears in the dashboard toolbar, right of the existing "Refresh" button.
2. **Click triggers download** of a `.csv` file named `<report-slug>-<YYYY-MM-DD>.csv`.
3. **CSV content** matches the report's currently applied filters — not the full dataset.
4. **Column order** matches the on-screen table column order.
5. **Header row** is the column display names, not internal field IDs.
6. **Values are RFC 4180 escaped** — quotes doubled, fields with commas/newlines wrapped.
7. **Empty filter state** exports the full report.
8. **Reports >50k rows** show a "preparing export…" toast and stream the response.
9. **Errors** surface as a toast, not a silent failure.

## Out of scope (explicitly)
- XLSX export
- Scheduled / email exports
- Per-user export history

## Non-goals
- We are not changing the JSON endpoint.
- We are not adding column selection in v1.

## Done when
- All 9 requirements have a verification entry.
- A user can export a 100k-row report without the page freezing.

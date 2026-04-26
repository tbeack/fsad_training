# plan.md — CSV export

## Approach
Add a new `GET /api/reports/:id/export.csv` endpoint that reuses the existing report query. Stream the response when row count exceeds threshold. Front-end adds a button that calls the endpoint with current filter params.

## Tasks

1. **Backend: add CSV serializer wrapper**
   - File: `lib/serializers.py`
   - Reuse `to_csv()`; add `stream_csv()` for chunked output.
   - Acceptance: unit test covers empty, single row, 1k rows, special characters.

2. **Backend: add `/api/reports/:id/export.csv` endpoint**
   - File: `api/reports.py`
   - Reuse existing report query; pass `format='csv'` flag.
   - Stream when `row_count > 50_000`.
   - Acceptance: integration test against the staging report.

3. **Frontend: add Export button**
   - File: `src/dashboard/Toolbar.tsx`
   - Place right of Refresh; uses existing `IconButton`.
   - Triggers `<a download>` with current filter querystring.

4. **Frontend: streaming-aware loading state**
   - File: `src/dashboard/useExport.ts` (new)
   - Show toast on click; remove on download start.
   - Handle error toast.

5. **Verify cross-browser**
   - Chrome, Firefox, Safari latest.
   - Verify Excel + Google Sheets open the file cleanly.

## Files to touch
- `lib/serializers.py` — modify
- `api/reports.py` — modify
- `src/dashboard/Toolbar.tsx` — modify
- `src/dashboard/useExport.ts` — new
- `tests/api/test_reports_export.py` — new

## Risks
- 120k-row export could exceed default request timeout. Mitigation: streaming + raised timeout for this route.

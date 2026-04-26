# verification.md — CSV export

## Requirements check

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Export button in toolbar | ✅ | Screenshot: dashboard-toolbar.png |
| 2 | Click downloads `.csv` named `<slug>-<date>.csv` | ✅ | Manual: downloaded `q1-revenue-2026-04-25.csv` |
| 3 | Content matches active filters | ✅ | Test: `test_export_respects_filters` |
| 4 | Column order matches table | ✅ | Manual: side-by-side compare |
| 5 | Header row uses display names | ✅ | Test: `test_export_headers` |
| 6 | RFC 4180 escaping | ✅ | Test: `test_export_rfc4180` (commas, quotes, newlines) |
| 7 | Empty filters exports full report | ✅ | Manual: 120k-row download |
| 8 | >50k rows streams with toast | ✅ | Manual: network panel shows chunked response |
| 9 | Errors show toast | ✅ | Manual: forced 500, toast fired |

## Browser pass
- Chrome 134 ✅
- Firefox 128 ✅
- Safari 17.5 ✅

## Spreadsheet pass
- Excel for Mac ✅
- Google Sheets ✅
- Numbers ✅ (one quirk: opens with comma delimiter detected automatically)

## Performance
- 120k rows: 4.2s end-to-end ✅
- 1k rows: 180ms ✅
- Memory: no spike — streaming path confirmed ✅

## Outstanding
None blocking. Two items queued for iterate phase.

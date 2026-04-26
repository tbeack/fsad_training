# research.md — Add CSV export to the report dashboard

## What exists
- Dashboard at `src/dashboard/index.tsx` renders charts via `recharts`.
- Data fetched from `GET /api/reports/:id` (returns JSON, paginated).
- No existing export — users currently screenshot panels.
- One related ticket: BUG-412 "exported PNGs are illegible at large data sizes."

## What's known
- Volume: top-end report = ~120k rows, 18 columns.
- Auth: dashboard uses session cookie; same-origin works.
- Backend already has a `to_csv()` helper in `lib/serializers.py` used by the admin tool.

## What's unknown
- Do we need streaming for the 120k-row case, or is in-memory fine?
- Should the export honor the dashboard's active filters, or always export the full report?
- File naming convention — does product care?

## Constraints
- No new dependencies if avoidable.
- Must not change the existing JSON endpoint contract.
- Browser support: latest Chrome, Firefox, Safari.

## Next phase needs
- Decide: full report vs filtered export (PM call).
- Decide: streaming threshold (Eng call).

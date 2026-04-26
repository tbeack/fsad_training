# followup.md — CSV export, post-ship

## What we learned
- Streaming threshold of 50k was right. No reports we measured needed a lower threshold.
- The "preparing export…" toast felt slow at small sizes; users on <5k rows expected an instant download.
- Two product asks landed within a day of ship — both reasonable, neither in v1 spec.

## Queued for next loop

1. **Smart toast suppression** — skip the "preparing…" toast when row count is below ~5k. Trivial change to `useExport.ts`.
2. **Column selection** (deferred from v1 spec) — let users pick which columns to export. Needs a small UI affordance + querystring param.
3. **XLSX format** (deferred) — product re-confirmed they want it. Worth its own spec.

## Spec deltas
- Add NFR: "exports under 5k rows must not show preparation toast."
- Move "column selection" from out-of-scope to v2 scope.

## Open questions for next research phase
- Is XLSX worth the dependency cost (`openpyxl`), or do we punt to a lib we already have?
- Do enterprise customers want scheduled exports? (Sales has anecdotes; we don't have data.)

## Loop status
Ready to start a new loop on the column-selection follow-up. Research phase next.

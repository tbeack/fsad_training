# FSD_Train-025 — Add the word "context" to Step 1 in the workflow, renaming it "Research & Creating Context" in both "The Loop" section and the "Workflow Deep-Dive" section

## Source
Own idea — requested directly by the user.

## Summary
Step 1 of the six-phase workflow is currently labeled just "Research" in two places: the Section 1 "The Loop" overview cards and the Section 4 "Workflow Deep-Dive" stepper pill. Both need the label updated to "Research & Creating Context" to make explicit that context-gathering is part of that phase.

## Assessment
Two locations currently say "Research" for step 1:

- `src/index.html:2224` — Section 1 ("The Loop"), inside the six-card `.overview-grid`: `<h3>1 — Research</h3>` with body text `Map the territory. What exists, what's known, what's unknown. Output: a research note that anchors every decision downstream.`
- `src/index.html:2607-2610` — Section 4 ("Workflow Deep-Dive"), the stepper's first tab button:
  ```html
  <button class="deepdive-step active" role="tab" data-step="0" data-md="research" aria-selected="true">
    <span class="deepdive-step-num">01</span>
    <span class="deepdive-step-name">Research</span>
  </button>
  ```

Both are hand-edited in `src/index.html` — no markdown or build-step involvement for the label text itself. `dist/fsad-training.html` will need `npm run bundle` to pick up the change (source of truth is `src/index.html`, `dist/` is generated and committed).

Note: `data-step="0"` / `data-md="research"` are internal wiring (matching `src/markdown/01-research.md` and the JS stepper logic) — only the human-facing label text changes, not these attribute values.

## Plan

1. In `src/index.html:2224`, change `<h3>1 — Research</h3>` to `<h3>1 — Research & Creating Context</h3>`.
2. In `src/index.html:2609`, change `<span class="deepdive-step-name">Research</span>` to `<span class="deepdive-step-name">Research & Creating Context</span>`.
3. Leave `data-step`, `data-md="research"`, and the underlying `src/markdown/01-research.md` filename/id untouched — only the visible label text changes.
4. Run `npm run bundle` to regenerate `dist/fsad-training.html`.
5. Open `dist/fsad-training.html` and visually confirm both Section 1 ("The Loop") and Section 4 ("Workflow Deep-Dive") show the updated label, including that the stepper pill still renders legibly at its current width (it may wrap to two lines — check this reads acceptably rather than looking broken).

## Acceptance Criteria
All criteria verified 2026-09-01 before commit.
- [x] `src/index.html` Section 1 "The Loop" card for step 1 reads "1 — Research & Creating Context" (was "1 — Research").
- [x] `src/index.html` Section 4 "Workflow Deep-Dive" stepper's first pill reads "Research & Creating Context" (was "Research").
- [x] The stepper's `data-step="0"` and `data-md="research"` attributes are unchanged, and clicking/keyboard-navigating to step 1 still shows the correct research artifact pane.
- [x] `npm run bundle` completes with no errors or warnings, and `dist/fsad-training.html` reflects both label changes.
- [x] No other on-page occurrence of the old bare "Research" step-1 label remains in either section (spot-checked visually in the bundled file).

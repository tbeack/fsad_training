# FSD_Train-003 — Add hangman research example to Section 4 Research step

## Source
`FSD_Train-003` from `planning/to do/todo.md`. The Research step in the Section 4 deep-dive currently shows a generic CSV-export research note. Replace it with a real-world example: the PacHangman research prompt and its output.

## Summary
Replace `src/markdown/01-research.md` with the PacHangman research prompt the presenter used to kick off the research phase. Add a code block at the bottom showing the `demo/research/hangman_research.md` output. Link the output label to `demo/research/hangman_research.md` and provide a separate session-replay hyperlink.

Also removed the left description panel from the Section 4 stepper (`.deepdive-desc`) to simplify the layout — artifact pane now fills the full width.

## Assessment
**Current state:**
- `src/markdown/01-research.md` contains a fictional "Add CSV export" research note (generic placeholder).
- `demo/research/hangman_research.md` exists with full PacHangman research.
- The Section 4 stepper renders the `research` artifact in the right pane via `<!-- @@MD:research -->`.
- Left description panel (`.deepdive-desc`) and its CSS/JS have been removed.

**Work needed:**
1. Replace `src/markdown/01-research.md` with the presenter's research prompt as primary content, a code block rendering the research output, and links to `demo/research/hangman_research.md` and the session replay.
2. Run `npm run bundle` to regenerate `dist/fsad-training.html`.

## Acceptance Criteria

- [x] `demo/research/hangman_research.md` exists with full PacHangman research (rules, gameplay options, visual designs, word selection, missing considerations)
- [x] `src/markdown/01-research.md` shows the presenter's research prompt as the primary content
- [x] Code block at the bottom of `01-research.md` renders the `hangman_research.md` output
- [x] Output label links to `../demo/research/hangman_research.md` (relative to `dist/`)
- [x] Hyperlink to `../session-replay/Hangman - Start the Research and Spec.html` is present and labeled
- [x] Left description panel removed; artifact pane fills full width
- [x] `npm run bundle` completes with no errors
- [x] Research step in the Section 4 stepper displays the new content correctly

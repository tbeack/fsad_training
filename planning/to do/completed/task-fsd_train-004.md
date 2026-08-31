# FSD_Train-004 — Add hangman spec example to Section 4 Spec step

## Source
`FSD_Train-004` from `planning/to do/todo.md`. The Spec step in the Section 4 deep-dive currently shows a generic CSV-export spec. Replace it with the real-world PacHangman example: the prompt used to kick off the spec phase, the output spec file, and a session-replay link.

## Summary
Replace `src/markdown/02-spec.md` with the presenter's spec prompt, a code block at the bottom rendering the `demo/design/hangman_spec.md` output, and a hyperlink to the session replay.

## Assessment
**Current state:**
- `src/markdown/02-spec.md` contains a fictional "Add CSV export" spec (generic placeholder).
- `demo/design/hangman_spec.md` exists with the full PacHangman design specification.
- The Section 4 stepper renders the `spec` artifact in the right pane via `<!-- @@MD:spec -->`.

**Work needed:**
1. Replace `src/markdown/02-spec.md` with the presenter's spec prompt as primary content, a code block rendering the spec output, and links to `demo/design/hangman_spec.md` and the session replay.
2. Run `npm run bundle` to regenerate `dist/fsad-training.html`.

## Prompt used in the session
```
/plan
Next create a design document to develop the overall app experience and design choices. write the design/requirements to ./planning/design/hangman_spec.md.
```

## Acceptance Criteria

- [x] `demo/design/hangman_spec.md` exists with the full PacHangman design spec
- [x] `src/markdown/02-spec.md` shows the presenter's spec prompt as the primary content
- [x] Code block at the bottom of `02-spec.md` renders the `hangman_spec.md` output
- [x] Output label links to `../demo/design/hangman_spec.md` (relative to `dist/`)
- [x] Hyperlink to `../session-replay/Hangman%20-%20Start%20the%20Research%20and%20Spec.html` is present and labeled
- [x] `npm run bundle` completes with no errors
- [x] Spec step in the Section 4 stepper displays the new content correctly

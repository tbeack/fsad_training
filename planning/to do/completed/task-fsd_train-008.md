# FSD_Train-008 — Add todo.md example to Section 4 Iterate step

## Source
`FSD_Train-008` from `planning/to do/todo.md`. The Iterate step in the Section 4 deep-dive currently shows a generic `followup.md` CSV-export placeholder. Replace it with a real PacHangman `todo.md` that shows closing the v1 loop and queuing v2 work.

## Summary
Replace `src/markdown/06-iterate.md` with a realistic iterate-phase prompt, a link to `demo/plan/hangman_todo.md`, and a code block rendering that file's content.

## Assessment

**Current state:**
- `src/markdown/06-iterate.md` contains a fictional "CSV export followup.md" example.
- No `demo/plan/hangman_todo.md` exists yet.
- No session replay recorded for the iterate step.

**Work needed:**
1. Create `demo/plan/hangman_todo.md` showing the PacHangman project after v1 ship: all 8 phases marked complete, v2 backlog derived from deferred features in the spec.
2. Replace `src/markdown/06-iterate.md` with the iterate prompt + output link + code block rendering `hangman_todo.md`.
3. Run `npm run bundle`.

## Prompt to show in the step

```
Update `planning/todo.md` to:
- Mark phases 1–8 as complete
- Add a v2 backlog section with the deferred features from `planning/design/hangman_spec.md`
- Note any post-ship observations from the verify phase
```

## Acceptance Criteria

- [ ] `demo/plan/hangman_todo.md` exists with v1 complete + v2 backlog content
- [ ] `src/markdown/06-iterate.md` shows the iterate prompt as primary content
- [ ] A code block renders the full content of `hangman_todo.md`
- [ ] Output label links to `../demo/plan/hangman_todo.md`
- [ ] `npm run bundle` completes with no errors
- [ ] Iterate step in the Section 4 stepper displays the new content correctly

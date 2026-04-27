# FSD_Train-005 — Add hangman plan example to Section 4 Plan step

## Source
`FSD_Train-005` from `planning/to do/todo.md`. The Plan step in the Section 4 deep-dive currently shows a generic CSV-export plan. Replace it with the real-world PacHangman example: the prompt used to kick off the planning phase, the output plan file, and a session-replay link.

## Summary
Replace `src/markdown/03-plan.md` with the presenter's plan prompt, a code block at the bottom rendering the `demo/plan/hang_implementation_plan.md` output, and a hyperlink to the session replay.

## Assessment
**Current state:**
- `src/markdown/03-plan.md` contains a fictional "Add CSV export" plan (generic placeholder).
- `demo/plan/hang_implementation_plan.md` exists with the full PacHangman implementation plan.
- The Section 4 stepper renders the `plan` artifact in the right pane via `<!-- @@MD:plan -->`.

**Work needed:**
1. Replace `src/markdown/03-plan.md` with the presenter's plan prompt as primary content, a code block rendering the plan output, and links to `demo/plan/hang_implementation_plan.md` and the session replay.
2. Run `npm run bundle` to regenerate `dist/fsad-training.html`.

## Prompt used in the session
```
/clear

/plan

create an implementation plan for the game. Read the ./planning/hangman_spec.md spec to develop the plan. write the plan to ./planning/plan/hang_implementation_plan.md
```

## Acceptance Criteria

- [ ] `demo/plan/hang_implementation_plan.md` exists with the full PacHangman implementation plan
- [ ] `src/markdown/03-plan.md` shows the presenter's plan prompt as the primary content
- [ ] Code block at the bottom of `03-plan.md` renders the `hang_implementation_plan.md` output
- [ ] Output label links to `../demo/plan/hang_implementation_plan.md` (relative to `dist/`)
- [ ] Hyperlink to `../session-replay/Hangman%20-%20Develop%20Implementation%20Plan.html` is present and labeled
- [ ] `npm run bundle` completes with no errors
- [ ] Plan step in the Section 4 stepper displays the new content correctly

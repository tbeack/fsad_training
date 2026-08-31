# FSD_Train-006 — Add hangman implement example to Section 4 Implement step

## Source
`FSD_Train-006` from `planning/to do/todo.md`. The Implement step in the Section 4 deep-dive currently shows a generic CSV-export implementation notes placeholder. Replace it with the real-world PacHangman example: the prompt used to kick off the implementation phase, a code block rendering the relevant portion of the implementation plan, and a session-replay link.

## Summary
Replace `src/markdown/04-implement.md` with the presenter's implementation prompt, a code block rendering the preamble and Phases 0–1 from `demo/plan/hang_implementation_plan.md`, and a hyperlink to the session replay.

## Assessment
**Current state:**
- `src/markdown/04-implement.md` contains a fictional "Add CSV export" implementation notes placeholder.
- `demo/plan/hang_implementation_plan.md` exists with the full PacHangman implementation plan (9 phases).
- The Section 4 stepper renders the `implement` artifact in the right pane via `<!-- @@MD:implement -->`.

**Work needed:**
1. Replace `src/markdown/04-implement.md` with the presenter's prompt as primary content, a code block rendering the plan preamble and Phases 0–1, and a link to the session replay.
2. Run `npm run bundle` to regenerate `dist/fsad-training.html`.

## Prompt used in the session
```
/clear

execute phase 0 and 1
```

## Content to include from `demo/plan/hang_implementation_plan.md`

Include the following sections in the code block (in order):

1. **File header / intro block** — the title, source-of-truth note, scope, and ship target (lines preceding the `---` separator before the Progress section).
2. **Progress table** — the `## Progress` section with the phase completion table.
3. **Pinned Implementation Calls** — `## 1. Pinned Implementation Calls` table.
4. **Phase 0 — Repo scaffold** — full phase block including goal, steps (with checkboxes), and the required structure code blocks.
5. **Phase 1 — Pure logic + persistence** — full phase block including goal, spec references, steps, and all module/export specifications.

## Session replay
Link to: `../session-replay/Hangman%20-%20Start%20the%20Implementation.html`
Label: `Session replay: Start the Implementation`

## Acceptance Criteria

- [ ] `src/markdown/04-implement.md` shows the presenter's `/clear` + `execute phase 0 and 1` prompt as the primary content
- [ ] A code block below the prompt renders the plan preamble, progress table, pinned implementation calls, Phase 0, and Phase 1 from `demo/plan/hang_implementation_plan.md`
- [ ] Output label links to `../demo/plan/hang_implementation_plan.md` (relative to `dist/`)
- [ ] Hyperlink to `../session-replay/Hangman%20-%20Start%20the%20Implementation.html` is present and labeled `Session replay: Start the Implementation`
- [ ] `npm run bundle` completes with no errors
- [ ] Implement step in the Section 4 stepper displays the new content correctly

# FSD_Train-007 — Add hangman verify example to Section 4 Verify step

## Source
`FSD_Train-007` from `planning/to do/todo.md`. The Verify step in the Section 4 deep-dive currently shows a generic CSV-export verification placeholder. Replace it with the real-world PacHangman example: the multi-agent prompt used to kick off the verification phase, a code block rendering `hangman_verification_phase_08.md`, and a session-replay link.

## Summary
Replace `src/markdown/05-verify.md` with the presenter's multi-agent prompt, a code block rendering the full content of `demo/plan/hangman_verification_phase_08.md`, and a hyperlink to the session replay.

## Assessment
**Current state:**
- `src/markdown/05-verify.md` contains a fictional "CSV export" verification placeholder.
- `demo/plan/hangman_verification_phase_08.md` exists with the full Phase 8 verification plan (52 checks across 8 groups).
- The session replay HTML is at `session-replay/Hangman - Multi-agent team create Verification and Test Plan.html`.
- The Section 4 stepper renders the `verify` artifact in the right pane via `<!-- @@MD:verify -->`.

**Work needed:**
1. Replace `src/markdown/05-verify.md` with the multi-agent prompt as primary content, a code block rendering `hangman_verification_phase_08.md`, and a link to the session replay.
2. Run `npm run bundle` to regenerate `dist/fsad-training.html`.

## Prompt used in the session

```
Spin up a team of agents to develop the test plans for phases 6 through 8, based on the approach taken in

./planning/plan/hangman_verification_phase_03.md. title the plan

./planning/plan/hangman_verification_phase_nn.md

-> Agent 1 - build a verification and test plan for phase 6

-> Agent 2 - build a verification and test plan for phase 7

-> Agent 3 - build a verification and test plan for phase 8
```

## Session replay
Link to: `../session-replay/Hangman%20-%20Multi-agent%20team%20create%20Verification%20and%20Test%20Plan.html`
Label: `Session replay: Multi-agent team create Verification and Test Plan`

## Acceptance Criteria

- [ ] `src/markdown/05-verify.md` shows the multi-agent prompt as the primary content
- [ ] A code block below the prompt renders the full content of `demo/plan/hangman_verification_phase_08.md`
- [ ] Output label links to `../demo/plan/hangman_verification_phase_08.md` (relative to `dist/`)
- [ ] Hyperlink to `../session-replay/Hangman%20-%20Multi-agent%20team%20create%20Verification%20and%20Test%20Plan.html` is present and labeled `Session replay: Multi-agent team create Verification and Test Plan`
- [ ] `npm run bundle` completes with no errors
- [ ] Verify step in the Section 4 stepper displays the new content correctly

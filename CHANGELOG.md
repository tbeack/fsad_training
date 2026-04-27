# Changelog

All notable changes to the FSAD Training app are recorded here. Newest first. The version shown in the app's title bar and sidebar matches the latest entry below.

## Changes in This Version

### v1.4 — 2026-04-27

**Section 4 deep-dive: real-world PacHangman example for Verify step (FSD_Train-007)**

Replaces the generic CSV-export verification placeholder in the Section 4 Verify step with the actual multi-agent prompt, the full Phase 8 verification plan, and a session replay link.

- **FSD_Train-007 — Verify step.** `05-verify.md` replaced with the multi-agent prompt that spawned three parallel agents (phases 6, 7, 8), a rendered code block of `hangman_verification_phase_08.md` (52 checks across 8 groups: 15 ACs, browser matrix, word counts, E2E scenarios, unit tests, visual polish), and a link to the source plan file. Session replay: *Hangman - Multi-agent team create Verification and Test Plan*.

---

### v1.3 — 2026-04-27

**Section 4 deep-dive: real-world PacHangman example for Implement step (FSD_Train-006)**

Replaces the generic CSV-export implementation notes placeholder in the Section 4 Implement step with the actual prompt, plan excerpt, and session replay from the PacHangman build session.

- **FSD_Train-006 — Implement step.** `04-implement.md` replaced with the `/clear` + `execute phase 0 and 1` prompt, a rendered code block of the implementation plan preamble (progress table, pinned implementation calls, Phase 0 — Repo scaffold, Phase 1 — Pure logic + persistence), and a link to the source plan file. Session replay: *Hangman - Start the Implementation*.

---

### v1.2 — 2026-04-27

**Layout: reduce hero and section whitespace (FSD_Train-012)**

Tightened the vertical rhythm across all pages. The hero area and section headers now sit much closer to the visible viewport, removing roughly half the top-of-page dead space and eliminating the large gap below the hero paragraph.

- **Hero top padding** reduced from `5rem` → `1.25rem`
- **Hero bottom padding** reduced from `4rem` → `1.5rem`
- **Hero badge margin-bottom** reduced from `1.5rem` → `0.6rem`
- **Hero h1 margin-bottom** reduced from `1.2rem` → `0.6rem`
- **Hero p margin-bottom** removed (was `2.5rem`; `p` is always the last hero element)
- **Section top padding** reduced from `5rem` → `1.5rem`

---

### v1.1 — 2026-04-27

**Section 4 deep-dive: real-world PacHangman examples for Research, Spec, and Plan steps (FSD_Train-003, FSD_Train-004, FSD_Train-005)**

Replaces generic CSV-export placeholder artifacts in the Section 4 stepper with the actual prompts, outputs, and session replays from the PacHangman build session. Each step now shows the presenter's exact prompt, a rendered code block of the output artifact, and a link to the full session replay.

- **FSD_Train-003 — Research step.** `01-research.md` replaced with the PacHangman research prompt and `hangman_research.md` output (game concept, visual style, mechanics, word list strategy, tech stack). Session replay: *Hangman - Start the Research and Spec*.
- **FSD_Train-004 — Spec step.** `02-spec.md` replaced with the `/plan` spec prompt and the full `hangman_spec.md` design document (palette, layout, game mechanics, state shape, acceptance criteria). Source artifact added at `demo/design/hangman_spec.md`. Session replay: *Hangman - Start the Research and Spec*.
- **FSD_Train-005 — Plan step.** `03-plan.md` replaced with the `/clear` + `/plan` implementation prompt and the full `hang_implementation_plan.md` (9 phases, pinned implementation calls, critical files reference, end-to-end verification recipe). Source artifact added at `demo/plan/hang_implementation_plan.md`. Session replay: *Hangman - Develop Implementation Plan*.

---

### v1 — 2026-04-27

**Section 5 build-out: single-shot vs spec-driven contrast (FSD_Train-001, FSD_Train-002)**

The first numbered release. Section 5 ships its full content — the centerpiece visual that motivates the rest of the workshop, plus two technical drill-downs that explain how each approach actually works under the hood.

- **FSD_Train-001 — At-a-glance infographic.** Replaced the Section 5 placeholder with the bordered single-shot vs spec-driven SVG pair (dark + light). Both SVGs inlined into `src/index.html` with renamed gradient/marker IDs to avoid collisions; theme swap handled by four scoped `.compare-figure*` CSS rules that mirror the existing `[data-theme="light"]` and `prefers-color-scheme: light` patterns. Source SVGs tracked under `planning/research/`.
- **FSD_Train-002 — Technical drill-downs.** Added two new sub-sections under Section 5: **Inside a Single-Shot Prompt** (the LLM internals — tokenizer, context window, forward pass, sampler, decode loop) and **Inside an FSAD Flow** (the agentic scaffolding — orchestrator, context assembly, agent execution with tool-use loop, verifier, persistent memory). Each sub-section pairs a theme-swapped technical-flow SVG with a markdown explainer rendered inline by the bundler. Sidebar nav under "Single-shot vs Spec-Driven" expanded from 1 to 3 sub-items: At-a-glance, Inside a single-shot prompt, Inside an FSAD flow. Closing TL;DR callout relocated to sit after both new sub-sections as the page's parting takeaway.
- **Bundler.** `dist/fsad-training.html` now bundles 8 markdown artifacts (was 6) — the two new explainers (`07-single-shot-flow.md`, `08-spec-driven-flow.md`) plus the original six deepdive artifacts.

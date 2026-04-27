# Changelog

All notable changes to the FSAD Training app are recorded here. Newest first. The version shown in the app's title bar and sidebar matches the latest entry below.

## Changes in This Version

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

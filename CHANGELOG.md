# Changelog

All notable changes to the FSAD Training app are recorded here. Newest first. The version shown in the app's title bar and sidebar matches the latest entry below.

## Changes in This Version

### v1 — 2026-04-27

**Section 5 build-out: single-shot vs spec-driven contrast (FSD_Train-001, FSD_Train-002)**

The first numbered release. Section 5 ships its full content — the centerpiece visual that motivates the rest of the workshop, plus two technical drill-downs that explain how each approach actually works under the hood.

- **FSD_Train-001 — At-a-glance infographic.** Replaced the Section 5 placeholder with the bordered single-shot vs spec-driven SVG pair (dark + light). Both SVGs inlined into `src/index.html` with renamed gradient/marker IDs to avoid collisions; theme swap handled by four scoped `.compare-figure*` CSS rules that mirror the existing `[data-theme="light"]` and `prefers-color-scheme: light` patterns. Source SVGs tracked under `planning/research/`.
- **FSD_Train-002 — Technical drill-downs.** Added two new sub-sections under Section 5: **Inside a Single-Shot Prompt** (the LLM internals — tokenizer, context window, forward pass, sampler, decode loop) and **Inside an FSAD Flow** (the agentic scaffolding — orchestrator, context assembly, agent execution with tool-use loop, verifier, persistent memory). Each sub-section pairs a theme-swapped technical-flow SVG with a markdown explainer rendered inline by the bundler. Sidebar nav under "Single-shot vs Spec-Driven" expanded from 1 to 3 sub-items: At-a-glance, Inside a single-shot prompt, Inside an FSAD flow. Closing TL;DR callout relocated to sit after both new sub-sections as the page's parting takeaway.
- **Bundler.** `dist/fsad-training.html` now bundles 8 markdown artifacts (was 6) — the two new explainers (`07-single-shot-flow.md`, `08-spec-driven-flow.md`) plus the original six deepdive artifacts.

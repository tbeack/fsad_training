# Changelog

All notable changes to the FSAD Training app are recorded here. Newest first. The version shown in the app's title bar and sidebar matches the latest entry below.

## Changes in This Version

### v1.11 — 2026-05-29

**Two-tier natural language search (FSD_Train-021)**

Replaces the plain `String.includes()` keyword filter with a two-tier search system. **Tier 1 — MiniSearch v7.1.1** (MIT, ~19 KB, fully inlined): BM25-ranked fuzzy search with prefix matching and field weighting — typo-tolerant queries like "effor level" and "claud md" return correct sections immediately with no CDN dependency. **Tier 2 — Transformers.js semantic layer** (progressive enhancement): lazy-loads `Xenova/all-MiniLM-L6-v2` from CDN and embeds section text chunks at runtime; queries ≥3 words or containing `?` blend keyword and semantic results, with semantic matches badged `✦`; vectors cache in IndexedDB. Also fixes a pre-existing navigation bug where search result clicks used a stale playbook `sectionToPageMap` — navigation now derives parent page from DOM. Graceful degradation: status indicator shows "Loading smart search…" / "Smart search ready" / "Using keyword search".

---

### v1.10 — 2026-05-29

**FSAD Playbook link in sidebar nav (FSD_Train-020)**

Adds an "FSAD Playbook ↗" external-link entry at the bottom of the sidebar nav — below the Compare section, above the footer — giving attendees a one-click path to the companion reference at `https://fsad-playbook.vercel.app/`.

---

### v1.9 — 2026-05-28

**Vercel deployment config (FSD_Train-019)**

Adds `vercel.json` at the repo root so the training app can be deployed to Vercel as a hosted instance, mirroring the approach used by `fsad_playbook`.

- **FSD_Train-019 — Vercel config.** `vercel.json` created with `outputDirectory: "dist"` and a catch-all rewrite routing `/(.*) → /fsad-training.html`. No build command is configured — Vercel serves the pre-built `dist/fsad-training.html` that is already committed to the repo. To deploy: import `tbeack/fsad_training` at vercel.com/new, set Framework Preset to Other, leave build command blank.

---

### v1.8 — 2026-04-27

**Section 2 basics: "How to manage your context window" subsection (FSD_Train-015)**

Adds a new §05 subsection to Claude Code Basics — between Statusline and CLAUDE.md (now §06) — teaching attendees to track, compact, and clear their context window.

- **FSD_Train-015 — Context Window section.** New `<section id="context-window">` with three overview cards (`/context`, `/compact`, `/clear`), a tip callout explaining when to use `/context` for diagnostics, and a visual example of the real `/context` output. The example renders the actual two-column terminal layout: a 10×10 coin-icon grid on the left (⛁/⛀/⛶/⛝ icons color-coded by category — system prompt in grey, system tools in medium grey, custom agents in lavender, memory in orange, skills in amber, messages in purple, free space and autocompact buffer in muted grey), and the per-category token breakdown on the right (system prompt 6.6k, system tools 8.1k, custom agents 5.6k, memory 2.4k, skills 7.3k, messages 22.2k, free 114.8k, autocompact 33k). A warning callout closes the section: compact at a natural pause, not mid-task.
- **Sidebar nav.** "Context Window" link added between Statusline and CLAUDE.md.
- **CLAUDE.md section** renumbered from §05 → §06.
- **Hero subtitle** updated from "Four things…" → "Five things…" to include context window management.

---

### v1.7 — 2026-04-27

**Section 2 basics: statusline customization examples (FSD_Train-014)**

Extends the Statusline section with a "Customizing the statusline" subsection showing three prompt→display examples, so attendees know they can configure the statusline with a plain-language ask.

- **FSD_Train-014 — Statusline examples.** Three card-style prompt+display pairs added after the context-bar warning callout. Each card shows the user's natural-language prompt (monospace, surface background) and a dark terminal-strip rendering of the resulting statusline. Examples cover: default full setup (model + context + mode + dir), minimal (model + context only), and git-aware (model + context + branch + mode + dir with branch highlighted in emerald).

---

### v1.6 — 2026-04-27

**Section 2 basics: CLAUDE.md example section (FSD_Train-013)**

Adds a fifth sub-section to the Claude Code Basics page showing what a real `CLAUDE.md` looks like, rendered as raw markdown in the same styled artifact panel used by the Section 4 deep-dive.

- **FSD_Train-013 — CLAUDE.md section.** New "05 — CLAUDE.md" section added after Statusline. Includes two callouts — one pointing to `/init` for generating a starter file, one framing the example — and the full raw markdown source of a real-world `CLAUDE.md` (workflow orchestration rules, task management conventions, core principles) displayed in a `deepdive-artifact` panel with monospace code-block formatting.
- **Sidebar nav.** "CLAUDE.md" link added as a fifth sub-item under the Claude Code Basics group.
- **CSS.** Added `.md-artifact-wrap .md-artifact { display: block }` so artifacts placed in a `md-artifact-wrap` container are always visible without the stepper's `.active` toggle (benefits the compare-page inline explainers).
- **Bundler.** `09-example-claude.md` removed; content is now hardcoded as a raw `<pre><code>` block. Artifact count drops from 9 → 8.

---

### v1.5 — 2026-04-27

**Section 4 deep-dive: real-world PacHangman example for Iterate step; example CLAUDE.md staged (FSD_Train-008)**

Replaces the generic CSV-export `followup.md` placeholder in the Section 4 Iterate step with the actual iterate prompt, a rendered `hangman_todo.md`, and post-ship notes. Also stages the example `CLAUDE.md` artifact for FSD_Train-010.

- **FSD_Train-008 — Iterate step.** `06-iterate.md` replaced with the "update planning/todo.md" iterate prompt, a rendered code block of `demo/plan/hangman_todo.md` (v1 phases 1–8 all marked complete, 11-item v2 backlog of deferred features, post-ship observations), and a link to the source file.
- **example_claude.md staged.** Copied from `fsad_playbook/example_claude.md` into `src/markdown/09-example-claude.md` — unused by the bundler until FSD_Train-010 wires it up.
- **Backlog additions.** `planning/to do/todo.md` gains three new tasks: FSD_Train-013 (CLAUDE.md example in Section 2), FSD_Train-014 (status line example prompt in Section 2), FSD_Train-015 (context usage tracking in Section 2).

---

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

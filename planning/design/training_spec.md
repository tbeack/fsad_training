# FSAD Training — Design Spec

> Status: Draft
> Owner: Theo Beack
> Last updated: 2026-04-25

## Overview
HTML app to deliver the most intensive lecture block of a 3-day workshop introducing software engineers and product managers to spec-driven and agentic development with Claude Code. The app is driven live by the presenter and remains usable as a self-contained takeaway artifact attendees revisit afterward.

Sibling app to `fsad_playbook` — inherits its visual language and technical stack.

## Goals
- Drive the live lecture block from a single browser tab — no slide-tool fallback
- Give attendees a self-contained artifact they can keep and re-explore on their own
- Match the look/feel of `fsad_playbook` so the two read as part of the same family
- Make the spec-driven workflow tangible by surfacing real markdown artifacts inline rather than describing them abstractly

## Non-Goals
- Live Claude Code API integration or real terminal/sandbox execution
- Per-user accounts, persistent state, or any backend service
- Quizzes, polls, or audience-participation/multiplayer features
- Coverage of the full 3-day workshop — scope is the intensive lecture block only
- Special presenter affordances (speaker view, presenter notes, remote-clicker shortcuts)

## Users & Use Cases
- **Presenter (live):** Drives the app on stage during the lecture block. Needs predictable navigation and visually anchored content per section.
- **Attendees (post-workshop):** Software engineers and product managers revisiting on their own laptops. Need self-explanatory navigation without a presenter narrating.

## Requirements

### Functional

**Content sections (initial scope — 5):**

1. **Workflow orientation** — introduce the spec-driven loop: Research → Spec → Plan Implementation → Implement → Verify → Iterate
2. **Claude Code basics** — how to launch, basic permissions, model & effort settings, statusline
3. **Slash command reference** — `/clear`, `/context`, `/skills`, `/plugin`, `/doctor`, `/compact`, `/resume`, `/plan`, `/init`, `/login`, `exit`
4. **Workflow deep-dive** — step through each phase of the loop; each step surfaces an associated example markdown artifact rendered inline
5. **Single-shot vs spec-driven infographic** — visual contrast between unmanaged single-shot prompting and spec-driven, context-managed interactions

**Interaction model:**
- Click-through scripted walkthroughs — outcomes are pre-defined; no real API calls
- Markdown artifacts in section 4 are authored as sibling `.md` files in the repo, pre-rendered to HTML at build time, and inlined into the output (so `file://` distribution works without a server)
- App-like persistent navigation: sidebar always visible; jump to any section; return home from any state

### Non-Functional
- Distributable as a single self-contained HTML file (mirrors `fsad-playbook.html`); markdown is authored separately under `src/markdown/` and bundled in
- Responsive layout — sidebar collapses below ~900px (matches playbook breakpoint)
- Distributed via a git repository; the built `dist/fsad-training.html` is committed so attendees can clone and double-click without any toolchain
- Minimal Node build step (`npm run bundle`); the output ships with no runtime dependencies — no markdown library, no framework

## UX & Visual Design

Design language inherited from `fsad_playbook` — see `./desktop/ai/fsad_playbook/fsad-playbook.html` for the source of truth.

- **Theme:** dark, premium. Background `#08080c`, surfaces `#0f0f14` / `#16161e`
- **Primary accent:** desaturated purple `#6f6fb5` for links, active nav, primary actions
- **Semantic accents:** emerald `#34d399` (positive examples / best practice), amber `#fbbf24` (caution), rose `#fb7185` (anti-patterns only)
- **Typography:**
  - Body / display: Inter (300–800)
  - Code: IBM Plex Mono
  - Hero `h1` only: Source Serif 4
- **Visual hierarchy contract:**
  - Tier 1 (quiet default): prose, body text, inline code — neutral, no borders, no glow
  - Tier 2 (structured exceptions): callouts, code blocks, tables — muted 1px borders, subtle background tints
  - Tier 3 (rare punctuation): pull-quotes, diagrams, hero — accent color permitted; still no glow shadows
- **Layout:** persistent left sidebar (~290px), top progress bar, page indicator under the sidebar offset
- **Radius:** 14px standard, 22px large

## Technical Approach
- Same runtime stack as `fsad_playbook`: a single self-contained HTML file with embedded CSS and JS, vanilla (no framework, no router, no client-side markdown library)
- Markdown artifacts authored as sibling `.md` files under `src/markdown/`; pre-rendered to HTML at build time via `marked` and inlined into the output through `<!-- @@MD:id -->` placeholder substitution (~35-line `scripts/bundle.mjs`)
- Google Fonts loaded via CDN link (matches playbook): Inter, IBM Plex Mono, Source Serif 4
- Hosted in a git repo with `dist/fsad-training.html` committed; cloning + opening the HTML file in a browser is the entire attendee setup. Authors run `npm run bundle` before sharing.

## Open Questions
- Section 5 infographic — concrete visual concept and layout still to be designed (placeholder until then)

# FSD_Train-002 — Add technical-flow drill-downs for both approaches with markdown explainers

## Source
Workshop need. The bordered infographic in Section 5 (`#compare-infographic`, shipped in FSD_Train-001) shows the two approaches at a glance — but doesn't explain *what's actually happening under the hood*. The user has dropped two SVG pairs and two markdown explainers into `planning/research/` to fill that gap.

## Summary
Extend Section 5 with two new sub-sections that drill into how each approach actually works:
1. **Inside a Single-Shot Prompt** — the technical pipeline (tokenizer → context window → forward pass → sampler → decode loop) with the markdown explainer.
2. **Inside an FSAD Flow** — the agentic scaffolding (orchestrator → context assembly → agent execution with tool-use loop → verifier → persistent memory) with the markdown explainer.

Each sub-section pairs a theme-swapped technical SVG with the corresponding markdown rendered inline by the bundler.

## Assessment
**Current state of Section 5 (`src/index.html`):**
- `#compare-hero` (lines 2518–2525)
- `#compare-infographic` with the bordered SVGs (lines 2527+, ends ~line 2750-ish post FSD_Train-001 changes)
- Sidebar: one sub-item "Infographic"

**New assets in `planning/research/`:**
| File | Purpose |
|---|---|
| `single_shot_technical_flow_dark.svg` | viewBox `0 0 690 730` — single-shot LLM internals, dark |
| `single_shot_technical_flow_light.svg` | viewBox same — single-shot, light |
| `spec_driven_technical_flow_dark.svg` | viewBox `0 0 680 720` — agentic flow, dark |
| `spec_driven_technical_flow_light.svg` | viewBox same — agentic flow, light |
| `single-shot_prompt_flow.md` | "Inside a Single-Shot Prompt" — 7-section explainer (inputs, tokenizer, context window, forward pass, sampler, decode loop, detokenize) + "What's not happening" + "Why this matters" |
| `fsad__technical_flow.md` | "Inside an FSAD Flow" — 6-section explainer (inputs, orchestrator, context assembly, agent execution, verifier, persistent memory) + "What this enables" + "Why FSAD prescribes this shape" |

**ID collision risk:** all 4 new SVGs use `id="cg"` (gradient) and `id="arrow"` (marker), same as the bordered SVGs already in the page. Need per-instance renames.

**Bundler convention (`scripts/bundle.mjs`):** `src/markdown/NN-name.md` → strips numeric prefix → id `name` → injected at any `<!-- @@MD:name -->` placeholder. Pre-rendered to HTML at build time via `marked`. Existing files: `01-research.md` through `06-iterate.md`.

## Plan

### Markdown intake
1. Move and rename so the bundler picks them up:
   - `planning/research/single-shot_prompt_flow.md` → `src/markdown/07-single-shot-flow.md` → id `single-shot-flow`
   - `planning/research/fsad__technical_flow.md` → `src/markdown/08-spec-driven-flow.md` → id `spec-driven-flow`
   *(rename normalizes the inconsistent file naming — hyphens, no double-underscore typo, descriptive names that match the section anchors)*
2. Verify content renders cleanly via `marked` (the bundler does this; if any heading levels feel off in context, light edits welcome — but defer unless rendering breaks).

### SVG embedding (same pattern as FSD_Train-001)
For each of the 4 new SVGs: inline into `src/index.html` inside a `<div class="compare-figure compare-figure--dark">` or `--light` wrapper. Rename colliding IDs per-instance:
- single-shot dark: `cg` → `cg-ss-dark`, `arrow` → `arrow-ss-dark`
- single-shot light: `cg` → `cg-ss-light`, `arrow` → `arrow-ss-light`
- spec-driven dark: `cg` → `cg-sd-dark`, `arrow` → `arrow-sd-dark`
- spec-driven light: `cg` → `cg-sd-light`, `arrow` → `arrow-sd-light`

Keep mask IDs as-is — they already have unique random suffixes per file.

The existing `.compare-figure*` CSS rules (added in FSD_Train-001) handle the theme swap for any new figure pair without modification.

### Section structure additions
Add two new sub-sections to `#page-compare`, immediately after `#compare-infographic`:

**`#compare-singleshot`**
1. `<hr class="divider">`
2. `<span class="section-label">02 — Inside a Single-Shot Prompt</span>`
3. `<h2 class="section-title">What Actually Happens Between Request and Response</h2>`
4. `<p class="section-subtitle">A deterministic pipeline with one probabilistic step in the middle. The shape of this is why agentic, spec-driven workflows exist.</p>`
5. Two `.compare-figure` divs (dark and light single-shot SVGs)
6. `<div class="md-artifact-wrap"><!-- @@MD:single-shot-flow --></div>`

**`#compare-specdriven`**
1. `<hr class="divider">`
2. `<span class="section-label">03 — Inside an FSAD Flow</span>`
3. `<h2 class="section-title">What Happens When You Direct Agents Instead</h2>`
4. `<p class="section-subtitle">Same model. Different scaffolding. Stateful, curated, tool-rich, and verifiable — by construction.</p>`
5. Two `.compare-figure` divs (dark and light spec-driven SVGs)
6. `<div class="md-artifact-wrap"><!-- @@MD:spec-driven-flow --></div>`

(Move the existing closing TL;DR `.callout-best-practice` to AFTER both new sub-sections so it remains the page's parting takeaway.)

### Sidebar nav update
Update `src/index.html:2154` (currently one "Infographic" link) to three sub-items:
```html
<a class="nav-sub-item" href="#compare/compare-infographic" onclick="scrollToSection('compare-infographic')">At-a-glance</a>
<a class="nav-sub-item" href="#compare/compare-singleshot" onclick="scrollToSection('compare-singleshot')">Inside a single-shot prompt</a>
<a class="nav-sub-item" href="#compare/compare-specdriven" onclick="scrollToSection('compare-specdriven')">Inside an FSAD flow</a>
```

(Renaming "Infographic" → "At-a-glance" makes the role of each section clearer when there are three of them.)

### Optional CSS (only if needed)
The existing `.md-artifact { ... }` styling (already used in Section 4's deepdive stepper) should render the markdown cleanly. If the long-form content needs different layout treatment from the deepdive's right-pane artifact (e.g. wider, no max-width tied to a flex column), add a `.md-artifact-wrap` wrapper rule capping at the same 720px the SVGs use, for visual rhythm. Decide this after a first preview.

### Build sequence
1. Move and rename the two markdown files into `src/markdown/`.
2. Inline all 4 new SVGs into `src/index.html` with renamed IDs (use a Python helper like FSD_Train-001 to avoid copy-paste errors).
3. Add the two new section blocks (`#compare-singleshot`, `#compare-specdriven`) and reorder the closing TL;DR callout.
4. Update sidebar nav to three sub-items.
5. `npm run bundle` and verify in browser — both themes, both new sub-sections, hash routing to each anchor, markdown renders cleanly inside each section.

## Acceptance Criteria
- [x] `dist/fsad-training.html` renders Section 5 with three sub-sections in order: at-a-glance infographic → Inside a Single-Shot Prompt → Inside an FSAD Flow → TL;DR callout. *(verified: DOM order is `compare-hero → compare-infographic → compare-singleshot → compare-specdriven → compare-tldr`)*
- [x] Each new sub-section has its technical SVG above the markdown explainer; SVG and explainer cover the same 7 / 6 phases. *(verified: each new section contains 2 SVGs (dark+light) plus the rendered markdown — `md-artifact` class present in both)*
- [x] Theme toggle swaps all SVGs (the at-a-glance infographic + both technical flows) atomically — no leftover dark SVG showing in light mode or vice versa. *(verified: the existing `.compare-figure--dark`/`--light` CSS rules apply uniformly to all 3 figure pairs since they share the same wrapper class)*
- [x] In a light-default OS with no explicit toggle, the light versions of all 3 SVG pairs render on first load. *(verified: same `@media (prefers-color-scheme: light) :root:not([data-theme])` rules cover all `.compare-figure*` elements)*
- [x] All 4 new SVGs render at full visual fidelity; no duplicate IDs across the 6 SVGs now in the page. *(verified: all 6 SVGs are well-formed XML with unique IDs — `cg-{dark,light,ss-dark,ss-light,sd-dark,sd-light}` and matching `arrow-*` plus per-file mask suffixes)*
- [x] Sidebar nav under "Single-shot vs Spec-Driven" lists three sub-items and each scrolls to the correct anchor. *(verified at `src/index.html:2153-2156`: At-a-glance, Inside a single-shot prompt, Inside an FSAD flow)*
- [x] Hash routing works for all three anchors: `#compare/compare-infographic`, `#compare/compare-singleshot`, `#compare/compare-specdriven`. *(verified: all 3 section anchors exist exactly once in dist)*
- [x] Markdown content from both `.md` files renders cleanly inside the page (headings nest correctly under the section title, code blocks/lists styled). *(verified: H1s "Inside a Single-Shot Prompt" and "Inside an FSAD Flow" present, plus the in-body sections "What's not happening" and "What this enables" — confirms both files were pre-rendered and injected by the bundler. No unrendered `@@MD:` placeholders remain.)*
- [x] `npm run bundle` exits 0; both new markdown ids appear in the bundler's "bundled N artifact(s)" count without "unused markdown artifact" warnings. *(verified: 8 artifacts bundled — was 6, now includes `single-shot-flow` and `spec-driven-flow`)*
- [x] Section 4 deep-dive still works (regression — the new ids don't collide with deepdive's existing `data-md` attributes). *(verified: 31 hits for deepdive markup unchanged; deepdive uses ids `research`/`spec`/`plan`/`implement`/`verify`/`iterate` which don't overlap with the new `single-shot-flow`/`spec-driven-flow`)*

## Notes
- The spec-driven dark technical-flow SVG ships without a text-gap mask (the authoring tool didn't generate one for that variant). The other 5 SVGs have masks. If a dashed line ever appears to cross a text label in the dark spec-driven flow, that's why; otherwise no action needed.

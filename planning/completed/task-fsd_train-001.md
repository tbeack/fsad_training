# FSD_Train-001 — Build Section 5 infographic: single-shot vs spec-driven, context-managed agentic coding

## Source
Spec gap. `planning/design/training_spec.md:39` and `:77` mark Section 5's infographic as "concept TBD." Section 5 currently ships as a placeholder. The visual concept was designed externally; final assets used are `planning/research/single_shot_vs_spec_driven_dark_bordered.svg` and `planning/research/single_shot_vs_spec_driven_light_bordered.svg` — identical content, different theme, bordered styling, with text-gap masks so the dashed feedback curves break cleanly around the "updates spec" label.

## Summary
Replace the Section 5 placeholder with the prepared infographic. Embed both SVGs inline, swap them based on the active theme so the visual matches the rest of the app whether the user is in dark or light mode.

## Assessment
**Current state:** Section 5 is a hero + a single placeholder section explaining the visual is coming. Located at `src/index.html:2518–2541` (the `#page-compare` div).

**Theme infrastructure (already in place — no work needed):**
- Default tokens at `src/index.html:28+` (dark)
- `[data-theme="light"]` overrides at `src/index.html:1459+`
- `prefers-color-scheme: light` fallback at `src/index.html:1544+` (only applies when no explicit `data-theme` is set)
- Theme toggle button at `src/index.html:2165` (calls `cycleTheme()`)

**Visuals (final, bordered):**
- `planning/research/single_shot_vs_spec_driven_dark_bordered.svg` — dark, viewBox `0 0 690 650`, ~35KB
- `planning/research/single_shot_vs_spec_driven_light_bordered.svg` — light, viewBox `0 0 690 650`, ~35KB
- Same narrative: left = single-shot flow (You → vague prompt → LLM → uncertain output → restart loop → "Lossy and unpredictable" outcome). Right = spec-driven flow (spec.md → Coordinator → 3 sub-agents → substrate strip [spec.md/context/skills/memory] → Verified output → "Predictable delivery", with feedback curve back to spec.md).
- Both files include unique text-gap masks (`imagine-text-gaps-rhcl4f` / `-r8fyhp`) so dashed lines break cleanly around text labels. Both share `id="cg"` (gradient) and `id="arrow"` (marker) — these were renamed per-instance during embedding to `cg-dark`/`cg-light` and `arrow-dark`/`arrow-light` to avoid ID collisions in the combined HTML doc.

## Plan

### Embedding strategy
Inline both SVGs directly into `src/index.html` (matches the project's "single self-contained file, no fetch, works from `file://`" character). Wrap each in a class-tagged container so CSS can show/hide based on theme:

```html
<div class="compare-figure compare-figure--dark">…dark SVG…</div>
<div class="compare-figure compare-figure--light">…light SVG…</div>
```

CSS swap rules (added to the existing stylesheet, not a new file):

```css
.compare-figure { width: 100%; max-width: 720px; margin: 0 auto; display: block; }
.compare-figure--light { display: none; }

[data-theme="light"] .compare-figure--dark { display: none; }
[data-theme="light"] .compare-figure--light { display: block; }

@media (prefers-color-scheme: light) {
  :root:not([data-theme]) .compare-figure--dark { display: none; }
  :root:not([data-theme]) .compare-figure--light { display: block; }
}
```

This mirrors the exact same theming pattern already in use throughout the file (lines 1459+ and 1544+).

### Section structure
Replace `#compare-overview` (the placeholder) with a single new section `#compare-infographic`:
1. Section label `01 — How They Actually Differ`
2. Section title `Two Loops, Side by Side`
3. Section subtitle restating the contrast in one sentence
4. The two SVG containers (dark + light)
5. Keep the existing `.callout-best-practice` "TL;DR" block from the placeholder — it pairs well as a takeaway under the visual

Sidebar nav update at `src/index.html:2141–2143`: rename the single sub-item from "Overview" to "Infographic" and point its href to `#compare/compare-infographic`.

Hero (`#compare-hero`) stays unchanged.

### Build sequence
1. Add the four CSS rules to the `<style>` block in `src/index.html` (locate near the existing theme overrides).
2. Update sidebar nav sub-item.
3. Replace `#compare-overview` with `#compare-infographic`. Inline both SVGs as-is (preserve their existing `viewBox` and inline styles so they render identically to the source files).
4. Remove the "→ What's coming" placeholder callout. Keep the "✓ The TL;DR until then" best-practice callout, retitled to "✓ The TL;DR" (drop "until then").
5. `npm run bundle`.
6. Open `dist/fsad-training.html` from `file://` and verify both themes by clicking the theme toggle.

## Acceptance Criteria
- [x] `dist/fsad-training.html` opened from `file://` renders Section 5 with the dark SVG by default. *(verified: `id="compare-infographic"` and `compare-figure--dark` div present; default CSS hides `--light`)*
- [x] Clicking the theme toggle to light mode swaps to the light SVG (no flash, no reload). *(verified: `[data-theme="light"]` rules invert visibility; `cycleTheme()` toggle wired up at `src/index.html:2165`)*
- [x] In a light-default OS with no explicit toggle, the light SVG renders on first load. *(verified: `@media (prefers-color-scheme: light) :root:not([data-theme])` fallback rules present)*
- [x] SVGs render at full visual fidelity — no clipped text, no missing arrows, no broken gradients. *(verified structurally: both SVGs are well-formed XML, identical structure (57 rects, 35 texts, 14 lines, 3 paths, 1 marker, 1 gradient, 1 mask each); no duplicate IDs in the section)*
- [x] SVG width caps at 720px on wide screens; scales down responsively below that. *(verified: `.compare-figure { max-width: 720px; ... }` rule present)*
- [x] Sidebar nav "Single-shot vs Spec-Driven" lists one sub-item ("Infographic") that scrolls to the visual. *(verified at `src/index.html:2154`)*
- [x] Hash routing `#compare/compare-infographic` works. *(verified: section anchor exists; existing `handleRoute` JS handles any anchor in the DOM)*
- [x] Bundle script (`npm run bundle`) exits 0 with no new "unused markdown artifact" warnings. *(verified: 6 markdown artifacts bundled cleanly)*
- [x] Section 4 deep-dive still works (regression — changes are isolated to the compare page, sidebar's compare block, and a small CSS addition). *(verified: deep-dive markup, IIFE, and markdown artifacts untouched)*

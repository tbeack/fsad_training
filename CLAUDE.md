# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An HTML training app for the most intensive lecture block of a 3-day workshop on spec-driven and agentic development with Claude Code. Used live by the presenter and shipped as a self-contained takeaway artifact.

Sibling app to `fsad_playbook` (at `~/repo/fsad_playbook/`) — same vanilla stack, same visual language, same single-file distribution model. The playbook is the design source of truth.

## Commands

```bash
npm install          # one-time
npm run bundle       # rebuild dist/fsad-training.html
```

There is no test suite, lint config, or dev server. The bundler is the only build step.

To preview, open `dist/fsad-training.html` directly (double-click works — `file://` is a hard requirement).

## Architecture

### The bundling pattern

`scripts/bundle.mjs` is the entire build (~35 lines):

1. Reads `src/markdown/*.md`, strips numeric prefix (`01-foo.md` → id `foo`), pre-renders to HTML via `marked`
2. Reads `src/index.html`, replaces every `<!-- @@MD:<id> -->` with `<div class="md-artifact" data-md="<id>">…rendered HTML…</div>`
3. Writes the result to `dist/fsad-training.html`

Bundler errors loudly on a placeholder with no matching `.md` file; warns on an unused `.md` file.

The output ships **no markdown library** — pre-rendering at build time is intentional so the dist file works from `file://` (where `fetch()` is blocked) and matches `fsad_playbook`'s "pure HTML" character.

### Source vs distribution

- `src/index.html` — app shell. Embedded CSS in `<style>`, embedded JS in `<script>` at end of body. Hand-edited.
- `src/markdown/*.md` — example artifacts surfaced in Section 4. Hand-edited.
- `dist/fsad-training.html` — generated single self-contained file. **Committed to the repo** so attendees with no toolchain can clone and double-click. Treat re-bundles like generated lockfiles.

`.gitignore` excludes `node_modules/` and `.DS_Store` only. `dist/` is intentionally tracked.

### Inherited from fsad_playbook

The shell was ported from `fsad_playbook/fsad-playbook.html`. What carries over:

- Design tokens (CSS custom properties): `--bg`, `--bg-surface`, `--text-*`, `--accent-violet` (`#6f6fb5`), semantic accents, `--font-hero/display/body/mono`, `--sidebar-w`
- Layout: `<aside class="sidebar">` (290px, hand-coded nav HTML) + `<div class="main">` containing all `.page` divs in DOM, one shown at a time via `.page.active`
- Hash routing `#pageId/sectionId`: `handleRoute()` → `switchPage()` swaps the visible page
- Top progress bar, page indicator, `IntersectionObserver`-driven fade-ins, responsive sidebar collapse <900px
- Reusable primitives: `.callout` (`-tip`/`-warning`/`-best-practice`), `.code-block`, `.collapsible`, `.overview-grid` + `.overview-card`, `.hero` + `.hero-badge`, `.section-label` + `.section-title` + `.section-subtitle`, `.pullquote`

Some JS functions came across that target playbook-specific DOM (`showPhase`, `showTopic`, `openChangelog`, etc.) — they're defensive (`if (!el) return;`) and act as no-ops here. Don't bother stripping them unless you're slimming the file.

Patched on import: default landing page (`navigateTo('workflow')`), `pageTitles` map, `scrollToSection` now derives parent page from DOM rather than the playbook's `sectionToPageMap`.

### Five sections (pages)

| Page id | Section | Notes |
|---|---|---|
| `workflow` | Workflow Orientation | Static — loop diagram, cost-of-skipping callouts |
| `basics` | Claude Code Basics | Static — launch/permissions/model+effort/statusline |
| `commands` | Slash Commands | Static — grouped reference cards |
| `deepdive` | Workflow Deep-Dive | **Interactive** — see Section 4 stepper below |
| `compare` | Single-shot vs Spec-Driven | Placeholder — infographic concept TBD |

### Section 4 stepper (the one piece of bespoke logic)

The only non-trivial JS in this app. Lives at the bottom of the `<script>` block as an IIFE. Six step pills (Research → Spec → Plan → Implement → Verify → Iterate); each step has a `data-md` attribute matching one of the bundled artifacts.

Click a pill or use ←/→ to advance. `setActive(i)` toggles `.active` on:
- the matching `.deepdive-step` pill
- the matching `.deepdive-desc-block` (left description pane)
- the `.md-artifact` whose `data-md` matches the step's `data-md` (right artifact pane)

Adding a new step means: new `.md` file in `src/markdown/`, new `<button class="deepdive-step" data-md="…">`, new `<!-- @@MD:… -->` placeholder, new `.deepdive-desc-block`. The IIFE picks them up automatically.

## Project documents

- `planning/design/training_spec.md` — what we're building and why
- `planning/plan/fsad_implementation_plan.md` — how it was built; build sequence; explicit "do not do" list

### Version bump checklist

When cutting a new version, update **all three** of these locations in `fsad-training.html` — they must always agree:

1. **`<title>` tag** (line ~6) — `FSAD Training (vX.XX.X)`
2. **Sidebar brand badge** (search for `sidebar-brand`) — `· vX.XX.X` inside the `<a>` tag
3. **In-app changelog modal** (search for `changelogModal`) — add a new `<section>` block above the previous latest version, matching the format:
   ```html
   <section>
     <h3>vX.XX.X <span class="changelog-date">· YYYY-MM-DD</span></h3>
     <p><strong>Summary sentence.</strong> Detail sentences.</p>
   </section>
   ```

## Things to avoid

- Adding a runtime markdown library (defeats `file://` distribution and breaks the matching with `fsad_training`)
- Splitting CSS/JS out of `src/index.html` (the playbook keeps everything embedded; match that)
- Adding any framework, bundler, preprocessor, or TypeScript
- Putting `dist/` in `.gitignore` (attendees may not have Node)
- Sanitizing the rendered markdown (single author, controlled input — DOMPurify is unnecessary weight)
- Hot-reload / live-reload tooling — `npm run bundle` + browser refresh is the loop

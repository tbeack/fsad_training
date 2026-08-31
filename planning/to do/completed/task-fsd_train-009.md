# FSD_Train-009 — Add a skills section to the training material

## Source
User request: copy the fsad_playbook skills into this repo (same naming convention), and add a new "Skills" section to the training app that clones the Skills Library section from fsad_playbook.

## Summary
fsad_playbook ships an installable skill library (`skills/<name>/SKILL.md` at repo root) and a "Skills Library" page in its app (`page-skills`: a categorized card grid + per-skill definition cards showing the live SKILL.md source). fsad_training has neither. This task copies the first-party fsad_playbook skills into `fsad_training/skills/` unchanged, and adds a new sixth page to the training app that mirrors fsad_playbook's Skills Library page structure using those copied files.

## Assessment

**Skills to copy — 16 of fsad_playbook's 21 `skills/` subdirectories:**
`ac`, `add-task`, `code-review-team`, `do-task`, `estimate`, `next`, `plan`, `plan-review`, `prd`, `prompt-improver`, `sec-review-fixes`, `sec-review-team`, `set-context`, `ship`, `ship-it`, `spec-review`.

Excluded per user direction: `init`, `playbook-assistant`, `sync`.
Also excluded: `engineering-skills`, `product-skills` — confirmed via `git ls-files` in fsad_playbook that both show **0 tracked files**; they're untracked third-party plugin clones sitting in that folder locally, not first-party fsad_playbook skills, so there's nothing to copy from git history.

**fsad_training app structure** (`src/index.html`, 4269 lines):
- Sidebar nav is fully data-driven: `.nav-group-toggle[data-page="X"]` + `#page-X` — `switchPage()`/`handleRoute()` (around line 3480–3596) require no page-specific branching to add a 6th page.
- The only hardcoded page list is the `pageTitles` map at line 3587 (currently 5 entries) — needs a `skills` entry added.
- All CSS primitives needed already exist (ported from fsad_playbook, per CLAUDE.md): `.hero`/`.hero-badge` (~line 692), `.section-label`/`.section-title`/`.section-subtitle` (~line 659), `.divider` (683), `.wf-grid`/`.wf-card`/`.wf-chips` (~line 1225–1275), `.collapsible`. No new CSS required.
- `sectionToPageMap` (line 3470) is legacy fsad_playbook routing for a different page set and is dead for new pages (confirmed no-op per CLAUDE.md) — do not add entries there.

**Bundler** (`scripts/bundle.mjs`, 35 lines): only reads flat `.md` files from `src/markdown/`, keyed by filename with numeric prefix stripped. It has no mechanism to pull markdown from `skills/*/SKILL.md` (different directory, different filename pattern, YAML frontmatter marked.js would render badly as a stray `<hr>` + raw text).

**fsad_playbook's page-skills structure** (`fsad-playbook.html` line 3693–3841+):
- `#skills-library` section: install snippet card + categorized `.wf-grid` of hand-authored summary cards (label/h4/p/chips per skill).
- `#skills-definitions` section: per-skill cards that render the actual live `SKILL.md` source, described as mirroring `skills/<name>/SKILL.md` in the repo.

## Plan

1. **Copy skill files** (verbatim, tracked-content only):
   For each of the 16 skills, copy only git-tracked files from fsad_playbook to avoid pulling in stray untracked cruft (e.g. `.DS_Store`):
   ```bash
   git -C /Users/theobeack/repo/fsad_playbook archive HEAD -- skills/<name> | tar -x -C /Users/theobeack/Repo/fsad_training/
   ```
   Repeat per skill (or pass all 16 paths to one `git archive` call). Result: `fsad_training/skills/<name>/SKILL.md` (plus any skill-specific subfiles, e.g. `code-review-team/specialists/*`, `sec-review-team`'s larger tree, `spec-review`'s files) — same relative layout as fsad_playbook, same filenames, no renaming.

2. **Extend `scripts/bundle.mjs`** to pre-render skill markdown at build time (mirrors the existing `src/markdown` pattern — no runtime markdown lib):
   - Add `SKILLS_DIR = resolve(root, 'skills')` and the fixed list of 16 skill directory names (or `readdir` + filter to dirs containing `SKILL.md`).
   - For each, read `skills/<name>/SKILL.md`, strip the leading YAML frontmatter block (`/^---\n[\s\S]*?\n---\n/`) before calling `marked.parse()`, and separately capture the frontmatter's `description:` value (regex) to surface as a card subtitle.
   - Render to `<div class="skill-artifact" data-skill="<name>">...</div>`, keyed in a new `renderedSkills` map (parallel to `rendered`).
   - Add a second placeholder pass: replace `<!-- @@SKILL:<name> -->` the same way `@@MD:<id>` is replaced, with its own `usedIds` tracking, missing-placeholder error, and unused-artifact warning.

3. **Add the new page to `src/index.html`:**
   - New sidebar nav group (append as Group 6, after "Single-shot vs Spec-Driven"): `data-page="skills"`, label "Skills Library", sub-items linking to `#skills/skills-library` (Overview) and `#skills/skills-definitions` (Definitions).
   - New `<div class="page" id="page-skills">` containing:
     - `<div class="hero" id="skills-hero">` — badge + h1 + intro paragraph, adapted from fsad_playbook's copy (drop the `fsd:`-namespace install instructions since these aren't installed as a plugin from this repo — reframe as reference material copied from fsad_playbook, with a link/credit back to it).
     - `<section id="skills-library">` — `.wf-grid` cards grouped under four `.section-label` subheadings: **Workflow Management** (`do-task`, `add-task`, `ship`, `ship-it`, `next`, `ac`, `estimate`, `set-context`), **Specification & Planning** (`plan`, `plan-review`, `prd`, `spec-review`), **Review & Security** (`code-review-team`, `sec-review-team`, `sec-review-fixes`), **Prompting** (`prompt-improver`). Each card: label (`/skill-name`), h4 (one-line purpose), p (2–3 sentence summary), chips — hand-authored from each skill's frontmatter `description:` and opening section, not auto-generated.
     - `<section id="skills-definitions">` — 16 `.collapsible` blocks (or similar existing primitive), one per skill, each containing its `<!-- @@SKILL:<name> -->` placeholder so the build injects the real rendered `SKILL.md` content.
   - Add `skills: 'Skills Library'` to the `pageTitles` map (line 3587).

4. **Update `CLAUDE.md`** "Five sections (pages)" table → six rows, adding:
   | `skills` | Skills Library | **Static/reference** — cloned from fsad_playbook's Skills Library page; cards + full SKILL.md source for 16 copied skills |

5. **Rebuild and verify:** `npm run bundle`, open `dist/fsad-training.html` via `file://`, click through the new nav group, confirm both sub-sections render, confirm no bundler warnings/errors for missing or unused artifacts.

## Acceptance Criteria
- [x] `fsad_training/skills/` contains exactly the 16 named skill directories, each with the same files (verbatim, same relative paths) as the corresponding directory in fsad_playbook's git history — no `init`, `playbook-assistant`, `sync`, `engineering-skills`, or `product-skills` directories present.
- [x] `scripts/bundle.mjs` reads every `skills/<name>/SKILL.md`, strips YAML frontmatter before rendering, and errors loudly if a `@@SKILL:<id>` placeholder has no matching skill (mirroring the existing `@@MD:<id>` behavior).
- [x] `src/index.html` has a 6th sidebar nav group ("Skills Library") and a `#page-skills` div that becomes visible and gets marked `.active` when clicked, with no changes required to `switchPage`/`handleRoute`.
- [x] The Skills Library page renders a categorized card grid (`#skills-library`, 16 cards across 4 category groups) and a definitions section (`#skills-definitions`, 16 entries) each showing the actual copied SKILL.md content.
- [x] `pageTitles` map includes `skills: 'Skills Library'` and the page indicator/title bar shows it correctly when the page is active.
- [x] `npm run bundle` completes with no missing-placeholder errors and no unused-artifact warnings.
- [x] `CLAUDE.md`'s "Five sections (pages)" table is updated to reflect six sections.
- [x] `dist/fsad-training.html` opened directly via `file://` shows the new Skills Library nav entry, both sub-sections render correctly, and existing pages/nav are unaffected.

All criteria verified 2026-08-31 before commit. AC1–AC7 verified via independent fan-out + adversarial refuter gate (all 7 refuter-confirmed). AC8 required live visual confirmation in a real `file://` browser session that this flow's tooling could not produce automatically (the available browser-automation tool refuses to open local `file://` URLs) — the user opened `dist/fsad-training.html` directly and confirmed it renders correctly.

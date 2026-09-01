# FSD_Train-024 — rename skill "ac" to "verify-ac", update the skills section (and anywhere) the "ac" skill is referenced.

## Source
Own idea — requested directly by the user.

## Summary
The `ac` skill (acceptance-criteria verifier) is being renamed to `verify-ac` for clarity. All copies of it — the physical skill directory, its own internal self-references, and every place the training app surfaces or links to it — need to be updated to the new name.

## Assessment
Current locations referencing the `ac` skill:

- `skills/ac/SKILL.md` — the skill file itself. Contains self-references: heading `# fsad-harness:ac — acceptance criteria verifier` (line 6), and two prose references to `/fsad-harness:ac` (lines 47, 141).
- `src/index.html:3640-3642` — Skills Library page: `<div class="collapsible" id="skill-ac">`, header `<h3>/ac</h3>`, and `<!-- @@SKILL:ac -->` placeholder that the bundler replaces with the rendered SKILL.md body.
- `src/index.html:3498-3505` — Slash Commands page reference card: `<span class="wf-card-label">/ac &lt;ID&gt;</span>` with description "Verify acceptance criteria".
- `dist/fsad-training.html` — generated file; will pick up the rename automatically via `npm run bundle` once source files are updated. Do not hand-edit.

**Caveat:** per this repo's `CLAUDE.md`, skill files under `skills/<name>/` are normally synced verbatim from `~/repo/fsad_playbook/skills/` and not hand-edited. `fsad_playbook`'s copy is still named `ac` (unrenamed) as of this task. Renaming only in `fsad_training` creates a local divergence — a future re-sync from `fsad_playbook` would need to re-apply this rename or reconcile with an upstream rename if one happens later. This is a known, accepted tradeoff per user request, not a blocker.

## Plan

1. Rename the skill directory: `git mv skills/ac skills/verify-ac` (or `mv` + `git add`/`git rm` if `git mv` doesn't handle the untracked case).
2. In `skills/verify-ac/SKILL.md`, update self-references from `ac` to `verify-ac`:
   - Line 6 heading → `# fsad-harness:verify-ac — acceptance criteria verifier`
   - Line 47 and line 141 → `/fsad-harness:verify-ac`
3. In `src/index.html`:
   - Line 3498: `/ac &lt;ID&gt;` → `/verify-ac &lt;ID&gt;`
   - Line 3640: `id="skill-ac"` → `id="skill-verify-ac"`
   - Line 3641: `<h3>/ac</h3>` → `<h3>/verify-ac</h3>`
   - Line 3642: `<!-- @@SKILL:ac -->` → `<!-- @@SKILL:verify-ac -->`
4. Grep the whole repo (`src/`, `skills/`, `planning/`, `README.md`) for any other standalone `ac` skill reference missed above (word-boundary match, excluding false positives like "each", "react", "impact").
5. Run `npm run bundle` to regenerate `dist/fsad-training.html`.
6. Open `dist/fsad-training.html` and spot-check the Skills Library and Slash Commands pages render `verify-ac` correctly with no leftover `ac` references or broken links.

## Acceptance Criteria

All criteria verified 2026-09-01 before commit.
- [x] `skills/ac/` no longer exists; `skills/verify-ac/SKILL.md` exists and contains the acceptance-criteria-verifier content.
- [x] `grep -rn "fsad-harness:ac\b" skills/ src/` returns no matches (all self-references in `skills/verify-ac/SKILL.md` say `fsad-harness:verify-ac`).
- [x] `src/index.html` contains `id="skill-verify-ac"`, `<!-- @@SKILL:verify-ac -->`, and no remaining `id="skill-ac"` or `@@SKILL:ac` placeholder.
- [x] `src/index.html`'s Slash Commands reference card shows `/verify-ac` as the label (line ~3498), not `/ac`.
- [x] `npm run bundle` completes without warning about an unused `.md` file or skill, and without erroring on a missing placeholder.
- [x] `dist/fsad-training.html` contains no occurrence of the standalone old skill name `ac` in a skill-context string (`skill-ac`, `@@SKILL:ac`, `/ac <ID>`, `fsad-harness:ac`) and does show `verify-ac` in the Skills Library and Slash Commands pages.

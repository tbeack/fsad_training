# FSD_Train-023 — Fix oversized markdown formatting on the Skills page

## Summary
The Skills Library page renders each skill's `SKILL.md` body through the same `marked.parse()` pipeline as the Section 4 deep-dive artifacts, but wraps the output in `.skill-artifact` instead of `.md-artifact`. `.md-artifact` carries the full typography scale tuned to mirror `fsad_playbook`'s compact styling; `.skill-artifact` has no matching CSS at all, so every skill card falls back to browser-default font sizes — visibly oversized next to the rest of the app.

## Assessment
- `scripts/bundle.mjs` wraps each rendered `SKILL.md` body in `<div class="skill-artifact" data-skill="...">` (preceded by `<p class="skill-description">` when the frontmatter has a `description:`), producing the same element mix (`h1`-`h3`, `p`, `ul`/`ol`/`li`, `code`, `pre`/`pre code`, `blockquote`, `strong`, `hr`) as the `.md-artifact` wrapper used by the deep-dive stepper.
- `src/index.html` styles `.md-artifact` at lines 1969-2021 — a full typographic scale (h1 1.18rem, h2 1.02rem, h3 0.92rem, p 0.86rem, li/ul/ol 0.86rem, code 0.78rem, pre code 0.76rem, etc.) already tuned to match `fsad_playbook`'s compact card typography.
- `src/index.html` has **no CSS at all** targeting `.skill-artifact` or `.skill-description` — confirmed via `grep -n "skill-artifact\|skill-description" src/index.html` (zero hits). Those elements render entirely on user-agent defaults (h1 ≈ 2em, p ≈ 1em), which reads as much larger than the surrounding app chrome.
- `fsad_playbook`'s own Skills Library page (`fsad_playbook/src/pages/skills.html`) takes a different approach: it renders the description as a plain `<p>` and the full `SKILL.md` source as raw, unparsed text inside a `<pre data-copy>` block (font-size 0.8rem, monospace) rather than as structured markdown. `fsad_training` already committed to parsed markdown for skill bodies (matching its own deep-dive pattern), so the fix is to extend `.md-artifact`'s already-tuned scale onto `.skill-artifact`, not to switch rendering strategies.
- No skill currently uses `h4` or markdown tables that would need extra selectors beyond what `.md-artifact` already covers (checked via `grep -rn "^####" skills/*/SKILL.md` — no hits; a few skills use tables, but `.md-artifact` doesn't style tables either today — that's a pre-existing gap shared by both artifact types and out of scope here).

**Location:** `src/index.html` — the `.md-artifact` CSS block starting at line 1969.

## Plan

1. In `src/index.html`, extend every `.md-artifact` typography selector in the block at lines 1969-2021 to also match `.skill-artifact` (comma-combined selectors: `h1`/`h2`/`h3`, `p`, `ul`/`ol`, `li`, `code`, `pre`, `pre code`, `blockquote`, `strong`, `hr`). Leave the `.md-artifact` / `.md-artifact.active` / `.md-artifact-wrap .md-artifact` display-toggle rules untouched — those drive the deep-dive stepper's show/hide behavior and don't apply to `.skill-artifact`, which is always visible inside its own `.collapsible-content`.
2. Add a `.skill-description` rule matching `.md-artifact p`'s sizing (font-size 0.86rem, color `var(--text-secondary)`, line-height 1.72, margin) so the description line above each skill's body reads at the same scale as the rest of the card.
3. Run `npm run bundle` to regenerate `dist/fsad-training.html`.
4. Open `dist/fsad-training.html` directly in a browser, navigate to the Skills Library page, expand a couple of skill cards that exercise headings/lists/code (e.g. `do-task`, `add-task`), and visually confirm sizes now match the Section 4 deep-dive artifact panes.

All criteria verified 2026-08-31 before commit.

## Acceptance Criteria
- [x] `.skill-artifact` headings (`h1`/`h2`/`h3`), paragraphs, lists, `code`, `pre`/`pre code`, `blockquote`, `strong`, and `hr` share the same font-size rules as the equivalent `.md-artifact` elements in `src/index.html` (verified by the selectors being comma-combined, and by computed `font-size` matching in devtools).
- [x] `.skill-description` renders at 0.86rem (matching `.md-artifact p`), not the browser default paragraph size.
- [x] `npm run bundle` completes cleanly with no missing-placeholder or unused-artifact warnings.
- [x] Opening `dist/fsad-training.html` and expanding a skill card on the Skills Library page shows headings and body text at the same visual scale as the deep-dive artifact panes elsewhere in the app — no oversized default-browser-size headings/paragraphs.

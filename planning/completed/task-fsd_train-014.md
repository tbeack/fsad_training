# FSD_Train-014 — Statusline customization examples

## Source
`FSD_Train-014` from `planning/to do/todo.md`. The existing `statusline` section in the Basics page covers what each field means but gives no guidance on how to change it. Add a "Customizing the statusline" subsection with 3 concrete prompts and terminal-style mockups of the resulting display.

## Summary
Append the `#statusline` section in `src/index.html` with a labelled subsection showing 3 prompt→display pairs. Each pair has: the user's natural-language prompt in monospace, and a dark terminal-strip rendering what the configured statusline looks like.

## Assessment

**Current state:**
- `src/index.html` statusline section (lines ~2288–2304) has 4 overview cards + a context-bar warning callout.
- No guidance on how to change or configure the statusline.

**Work needed:**
1. After the warning callout in `#statusline`, insert a `<h3>` subheading and 3 example cards directly in `src/index.html`.
2. Each card: prompt row (top, `var(--bg-surface)`) + terminal-strip row (bottom, `#12121e` dark bg, monospace).
3. Run `npm run bundle`.
4. Bump version to v1.7 in `src/index.html`, `README.md`, and `CHANGELOG.md`.

## Examples to show

| # | Prompt | Statusline display |
|---|--------|-------------------|
| 1 | `"Set up a statusline for my Claude Code sessions"` | `⊙  claude-sonnet-4-6  ·  23%  ·  automode  ·  ~/project` |
| 2 | `"Simplify my statusline — just show model and context"` | `⊙  claude-sonnet-4-6  ·  23%` |
| 3 | `"Add my current git branch to the statusline"` | `⊙  claude-opus-4-7  ·  67%  ·  main  ·  plan  ·  ~/project` |

## Acceptance Criteria

- [ ] A "Customizing the statusline" subheading appears after the warning callout in the statusline section
- [ ] 3 prompt+display pairs are shown, each in a card-style container
- [ ] Terminal strip uses dark background (`#12121e`) with violet accent dot and muted purple text
- [ ] Git branch in example 3 is highlighted in a distinct color (emerald)
- [ ] Section renders consistently with the rest of the Basics page
- [ ] No new CSS classes added — all styling is inline (consistent with this section's pattern)
- [ ] `npm run bundle` completes with no errors
- [ ] Version bumped to v1.7 across `src/index.html`, `README.md`, `CHANGELOG.md`

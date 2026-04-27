# FSD_Train-012 — Reduce wasted white space at the top of every section

## Source
`FSD_Train-012` from `planning/to do/todo.md`. Every page opens with an excessive vertical gap before the first visible content, and each section within a page has a similarly large top padding. Tighten both so the screen real estate is used more effectively during live presentation.

## Assessment

**Where the space comes from:**

| Source | Value | Notes |
|---|---|---|
| `.page.active { padding-top }` | `62px` | Clears the fixed page-indicator bar — do not reduce |
| `.hero { padding }` | `5rem 2.5rem 4rem` | 5rem top (~80px) is the primary offender |
| `section { padding }` | `5rem 2.5rem` | 5rem top on every section adds a large gap between sections |

Total before first hero content: ~142px (62px page + 80px hero-top). Feels like half a screen on a laptop at 1080p.

**What to change:**

1. **`.hero` top padding** — reduce from `5rem` to `2.5rem`. The hero glow pseudo-element (`::before`) is positioned with `top: -50%` relative to the hero, so it scales with the hero height and will still look correct with a smaller top pad.

2. **`section` top padding** — reduce from `5rem` to `3rem`. Bottom padding can stay at `5rem` (it separates content from the next section's heading, which needs breathing room). The change is to the shorthand: `5rem 2.5rem` → `3rem 2.5rem 5rem`.

No other padding/margin changes needed — the space *between* sections (bottom of one + top of next = 5rem + 3rem = 8rem) remains generous enough.

## Files to change

- `src/index.html` — two CSS rule edits (`.hero` and `section`)
- `dist/fsad-training.html` — rebundle

## Acceptance Criteria

- [x] `.hero { padding }` top value reduced from `5rem` to `1.25rem`
- [x] `.hero { padding }` bottom value reduced from `4rem` to `1.5rem`
- [x] `hero-badge { margin-bottom }` reduced from `1.5rem` to `0.6rem`
- [x] `hero h1 { margin-bottom }` reduced from `1.2rem` to `0.6rem`
- [x] `hero p { margin-bottom }` removed (was `2.5rem`)
- [x] `section { padding-top }` reduced from `5rem` to `1.5rem`
- [x] Hero glow background still visually centred and not clipped
- [x] No section content is visually cramped or overlaps the fixed page-indicator bar
- [x] `npm run bundle` completes with no errors
- [x] Verified across at least two pages (e.g. Workflow and Deep-Dive) that the tighter spacing looks correct

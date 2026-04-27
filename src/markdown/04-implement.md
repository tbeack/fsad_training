# Implement — PacHangman

## Prompt

> `/clear`
>
> `execute phase 0 and 1`

---

**Output:** [`./demo/plan/hang_implementation_plan.md`](../demo/plan/hang_implementation_plan.md)

[View session replay →](../session-replay/Hangman%20-%20Start%20the%20Implementation.html)

---

## hang_implementation_plan.md — Phases 0 & 1

````markdown
# PacHangman — Implementation Plan

> Source of truth: `planning/design/hangman_spec.md` (v2 Draft, 2026-04-27).
> Scope: v1 only — vanilla stack, zero build step required to play.
> Ship target: `python3 -m http.server 8000` from repo root, all 14 acceptance criteria from spec §10 passing in Chrome, Firefox, and Safari.

---

## Progress

**46 / 68 steps complete**

`█████████████████████████████░░░░░░░░░░░` 68%

| Phase | Steps | Done |
|---|---|---|
| Phase 0 — Repo scaffold | 5 | 5 ✓ |
| Phase 1 — Pure logic + persistence | 9 | 9 ✓ |
| Phase 2 — Word list build pipeline | 5 | 5 ✓ |
| Phase 3 — Theme + screens shell | 10 | 10 ✓ |
| Phase 4 — Maze + sprite sheet | 7 | 7 ✓ |
| Phase 5 — Game screen + interactions | 5 | 5 ✓ |
| Phase 6 — Animations | 6 | 0 |
| Phase 7 — Audio stub, edge cases, mobile, a11y | 5 | 5 ✓ |
| Phase 8 — Final acceptance pass | 17 | 0 |
| **Total** | **69** | **29** |

---

## 1. Pinned Implementation Calls

These resolve the "low-stakes defaults" from spec §9. Do not revisit during build.

| Call | Value |
|---|---|
| Module system | Native ES modules — `<script type="module" src="src/main.js">` in `index.html` |
| `package.json` role | `"type": "module"` + `"scripts": { "build-words": "node tools/build-wordlists.js" }` only. No runtime deps. |
| Dev server | `python3 -m http.server 8000` |
| Test runner | Node built-in `node:test` — zero deps, no Jest, no Vitest |
| Seed file size | ~50 core seeds per category; expand to 200 only if a tier under-fills 900 words |
| READY! duration | 1.5s |
| Pac-Man traversal | 300ms per leg (to pellet, back to home) |
| Ghost emerge | 600ms ease-in-out |
| Win maze strobe | 6 flashes × 80ms each |
| Profanity blocklist | LDNOOBW en JSON (download at build time) |
| Gitignored paths | `tools/cache/` (downloaded source dictionaries) |

---

## 2. Phases

---

### Phase 0 — Repo scaffold

- [x] **Phase 0 complete**

**Goal:** Clean directory tree + `index.html` shell that loads error-free in a browser.

**Steps:**
- [x] Create directory tree: `styles/`, `src/render/`, `assets/`, `words/`, `tools/seeds/`, `tools/cache/` (.gitignored), `tests/`
- [x] `index.html` — skeleton with Press Start 2P link, inline `<svg id="sprites">` block, `<div id="app" data-screen="title">` with three screen sections, `sr-announce` region
- [x] `.gitignore` — `tools/cache/`, `.DS_Store`
- [x] `package.json` — `"type": "module"`, `"build-words"` script
- [x] **Verify:** `python3 -m http.server 8000` → `localhost:8000` renders a blank white page, DevTools console is clean

**`index.html` required structure:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PacHangman</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <!-- styles linked here in phase 3 -->
  <script type="module" src="src/main.js" defer></script>
</head>
<body>
  <!-- Inline SVG sprite sheet — populated in phase 4 -->
  <svg id="sprites" style="display:none" xmlns="http://www.w3.org/2000/svg">
  </svg>

  <!-- Aria-live region for screen reader announcements -->
  <div class="sr-only" aria-live="polite" aria-atomic="true" id="sr-announce"></div>

  <div id="app" data-screen="title">
    <section class="screen screen--title" data-screen-id="title"></section>
    <section class="screen screen--game"  data-screen-id="game"></section>
    <section class="screen screen--result" data-screen-id="result"></section>
  </div>
</body>
</html>
```

**`package.json`:**
```json
{
  "name": "pachangman",
  "type": "module",
  "scripts": {
    "build-words": "node tools/build-wordlists.js"
  }
}
```

---

### Phase 1 — Pure logic + persistence

- [x] **Phase 1 complete**

**Goal:** All game rules, state transitions, and persistence coded as pure/isolated modules — no DOM, no globals, unit-tested in Node.

**Spec references:** §4.1 (state shape), §4.2 (transitions), §4.3 (persistence), §5.1–5.4 (rules + scoring), §5.6 (score formula).

**Steps:**
- [x] `src/state.js` — `initialState` object + `reduce(state, action) → state` pure reducer
- [x] `src/game.js` — `guessLetter`, `guessWord`, `isWin`, `isLoss`, `computeScore`
- [x] `src/words.js` — `loadCategory(category, wordsCache, setCache)`, `pickWord({ difficulty, category, recentWords, wordsCache })`
- [x] `src/persist.js` — `load() → slice | defaults`, `save(slice) → void` against key `pachangman_v1`
- [x] `tests/game.test.js` — hit, miss, repeat-letter, win, loss, full-word correct + wrong, score formula
- [x] `tests/words.test.js` — avoids recentWords, falls back to full pool, returns correct tier
- [x] `tests/state.test.js` — START_GAME init, GUESS_LETTER flow, QUIT resets streak, reducer is pure
- [x] `tests/persist.test.js` — load defaults/parse-fail/missing-fields, save shape, wordsCache exclusion, round-trip
- [x] **Verify:** `npm test` exits 0, all 47 test cases green

#### `src/state.js`

Actions to handle:

| Action type | Payload | Effect |
|---|---|---|
| `START_GAME` | `{ word, difficulty, category }` | Set word, reset revealed/guessed/lives/outcome; bump level |
| `GUESS_LETTER` | `{ letter }` | Reveal positions or decrement lives; set outcome if terminal |
| `GUESS_WORD` | `{ word }` | WIN or decrement lives; set outcome if terminal |
| `QUIT` | — | Set screen to `'title'`; reset streak (loss) |
| `RESTART` | `{ word }` | Same difficulty+category; new word; bump level |
| `SET_SCREEN` | `{ screen }` | Transition screen |

#### `src/game.js`

```js
export function guessLetter(state, letter) → Partial<state>
export function guessWord(state, word) → Partial<state>
export function isWin(revealed) → boolean
export function isLoss(lives) → boolean
export function computeScore({ difficulty, lives, word }) → number
  // base(difficulty) × lives × (1 + (word.length - minLength) × 0.1)
  // base: easy=10, normal=20, hard=40
```

#### `src/words.js`

```js
export async function loadCategory(category, wordsCache, setCache)
export function pickWord({ difficulty, category, recentWords, wordsCache }) → string
```

#### `src/persist.js`

```js
export function load() → persistedSlice | defaults
  // Persisted fields: streak, bestStreak, highScore, recentWords, settings
export function save(slice) → void
// wordsCache is NOT persisted (spec §4.3)
```
````

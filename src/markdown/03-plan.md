# Plan — PacHangman

## Prompt

> `/clear`
>
> `/plan`
>
> create an implementation plan for the game. Read the ./planning/hangman_spec.md spec to develop the plan. write the plan to ./planning/plan/hang_implementation_plan.md

---

**Output:** [`./demo/plan/hang_implementation_plan.md`](../demo/plan/hang_implementation_plan.md)

[View session replay →](../session-replay/Hangman%20-%20Develop%20Implementation%20Plan.html)

---

## hang_implementation_plan.md

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

Nine phases, each with a clear verify step before moving to the next.

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

---

### Phase 1 — Pure logic + persistence

- [x] **Phase 1 complete**

**Goal:** All game rules, state transitions, and persistence coded as pure/isolated modules — no DOM, no globals, unit-tested in Node.

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

---

### Phase 2 — Word list build pipeline

- [x] **Phase 2 complete**

**Goal:** Three populated `words/*.json` files with ≥ 900 words per difficulty tier.

**Steps:**
- [x] `tools/seeds/arcade.txt` — ~50 seeds from spec §5.3
- [x] `tools/seeds/scitech.txt` — ~50 seeds from spec §5.3
- [x] `tools/seeds/movies.txt` — ~50 single-word film titles from spec §5.3
- [x] `tools/build-wordlists.js` — full build script per spec §5.5 algorithm
- [x] **Verify:** `npm run build-words` exits 0, `node --test tests/words-output.test.js` exits 0

---

### Phase 3 — Theme + screens shell

- [x] **Phase 3 complete**

**Goal:** Title and Result screens render correctly; `data-screen` switching works; fonts load.

**Steps:**
- [x] `styles/reset.css`, `styles/theme.css`, `styles/layout.css`, `styles/screens.css`
- [x] `src/render/shared.js` — `renderHUD(state, container)`
- [x] `src/render/title.js` — difficulty radios, category select, INSERT COIN button
- [x] `src/render/result.js` — outcome banner, revealed word, streak update
- [x] `src/main.js` — boot sequence: load persisted state, detect `prefers-reduced-motion`, render Title
- [x] `src/input.js` — keyboard + pellet click delegation wired to `dispatch`
- [x] **Verify:** Title screen renders; INSERT COIN transitions to Game div

---

### Phase 4 — Maze + sprite sheet

- [x] **Phase 4 complete**

**Goal:** Game screen shows the full arcade maze, ghost house, and Pac-Man at home position.

**Steps:**
- [x] `assets/sprites.svg` — 7 `<symbol>` defs
- [x] `styles/maze.css`, `styles/sprites.css`
- [x] `src/render/maze.js`, `src/render/sprites.js`
- [x] **Verify:** Maze scaffold renders; ghost house and Pac-Man at home visible

---

### Phase 5 — Game screen + interactions

- [x] **Phase 5 complete**

**Goal:** Full playable game loop — letter guessing via keyboard and alphabet pellets.

**Steps:**
- [x] `styles/game.css` — word display + alphabet pellet states
- [x] `src/render/game.js` — word slots, 26 alphabet buttons, word-guess `<dialog>`
- [x] `src/input.js` (complete wiring) — A–Z, Enter, Space, ESC
- [x] `src/main.js` dispatch loop — `dispatch(action) → reduce → render → persist.save`
- [x] **Verify:** A–Z key guess works; word-guess modal works

---

### Phase 6 — Animations

- [ ] **Phase 6 complete**

**Goal:** All spec §3.8 animations with `prefers-reduced-motion` support.

**Steps:**
- [ ] `styles/animations.css` — all `@keyframes` + reduced-motion overrides
- [ ] Ghost emerge sequencing in `src/render/sprites.js`
- [ ] READY! interstitial, Win animation, Death animation
- [ ] **Verify:** Hit → Pac-Man traverses; miss → ghost emerges; win/loss animations play

---

### Phase 7 — Audio stub, edge cases, mobile, accessibility

- [x] **Phase 7 complete**

**Steps:**
- [x] `src/audio.js` — 7 no-op methods wired at call sites
- [x] Edge cases — ESC confirm, Tab+Space, resize, JSON load-fail overlay
- [x] Mobile layout (≤480px) — compact view, 6-col alphabet grid
- [x] Accessibility — `#sr-announce`, aria attrs, focus rings, touch targets ≥44px

---

### Phase 8 — Final acceptance pass

- [ ] **Phase 8 complete**

**Goal:** All 14 spec §10 acceptance criteria verified in Chrome, Firefox, and Safari.

**Steps:**
- [ ] AC #1–15: full acceptance matrix
- [ ] Browser matrix: Chrome, Firefox, Safari

---

## 3. Critical Files Reference

| File | Phase | Spec § |
|---|---|---|
| `index.html` | 0 | §6.1, §6.4 |
| `src/state.js` | 1 | §4.1, §4.2 |
| `src/game.js` | 1 | §5.1, §5.4, §5.6 |
| `src/words.js` | 1 | §5.4 |
| `src/persist.js` | 1 | §4.3 |
| `styles/theme.css` | 3 | §3.1, §3.2 |
| `src/render/maze.js` | 4 | §3.4 |
| `src/render/sprites.js` | 4, 6 | §3.3, §3.5, §3.7 |
| `styles/game.css` | 5 | §3.6, §3.7 |
| `styles/animations.css` | 6 | §3.8 |
| `src/audio.js` | 7 | §7 |

---

## 4. Out of Scope (v1)

- Real audio — `audio.js` stub only
- Daily challenge, hint power-pellets, multi-theme switcher
- Stats screen, achievements, leaderboard, share-result
- gzip word bundle compression, accounts, backend, multiplayer

---

## 5. End-to-End Verification Recipe

1. `python3 -m http.server 8000` → open `http://localhost:8000`
2. Happy path — Easy/Arcade win: confirm maze strobe + victory loop + streak = 1
3. Happy path — Normal/SciTech loss: confirm death animation + streak resets to 0
4. Happy path — Hard/Movies word-guess: press Enter, type correct word, confirm WIN
5. Streak persistence: reload page, confirm streak preserved
6. Reduce motion: System Settings → Reduce Motion ON → no traversal animations
7. Mobile: DevTools 375×667 → no horizontal scroll, 6-col alphabet grid
8. `node --test tests/` → all pass
````

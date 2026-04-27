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

**`.gitignore`:**
```
tools/cache/
.DS_Store
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
- [x] `tests/persist.test.js` — load defaults/parse-fail/missing-fields, save shape, wordsCache exclusion, round-trip (see verification plan)
- [x] **Verify:** run all checks in `planning/plan/hangman_verification_phase_01.md` — static grep checks pass, `npm test` exits 0, all 47 test cases green, coverage matrix complete

#### `src/state.js`

Exports:
- `initialState` — the full state object matching spec §4.1 shape.
- `reduce(state, action) → state` — pure reducer. No mutations; return new state object.

Actions to handle:

| Action type | Payload | Effect |
|---|---|---|
| `START_GAME` | `{ word, difficulty, category }` | Set word, reset revealed/guessed/lives/outcome; bump level |
| `GUESS_LETTER` | `{ letter }` | Reveal positions or decrement lives; set outcome if terminal |
| `GUESS_WORD` | `{ word }` | WIN or decrement lives; set outcome if terminal |
| `QUIT` | — | Set screen to `'title'`; reset streak (loss) |
| `RESTART` | `{ word }` | Same difficulty+category; new word; bump level |
| `SET_SCREEN` | `{ screen }` | Transition screen |

Win/loss terminal checks happen inside `reduce` — call helpers from `src/game.js` (import into reducer).

#### `src/game.js`

Exports (pure functions, take slices of state, return values — no side effects):

```js
export function guessLetter(state, letter) → Partial<state>
  // Returns { revealed, guessed, lives, outcome } delta

export function guessWord(state, word) → Partial<state>
  // Returns { lives, outcome, revealed } delta

export function isWin(revealed) → boolean
  // All positions true

export function isLoss(lives) → boolean
  // lives === 0

export function computeScore({ difficulty, lives, word }) → number
  // base(difficulty) × lives × (1 + (word.length - minLength) × 0.1)
  // base: easy=10, normal=20, hard=40
  // minLength: easy=3, normal=6, hard=9
```

#### `src/words.js`

Exports:

```js
export async function loadCategory(category, wordsCache, setCache)
  // fetch('./words/<category>.json'), parse, store via setCache
  // throws on non-ok response (caller shows error overlay)

export function pickWord({ difficulty, category, recentWords, wordsCache }) → string
  // Spec §5.4 algorithm: filter recentWords, fallback to full pool
```

#### `src/persist.js`

Exports:

```js
export function load() → persistedSlice | defaults
  // Read 'pachangman_v1' from localStorage, defensive JSON.parse
  // Persisted fields: streak, bestStreak, highScore, recentWords, settings

export function save(slice) → void
  // JSON.stringify(slice) → localStorage['pachangman_v1']
```

`wordsCache` is NOT persisted (spec §4.3).

#### `tests/`

Three test files using `node:test` + `node:assert`:

**`tests/game.test.js`** — cover:
- `guessLetter` hit: reveals all matching positions, outcome null.
- `guessLetter` hit completing word: outcome `'win'`.
- `guessLetter` miss: lives decremented, outcome null.
- `guessLetter` miss to zero lives: outcome `'loss'`.
- `guessLetter` repeat letter: no state change (idempotent delta).
- `guessWord` correct: outcome `'win'`.
- `guessWord` wrong: lives--, outcome null if lives > 0.
- `guessWord` wrong to zero lives: outcome `'loss'`.
- `computeScore` formula correctness at each difficulty.

**`tests/words.test.js`** — cover:
- `pickWord` avoids `recentWords`.
- `pickWord` falls back to full pool when all words in `recentWords`.
- `pickWord` returns a string in the correct tier.

**`tests/state.test.js`** — cover:
- `START_GAME` initialises word/revealed/lives correctly.
- `GUESS_LETTER` action flows through reducer (delegates to game.js helpers).
- `QUIT` resets streak to 0.
- Reducer is pure (input state not mutated).

---

### Phase 2 — Word list build pipeline

- [x] **Phase 2 complete**

**Goal:** Three populated `words/*.json` files with ≥ 900 words per difficulty tier.

**Spec references:** §5.3 (categories + seeds), §5.5 (build script algorithm).

**Steps:**
- [x] `tools/seeds/arcade.txt` — ~50 seeds from spec §5.3
- [x] `tools/seeds/scitech.txt` — ~50 seeds from spec §5.3
- [x] `tools/seeds/movies.txt` — ~50 single-word film titles from spec §5.3
- [x] `tools/build-wordlists.js` — full build script per spec §5.5 algorithm
- [x] **Verify:** run all checks in `planning/plan/hangman_verification_phase_02.md` — `npm run build-words` exits 0, `node --test tests/words-output.test.js` exits 0 (43 tests green), static grep checks pass, shell spot-checks pass

#### `tools/seeds/arcade.txt`
~50 seeds — one word per line, drawn from spec §5.3 Arcade list:
```
pacman
tetris
pinball
joystick
asteroid
frogger
galaga
sprite
pixel
arcade
atari
nintendo
donkey
pong
breakout
centipede
defender
tempest
zaxxon
mame
rom
bios
cheat
combo
respawn
loot
hitbox
vector
raster
cabinet
marquee
bezel
trackball
flipper
plunger
bumper
paddle
quarter
token
highscore
```
(Expand to 200 if easy/normal/hard tiers under-fill 900 after build.)

#### `tools/seeds/scitech.txt`
~50 seeds from spec §5.3:
```
electron
quantum
neuron
satellite
pixel
kernel
photon
capacitor
algorithm
binary
matrix
circuit
voltage
genome
protein
catalyst
osmosis
entropy
isotope
fractal
topology
compiler
bandwidth
latency
firmware
semiconductor
transistor
telescope
microscope
polymer
alloy
neutron
proton
```

#### `tools/seeds/movies.txt`
~50 single-word film titles from spec §5.3:
```
alien
jaws
frozen
gladiator
inception
matrix
avatar
beetlejuice
grease
tenet
dune
prey
heat
leon
speed
signs
crash
up
us
whiplash
parasite
clue
misery
psycho
rocky
fargo
joker
moonlight
spotlight
arrival
logan
solo
thor
hulk
blade
```

#### `tools/build-wordlists.js`

Node script — algorithm per spec §5.5:

1. If `tools/cache/words_dictionary.json` missing: `fetch` dwyl english-words raw and write to cache.
2. If `tools/cache/google-10000-english.txt` missing: `fetch` first20hours frequency list and write to cache.
3. If `tools/cache/ldnoobw-en.json` missing: `fetch` LDNOOBW en list and write to cache.
4. For each category (`arcade`, `scitech`, `movies`):
   a. Read seed file from `tools/seeds/<category>.txt`.
   b. Filter dwyl dictionary: keep words whose value is `1` (valid English) and whose characters match any seed by exact substring or edit-distance ≤ 1.
   c. Bucket by length: easy = 3–5 chars, normal = 6–8, hard = 9–14.
   d. Remove words matching any LDNOOBW entry.
   e. If a tier has < 1000 candidates: backfill from frequency list filtered to same length range; deduplicate.
   f. Shuffle each tier (Fisher-Yates), cap at 1000.
   g. Write `words/<category>.json` as `{ easy: [...], normal: [...], hard: [...] }`.
5. Print final counts per tier to console.

Output file name for `scitech` category: `words/scitech.json` (matches spec §5.3 file layout).

---

### Phase 3 — Theme + screens shell

- [x] **Phase 3 complete**

**Goal:** Title and Result screens render correctly; `data-screen` switching works; fonts load.

**Spec references:** §2.1 (screens), §3.1–3.2 (palette + type), §6.4 (boot sequence).

**Steps:**
- [x] `styles/reset.css` — `box-sizing`, `margin`, `padding`, button reset
- [x] `styles/theme.css` — CSS custom properties (palette + type scale) from spec §3.1–3.2
- [x] `styles/layout.css` — viewport, flex column, `data-screen` visibility rules, `.sr-only`
- [x] `styles/screens.css` — Title + Result screen layout, CTA button styles
- [x] `src/render/shared.js` — `renderHUD(state, container)`: 1UP score, HIGH SCORE, CATEGORY, LEVEL
- [x] `src/render/title.js` — difficulty radios, category select, INSERT COIN button, streak display, lazy category fetch
- [x] `src/render/result.js` — outcome banner, revealed word, streak update, PLAY AGAIN / CHANGE CATEGORY / QUIT
- [x] `src/main.js` — boot sequence: load persisted state, detect `prefers-reduced-motion`, render Title, export `dispatch`
- [x] `src/input.js` — `keydown` (A–Z, Enter, Space, ESC) + pellet click delegation wired to `dispatch`
- [x] **Verify:** `localhost:8000` shows Title screen with difficulty controls and INSERT COIN; clicking INSERT COIN transitions to Game div; `data-screen` attribute updates on `#app`

#### `styles/theme.css`
CSS custom properties from spec §3.1 (exact hex values):
```css
:root {
  --bg:           #000000;
  --maze:         #2121DE;
  --pac:          #FFFF00;
  --dot:          #FFB8AE;
  --ghost-blinky: #FF0000;
  --ghost-pinky:  #FFB8DE;
  --ghost-inky:   #00FFDE;
  --ghost-clyde:  #FFB847;
  --text:         #FFFFFF;
  --text-dim:     #555555;
  --hit:          #00FF66;
  --miss:         #FF0044;
  --hud:          #FFB8AE;
  --font: 'Press Start 2P', monospace;
}
```
Type scale rules (spec §3.2): word letters 24px, HUD labels 12px, fine chrome 10px. All text `text-transform: uppercase`.

#### `styles/layout.css`
- `body`: `background: var(--bg)`, `color: var(--text)`, `font-family: var(--font)`.
- `#app`: full viewport, flex column.
- `.screen`: `display: none` by default.
- `[data-screen="title"] .screen--title`, `[data-screen="game"] .screen--game`, `[data-screen="result"] .screen--result`: `display: block` (or flex).
- `.sr-only`: visually-hidden class (clip-path technique).

#### `src/main.js`
Boot sequence per spec §6.4:
```js
// 1. DOMContentLoaded
// 2. persist.load() → state
// 3. detect prefers-reduced-motion → state.settings.reducedMotion
// 4. renderTitle()
// 5. export dispatch(action) → state = reduce(state, action) → render() → persist.save(persistedSlice)
```

`render()` switches on `state.screen` to call the right render function.

#### `src/input.js`
Event listener wiring — attached once in `main.js`:
- `keydown`: A–Z → `GUESS_LETTER`; Enter → open word-guess modal; Space → click focused button; ESC → confirm-quit.
- Alphabet pellet `click` events delegated from the pellets container.

---

### Phase 4 — Maze + sprite sheet

- [x] **Phase 4 complete**

**Goal:** Game screen shows the full arcade maze, ghost house, and Pac-Man at home position.

**Spec references:** §3.3 (sprites), §3.4 (layout diagram), §3.5 (ghost house).

**Steps:**
- [x] `assets/sprites.svg` — 7 `<symbol>` defs: `#pacman-open`, `#pacman-closed`, `#ghost`, `#ghost-frightened`, `#pellet`, `#power-pellet`, `#ghost-door`
- [x] Inline `<symbol>` elements into `<svg id="sprites">` block in `index.html`
- [x] `styles/maze.css` — maze wall divs, ghost house, corridor layout per spec §3.4 ASCII diagram
- [x] `styles/sprites.css` — `<use>` sizing, ghost `currentColor` overrides, Pac-Man chomp toggle
- [x] `src/render/maze.js` — inject maze scaffold HTML (maze wrapper, ghost house, ghost slots, Pac-Man at home, word-area div, pellet-row divs); called once on game screen mount
- [x] `src/render/sprites.js` — `setPacPos`, `setGhostState`, `animatePacTraverse` (WAAPI), `animateGhostEmerge` (WAAPI)
- [x] **Verify:** 30/30 static + code checks pass; shell script clean; browser visual checks next

#### `assets/sprites.svg`

Seven `<symbol>` elements per spec §3.3:

| Symbol | ViewBox | Key shapes |
|---|---|---|
| `#pacman-open` | `0 0 16 16` | Yellow circle with 240° arc (mouth open, facing right) |
| `#pacman-closed` | `0 0 16 16` | Full yellow circle |
| `#ghost` | `0 0 16 16` | Ghost body + two dot eyes; body uses `currentColor` for colour override |
| `#ghost-frightened` | `0 0 16 16` | Blue body, white rectangular eyes |
| `#pellet` | `0 0 8 8` | Small `<circle r="2" cx="4" cy="4">` in `--dot` colour |
| `#power-pellet` | `0 0 14 14` | Large `<circle r="5" cx="7" cy="7">` |
| `#ghost-door` | `0 0 16 4` | Horizontal bar in `--ghost-pinky` colour |

After creating `assets/sprites.svg`, copy the inner `<symbol>` elements into the `<svg id="sprites">` block in `index.html`.

#### `styles/maze.css`

Maze is structural `<div>`s with `border` walls. Key rules:
- `.maze`: `position: relative; border: 4px solid var(--maze); border-radius: 4px;`.
- `.maze-wall`: `border: 2px solid var(--maze); border-radius: 4px;` inside the playfield.
- `.ghost-house`: centred `<div>`, blue walls, positioned in upper-centre of maze.
- `.ghost-house__door`: `<use href="#ghost-door">` SVG across the opening.
- Ghost slots: `position: absolute` inside `.ghost-house`.
- Pac-Man home: `position: absolute; bottom: 16px; left: 16px` (bottom-left of maze).

#### `styles/sprites.css`

```css
use.pac { width: 16px; height: 16px; color: var(--pac); }
use.ghost { width: 16px; height: 16px; }
use.ghost--blinky { color: var(--ghost-blinky); }
use.ghost--pinky  { color: var(--ghost-pinky); }
use.ghost--inky   { color: var(--ghost-inky); }
use.ghost--clyde  { color: var(--ghost-clyde); }
```

Pac-Man chomp: alternate `#pacman-open` / `#pacman-closed` via CSS animation toggling `display`.

#### `src/render/sprites.js`

```js
export function setPacPos(x, y)
  // document.querySelector('.pac').style.setProperty('--pac-x', x+'px')
  // document.querySelector('.pac').style.setProperty('--pac-y', y+'px')

export function setGhostState(missCount)
  // Show/hide ghosts based on missCount per spec §3.5 table

export async function animatePacTraverse(targetEl, reducedMotion)
  // Web Animations API: Pac-Man moves home→target (300ms), chomps ×2, returns home (300ms)
  // If reducedMotion: skip WAAPI, instant eat, return resolved promise

export async function animateGhostEmerge(ghostEl, reducedMotion)
  // translateY path from ghost house to maze position (600ms)
  // If reducedMotion: instant position change
```

---

### Phase 5 — Game screen + interactions

- [x] **Phase 5 complete**

**Goal:** Full playable game loop — letter guessing via keyboard and alphabet pellets, word-guess CTA, all state transitions wired.

**Spec references:** §2.2 (user flow), §3.6 (word display), §3.7 (alphabet pellets), §4.2 (state transitions).

**Steps:**
- [ ] `styles/game.css` — word display (letter slots + underlines per §3.6) + alphabet pellet states (default / hover / hit / miss / used / ping per §3.7)
- [ ] `src/render/game.js` — word slots from `state.revealed`, 26 alphabet buttons with aria attrs, word-guess `<dialog>`, already-guessed ping
- [ ] `src/input.js` (complete wiring) — A–Z → `GUESS_LETTER`, Enter → modal, Space → focused button click, ESC → quit confirm, resize → `setPacPos`
- [ ] `src/main.js` dispatch loop — `dispatch(action) → reduce → render → persist.save`; fire animation calls (non-blocking) after render
- [ ] **Verify:** A–Z key guess works; clicking alphabet pellet works; Enter opens word-guess modal (correct→WIN, wrong→1 miss); guessing already-guessed letter shows ping with no life lost

#### `styles/game.css`

**Word display** (spec §3.6):
- `.word-area`: flex row, gap, centred in upper maze area.
- `.letter-slot`: flex column — `.letter` on top, `.underline` bar beneath.
- `.letter--hidden .letter`: `opacity: 0`.
- `.letter--revealed .letter`: `color: var(--pac); opacity: 1; transition: opacity 200ms`.
- `.letter--revealed .underline`: `animation: pellet-eat 150ms forwards` (shrinks underline).

**Alphabet pellets** (spec §3.7):
- Two rows of 13 `<button>` elements in `.pellet-row`.
- Default: `background: var(--dot); color: var(--text); border: 2px solid var(--maze)`.
- Hover/focus: `transform: scale(1.1); text-shadow: 0 0 8px var(--pac)`.
- `.pellet--hit`: flash `var(--hit)` 300ms → `opacity: 0.4; color: var(--text-dim)`.
- `.pellet--miss`: flash `var(--miss)` 300ms → `opacity: 0.4; color: var(--text-dim)`.
- `.pellet--used`: `opacity: 0.25; pointer-events: none`.
- Touch targets: min `44px × 44px`.

#### `src/render/game.js`

```js
export function renderGame(state, container, dispatch)
  // Render HUD (shared.js)
  // Render .word-area: one .letter-slot per character in state.word;
  //   apply --revealed or --hidden class per state.revealed
  // Render 26 alphabet <button>s:
  //   aria-label="Letter A", aria-pressed when guessed, aria-disabled when guessed
  // Wire GUESS WORD button → open word-guess modal
  // Wire QUIT button → ESC confirm flow
```

Word-guess modal: a `<dialog>` element (native) with a text `<input>` + Submit button. On submit: `dispatch({ type: 'GUESS_WORD', word: input.value.trim().toLowerCase() })`.

Already-guessed ping (spec §2.3): add `.pellet--ping` class that applies a brief `box-shadow` pulse animation, remove after 300ms. No state change.

#### `src/main.js` dispatch loop

```js
export function dispatch(action) {
  state = reduce(state, action);
  render(state);
  persist.save(persistedSlice(state));
}
```

`render(state)` calls `renderTitle`, `renderGame`, or `renderResult` based on `state.screen`. Animations triggered from here after render: call `animatePacTraverse` / `animateGhostEmerge` from sprites.js as fire-and-forget (no blocking dispatch).

---

### Phase 6 — Animations

- [ ] **Phase 6 complete**

**Goal:** All spec §3.8 animations implemented with `prefers-reduced-motion` support.

**Spec references:** §3.5 (ghost emerge sequencing), §3.7 (Pac-Man traverse steps), §3.8 (animation budget).

**Steps:**
- [ ] `styles/animations.css` — all `@keyframes` (chomp, pacman-death, maze-strobe, pellet-eat, ghost-emerge-1/2/3, pellet-ping) + `prefers-reduced-motion` overrides
- [ ] Ghost emerge sequencing in `src/render/sprites.js` — `setGhostState(missCount)` per spec §3.5 table; call `animateGhostEmerge` after each miss
- [ ] READY! interstitial — `.ready-text` injected into maze center on `START_GAME`, blinks for 1.5s, then removed; input disabled during interstitial
- [ ] Win animation — `maze-strobe` on `.maze` (6 × 80ms) + Pac-Man victory loop; transition to Result after strobe completes
- [ ] Death animation — `pacman-death` on Pac-Man sprite (1.2s) then transition to Result after 1.5s total
- [ ] **Verify:** Hit → Pac-Man traverses; miss → ghost emerges; 6 misses → death anim → result; win → strobe + loop; OS reduce-motion ON → all animations instant

#### `styles/animations.css`

```css
/* Pac-Man chomp — toggle between open/closed symbols */
@keyframes pacman-chomp { ... }

/* Pac-Man death — rotate+scale to zero, 1.2s */
@keyframes pacman-death {
  from { transform: rotate(0deg) scale(1); opacity: 1; }
  to   { transform: rotate(360deg) scale(0); opacity: 0; }
}

/* Maze wall strobe — 6 flashes × 80ms */
@keyframes maze-strobe {
  0%, 100% { border-color: var(--maze); }
  50%       { border-color: var(--text); }
}

/* Pellet eat — underline shrinks */
@keyframes pellet-eat {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}

/* Ghost emerge path — translateY from ghost house down to maze floor */
@keyframes ghost-emerge-1 { ... }
@keyframes ghost-emerge-2 { ... }
@keyframes ghost-emerge-3 { ... }

/* Already-guessed ping */
@keyframes pellet-ping {
  0%   { box-shadow: 0 0 0 0 var(--text); }
  100% { box-shadow: 0 0 0 8px transparent; }
}

/* Reduced motion overrides */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Ghost emerge sequencing (spec §3.5)

`setGhostState(missCount)` in `sprites.js` drives visibility. After each miss, `animateGhostEmerge` is called with the relevant ghost element per this table:

| Miss # | Ghost action |
|---|---|
| 1 | Blinky exits ghost house (emerge animation) |
| 2 | Blinky advances one maze segment toward Pac-Man |
| 3 | Pinky exits ghost house |
| 4 | Pinky advances toward Pac-Man |
| 5 | Inky exits ghost house |
| 6 | Inky reaches Pac-Man → death animation, then result screen after 1.5s |

Clyde never leaves the house in v1 (spec §3.5).

#### READY! interstitial

On `START_GAME` dispatch (inside `render/game.js` or `main.js`):
1. Inject `.ready-text` `<div>` into maze center with text "READY!".
2. Apply blinking CSS class.
3. After 1.5s → remove `.ready-text`, enable input, proceed.
4. Pac-Man animates into frame from home.

#### Win animation

On `outcome === 'win'`:
1. Apply `maze-strobe` animation to `.maze` element (6 × 80ms).
2. Pac-Man victory loop: `animatePacTraverse` to a point and back in a small circle (one 600ms loop).
3. After strobe completes (~480ms), transition to Result screen.

#### Death animation

On `outcome === 'loss'`:
1. Apply `pacman-death` animation to Pac-Man sprite (1.2s).
2. After 1.5s total (per spec §3.5), transition to Result screen.

---

### Phase 7 — Audio stub, edge cases, mobile, accessibility

- [x] **Phase 7 complete**

**Goal:** Complete all edge-case behaviours from spec §2.3, mobile layout, a11y requirements from spec §8, and audio stub from spec §7.

**Steps:**
- [x] `src/audio.js` — 7 no-op methods (`chomp`, `miss`, `win`, `loss`, `ready`, `tick`, `bgm`) + call sites wired in `main.js`
- [x] Edge cases — ESC quit `<dialog>`, Tab+Space discipline, window resize → `setPacPos`, JSON load-fail overlay, >150ms loading text in INSERT COIN
- [x] Mobile layout (≤480px) — `styles/layout.css` media query: 6-col alphabet grid, ghost house top, word middle; `main.js` mobile flag disables WAAPI traversal
- [x] Accessibility — `#sr-announce` text after each guess (hit/miss/win/loss), `aria-hidden` on sprites, `aria-label`/`aria-pressed`/`aria-disabled` on alphabet buttons, focus rings `2px solid var(--pac)`, tab order enforced, touch targets ≥44px
- [x] **Verify:** static checks all pass; browser checks per verification plan

#### `src/audio.js`

Seven no-op methods (wire call sites now so v2 only adds implementations):

```js
export const audio = {
  chomp()    {},   // letter hit
  miss()     {},   // letter miss
  win()      {},   // game win
  loss()     {},   // game loss
  ready()    {},   // READY! interstitial
  tick()     {},   // alphabet button hover
  bgm(play)  {},   // title background music
};
```

#### Edge cases (spec §2.3)

| Case | Implementation |
|---|---|
| ESC mid-game | Native `<dialog>` confirm: "QUIT RUN? STREAK WILL BE LOST." Yes → dispatch `QUIT`. No → close dialog, resume. |
| Tab + Space | `input.js` Space handler: `if (document.activeElement.tagName === 'BUTTON') document.activeElement.click()`. No duplicate guess fire. |
| Window resize | `window` `resize` listener → `setPacPos` to recalculate home coordinates. |
| Category JSON load fails | `loadCategory` rejection caught in title renderer → inject `.error-overlay` div with "NETWORK ERROR — PLEASE REFRESH". `INSERT COIN` stays disabled. |
| Category JSON loading > 150ms | `setTimeout(150ms)` after fetch starts → if still loading, set `INSERT COIN` text to "LOADING…". Clear on resolve. |
| Repeated letter in word | `guessLetter` in `game.js` already reveals all positions — covered by Phase 1. |

#### Mobile layout (≤ 480px) in `styles/layout.css`

```css
@media (max-width: 480px) {
  .maze { /* compact vertical stack */ }
  .ghost-house { /* top of maze */ }
  .word-area { /* middle */ }
  .pellet-rows { /* 6-column grid at bottom */ }
  /* Pac-Man traversal animation disabled (handled in sprites.js via reducedMotion flag OR mobile flag) */
}
```

Detect mobile in `main.js`: `window.innerWidth <= 480` → set `state.settings.mobile = true` → sprites.js skips WAAPI traversal.

#### Accessibility (spec §8)

- `#sr-announce` (`aria-live="polite"`): after each guess, set `textContent` to e.g. `"Letter E found — 2 positions revealed. 4 letters remaining."` or `"Letter Q not in word. 5 lives remaining."`.
- Win/loss: `"You win! The word was JOYSTICK."` / `"Game over. The word was JOYSTICK."`.
- All SVG sprite `<use>` elements: `aria-hidden="true"`.
- Alphabet `<button>`: `aria-label="Letter A"`, `aria-pressed="true"` when guessed, `aria-disabled="true"` when guessed.
- Focus rings: `outline: 2px solid var(--pac); outline-offset: 2px` on `:focus-visible` — never hidden.
- Tab order Title: difficulty radios → category select → INSERT COIN.
- Tab order Game: alphabet pellets A–Z → GUESS WORD → QUIT.

---

### Phase 8 — Final acceptance pass

- [ ] **Phase 8 complete**

**Goal:** All 14 spec §10 acceptance criteria verified in Chrome, Firefox, and Safari.

**Steps:**
- [ ] AC #1: `python3 -m http.server 8000` → no console errors (DevTools Console, full game)
- [ ] AC #2: Difficulty + category selectors functional; category JSON fetch fires on selection (Network tab)
- [ ] AC #3: INSERT COIN → READY! 1.5s → play begins
- [ ] AC #4: All 26 letters guessable via keyboard (A–Z) AND clicking alphabet pellets
- [ ] AC #5: Hit — Pac-Man visibly traverses to pellet, eats it, letter fills into word display
- [ ] AC #6: Miss — ghost visibly emerges from ghost house each miss
- [ ] AC #7: 6 misses — Pac-Man death animation plays, result screen appears
- [ ] AC #8: Word-guess CTA — correct word → WIN; wrong word → 1 miss
- [ ] AC #9: Win — maze walls strobe, Pac-Man victory loop, result screen shows streak +1
- [ ] AC #10: Streak + best streak + recent words + high score persist across page reload
- [ ] AC #11: Already-guessed letter → UI ping, no life penalty
- [ ] AC #12: Each category JSON ≥ 900 words per difficulty tier
- [ ] AC #13: Mobile 375×667 — simplified layout, no horizontal scroll
- [ ] AC #14: `prefers-reduced-motion` ON — all CSS transitions and keyframe animations disabled
- [ ] AC #15: `node --test tests/` → all assertions green
- [ ] Browser matrix: repeat happy paths (win + loss + word-guess) in Firefox and Safari; no console errors
- [ ] Document any tier with < 1,000 but ≥ 900 words at top of `words/README.md` (if applicable)

---

## 3. Critical Files Reference

| File | Phase | Spec § |
|---|---|---|
| `index.html` | 0 | §6.1, §6.4 |
| `.gitignore`, `package.json` | 0 | §6.1 |
| `src/state.js` | 1 | §4.1, §4.2 |
| `src/game.js` | 1 | §5.1, §5.4, §5.6 |
| `src/words.js` | 1 | §5.4 |
| `src/persist.js` | 1 | §4.3 |
| `tests/game.test.js` | 1 | §10 AC#14 |
| `tests/words.test.js` | 1 | §10 AC#14 |
| `tests/state.test.js` | 1 | §10 AC#14 |
| `tools/seeds/arcade.txt` | 2 | §5.3 |
| `tools/seeds/scitech.txt` | 2 | §5.3 |
| `tools/seeds/movies.txt` | 2 | §5.3 |
| `tools/build-wordlists.js` | 2 | §5.5 |
| `words/arcade.json` | 2 | §5.3 |
| `words/scitech.json` | 2 | §5.3 |
| `words/movies.json` | 2 | §5.3 |
| `styles/reset.css` | 3 | §3.1 |
| `styles/theme.css` | 3 | §3.1, §3.2 |
| `styles/layout.css` | 3, 7 | §3.4, §3.7 |
| `styles/screens.css` | 3 | §2.1 |
| `src/render/shared.js` | 3 | §3.4 HUD |
| `src/render/title.js` | 3 | §2.1, §2.2 |
| `src/render/result.js` | 3 | §2.1, §2.2 |
| `src/main.js` | 3 | §6.4 |
| `src/input.js` | 3, 5 | §2.2, §8 |
| `assets/sprites.svg` | 4 | §3.3 |
| `styles/maze.css` | 4 | §3.4 |
| `styles/sprites.css` | 4 | §3.3, §3.5 |
| `src/render/maze.js` | 4 | §3.4 |
| `src/render/sprites.js` | 4, 6 | §3.3, §3.5, §3.7 |
| `styles/game.css` | 5 | §3.6, §3.7 |
| `src/render/game.js` | 5 | §3.6, §3.7 |
| `styles/animations.css` | 6 | §3.8 |
| `src/audio.js` | 7 | §7 |

---

## 4. Out of Scope (v1)

Do not implement. Carry these to v2 as-is.

- Real audio (chomp, miss, win, loss, title chiptune) — `audio.js` stub only.
- Daily challenge (deterministic word by UTC date).
- Hint power-pellets / frightened-ghost mode.
- Multi-theme switcher (Synthwave, Modern Cute).
- Multi-word movie titles.
- Stats screen, achievements, leaderboard, share-result.
- Random category option.
- gzip word bundle compression.
- Accounts, backend, multiplayer, i18n.

---

## 5. End-to-End Verification Recipe

Run these steps in order once all phases are complete:

1. `python3 -m http.server 8000` from repo root → open `http://localhost:8000`.
2. **Happy path — Easy/Arcade win:** Select Easy + Arcade, INSERT COIN, guess letters to win. Confirm maze strobe + victory loop + Result shows streak = 1.
3. **Happy path — Normal/SciTech loss:** Select Normal + Sci-Tech, INSERT COIN, guess 6 wrong letters. Confirm death animation + "GAME OVER" + streak resets to 0.
4. **Happy path — Hard/Movies word-guess:** Select Hard + Movies, INSERT COIN, press Enter, type the correct word. Confirm WIN.
5. **Streak persistence:** Win a game, streak = N. Reload page. Confirm streak still shows N.
6. **Slow network simulation:** DevTools → Network → Throttle "Slow 3G". Select a category. Confirm "LOADING…" text appears in INSERT COIN button before fetch resolves.
7. **Reduce motion:** macOS: System Settings → Accessibility → Display → Reduce Motion ON. Reload. Confirm no traversal animations or strobe — instant transitions.
8. **Mobile layout:** DevTools Device Toolbar → 375×667. Confirm no horizontal scroll, 6-col alphabet grid, ghost house at top.
9. **Keyboard-only:** Tab through Title, Space to INSERT COIN, type letters A–Z, Enter for word-guess modal, Tab to QUIT and Space to quit. No mouse required.
10. **Unit tests:** `node --test tests/` → all pass.
11. **Word counts:** `npm run build-words` (if rerunning) → each tier logs ≥ 900 words.
12. **Browser matrix:** Repeat steps 2–4 in Firefox and Safari with DevTools open; confirm no console errors.

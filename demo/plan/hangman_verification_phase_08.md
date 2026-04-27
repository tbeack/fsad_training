# PacHangman — Phase 8 Verification Plan

> Companion to `planning/plan/hang_implementation_plan.md` §Phase 8.
> Run these checks **after** Phase 7 is complete and before the project is shipped.
> Spec references: `planning/design/hangman_spec.md`.

---

## 1. Context & Scope

Phase 8 is the final acceptance gate. No new code is written. This plan verifies that all 14 + 1 acceptance criteria from spec §10 pass in Chrome, Firefox, and Safari; that the browser matrix is clean across three happy-path scenarios; and that word-count documentation is added to `words/README.md` for any tier with < 1,000 but ≥ 900 words.

**In scope for this verification:**
- All 15 acceptance criteria (AC-01 through AC-15) — Chrome primary, Firefox and Safari confirming
- Browser matrix: win / loss / word-guess CTA runs in all three browsers, no console errors
- Word counts: `words/arcade.json`, `words/scitech.json`, `words/movies.json` — each of 9 tiers ≥ 900 words
- `node --test tests/` — all five test files green
- End-to-end scenario runs: keyboard-only, persistence, slow network, reduced motion, mobile layout
- Visual polish: no raw values, no lowercase text, no broken assets, correct font in all browsers
- Accessibility: full keyboard run, `#sr-announce` live region, focus rings
- Scoring formula: spec §5.6 — `score = base × livesRemaining × lengthBonus`
- Ghost sequence: spec §3.5 — Blinky, Blinky+advance, Pinky, Pinky+advance, Inky, Inky→death; Clyde stays
- Edge cases: already-guessed letter ping, wrong full-word guess adds 1 miss, ESC confirm dialog

**Out of scope (defer to v2+):**
- Real audio (chomp, miss, win, loss, title chiptune)
- Daily challenge, hint power-pellets, frightened-ghost mode
- Multi-theme switcher, multi-word movie titles
- Stats screen, achievements, leaderboard, share-result
- Random category option, gzip compression, accounts, multiplayer, i18n

---

## 2. Environment & Setup

**Dev server:** `python3 -m http.server 8000` from repo root.
**Browsers:** Chrome (primary), Firefox, Safari — all with DevTools open.
**Node:** `node --test tests/` run from repo root in a separate terminal.

### 2.1 Console Snippets (reference these in §3 checks)

Paste into the DevTools Console at `localhost:8000`.

**Snippet A — read `#app` current screen:**
```js
document.getElementById('app').dataset.screen
```

**Snippet B — read persisted streak:**
```js
JSON.parse(localStorage.getItem('pachangman_v1') || '{}').streak
```

**Snippet C — read high score:**
```js
JSON.parse(localStorage.getItem('pachangman_v1') || '{}').highScore
```

**Snippet D — count recent words:**
```js
(JSON.parse(localStorage.getItem('pachangman_v1') || '{}').recentWords || []).length
```

**Snippet E — confirm wordsCache NOT persisted:**
```js
!JSON.parse(localStorage.getItem('pachangman_v1') || '{}').wordsCache
// Expected: true
```

**Snippet F — word count check (arcade, via fetch):**
```js
fetch('./words/arcade.json').then(r=>r.json()).then(d=>console.log({easy:d.easy.length,normal:d.normal.length,hard:d.hard.length}))
```

**Snippet G — no horizontal scroll:**
```js
document.documentElement.scrollWidth > document.documentElement.clientWidth
// Expected: false
```

**Snippet H — seed localStorage for persistence checks:**
```js
localStorage.setItem('pachangman_v1', JSON.stringify({
  streak: 5, bestStreak: 8, highScore: 320,
  recentWords: ['GHOST', 'PELLET'],
  settings: { soundEnabled: false, reducedMotion: false }
}))
```

**Snippet I — clear seed:**
```js
localStorage.removeItem('pachangman_v1')
```

### 2.2 E2E Verification Recipe

Run these steps in order with Chrome DevTools open.

```
1.  python3 -m http.server 8000 from repo root → open http://localhost:8000
2.  Happy path — Easy/Arcade win: Select Easy + Arcade, INSERT COIN, guess letters to win.
    Confirm maze strobe + victory loop + Result shows streak = 1.
3.  Happy path — Normal/SciTech loss: Select Normal + Sci-Tech, INSERT COIN, guess 6 wrong
    letters. Confirm death animation + "GAME OVER" + streak resets to 0.
4.  Happy path — Hard/Movies word-guess: Select Hard + Movies, INSERT COIN, press Enter,
    type the correct word. Confirm WIN.
5.  Streak persistence: Win a game (streak = N). Reload page. Confirm streak still shows N.
6.  Slow network: DevTools → Network → Throttle "Slow 3G". Select a category. Confirm
    "LOADING…" text appears in INSERT COIN button before fetch resolves.
7.  Reduce motion: macOS System Settings → Accessibility → Display → Reduce Motion ON.
    Reload. Confirm no traversal animations or strobe — instant transitions.
8.  Mobile layout: DevTools Device Toolbar → 375×667. Confirm no horizontal scroll,
    6-col alphabet grid, ghost house at top.
9.  Keyboard-only: Tab through Title, Space to INSERT COIN, type letters A–Z, Enter for
    word-guess modal, Tab to QUIT and Space to quit. No mouse required.
10. Unit tests: node --test tests/ → all pass.
11. Word counts: node -e to check each category JSON tier — each ≥ 900.
12. Browser matrix: Repeat steps 2–4 in Firefox and Safari with DevTools open; confirm no
    console errors.
```

---

## 3. Check Catalog

Check IDs follow `<MODULE>-NN`. Phase 8 has 52 checks across 8 groups.

### 3.1 Acceptance Criteria — AC-01 through AC-15

Each check must pass in Chrome, Firefox, and Safari unless otherwise noted (Firefox/Safari are cross-checked in BROWSERMATRIX-01 through BROWSERMATRIX-06).

---

**AC-01 — No console errors on page load**

Start `python3 -m http.server 8000`. Open `http://localhost:8000` in Chrome with DevTools Console open.

Procedure: load the page cold (no prior state). Play through a full game (win or loss).

Expected:
- Zero red error entries (TypeError, ReferenceError, SyntaxError, network 4xx/5xx for game assets).
- Zero unhandled promise rejections.
- Font CDN CORS notices are acceptable. `localStorage` key-not-found fallbacks on first run are acceptable.

Failure: any single red error = AC-01 fails.

---

**AC-02 — Difficulty + category selectors functional; fetch fires on category change**

Procedure:
1. Open DevTools → Network tab. Clear log.
2. Change the difficulty radio from Normal to Hard.
3. Change the category `<select>` to a different option (e.g. Arcade → Sci-Tech).

Expected:
- Difficulty radio change is reflected (selected radio updates).
- A request for `./words/<category>.json` appears in the Network tab after category change.
- The request is `200 OK` (file exists, word lists are built).

```js
document.querySelector('input[type="radio"][name="difficulty"]:checked').value
// Expected: "hard" (after selecting Hard)
```

---

**AC-03 — INSERT COIN → READY! 1.5s → play begins**

Procedure: ensure a category JSON has loaded (Network tab shows 200). Click INSERT COIN.

Expected:
- The button or an overlay shows "READY!" text immediately after click.
- After approximately 1.5 seconds the game screen becomes active (word display visible, alphabet pellets enabled).
- `data-screen` transitions from `"title"` to `"game"` — check via Snippet A.

Time the READY! duration with DevTools Performance or a stopwatch: must be 1.3–1.7s.

---

**AC-04 — All 26 letters guessable via keyboard and alphabet pellet click**

Procedure (keyboard path): in an active game, type each letter A through Z. Confirm each:
- If not already guessed: registers as a guess (hit or miss).
- If already guessed: triggers a UI ping with no life penalty (see AC-11).

Procedure (click path): click each unguessed pellet in the alphabet grid. Confirm each registers.

```js
// After guessing letter 'A' via keyboard, confirm pellet state updated
document.querySelector('[data-letter="A"]').dataset.state
// Expected: "hit" or "miss" (not "idle")
```

---

**AC-05 — Hit: Pac-Man traverses to pellet, eats it, letter fills word display**

Procedure: guess a letter that is in the current word.

Expected:
- Pac-Man sprite moves from home position toward the pellet position (traversal animation, ~300ms per leg).
- On arrival: pellet disappears (eaten state), chomp visual plays.
- The letter fills into the correct slot(s) in the word display.
- Lives counter and miss count are unchanged.

Verify the word display:
```js
[...document.querySelectorAll('.letter-slot')].map(el => el.textContent)
// Expected: correct letter appears in corresponding slot(s); unrevealed slots still show blank/underscore
```

---

**AC-06 — Miss: ghost visibly emerges from ghost house on each miss**

Procedure: guess a letter not in the word.

Expected per miss:
- Ghost emerge animation plays (600ms ease-in-out from ghost house).
- The correct ghost appears in sequence per spec §3.5:
  - Miss 1: Blinky emerges
  - Miss 2: Blinky advances, second ghost (Pinky) starts emerging
  - Miss 3: Pinky emerges
  - Miss 4: Pinky advances, Inky starts emerging
  - Miss 5: Inky emerges
  - Miss 6: Inky advances to kill position; Clyde remains in house
- Lives remaining counter decrements by 1 after each miss.
- Pellet for guessed letter transitions to "miss" state.

---

**AC-07 — 6 misses: Pac-Man death animation plays, result screen appears**

Procedure: from an active game, make 6 wrong guesses (use letters not in the word).

Expected:
- On the 6th miss: Pac-Man death animation fires (sprite cycles through death frames).
- After animation completes: `data-screen` transitions to `"result"` — verify via Snippet A.
- Result screen shows "GAME OVER" banner.
- Streak is reset to 0. Verify: Snippet B after result appears.

---

**AC-08 — Word-guess CTA: correct word → WIN; wrong word → 1 miss**

Procedure A (correct):
1. In an active game with lives remaining, press Enter to open word-guess modal.
2. Type the exact correct word. Confirm.

Expected: game transitions to win state (maze strobe, result screen shows win).

Procedure B (wrong):
1. Press Enter → open modal. Type an incorrect word. Confirm.

Expected:
- 1 miss added (lives decrements by 1).
- A ghost emerges.
- Game continues if lives remain; death triggers if this was the 6th miss.

---

**AC-09 — Win: maze walls strobe, Pac-Man victory loop, result screen shows streak +1**

Procedure: win a game (all letters guessed correctly OR correct word-guess CTA).

Expected:
- Maze wall strobe animation fires: 6 flashes × 80ms each (spec §4 implementation call).
- Pac-Man plays a victory loop animation.
- Result screen shows "YOU WIN" banner (or equivalent win text).
- Streak increments by 1. Verify:
  ```js
  JSON.parse(localStorage.getItem('pachangman_v1') || '{}').streak
  // Expected: previous streak + 1
  ```
- Score displayed on result screen matches formula: `base(difficulty) × livesRemaining × lengthBonus`.

---

**AC-10 — Streak + best streak + recent words + high score persist across page reload**

Procedure:
1. Win a game. Note streak N, highScore S, and at least one word in recentWords.
2. Hard-reload the page (Cmd+Shift+R / Ctrl+Shift+R).
3. Verify via console:

```js
const s = JSON.parse(localStorage.getItem('pachangman_v1') || '{}')
console.log(s.streak, s.bestStreak, s.highScore, s.recentWords)
```

Expected: `streak === N`, `bestStreak ≥ N`, `highScore === S`, `recentWords` contains the word played.

Also confirm `wordsCache` is NOT in storage (Snippet E — expected: `true`).

---

**AC-11 — Already-guessed letter: UI ping, no life penalty**

Procedure:
1. In an active game, guess a letter (e.g. press 'A') — it registers as hit or miss.
2. Press 'A' again.

Expected:
- A visual ping or flash on the already-guessed pellet (no state change on the pellet).
- Lives remaining unchanged.
- No miss logged. Miss count must equal the count before the duplicate guess.

```js
// Capture miss count before duplicate guess — compare after
document.querySelector('[data-lives]').dataset.lives
```

---

**AC-12 — Each category JSON ≥ 900 words per difficulty tier**

Run in terminal (not browser):

```bash
node -e "const d=require('./words/arcade.json'); console.log('arcade:', d.easy.length, d.normal.length, d.hard.length)"
node -e "const d=require('./words/scitech.json'); console.log('scitech:', d.easy.length, d.normal.length, d.hard.length)"
node -e "const d=require('./words/movies.json'); console.log('movies:', d.easy.length, d.normal.length, d.hard.length)"
```

Expected: every printed value ≥ 900. Nine values total across three files × three tiers.

If any value is < 1,000 but ≥ 900: verify that tier is documented at the top of `words/README.md`.

---

**AC-13 — Mobile 375×667: simplified layout, no horizontal scroll**

Procedure: DevTools → toggle Device Toolbar → set to 375×667 (iPhone SE). Reload. Play a full game.

Expected:
- No horizontal scroll at any point (Snippet G — expected: `false`).
- Alphabet grid uses 6 columns (not 13).
- Ghost house renders at top of game area.
- All text legible — no overflow or clipping.
- INSERT COIN button, word display, and result CTAs all visible without scrolling.

---

**AC-14 — `prefers-reduced-motion` ON: all CSS transitions and keyframe animations disabled**

Procedure:
1. macOS: System Settings → Accessibility → Display → Reduce Motion ON.
2. Reload `localhost:8000`. Play a full game through a hit, a miss, a win.

Expected:
- Pac-Man traversal: instant position change (no 300ms slide).
- Ghost emerge: instant appearance (no 600ms ease-in-out).
- Maze strobe: single instant flash or no flash — no 6-cycle animation.
- Death animation: Pac-Man disappears immediately without cycling frames.
- No `@keyframes` play for any game event.

Verify in DevTools:
```js
window.matchMedia('(prefers-reduced-motion: reduce)').matches
// Expected: true
```

Confirm CSS `@media (prefers-reduced-motion: reduce)` block disables `animation` and `transition`:
```bash
grep -A 5 'prefers-reduced-motion' styles/animations.css
# Expected: animation: none; and/or transition: none; rules present
```

---

**AC-15 — `node --test tests/` → all assertions green**

Run in terminal from repo root:

```bash
node --test tests/
```

Expected:
- All test files execute: `game.test.js`, `words.test.js`, `state.test.js`, `persist.test.js`, `words-output.test.js`.
- Zero failing assertions. Exit code 0.
- No uncaught exceptions printed to stderr.

---

### 3.2 Browser Matrix — BROWSERMATRIX-01 through BROWSERMATRIX-06

These six checks confirm the three happy paths from the E2E recipe (steps 2–4) are clean in all three browsers. Run each with DevTools open.

---

**BROWSERMATRIX-01 — Chrome: happy-path win run (Easy / Arcade)**

Open Chrome at `localhost:8000`. Select Easy + Arcade. INSERT COIN. Guess letters to win.

Expected:
- Maze strobe fires.
- Pac-Man victory loop plays.
- Result screen shows win, streak increments.
- DevTools Console: zero errors throughout the run.

---

**BROWSERMATRIX-02 — Chrome: happy-path loss run (Normal / Sci-Tech)**

Select Normal + Sci-Tech. INSERT COIN. Make 6 wrong guesses.

Expected:
- Each miss: correct ghost emerges in sequence.
- 6th miss: Pac-Man death animation plays.
- Result screen shows "GAME OVER", streak resets.
- DevTools Console: zero errors throughout the run.

---

**BROWSERMATRIX-03 — Chrome: word-guess CTA (Hard / Movies)**

Select Hard + Movies. INSERT COIN. Press Enter. Type the correct word. Confirm.

Expected: game transitions to win state. Console: zero errors.

---

**BROWSERMATRIX-04 — Firefox: repeat BROWSERMATRIX-01 through -03**

Open Firefox at `localhost:8000`. Run the same three happy paths (win / loss / word-guess CTA) with Firefox DevTools Console open.

Expected: identical outcomes to Chrome. Zero console errors in all three runs.

Note: Press Start 2P font must render (not fallback). Check computed `font-family` on any text node.

---

**BROWSERMATRIX-05 — Safari: repeat BROWSERMATRIX-01 through -03**

Open Safari at `localhost:8000`. Enable Web Inspector (Develop menu → Show Web Inspector). Run the same three happy paths.

Expected: identical outcomes to Chrome. Zero console errors. No Safari-specific layout breaks.

Note: Safari handles `@keyframes` and `prefers-reduced-motion` differently — confirm animations play (or skip when reduced-motion is ON) correctly.

---

**BROWSERMATRIX-06 — All browsers: `node --test tests/` exits 0**

This is a terminal check, not browser-specific. Confirm once:

```bash
node --test tests/ ; echo "Exit: $?"
```

Expected: `Exit: 0`. All five test files pass. This check covers AC-15 for the matrix row.

---

### 3.3 Word Count Checks — WORDCOUNT-01 through WORDCOUNT-09

Run each command from repo root in a terminal. Expected: each printed length ≥ 900. Nine checks total (3 categories × 3 tiers).

---

**WORDCOUNT-01 — arcade / easy**

```bash
node -e "const d=JSON.parse(require('fs').readFileSync('./words/arcade.json','utf8')); console.log('arcade easy:', d.easy.length)"
```
Expected: ≥ 900. If 900–999: confirm documented in `words/README.md`.

---

**WORDCOUNT-02 — arcade / normal**

```bash
node -e "const d=JSON.parse(require('fs').readFileSync('./words/arcade.json','utf8')); console.log('arcade normal:', d.normal.length)"
```
Expected: ≥ 900.

---

**WORDCOUNT-03 — arcade / hard**

```bash
node -e "const d=JSON.parse(require('fs').readFileSync('./words/arcade.json','utf8')); console.log('arcade hard:', d.hard.length)"
```
Expected: ≥ 900.

---

**WORDCOUNT-04 — scitech / easy**

```bash
node -e "const d=JSON.parse(require('fs').readFileSync('./words/scitech.json','utf8')); console.log('scitech easy:', d.easy.length)"
```
Expected: ≥ 900.

---

**WORDCOUNT-05 — scitech / normal**

```bash
node -e "const d=JSON.parse(require('fs').readFileSync('./words/scitech.json','utf8')); console.log('scitech normal:', d.normal.length)"
```
Expected: ≥ 900.

---

**WORDCOUNT-06 — scitech / hard**

```bash
node -e "const d=JSON.parse(require('fs').readFileSync('./words/scitech.json','utf8')); console.log('scitech hard:', d.hard.length)"
```
Expected: ≥ 900.

---

**WORDCOUNT-07 — movies / easy**

```bash
node -e "const d=JSON.parse(require('fs').readFileSync('./words/movies.json','utf8')); console.log('movies easy:', d.easy.length)"
```
Expected: ≥ 900.

---

**WORDCOUNT-08 — movies / normal**

```bash
node -e "const d=JSON.parse(require('fs').readFileSync('./words/movies.json','utf8')); console.log('movies normal:', d.normal.length)"
```
Expected: ≥ 900.

---

**WORDCOUNT-09 — movies / hard**

```bash
node -e "const d=JSON.parse(require('fs').readFileSync('./words/movies.json','utf8')); console.log('movies hard:', d.hard.length)"
```
Expected: ≥ 900. If any tier across WORDCOUNT-01 through -09 is 900–999, add a note to `words/README.md` before marking Phase 8 complete.

---

### 3.4 End-to-End Scenarios — E2E-01 through E2E-06

Full scenario runs that cross module boundaries. Run in Chrome unless noted.

---

**E2E-01 — Full win run (keyboard-only)**

Procedure:
1. Load `localhost:8000`. Use only the keyboard — no mouse.
2. Tab to difficulty radios. Arrow keys to select Easy. Tab to category `<select>`. Arrow keys to select Arcade. Tab to INSERT COIN. Press Space.
3. READY! appears. After 1.5s, game screen is active.
4. Type letter keys A–Z to find and guess all letters in the word.
5. Win condition triggers: maze strobe + victory loop.
6. Result screen: Tab to PLAY AGAIN, press Space.
7. Confirm streak incremented by 1.

Expected: full run completed without touching the mouse. No console errors.

---

**E2E-02 — Full loss run (keyboard-only)**

Procedure:
1. Load fresh game. Keyboard-only.
2. INSERT COIN → game starts.
3. Make 6 wrong guesses using letter keys.
4. Death animation plays. Result screen shows GAME OVER.
5. Confirm streak reset to 0 via Snippet B.

Expected: no console errors. Ghost sequence (Blinky → Pinky → Inky) visible on screen; Clyde stays in house.

---

**E2E-03 — Persistence across page reload**

Procedure:
1. Win a game. Note streak N.
2. Hard-reload (Cmd+Shift+R).
3. Verify streak = N on the Title screen.
4. Run Snippet B: confirms `streak === N`.
5. Run Snippet E: confirms `wordsCache` is absent from storage (expected: `true`).

---

**E2E-04 — Slow network: "LOADING…" appears during fetch**

Procedure:
1. Open DevTools → Network → Throttle: Slow 3G.
2. Reload page. On Title screen, change the category `<select>`.
3. Immediately observe the INSERT COIN button (or adjacent area) for "LOADING…" text.
4. Wait for fetch to resolve (200 OK in Network tab).
5. Confirm "LOADING…" disappears and INSERT COIN re-enables.

Expected: "LOADING…" state is visible before fetch completes. No errors during slow fetch.

---

**E2E-05 — Reduced motion: no animation on hit / miss / win / loss**

Procedure:
1. macOS: System Settings → Accessibility → Display → Reduce Motion ON.
2. Reload `localhost:8000`. Play through a hit, a miss, then force a win or loss.

Expected for each event:
- Hit: Pac-Man teleports to pellet position — no traversal slide.
- Miss: ghost appears at emerged position instantly — no ease-in-out slide.
- Win: maze state changes without strobe sequence — no flashing.
- Loss: Pac-Man disappears immediately — no death frame cycling.

Confirm via DevTools:
```js
window.matchMedia('(prefers-reduced-motion: reduce)').matches // true
```

---

**E2E-06 — Mobile layout: 375×667 full game run, no horizontal scroll**

Procedure:
1. DevTools → Device Toolbar → 375×667. Reload.
2. Play a full game from Title through Result.

Expected at every screen:
- No horizontal scroll: `document.documentElement.scrollWidth > document.documentElement.clientWidth` → `false` (Snippet G).
- Alphabet grid: 6 columns visible without overflow.
- Ghost house positioned at top of game area.
- All buttons and text legible; nothing clipped.

---

### 3.5 Unit Tests — UNITTEST-01 through UNITTEST-05

Run all five test files via `node --test tests/` from repo root. Each file is listed individually to confirm its contribution.

---

**UNITTEST-01 — `tests/game.test.js`**

```bash
node --test tests/game.test.js
```

Expected: all assertions green. Tests cover: `guessLetter`, scoring formula, win/loss detection.

---

**UNITTEST-02 — `tests/words.test.js`**

```bash
node --test tests/words.test.js
```

Expected: all assertions green. Tests cover: word-drawing logic, deduplication, tier selection.

---

**UNITTEST-03 — `tests/state.test.js`**

```bash
node --test tests/state.test.js
```

Expected: all assertions green. Tests cover: initial state shape, `reduce` transitions, streak logic.

---

**UNITTEST-04 — `tests/persist.test.js`**

```bash
node --test tests/persist.test.js
```

Expected: all assertions green. Tests cover: `persist.save`, `persist.load`, key name, `wordsCache` exclusion from saved state.

---

**UNITTEST-05 — `tests/words-output.test.js`**

```bash
node --test tests/words-output.test.js
```

Expected: all assertions green. Tests cover: built JSON files have correct structure, each tier ≥ 900 words.

---

### 3.6 Visual Polish — VISUAL-01 through VISUAL-05

Eyeball checks in Chrome at default viewport (≥ 1024px). Close DevTools so layout is not distorted.

---

**VISUAL-01 — No raw `[object Object]` or undefined values**

Scan all three screens (Title, Game mid-game, Result) for any rendered `[object Object]`, `undefined`, `null`, or `NaN`. None must appear.

Check result screen score specifically — score is a computed value and a common source of undefined renders.

---

**VISUAL-02 — All text is uppercase on all three screens**

Scroll through Title, Game, and Result screens. No lowercase text should be visible anywhere — labels, button text, word display, HUD values, announcements.

```bash
# Audit text-transform rules
grep -n 'text-transform' styles/theme.css styles/screens.css styles/game.css
# Expected: uppercase applied at a global or per-element level covering all visible text
```

---

**VISUAL-03 — No horizontal scroll at ≥ 1024px viewport**

At default desktop viewport (≥ 1024px wide):

```js
document.documentElement.scrollWidth > document.documentElement.clientWidth
// Expected: false
```

Check on all three screens: Title, mid-game Game, Result.

---

**VISUAL-04 — Press Start 2P font renders in all three browsers**

In Chrome, Firefox, and Safari: inspect any text node → Computed tab → `font-family`.

Expected: `"Press Start 2P"` listed as the resolved font (not `monospace` fallback). Pixelated rendering visible at all type sizes.

---

**VISUAL-05 — No broken assets (all resources 200)**

DevTools → Network tab → filter by `Img`, `Font`, `Other`. Reload the page and play through a game.

Expected: zero 404 or 5xx responses for any loaded resource. All sprite images, font files, and JSON word files return 200.

---

## 4. Shell Static Checks

The companion script `scripts/check-phase8-static.sh` runs all static verifications. See §6.1. Run before browser checks:

```bash
bash scripts/check-phase8-static.sh
```

Each section prints PASS or FAIL. All must be PASS before proceeding to browser checks.

---

## 5. Spec → Check Coverage Matrix

Every spec rule that Phase 8 validates maps to at least one check ID.

| Spec Rule | Section | Check IDs |
|---|---|---|
| AC #1: no console errors, full game | §10 | AC-01, BROWSERMATRIX-01 through -05 |
| AC #2: difficulty + category selectors; fetch fires | §10, §2.2 | AC-02 |
| AC #3: INSERT COIN → READY! 1.5s → play | §10, §2.2 | AC-03 |
| AC #4: all 26 letters via keyboard + click | §10, §2.2, §8 | AC-04, E2E-01 |
| AC #5: hit — traversal + eat + fill | §10, §3.8 | AC-05 |
| AC #6: miss — ghost emerges | §10, §3.5, §3.8 | AC-06, E2E-02 |
| AC #7: 6 misses → death + result | §10, §3.8 | AC-07, E2E-02 |
| AC #8: word-guess CTA correct → WIN; wrong → 1 miss | §10, §2.3 | AC-08, BROWSERMATRIX-03 |
| AC #9: win → strobe + victory + streak +1 | §10, §3.8, §5.6 | AC-09, BROWSERMATRIX-01 |
| AC #10: streak + bestStreak + recentWords + highScore persist | §10, §4.3 | AC-10, E2E-03 |
| AC #11: already-guessed letter → ping, no miss | §10, §2.3 | AC-11, E2E-01 |
| AC #12: each category JSON ≥ 900 per tier | §10, §5.3 | AC-12, WORDCOUNT-01 through -09, UNITTEST-05 |
| AC #13: mobile 375×667 — no horizontal scroll | §10, §3.7 | AC-13, E2E-06, VISUAL-03 |
| AC #14: prefers-reduced-motion disables all animations | §10, §3.8 | AC-14, E2E-05 |
| AC #15: `node --test tests/` all green | §10 | AC-15, UNITTEST-01 through -05, BROWSERMATRIX-06 |
| Browser matrix: Firefox + Safari happy paths | §10 | BROWSERMATRIX-04, BROWSERMATRIX-05 |
| Ghost sequence: Blinky → Pinky → Inky; Clyde stays | §3.5 | AC-06, E2E-02 |
| Scoring formula: base × livesRemaining × lengthBonus | §5.6 | AC-09, UNITTEST-01 |
| Persistence: wordsCache NOT saved | §4.3 | AC-10, E2E-03 |
| Already-guessed letter edge case | §2.3 | AC-11 |
| Wrong full-word guess → 1 miss | §2.3 | AC-08 |
| ESC mid-game → confirm dialog → QUIT or resume | §2.3 | E2E-01 (keyboard-only run) |
| Tab order: Title and Game screens | §8 | E2E-01 |
| `#sr-announce` live region announces guess/win/loss | §8 | E2E-01 |
| Focus rings visible (2px solid var(--pac)) | §8 | E2E-01 |
| Slow network: LOADING… state visible | §5.4 | E2E-04 |
| `words/README.md` documents tiers 900–999 words | §5.3 | WORDCOUNT-01 through -09 |
| No raw values or undefined rendered | implicit | VISUAL-01 |
| All text uppercase | §3.2 | VISUAL-02 |
| No horizontal scroll at desktop viewport | §1 | VISUAL-03, AC-13, E2E-06 |
| Press Start 2P font in all three browsers | §3.2 | VISUAL-04, BROWSERMATRIX-04, -05 |
| No broken assets | implicit | VISUAL-05 |

---

## 6. Check Automation

### 6.1 Shell Static Checks Script

The script below is saved as `scripts/check-phase8-static.sh`.

```bash
#!/bin/bash
set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "=== Phase 8 Static Checks ==="

echo ""
echo "--- Unit tests ---"
node --test tests/ && echo "PASS: all unit tests green" || { echo "FAIL: unit tests failed"; exit 1; }

echo ""
echo "--- Word JSON structure and counts ---"
for CATEGORY in arcade scitech movies; do
  FILE="words/${CATEGORY}.json"
  if [ ! -f "$FILE" ]; then
    echo "FAIL: $FILE does not exist"
    exit 1
  fi
  node -e "
    const d = JSON.parse(require('fs').readFileSync('${FILE}', 'utf8'));
    let fail = false;
    ['easy','normal','hard'].forEach(tier => {
      if (!Array.isArray(d[tier])) { console.error('FAIL: ${CATEGORY}.' + tier + ' is not an array'); fail = true; return; }
      const n = d[tier].length;
      const status = n >= 1000 ? 'PASS' : n >= 900 ? 'WARN (<1000 — document in words/README.md)' : 'FAIL (<900)';
      console.log(status + ': ${CATEGORY}.' + tier + ' = ' + n + ' words');
      if (n < 900) fail = true;
    });
    if (fail) process.exit(1);
  " || exit 1
done

echo ""
echo "--- words/README.md exists ---"
if [ -f "words/README.md" ]; then
  echo "PASS: words/README.md exists"
else
  echo "FAIL: words/README.md missing — create it to document tier counts"
  exit 1
fi

echo ""
echo "--- index.html stylesheet links present ---"
grep -n 'link.*\.css' index.html
echo "(verify: reset.css, theme.css, layout.css, screens.css, maze.css, sprites.css, game.css, animations.css all linked)"

echo ""
echo "--- No console.log debug statements left in src/ ---"
if grep -rn 'console\.log' src/ 2>/dev/null | grep -v '\.test\.'; then
  echo "WARN: console.log found in src/ — remove before ship"
else
  echo "PASS: no console.log in src/"
fi

echo ""
echo "--- prefers-reduced-motion media query in animations.css ---"
if grep -q 'prefers-reduced-motion' styles/animations.css 2>/dev/null; then
  echo "PASS: prefers-reduced-motion rule present in animations.css"
  grep -A 3 'prefers-reduced-motion' styles/animations.css
else
  echo "FAIL: prefers-reduced-motion not found in styles/animations.css"
  exit 1
fi

echo ""
echo "--- wordsCache absent from persist.js save logic ---"
if grep -q 'wordsCache' src/persist.js 2>/dev/null; then
  if grep -q 'wordsCache' src/persist.js; then
    echo "WARN: wordsCache mentioned in persist.js — verify it is excluded from save, not included"
  fi
else
  echo "PASS: wordsCache not referenced in persist.js (excluded from persistence)"
fi

echo ""
echo "=== Phase 8 static checks done ==="
```

Run: `bash scripts/check-phase8-static.sh`

### 6.2 Browser Checks — Manual Checklist

Work through this list in each browser. Mark each `[x]` when confirmed.

```
=== Acceptance Criteria (Chrome primary) ===
[ ] AC-01   No console errors on page load or during full game
[ ] AC-02   Difficulty radio + category <select> functional; fetch fires on category change
[ ] AC-03   INSERT COIN → READY! 1.5s → game active
[ ] AC-04   All 26 letters guessable via keyboard A–Z and alphabet pellet click
[ ] AC-05   Hit — Pac-Man traverses, pellet eaten, letter fills word display
[ ] AC-06   Miss — correct ghost emerges per sequence (Blinky→Pinky→Inky; Clyde stays)
[ ] AC-07   6 misses — death animation plays, result screen appears with GAME OVER
[ ] AC-08   Word-guess CTA: correct → WIN; wrong → 1 miss
[ ] AC-09   Win — maze strobe (6×80ms), victory loop, result streak +1, score correct
[ ] AC-10   Streak + bestStreak + recentWords + highScore persist across reload; wordsCache absent
[ ] AC-11   Already-guessed letter — UI ping, no life penalty
[ ] AC-12   Each category JSON ≥ 900 per tier (9 values — see WORDCOUNT checks)
[ ] AC-13   Mobile 375×667 — no horizontal scroll, 6-col grid, ghost house at top
[ ] AC-14   prefers-reduced-motion ON — all animations disabled, instant transitions
[ ] AC-15   node --test tests/ → all assertions green, exit 0

=== Browser Matrix ===
[ ] BROWSERMATRIX-01   Chrome: win run Easy/Arcade — no console errors
[ ] BROWSERMATRIX-02   Chrome: loss run Normal/SciTech — death animation, GAME OVER
[ ] BROWSERMATRIX-03   Chrome: word-guess Hard/Movies — correct → WIN
[ ] BROWSERMATRIX-04   Firefox: win + loss + word-guess CTA — no console errors, font renders
[ ] BROWSERMATRIX-05   Safari: win + loss + word-guess CTA — no console errors, animations correct
[ ] BROWSERMATRIX-06   node --test tests/ exit 0 (terminal)

=== Word Counts ===
[ ] WORDCOUNT-01   arcade / easy ≥ 900
[ ] WORDCOUNT-02   arcade / normal ≥ 900
[ ] WORDCOUNT-03   arcade / hard ≥ 900
[ ] WORDCOUNT-04   scitech / easy ≥ 900
[ ] WORDCOUNT-05   scitech / normal ≥ 900
[ ] WORDCOUNT-06   scitech / hard ≥ 900
[ ] WORDCOUNT-07   movies / easy ≥ 900
[ ] WORDCOUNT-08   movies / normal ≥ 900
[ ] WORDCOUNT-09   movies / hard ≥ 900

=== End-to-End Scenarios ===
[ ] E2E-01   Full win run keyboard-only — no mouse, Tab+Space+letters, streak +1
[ ] E2E-02   Full loss run keyboard-only — 6 misses, ghost sequence, GAME OVER, streak 0
[ ] E2E-03   Persistence across reload — streak N survives reload; wordsCache absent
[ ] E2E-04   Slow network (Slow 3G) — LOADING… visible before fetch resolves
[ ] E2E-05   Reduced motion — all animations instant (hit / miss / win / loss)
[ ] E2E-06   Mobile 375×667 — full game run, no horizontal scroll at any screen

=== Unit Tests ===
[ ] UNITTEST-01   tests/game.test.js all green
[ ] UNITTEST-02   tests/words.test.js all green
[ ] UNITTEST-03   tests/state.test.js all green
[ ] UNITTEST-04   tests/persist.test.js all green
[ ] UNITTEST-05   tests/words-output.test.js all green

=== Visual Polish ===
[ ] VISUAL-01   No [object Object], undefined, null, or NaN visible anywhere
[ ] VISUAL-02   All text uppercase on all three screens
[ ] VISUAL-03   No horizontal scroll at ≥ 1024px viewport
[ ] VISUAL-04   Press Start 2P font renders in Chrome, Firefox, and Safari
[ ] VISUAL-05   No broken assets — all resources 200 in Network tab
```

---

## 7. Exit Criteria

Phase 8 is verified when **all** of the following hold:

- [ ] `bash scripts/check-phase8-static.sh` exits 0 with no FAIL lines.
- [ ] AC-01 through AC-15 — all 15 acceptance criteria confirmed in Chrome.
- [ ] BROWSERMATRIX-01 through -03 — all three Chrome happy paths clean.
- [ ] BROWSERMATRIX-04 — Firefox: all three happy paths clean, no console errors, font renders.
- [ ] BROWSERMATRIX-05 — Safari: all three happy paths clean, no console errors, animations correct.
- [ ] BROWSERMATRIX-06 — `node --test tests/` exits 0.
- [ ] WORDCOUNT-01 through WORDCOUNT-09 — all nine tier counts ≥ 900.
- [ ] Any tier with 900–999 words is documented in `words/README.md`.
- [ ] E2E-01 through E2E-06 — all six scenario runs pass.
- [ ] UNITTEST-01 through UNITTEST-05 — all five test files fully green.
- [ ] VISUAL-01 through VISUAL-05 — all visual polish checks pass.

**Total: 52 checks across 8 groups.** All 52 must be green.

The project ships when all 52 checks are checked and `bash scripts/check-phase8-static.sh` exits 0.

---

## 8. Out of Scope (v2+)

| Item | Notes |
|---|---|
| Real audio (chomp, miss, win, loss, title chiptune) | `audio.js` stub in v1 |
| Daily challenge (deterministic word by UTC date) | v2 feature |
| Hint power-pellets / frightened-ghost mode | v2 feature |
| Multi-theme switcher (Synthwave, Modern Cute) | v2 feature |
| Multi-word movie titles | v2 feature |
| Stats screen, achievements, leaderboard, share-result | v2 feature |
| Random category option | v2 feature |
| gzip word bundle compression | v2 optimization |
| Accounts, backend, multiplayer, i18n | v2+ infrastructure |

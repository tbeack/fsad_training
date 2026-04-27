# Verify — PacHangman

## Prompt

> Spin up a team of agents to develop the test plans for phases 6 through 8, based on the approach taken in
>
> `./planning/plan/hangman_verification_phase_03.md`. title the plan
>
> `./planning/plan/hangman_verification_phase_nn.md`
>
> -> Agent 1 - build a verification and test plan for phase 6
>
> -> Agent 2 - build a verification and test plan for phase 7
>
> -> Agent 3 - build a verification and test plan for phase 8

---

**Output:** [`./demo/plan/hangman_verification_phase_08.md`](../demo/plan/hangman_verification_phase_08.md)

[Session replay: Multi-agent team create Verification and Test Plan →](../session-replay/Hangman%20-%20Multi-agent%20team%20create%20Verification%20and%20Test%20Plan.html)

---

## hangman_verification_phase_08.md

````markdown
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

---

**BROWSERMATRIX-01 — Chrome: happy-path win run (Easy / Arcade)**

Open Chrome at `localhost:8000`. Select Easy + Arcade. INSERT COIN. Guess letters to win.

Expected: maze strobe fires, Pac-Man victory loop plays, result screen shows win, streak increments. DevTools Console: zero errors.

---

**BROWSERMATRIX-02 — Chrome: happy-path loss run (Normal / Sci-Tech)**

Select Normal + Sci-Tech. INSERT COIN. Make 6 wrong guesses.

Expected: each miss correct ghost emerges, 6th miss death animation plays, result shows "GAME OVER", streak resets. DevTools Console: zero errors.

---

**BROWSERMATRIX-03 — Chrome: word-guess CTA (Hard / Movies)**

Select Hard + Movies. INSERT COIN. Press Enter. Type the correct word. Confirm.

Expected: game transitions to win state. Console: zero errors.

---

**BROWSERMATRIX-04 — Firefox: repeat BROWSERMATRIX-01 through -03**

Open Firefox at `localhost:8000`. Run the same three happy paths with Firefox DevTools Console open.

Expected: identical outcomes to Chrome. Zero console errors. Press Start 2P font must render.

---

**BROWSERMATRIX-05 — Safari: repeat BROWSERMATRIX-01 through -03**

Open Safari at `localhost:8000`. Enable Web Inspector. Run the same three happy paths.

Expected: identical outcomes to Chrome. Zero console errors. No Safari-specific layout breaks.

---

**BROWSERMATRIX-06 — All browsers: `node --test tests/` exits 0**

```bash
node --test tests/ ; echo "Exit: $?"
```

Expected: `Exit: 0`. All five test files pass.

---

### 3.3 Word Count Checks — WORDCOUNT-01 through WORDCOUNT-09

```bash
node -e "const d=JSON.parse(require('fs').readFileSync('./words/arcade.json','utf8')); console.log('arcade easy:', d.easy.length)"
node -e "const d=JSON.parse(require('fs').readFileSync('./words/arcade.json','utf8')); console.log('arcade normal:', d.normal.length)"
node -e "const d=JSON.parse(require('fs').readFileSync('./words/arcade.json','utf8')); console.log('arcade hard:', d.hard.length)"
node -e "const d=JSON.parse(require('fs').readFileSync('./words/scitech.json','utf8')); console.log('scitech easy:', d.easy.length)"
node -e "const d=JSON.parse(require('fs').readFileSync('./words/scitech.json','utf8')); console.log('scitech normal:', d.normal.length)"
node -e "const d=JSON.parse(require('fs').readFileSync('./words/scitech.json','utf8')); console.log('scitech hard:', d.hard.length)"
node -e "const d=JSON.parse(require('fs').readFileSync('./words/movies.json','utf8')); console.log('movies easy:', d.easy.length)"
node -e "const d=JSON.parse(require('fs').readFileSync('./words/movies.json','utf8')); console.log('movies normal:', d.normal.length)"
node -e "const d=JSON.parse(require('fs').readFileSync('./words/movies.json','utf8')); console.log('movies hard:', d.hard.length)"
```

Expected: all nine values ≥ 900. Any tier 900–999: document in `words/README.md`.

---

### 3.4 End-to-End Scenarios — E2E-01 through E2E-06

**E2E-01 — Full win run (keyboard-only)**
Tab to controls, Arrow to select difficulty/category, Space to INSERT COIN, type letters A–Z, win, Tab to PLAY AGAIN, Space. No mouse. Streak +1.

**E2E-02 — Full loss run (keyboard-only)**
INSERT COIN → 6 wrong guesses → death animation → GAME OVER → streak 0 via Snippet B.

**E2E-03 — Persistence across page reload**
Win a game. Hard-reload. Verify streak = N, bestStreak ≥ N, highScore = S, recentWords has the word. wordsCache absent (Snippet E → `true`).

**E2E-04 — Slow network: "LOADING…" appears during fetch**
DevTools → Network → Throttle Slow 3G. Change category. Confirm LOADING… before fetch resolves.

**E2E-05 — Reduced motion: no animation on hit / miss / win / loss**
Reduce Motion ON. Reload. Hit: Pac-Man teleports. Miss: ghost appears instantly. Win: no strobe. Loss: Pac-Man disappears instantly.

**E2E-06 — Mobile layout: 375×667 full game run, no horizontal scroll**
DevTools Device Toolbar 375×667. Play full game. No horizontal scroll at any screen (Snippet G → `false`).

---

### 3.5 Unit Tests — UNITTEST-01 through UNITTEST-05

```bash
node --test tests/game.test.js
node --test tests/words.test.js
node --test tests/state.test.js
node --test tests/persist.test.js
node --test tests/words-output.test.js
```

Expected: all five files exit 0, all assertions green.

---

### 3.6 Visual Polish — VISUAL-01 through VISUAL-05

**VISUAL-01** — No `[object Object]`, `undefined`, `null`, or `NaN` visible on any screen.
**VISUAL-02** — All text uppercase on Title, Game, and Result screens.
**VISUAL-03** — No horizontal scroll at ≥ 1024px viewport (Snippet G → `false`).
**VISUAL-04** — Press Start 2P font renders in Chrome, Firefox, and Safari (check computed `font-family`).
**VISUAL-05** — No broken assets — all resources 200 in Network tab during a full game.

---

## 7. Exit Criteria

Phase 8 is verified when **all** of the following hold:

- [ ] `bash scripts/check-phase8-static.sh` exits 0 with no FAIL lines
- [ ] AC-01 through AC-15 confirmed in Chrome
- [ ] BROWSERMATRIX-01 through -03 all three Chrome happy paths clean
- [ ] BROWSERMATRIX-04 Firefox: all three happy paths clean, font renders
- [ ] BROWSERMATRIX-05 Safari: all three happy paths clean, animations correct
- [ ] BROWSERMATRIX-06 `node --test tests/` exits 0
- [ ] WORDCOUNT-01 through -09 all nine tier counts ≥ 900
- [ ] E2E-01 through E2E-06 all six scenario runs pass
- [ ] UNITTEST-01 through -05 all five test files fully green
- [ ] VISUAL-01 through -05 all visual polish checks pass

**Total: 52 checks across 8 groups.** All 52 must be green before ship.
````

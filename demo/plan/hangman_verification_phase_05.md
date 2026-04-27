# PacHangman — Phase 5 Verification Plan

> Companion to `planning/plan/hang_implementation_plan.md` §Phase 5.
> Run these checks **after** Phase 5 is complete and before Phase 6 begins.
> Spec references: `planning/design/hangman_spec.md` §2.2 (user flow), §2.3 (edge cases), §3.6 (word display), §3.7 (alphabet pellets), §4.2 (state transitions).

---

## 1. Context & Scope

Phase 5 delivers the full playable game loop: `styles/game.css` (word slots + pellet states), `src/render/game.js` (letter rendering, 26 alphabet buttons, word-guess dialog), the completed `src/input.js` event wiring (A–Z, Enter, Space, ESC, resize), and the `src/main.js` dispatch cycle (`dispatch → reduce → render → persist.save` + fire-and-forget animations).

After Phase 5 the game is fully playable end-to-end: guessing letters via keyboard and pellet click, submitting full-word guesses, handling already-guessed letters, winning on full reveal, and losing after 6 misses. Ghost emergence and all `@keyframes` animations are deferred to Phase 6; Phase 5 confirms the state transitions and DOM class changes are correct even without animated transitions.

**In scope for this verification:**
- `styles/game.css` — word area layout, letter slot states (hidden/revealed), alphabet pellet states (default/hover/hit/miss/used/ping)
- `src/render/game.js` — letter slots from `state.revealed`, 26 alphabet `<button>` elements with ARIA attrs, word-guess `<dialog>`, already-guessed ping
- `src/input.js` — A–Z `keydown` → `GUESS_LETTER`, Enter → dialog, Space → focused button, ESC → confirm quit, pellet click delegation, window resize → `setPacPos`
- `src/main.js` — `dispatch(action)` export, `reduce → render → persist.save` cycle, animation calls as fire-and-forget after render

**Out of scope until later phases:**
- `@keyframes` chomp, pacman-death, maze-strobe, pellet-eat, ghost-emerge-*, pellet-ping — Phase 6
- Pac-Man traverse animation during guesses (WAAPI) — Phase 6 (stubs confirmed in Phase 4)
- Ghost emergence triggered by `GUESS_LETTER` misses — Phase 6
- READY! interstitial, win strobe, death animation sequence — Phase 6
- `src/audio.js` call sites — Phase 7
- Mobile layout (≤ 480px), Pac-Man traversal skip on mobile — Phase 7
- Full a11y: `aria-live` announcements, focus-ring enforcement — Phase 7
- Firefox/Safari cross-browser matrix, E2E acceptance pass — Phase 8

---

## 2. Environment & Setup

**Dev server:** `python3 -m http.server 8000` from repo root.
**Browser:** Chrome with DevTools (F12).
**Static checks:** bash grep/ls from repo root.

To mount the game screen and begin play: select a category on the Title screen, wait for the word JSON fetch (Network tab shows 200), click INSERT COIN, wait for "READY!" to clear (1.5s), then start guessing.

### 2.1 Console Snippets (reference in §3 checks)

Paste into DevTools Console at `localhost:8000` after the game screen is active.

**Snippet A — confirm game screen is active:**
```js
document.getElementById('app').dataset.screen
// Expected: "game"
```

**Snippet B — inspect word area and letter slot count:**
```js
({
  wordArea:     !!document.querySelector('.maze .word-area'),
  letterSlots:  document.querySelectorAll('.word-area .letter-slot').length,
  hiddenSlots:  document.querySelectorAll('.word-area .letter--hidden').length,
  revealedSlots: document.querySelectorAll('.word-area .letter--revealed').length,
})
// Expected: wordArea:true, letterSlots >= 3, hiddenSlots == letterSlots (before any guess), revealedSlots:0
```

**Snippet C — inspect alphabet pellet buttons:**
```js
({
  totalButtons: document.querySelectorAll('.pellet-row button').length,
  withAriaLabel: document.querySelectorAll('.pellet-row button[aria-label]').length,
  withAriaPressed: document.querySelectorAll('.pellet-row button[aria-pressed]').length,
  firstLabel: document.querySelector('.pellet-row button')?.getAttribute('aria-label'),
  lastLabel: document.querySelectorAll('.pellet-row button')[25]?.getAttribute('aria-label'),
})
// Expected: totalButtons:26, withAriaLabel:26, withAriaPressed:26,
//           firstLabel:"Letter A", lastLabel:"Letter Z"
```

**Snippet D — inspect full game screen interactive structure:**
```js
({
  dialog:       !!document.querySelector('dialog'),
  guessWordBtn: !!(document.querySelector('[data-action="guess-word"]') ||
                   document.querySelector('.btn--guess-word') ||
                   Array.from(document.querySelectorAll('button'))
                     .find(b => /guess.?word/i.test(b.textContent))),
  quitBtn:      !!(document.querySelector('[data-action="quit"]') ||
                   document.querySelector('.btn--quit') ||
                   Array.from(document.querySelectorAll('button'))
                     .find(b => /quit/i.test(b.textContent))),
})
// Expected: all true
```

**Snippet E — verify a letter slot's inner structure:**
```js
const slot = document.querySelector('.word-area .letter-slot');
({
  hasLetterSpan:    !!slot?.querySelector('.letter'),
  hasUnderlineSpan: !!slot?.querySelector('.underline'),
  isHidden:         slot?.classList.contains('letter--hidden'),
})
// Expected: hasLetterSpan:true, hasUnderlineSpan:true, isHidden:true (before first guess)
```

---

## 3. Check Catalog

Check IDs follow `<MODULE>-NN`. All DOM/visual/interactive checks require the game screen to be mounted (INSERT COIN clicked). Static/grep checks can run from the shell at any time.

---

### 3.1 File Existence — FILE-01 through FILE-02

---

**FILE-01 — All Phase 5 source files exist**

```bash
ls styles/game.css src/render/game.js src/input.js
```

Expected: all 3 listed, no "No such file or directory".

`src/main.js` and `src/input.js` were introduced in Phase 3; Phase 5 completes their wiring. Confirm they are present but do not require them to be newly created files.

---

**FILE-02 — `game.css` linked in `index.html` in correct position; `animations.css` absent**

```bash
grep -n 'link.*\.css' index.html
```

Required link order:
1. `reset.css`
2. `theme.css`
3. `layout.css`
4. `screens.css`
5. `maze.css`
6. `sprites.css`
7. `game.css`

`animations.css` must **not** appear (Phase 6).

---

### 3.2 `game.css` Rules — GAMECSS-01 through GAMECSS-10

---

**GAMECSS-01 — `.word-area` is a flex row**

```bash
grep -A 5 '\.word-area[^_-]' styles/game.css
```

Expected:
- `display: flex`
- `flex-direction: row` or default (row is the default — absence of `column` is fine)
- `justify-content` or `align-items` centering rule present

---

**GAMECSS-02 — `.letter-slot` is a flex column with letter on top, underline beneath**

```bash
grep -A 6 '\.letter-slot' styles/game.css
```

Expected:
- `display: flex`
- `flex-direction: column`
- `align-items: center`

---

**GAMECSS-03 — `.letter--hidden .letter` — opacity 0**

```bash
grep -A 3 '\.letter--hidden' styles/game.css
```

Expected: `opacity: 0` on the `.letter` span (or on the `.letter--hidden` selector itself).

---

**GAMECSS-04 — `.letter--revealed .letter` — yellow colour, opacity 1, 200ms transition**

```bash
grep -A 6 '\.letter--revealed' styles/game.css
```

Expected:
- `color: var(--pac)` — yellow per spec §3.6
- `opacity: 1`
- `transition: opacity 200ms` (or shorthand including `opacity`)

---

**GAMECSS-05 — `.pellet--hit` and `.pellet--miss` flash rules present**

```bash
grep -n 'pellet--hit\|pellet--miss' styles/game.css
```

Expected:
- `.pellet--hit`: uses `var(--hit)` (`#00FF66`) as a flash colour — via `background`, `animation`, or `outline`; then settles to `opacity: 0.4; color: var(--text-dim)`
- `.pellet--miss`: uses `var(--miss)` (`#FF0044`) as a flash colour; same settle state

```bash
grep -A 5 '\.pellet--hit' styles/game.css
grep -A 5 '\.pellet--miss' styles/game.css
```

---

**GAMECSS-06 — `.pellet--used` opacity and pointer-events**

```bash
grep -A 4 '\.pellet--used' styles/game.css
```

Expected:
- `opacity: 0.25` (spec §3.7)
- `pointer-events: none`

---

**GAMECSS-07 — `.pellet--ping` rule present for already-guessed feedback**

```bash
grep -n '\.pellet--ping' styles/game.css
```

Expected: at least one rule targeting `.pellet--ping`. This is the visual feedback for a repeated letter guess (spec §2.3). The `@keyframes pellet-ping` lives in Phase 6's `animations.css`; the selector and `animation` property hook belong here.

---

**GAMECSS-08 — Default alphabet button style uses CSS custom properties**

```bash
grep -A 8 '\.pellet-row button\|\.pellet-row > button' styles/game.css
```

Expected:
- `background: var(--dot)` or `background-color: var(--dot)`
- `color: var(--text)`
- `border: 2px solid var(--maze)` (spec §3.7)

---

**GAMECSS-09 — Hover/focus: scale + glow**

```bash
grep -n 'hover\|focus-visible\|scale.*1\.1\|text-shadow' styles/game.css
```

Expected:
- `:hover` or `:focus-visible` rule on alphabet buttons with `transform: scale(1.1)` and `text-shadow: 0 0 8px var(--pac)` (spec §3.7)

---

**GAMECSS-10 — No hard-coded hex colours; touch targets ≥ 44px**

```bash
grep -nE '#[0-9a-fA-F]{3,6}' styles/game.css
```

Expected: zero matches outside of comments.

```bash
grep -n '44px\|min-height.*44\|min-width.*44' styles/game.css
```

Expected: at least one `44px` reference establishing touch-target minimum (spec §3.7, §8).

---

### 3.3 Game Screen DOM Structure (Browser) — DOM-01 through DOM-08

**Setup:** INSERT COIN → wait for READY! to clear → game is active. Confirm `document.getElementById('app').dataset.screen === 'game'` before running these checks.

---

**DOM-01 — `.word-area` populated with `.letter-slot` elements**

```js
document.querySelectorAll('.word-area .letter-slot').length
// Expected: > 0 (equal to the length of the current word; ≥ 3)
```

---

**DOM-02 — Each `.letter-slot` contains `.letter` and `.underline` child spans**

```js
const slot = document.querySelector('.word-area .letter-slot');
!!slot.querySelector('.letter') && !!slot.querySelector('.underline')
// Expected: true
```

---

**DOM-03 — All letter slots start as `.letter--hidden` before any guess**

```js
const slots = document.querySelectorAll('.word-area .letter-slot');
[...slots].every(s => s.classList.contains('letter--hidden'))
// Expected: true (at game start, before first guess)
```

---

**DOM-04 — Exactly 26 alphabet `<button>` elements across two `.pellet-row` divs**

```js
document.querySelectorAll('.pellet-row button').length
// Expected: 26
```

```js
document.querySelectorAll('.pellet-row').length
// Expected: 2
```

---

**DOM-05 — Every alphabet button has correct `aria-label` and `aria-pressed`**

```js
document.querySelectorAll('.pellet-row button[aria-label]').length
// Expected: 26
```

```js
document.querySelectorAll('.pellet-row button[aria-pressed]').length
// Expected: 26
```

```js
document.querySelector('.pellet-row button').getAttribute('aria-label')
// Expected: "Letter A"
document.querySelectorAll('.pellet-row button')[25].getAttribute('aria-label')
// Expected: "Letter Z"
```

---

**DOM-06 — `aria-pressed` is `"false"` on all buttons at game start**

```js
[...document.querySelectorAll('.pellet-row button')]
  .every(b => b.getAttribute('aria-pressed') === 'false')
// Expected: true
```

---

**DOM-07 — Word-guess `<dialog>` element present in DOM**

```js
!!document.querySelector('dialog')
// Expected: true
```

```js
!!document.querySelector('dialog input[type="text"], dialog input:not([type])')
// Expected: true (text input inside dialog)
```

---

**DOM-08 — GUESS WORD and QUIT buttons present outside `.maze`**

```js
// Both should exist in the document and NOT be inside .maze
const guessWordBtn = Array.from(document.querySelectorAll('button'))
  .find(b => /guess.?word/i.test(b.textContent));
const quitBtn = Array.from(document.querySelectorAll('button'))
  .find(b => /quit/i.test(b.textContent));
({
  guessWordExists: !!guessWordBtn,
  quitExists: !!quitBtn,
  guessWordOutsideMaze: guessWordBtn && !document.querySelector('.maze')?.contains(guessWordBtn),
  quitOutsideMaze: quitBtn && !document.querySelector('.maze')?.contains(quitBtn),
})
// Expected: all true
```

---

### 3.4 `render/game.js` API — GAMEJS-01 through GAMEJS-07

ES module isolation prevents direct console invocation. Verify via source inspection (bash) plus observable DOM effects.

---

**GAMEJS-01 — `renderGame` exported**

```bash
grep -n '^export function renderGame\|^export async function renderGame' src/render/game.js
```

Expected: one match.

---

**GAMEJS-02 — Letter slots derived from `state.word` and `state.revealed`**

```bash
grep -n 'state\.word\|state\.revealed\|letter-slot\|letter--hidden\|letter--revealed' src/render/game.js
```

Expected: `state.word` and `state.revealed` both appear; `.letter--hidden` and `.letter--revealed` class names present (applied conditionally per `revealed[i]`).

---

**GAMEJS-03 — 26 alphabet buttons rendered with required ARIA attributes**

```bash
grep -n 'aria-label\|aria-pressed\|aria-disabled\|Letter.*[A-Z]' src/render/game.js
```

Expected:
- `aria-label` set to `"Letter " + letter` (or template literal equivalent)
- `aria-pressed` set based on whether the letter is in `state.guessed`
- `aria-disabled` set to `"true"` for guessed letters

---

**GAMEJS-04 — Word-guess `<dialog>` with input and submit button**

```bash
grep -n 'dialog\|showModal\|<input\|submit' src/render/game.js
```

Expected: `<dialog>` or `dialog` tag, `showModal()` call or equivalent, `<input` element, and a submit button or `submit` event handler.

---

**GAMEJS-05 — Already-guessed ping implemented**

```bash
grep -n 'pellet--ping\|ping\|already' src/render/game.js
```

Expected: `.pellet--ping` class added when a letter from `state.guessed` is re-submitted, then removed after a short timeout (`setTimeout`). Per spec §2.3: no state change, no penalty.

---

**GAMEJS-06 — `renderHUD` called from `render/shared.js`**

```bash
grep -n 'renderHUD\|shared\|import.*shared' src/render/game.js
```

Expected: `renderHUD` imported from `./shared.js` and called inside `renderGame`.

---

**GAMEJS-07 — `render/game.js` is a pure render module**

```bash
grep -n 'localStorage\|lives\|outcome\|guessLetter\|isWin\|isLoss\|dispatch' src/render/game.js
```

Expected: no matches. `renderGame` writes DOM only; it must not call `dispatch`, access `localStorage`, or contain game rule logic.

---

### 3.5 `input.js` Wiring — INPUTJS-01 through INPUTJS-06

---

**INPUTJS-01 — A–Z `keydown` dispatches `GUESS_LETTER`**

```bash
grep -n 'GUESS_LETTER\|keydown\|key.*[Aa]-[Zz]\|key\.length.*1\|/[a-zA-Z]/' src/input.js
```

Expected: a `keydown` handler that checks `event.key.match(/^[a-zA-Z]$/)` (or equivalent) and calls `dispatch({ type: 'GUESS_LETTER', letter: ... })`.

---

**INPUTJS-02 — Enter `keydown` opens word-guess dialog**

```bash
grep -n 'Enter\|showModal\|dialog.*open\|open.*dialog' src/input.js
```

Expected: `event.key === 'Enter'` handler that opens the word-guess `<dialog>` on the game screen.

---

**INPUTJS-03 — Space triggers focused button without double-firing**

```bash
grep -n 'Space\| == " "\|activeElement\|\.click()' src/input.js
```

Expected: `event.key === ' '` handler checks `document.activeElement.tagName === 'BUTTON'` and calls `document.activeElement.click()`. Must also call `event.preventDefault()` to prevent the default Space scroll behaviour.

---

**INPUTJS-04 — ESC dispatches quit or opens confirm dialog**

```bash
grep -n 'Escape\|ESC\|esc\|quit\|confirm\|QUIT' src/input.js
```

Expected: `event.key === 'Escape'` handler that opens the quit-confirm `<dialog>` (or shows a confirm prompt) on the game screen only; must not interfere with other screens.

---

**INPUTJS-05 — Pellet click delegation wired to `.pellet-row` (not per-button)**

```bash
grep -n 'pellet-row\|delegat\|target.*button\|addEventListener.*click' src/input.js
```

Expected: a single `click` event listener on `.pellet-row` (or a parent container) that reads `event.target.closest('button')` or `event.target.dataset.letter` — not 26 separate `addEventListener` calls.

---

**INPUTJS-06 — Window resize → `setPacPos` called; listeners attached once**

```bash
grep -n 'resize\|setPacPos' src/input.js
```

Expected: `window.addEventListener('resize', ...)` with a call to `setPacPos` (debounced or direct).

```bash
grep -n 'initInput\|wireInput\|addEventListener\|once\|initialized\|flag' src/input.js src/main.js
```

Expected: event listeners are attached once at boot (inside a `DOMContentLoaded` or an `initInput()` call in `main.js`), not re-attached on every `dispatch → render` cycle.

---

### 3.6 `main.js` Dispatch Loop — MAINJS-01 through MAINJS-04

---

**MAINJS-01 — `dispatch` exported from `src/main.js`**

```bash
grep -n '^export.*dispatch\|export.*function dispatch\|export { dispatch' src/main.js
```

Expected: one match.

---

**MAINJS-02 — Dispatch cycle: `reduce → render → persist.save`**

```bash
grep -n 'reduce\|render\|persist\|save\|persistedSlice' src/main.js
```

Expected: inside `dispatch`, these three calls appear in order:
1. `state = reduce(state, action)`
2. `render(state)` (or the screen-routing equivalent)
3. `persist.save(...)` called with the persisted slice — **not** the full state (which would persist `wordsCache`)

---

**MAINJS-03 — Animation calls are fire-and-forget (non-blocking)**

```bash
grep -n 'animatePacTraverse\|animateGhostEmerge\|await.*anim' src/main.js
```

Expected:
- `animatePacTraverse` and/or `animateGhostEmerge` called without `await` inside `dispatch` — they must not block the dispatch loop.
- No `await` on animation calls in the synchronous `dispatch` body. (Async animation functions may be called with `.catch(console.error)` or just fire-and-forget.)

---

**MAINJS-04 — `render()` routes to the correct screen renderer**

```bash
grep -n 'state\.screen\|renderTitle\|renderGame\|renderResult\|switch\|if.*screen' src/main.js
```

Expected: branching logic on `state.screen` that calls `renderTitle`, `renderGame`, or `renderResult` (from their respective modules) depending on the current screen value.

---

### 3.7 Interactive Behavior Checks — INTERACT-01 through INTERACT-09

**Setup:** INSERT COIN → wait for READY! to clear → game is active. Have DevTools Console open. Run Snippet A to confirm `data-screen === "game"` before starting each interactive check.

---

**INTERACT-01 — A–Z keyboard: hit reveals letter slot**

1. Identify a letter that IS in the current word. (Cheat: DevTools Elements panel → inspect `.letter-slot` elements to find a hidden letter's `textContent`, or wait until after game ends to see the word.)
2. Press that letter key.

```js
document.querySelectorAll('.word-area .letter--revealed').length
// Expected: > 0 — at least one slot flipped to revealed
```

```js
// The guessed pellet should be marked used
document.querySelectorAll('.pellet-row .pellet--used').length
// Expected: 1 (after the first correct guess)
```

---

**INTERACT-02 — A–Z keyboard: miss does NOT reveal a slot**

1. Press a letter key that is NOT in the current word.

```js
document.querySelectorAll('.word-area .letter--revealed').length
// Expected: same count as before the miss — no new reveals
```

```js
document.querySelectorAll('.pellet-row .pellet--miss, .pellet-row .pellet--used').length
// Expected: ≥ 1 — the missed pellet got a miss class then settled to used
```

---

**INTERACT-03 — Already-guessed letter produces a ping, no state change**

1. After guessing letter X (hit or miss), press the same X key again.
2. Observe: a brief animation or visual ping on the X pellet.

```js
// Revealed slot count should be unchanged from before the repeated guess
document.querySelectorAll('.word-area .letter--revealed').length
// Expected: same count as after the previous guess
```

```js
// No new .pellet--miss class added from the repeated guess
// (The ping class .pellet--ping should appear briefly then disappear)
document.querySelectorAll('.pellet--ping').length
// Expected: 0 after ping animation completes (ping class removed via setTimeout)
```

---

**INTERACT-04 — Clicking an alphabet pellet works identically to keyboard**

1. Click a `.pellet-row button` with a letter not yet guessed.
2. Observe: same DOM state change as a keyboard press (INTERACT-01 or INTERACT-02).

```js
document.querySelectorAll('.pellet-row .pellet--used').length
// Expected: incremented by 1 after each click
```

---

**INTERACT-05 — Enter key opens word-guess dialog**

1. On the game screen, press the Enter key.
2. Observe: the `<dialog>` element opens (modal overlay visible).

```js
document.querySelector('dialog').open
// Expected: true
```

3. Press Escape or cancel to close without submitting.

---

**INTERACT-06 — Word-guess modal: wrong word costs 1 miss**

1. Open dialog (press Enter).
2. In the dialog input, type a word you know is wrong (e.g., type "xyz" if that cannot be the word).
3. Submit.

```js
// The miss count should have incremented by 1
// Check via ghost state: one more ghost should have changed position (Phase 6 animates; Phase 5 confirms DOM class)
document.querySelectorAll('.ghost-house use.ghost').length
// Decrements by 1 if a ghost exited (or the ghost state was set by setGhostState)
```

Also confirm: dialog closes after wrong guess.

---

**INTERACT-07 — Win condition: all letters revealed → transition to result screen**

1. Play through a game to win (all letters revealed). For a faster test: open the dialog and type the exact word if you can determine it via the Elements panel.
2. After the final letter is revealed (or correct word submitted):

```js
document.getElementById('app').dataset.screen
// Expected: "result"
```

---

**INTERACT-08 — ESC / QUIT triggers confirm dialog**

1. On the game screen, press ESC.
2. Observe: a confirm dialog appears with text indicating streak loss.

```js
document.querySelectorAll('dialog[open]').length
// Expected: 1 (the confirm dialog is open)
```

3. Dismiss without confirming (click No / cancel). Confirm game is still active:

```js
document.getElementById('app').dataset.screen
// Expected: "game"
```

---

**INTERACT-09 — No console errors during full guess sequence**

After running INTERACT-01 through INTERACT-08, verify:

```js
// No errors logged during interactions. Manually review DevTools Console.
// Expected: zero red errors, zero unhandled promise rejections.
```

---

### 3.8 Visual Browser Checks — VISUAL-01 through VISUAL-05

Eyeball checks at ≥ 1024px viewport with DevTools closed so layout is unaffected. Navigate to game screen first.

---

**VISUAL-01 — Word display shows blank letter slots with visible underlines**

The word area shows a row of blank slots — each slot has a `--dot` peach underline bar beneath it. No letters are visible before any guess. The number of slots matches the word length.

---

**VISUAL-02 — Two rows of 13 alphabet pellet buttons visible**

Two horizontal rows of `A–M` and `N–Z` pellet buttons are visible in the lower maze area. Each button shows its letter in `--text` white on a `--dot` peach background with a `--maze` blue border.

---

**VISUAL-03 — GUESS WORD and QUIT buttons visible below the maze**

Two action buttons appear beneath the maze playfield: "GUESS WORD" (or equivalent label) on the left, and "QUIT (ESC)" or similar on the right. They match the spec §3.4 layout diagram.

---

**VISUAL-04 — HUD rendered correctly on game screen**

The HUD row above the maze shows: `1UP` score, `HIGH SCORE`, `CATEGORY`, `LEVEL` — all in `Press Start 2P` font, `--hud` peach colour, uppercase. Values are derived from the current game state.

---

**VISUAL-05 — No horizontal scroll on game screen**

```js
document.documentElement.scrollWidth > document.documentElement.clientWidth
// Expected: false
```

---

## 4. Shell Static Checks

Save as `scripts/check-phase5-static.sh` and run from repo root.

```bash
#!/bin/bash
set -e
echo "=== Phase 5 Static Checks ==="

echo "--- File existence ---"
ls styles/game.css src/render/game.js src/input.js
echo "PASS: all 3 files exist"

echo "--- game.css linked in index.html (after sprites.css) ---"
grep -n 'link.*\.css' index.html
echo "(verify: reset→theme→layout→screens→maze→sprites→game; no animations.css yet)"

echo "--- animations.css absent from index.html ---"
if grep -qn 'animations\.css' index.html 2>/dev/null; then
  echo "WARN: animations.css linked prematurely (Phase 6)"
else
  echo "PASS"
fi

echo "--- game.css: .word-area flex ---"
grep -q 'display.*flex\|flex' styles/game.css \
  && echo "PASS: flex layout found" || echo "FAIL: no flex in game.css"

echo "--- game.css: letter slot state classes ---"
for cls in letter--hidden letter--revealed pellet--hit pellet--miss pellet--used pellet--ping; do
  grep -q "\.$cls" styles/game.css \
    && echo "PASS: .$cls" \
    || echo "FAIL: .$cls missing from game.css"
done

echo "--- game.css: .pellet--used has pointer-events:none ---"
grep -q 'pointer-events.*none' styles/game.css \
  && echo "PASS" || echo "FAIL: pointer-events:none not found"

echo "--- game.css: touch target 44px ---"
grep -q '44px' styles/game.css \
  && echo "PASS" || echo "WARN: 44px touch target not found in game.css"

echo "--- game.css: no raw hex colours ---"
if grep -qE '#[0-9a-fA-F]{3,6}' styles/game.css 2>/dev/null; then
  echo "WARN: raw hex in game.css — use CSS custom properties"
else
  echo "PASS"
fi

echo "--- render/game.js: renderGame exported ---"
grep -q '^export.*function renderGame\|^export.*renderGame' src/render/game.js \
  && echo "PASS" || echo "FAIL: renderGame not exported"

echo "--- render/game.js: aria-label + aria-pressed on buttons ---"
grep -q 'aria-label\|aria-pressed' src/render/game.js \
  && echo "PASS" || echo "FAIL: ARIA attrs not set on alphabet buttons"

echo "--- render/game.js: dialog element present ---"
grep -q 'dialog\|showModal' src/render/game.js \
  && echo "PASS" || echo "FAIL: word-guess dialog not found in renderGame"

echo "--- render/game.js: pellet--ping for already-guessed ---"
grep -q 'pellet--ping' src/render/game.js \
  && echo "PASS" || echo "FAIL: already-guessed ping not implemented"

echo "--- render/game.js: pure render — no game logic / storage ---"
if grep -qn 'localStorage\|dispatch\|isWin\|isLoss\|guessLetter' src/render/game.js 2>/dev/null; then
  echo "FAIL: render/game.js contains logic or storage access"
else
  echo "PASS"
fi

echo "--- input.js: A-Z keydown → GUESS_LETTER ---"
grep -q 'GUESS_LETTER' src/input.js \
  && echo "PASS" || echo "FAIL: GUESS_LETTER not dispatched from input.js"

echo "--- input.js: Enter opens dialog ---"
grep -q 'Enter\|showModal' src/input.js \
  && echo "PASS" || echo "WARN: Enter→dialog not found in input.js"

echo "--- input.js: Space → activeElement.click() ---"
grep -q 'Space\|activeElement\|\.click()' src/input.js \
  && echo "PASS" || echo "WARN: Space→click not found in input.js"

echo "--- input.js: ESC → quit confirm ---"
grep -q 'Escape\|quit\|QUIT\|confirm' src/input.js \
  && echo "PASS" || echo "FAIL: ESC quit not found in input.js"

echo "--- input.js: click delegation (not per-button) ---"
COUNT=$(grep -c 'addEventListener.*click' src/input.js 2>/dev/null || echo 0)
echo "click addEventListener count: $COUNT (expect ≤ 3 — delegation, not per-button)"
[ "$COUNT" -le 3 ] && echo "PASS" || echo "WARN: too many click listeners — may not be delegated"

echo "--- input.js: window resize → setPacPos ---"
grep -q 'resize\|setPacPos' src/input.js \
  && echo "PASS" || echo "FAIL: resize handler not found"

echo "--- main.js: dispatch exported ---"
grep -q '^export.*dispatch\|export.*function dispatch\|export { dispatch' src/main.js \
  && echo "PASS" || echo "FAIL: dispatch not exported from main.js"

echo "--- main.js: reduce → render → persist.save ---"
grep -q 'reduce\|persist' src/main.js \
  && echo "PASS" || echo "FAIL: dispatch cycle incomplete in main.js"

echo "--- main.js: animation calls not awaited in dispatch ---"
if grep -q 'await.*animatePacTraverse\|await.*animateGhostEmerge' src/main.js 2>/dev/null; then
  echo "WARN: animations awaited in dispatch — may block game loop"
else
  echo "PASS: animations are fire-and-forget"
fi

echo "--- main.js: screen routing to renderTitle/renderGame/renderResult ---"
grep -q 'renderTitle\|renderGame\|renderResult' src/main.js \
  && echo "PASS" || echo "FAIL: screen routing not found in main.js"

echo "=== Static checks done — run browser checks and interactive checks manually ==="
```

Run: `bash scripts/check-phase5-static.sh`

---

## 5. Spec → Check Coverage Matrix

| Spec Rule | Section | Check IDs |
|---|---|---|
| `game.css` linked after sprites.css; animations.css absent | §6.1 | FILE-02 |
| `.word-area` flex row, centred in maze | §3.6 | GAMECSS-01, VISUAL-01 |
| `.letter-slot` flex column: letter above underline | §3.6 | GAMECSS-02, DOM-02, VISUAL-01 |
| Hidden letter: underline shows, letter hidden (opacity 0) | §3.6 | GAMECSS-03, DOM-03 |
| Revealed letter: `--pac` yellow, opacity 1, 200ms fade | §3.6 | GAMECSS-04, INTERACT-01 |
| Pellet hit → `--hit` flash → dim | §3.7 | GAMECSS-05, INTERACT-01 |
| Pellet miss → `--miss` flash → dim | §3.7 | GAMECSS-05, INTERACT-02 |
| `.pellet--used`: opacity 0.25, pointer-events none | §3.7 | GAMECSS-06, DOM checks, INTERACT-01/02 |
| Already-guessed letter → ping, no state change | §2.3, §3.7 | GAMECSS-07, GAMEJS-05, INTERACT-03 |
| Default pellet: `--dot`, `--text`, `--maze` border | §3.7 | GAMECSS-08, VISUAL-02 |
| Hover/focus: scale 1.1, `--pac` glow | §3.7 | GAMECSS-09 |
| Touch targets ≥ 44×44 px | §3.7, §8 | GAMECSS-10 |
| No hard-coded hex colours | §3.1 | GAMECSS-10, shell check |
| `.word-area` populated with one slot per character | §3.6 | DOM-01, Snippet B |
| Each `.letter-slot` has `.letter` and `.underline` spans | §3.6 | DOM-02, Snippet E |
| All slots start as `.letter--hidden` | §3.6 | DOM-03, INTERACT-01 |
| 26 alphabet buttons in two rows of 13 | §3.7 | DOM-04, Snippet C, VISUAL-02 |
| `aria-label="Letter X"` on each button | §8 | DOM-05, GAMEJS-03, Snippet C |
| `aria-pressed` on each button; `false` at start | §8 | DOM-05/06, GAMEJS-03 |
| `aria-pressed="true"` + `aria-disabled="true"` after guess | §8 | GAMEJS-03, DOM-06 |
| Word-guess `<dialog>` with text input + submit | §2.2 | DOM-07, GAMEJS-04, INTERACT-05 |
| GUESS WORD + QUIT outside `.maze` | §3.4 | DOM-08, VISUAL-03 |
| `renderGame` is a pure render module | §6.2 | GAMEJS-07, shell check |
| `renderGame` calls `renderHUD` | §3.4 | GAMEJS-06, VISUAL-04 |
| A–Z keydown → `GUESS_LETTER` dispatched | §2.2 | INPUTJS-01, INTERACT-01/02 |
| Enter → word-guess dialog opens | §2.2, §5.1 | INPUTJS-02, INTERACT-05 |
| Space → focused button click, no double fire | §2.3 | INPUTJS-03 |
| ESC → quit confirm dialog | §2.3 | INPUTJS-04, INTERACT-08 |
| Pellet click delegated (one listener per row) | §3.7 | INPUTJS-05, INTERACT-04 |
| Window resize → `setPacPos` called | §2.3 | INPUTJS-06 |
| Input listeners attached once at boot | §6.4 | INPUTJS-06 |
| `dispatch` exported from `main.js` | §6.4 | MAINJS-01, shell check |
| dispatch: `reduce → render → persist.save` cycle | §4.2, §4.3 | MAINJS-02, shell check |
| `wordsCache` NOT persisted | §4.3 | MAINJS-02 |
| Animations fire-and-forget, non-blocking | §3.8 | MAINJS-03, shell check |
| `render()` routes on `state.screen` | §6.3 | MAINJS-04, shell check |
| Correct letter → slot revealed, pellet used | §5.1, §3.7 | INTERACT-01 |
| Wrong letter → no reveal, pellet missed | §5.1, §3.7 | INTERACT-02 |
| Repeated letter → ping, no state change | §2.3 | INTERACT-03, GAMEJS-05 |
| Click pellet = keyboard press (same behavior) | §3.7 | INTERACT-04 |
| Word-guess correct → WIN; result screen | §5.1, §2.2 | INTERACT-07 |
| Word-guess wrong → 1 miss, dialog closes | §5.1, §2.3 | INTERACT-06 |
| ESC confirm dialog shows streak loss warning | §2.3 | INTERACT-08 |
| No console errors during full guess sequence | §6.4 | INTERACT-09, VISUAL-05 |
| No horizontal scroll on game screen | §1 goals | VISUAL-05 |

---

## 6. Check Automation

### 6.1 Shell Static Checks Script

The bash block in §4 above is the complete script. Save it as `scripts/check-phase5-static.sh`.

Run: `bash scripts/check-phase5-static.sh`

### 6.2 Browser Checks — Manual Checklist

```
=== Files & CSS (static) ===
[ ] FILE-01   styles/game.css + src/render/game.js + src/input.js exist
[ ] FILE-02   game.css linked after sprites.css; animations.css absent

=== game.css ===
[ ] GAMECSS-01   .word-area: display:flex (row layout)
[ ] GAMECSS-02   .letter-slot: display:flex, flex-direction:column
[ ] GAMECSS-03   .letter--hidden .letter: opacity:0
[ ] GAMECSS-04   .letter--revealed .letter: color:var(--pac), opacity:1, transition:opacity 200ms
[ ] GAMECSS-05   .pellet--hit: var(--hit) flash; .pellet--miss: var(--miss) flash
[ ] GAMECSS-06   .pellet--used: opacity:0.25, pointer-events:none
[ ] GAMECSS-07   .pellet--ping rule present
[ ] GAMECSS-08   Default pellet button: background:var(--dot), border:2px solid var(--maze)
[ ] GAMECSS-09   Hover/focus: transform:scale(1.1), text-shadow glow var(--pac)
[ ] GAMECSS-10   Touch targets 44px; no raw hex colours

=== DOM structure (game screen) ===
[ ] DOM-01   .word-area has .letter-slot children (≥ 3, one per letter)
[ ] DOM-02   Each .letter-slot has .letter and .underline child spans
[ ] DOM-03   All slots start as .letter--hidden before first guess
[ ] DOM-04   26 alphabet <button> elements across 2 .pellet-row divs
[ ] DOM-05   Each button has aria-label="Letter X" and aria-pressed attribute
[ ] DOM-06   All aria-pressed="false" at game start
[ ] DOM-07   <dialog> with text input present in DOM
[ ] DOM-08   GUESS WORD and QUIT buttons outside .maze

=== render/game.js API ===
[ ] GAMEJS-01   renderGame exported
[ ] GAMEJS-02   Letter slots derived from state.word + state.revealed
[ ] GAMEJS-03   26 buttons rendered with aria-label, aria-pressed, aria-disabled
[ ] GAMEJS-04   Word-guess <dialog> with input + submit
[ ] GAMEJS-05   Already-guessed ping (.pellet--ping added + removed via setTimeout)
[ ] GAMEJS-06   renderHUD called from shared.js
[ ] GAMEJS-07   render/game.js is pure (no dispatch/localStorage/game logic)

=== input.js wiring ===
[ ] INPUTJS-01   A–Z keydown dispatches GUESS_LETTER
[ ] INPUTJS-02   Enter opens word-guess dialog
[ ] INPUTJS-03   Space → activeElement.click(), event.preventDefault()
[ ] INPUTJS-04   ESC → quit confirm dialog (game screen only)
[ ] INPUTJS-05   Pellet click delegated (not per-button addEventListener)
[ ] INPUTJS-06   Window resize → setPacPos; listeners attached once at boot

=== main.js dispatch loop ===
[ ] MAINJS-01   dispatch exported
[ ] MAINJS-02   dispatch: state = reduce(state, action) → render(state) → persist.save(slice)
[ ] MAINJS-03   Animations (animatePacTraverse / animateGhostEmerge) called without await
[ ] MAINJS-04   render() routes to renderTitle/renderGame/renderResult on state.screen

=== Interactive behavior (game screen) ===
[ ] INTERACT-01   Keyboard hit: letter slot reveals (.letter--revealed), pellet marked used
[ ] INTERACT-02   Keyboard miss: no slot reveals; pellet marked miss/used
[ ] INTERACT-03   Repeated letter: ping visible on pellet, no state change, no life lost
[ ] INTERACT-04   Pellet click: identical behavior to keyboard press
[ ] INTERACT-05   Enter opens word-guess dialog; dialog.open === true
[ ] INTERACT-06   Wrong word in dialog: 1 miss, dialog closes
[ ] INTERACT-07   All letters revealed: app transitions to result screen
[ ] INTERACT-08   ESC: confirm dialog opens; cancel → game resumes (data-screen stays "game")
[ ] INTERACT-09   No console errors during full guess sequence

=== Visual (game screen) ===
[ ] VISUAL-01   Word slots visible with peach underlines; no letters shown before first guess
[ ] VISUAL-02   Two rows of A–M and N–Z pellet buttons visible in lower maze area
[ ] VISUAL-03   GUESS WORD and QUIT buttons visible below maze
[ ] VISUAL-04   HUD shows score, high score, category, level in Press Start 2P font
[ ] VISUAL-05   No horizontal scroll on game screen
```

---

## 7. Exit Criteria

Phase 5 is verified when **all** of the following hold:

- [ ] `bash scripts/check-phase5-static.sh` exits without FAIL lines.
- [ ] FILE-01, FILE-02 — all files exist, link order correct.
- [ ] GAMECSS-01 through GAMECSS-10 — all game.css rules verified.
- [ ] DOM-01 through DOM-08 — all DOM structure checks pass on mounted game screen.
- [ ] GAMEJS-01 through GAMEJS-07 — all render/game.js checks pass.
- [ ] INPUTJS-01 through INPUTJS-06 — all input.js wiring checks pass.
- [ ] MAINJS-01 through MAINJS-04 — dispatch loop verified.
- [ ] INTERACT-01 through INTERACT-09 — all interactive behavior checks pass.
- [ ] VISUAL-01 through VISUAL-05 — all visual checks pass.

**Total: 51 checks across 8 groups.** All 51 must be green.

Do **not** proceed to Phase 6 (Animations) until all mandatory items above are checked.

---

## 8. Out of Scope (defer to later phases)

| Item | Phase |
|---|---|
| `@keyframes pacman-chomp` definition | Phase 6 |
| `@keyframes pacman-death`, `maze-strobe`, `pellet-eat`, `ghost-emerge-*`, `pellet-ping` | Phase 6 |
| Pac-Man WAAPI traverse animation on hit | Phase 6 |
| Ghost emergence triggered by miss (animation) | Phase 6 |
| READY! interstitial blink animation | Phase 6 |
| Win maze strobe + Pac-Man victory loop | Phase 6 |
| Death animation sequence (1.2s → result) | Phase 6 |
| `src/audio.js` call sites (chomp, miss, win, loss) | Phase 7 |
| Mobile layout (≤ 480px), 6-col alphabet grid | Phase 7 |
| `aria-live` guess announcements in `#sr-announce` | Phase 7 |
| Focus ring enforcement on all interactive elements | Phase 7 |
| `prefers-reduced-motion` CSS media query overrides | Phase 7 |
| Firefox + Safari cross-browser matrix | Phase 8 |
| All 14 acceptance criteria E2E pass | Phase 8 |

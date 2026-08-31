# PacHangman — Phase 7 Verification Plan

> Companion to `planning/plan/hang_implementation_plan.md` §Phase 7.
> Run these checks **after** Phase 7 is complete and before Phase 8 begins.
> Spec references: `planning/design/hangman_spec.md`.

---

## 1. Context & Scope

Phase 7 delivers the audio stub, all §2.3 edge-case behaviours, the mobile responsive layout, and the full v1 accessibility layer. Unlike Phase 6 (animation), nothing here requires timing-sensitive visual observation — verification is a mix of static grep checks, DevTools Console snippets, DevTools throttle simulations, and manual browser/keyboard checks.

**In scope for this verification:**
- `src/audio.js` — 7 no-op methods (`chomp`, `miss`, `win`, `loss`, `ready`, `tick`, `bgm`) exported as named properties on the `audio` object; zero side effects in v1
- `src/main.js` — call sites wired for all 7 audio events; mobile flag detection; `resize` listener registered on `window`
- `src/input.js` — Tab+Space discipline finalised; ESC quit native `<dialog>` confirm; resize → `setPacPos`
- `src/render/title.js` — `setTimeout(150ms)` loading text ("LOADING…") during fetch; `.error-overlay` injected on JSON load failure; INSERT COIN disabled while error overlay is visible
- `styles/layout.css` — `@media (max-width: 480px)` block: 6-column alphabet grid, ghost house at top, word display in middle; touch targets ≥ 44×44 px
- `src/render/shared.js` or `src/render/game.js` — `#sr-announce` (`aria-live="polite"`, `aria-atomic="true"`) updated with correct text after every guess event (hit, miss, win, loss)
- `index.html` — `#sr-announce` element present; `aria-hidden="true"` on all SVG `<use>` elements; `aria-label`, `aria-pressed`, `aria-disabled` on alphabet buttons

**Out of scope until later phases:**
- Firefox + Safari cross-browser matrix — Phase 8
- All 14 acceptance criteria E2E pass — Phase 8
- Real audio implementation (non-no-op) — v2
- Performance profiling, Lighthouse audit — Phase 8

---

## 2. Environment & Setup

**Dev server:** `python3 -m http.server 8000` from repo root.
**Browser:** Chrome with DevTools (F12). No Node test runner needed for Phase 7.

### 2.1 Console Snippets (reference these in §3 checks)

Paste these into the DevTools Console at `localhost:8000`.

**Snippet A — confirm `#sr-announce` element is present:**
```js
!!document.getElementById('sr-announce')
// Expected: true
```

**Snippet B — read `aria-live` attribute on `#sr-announce`:**
```js
document.getElementById('sr-announce').getAttribute('aria-live')
// Expected: "polite"
```

**Snippet C — read `aria-atomic` attribute on `#sr-announce`:**
```js
document.getElementById('sr-announce').getAttribute('aria-atomic')
// Expected: "true"
```

**Snippet D — confirm all `<use>` elements carry `aria-hidden="true"`:**
```js
[...document.querySelectorAll('use')].every(u => u.getAttribute('aria-hidden') === 'true')
// Expected: true
```

**Snippet E — read `aria-label` on the first alphabet button:**
```js
document.querySelector('.pellet-row button').getAttribute('aria-label')
// Expected: "Letter A" (or similar format for the first button)
```

**Snippet F — check `<dialog>` element exists in DOM:**
```js
!!document.querySelector('dialog')
// Expected: true (after the ESC quit flow has been triggered at least once, or if the dialog is pre-rendered)
```

**Snippet G — simulate slow network:** In DevTools → Network tab → Throttle dropdown → select "Slow 3G". Reload the page and watch INSERT COIN area for "LOADING…" text. Clear throttle after the check.

**Snippet H — simulate fetch failure for error overlay:** In DevTools → Network tab → right-click the `words/<category>.json` request → "Block request URL". Reload or change category. Confirm `.error-overlay` with "NETWORK ERROR — PLEASE REFRESH" appears.

**Snippet I — read current `#sr-announce` text after a guess:**
```js
document.getElementById('sr-announce').textContent
// Expected: non-empty string describing the last guess result
```

**Snippet J — check touch target size on an alphabet button:**
```js
const btn = document.querySelector('.pellet-row button');
const r = btn.getBoundingClientRect();
[r.width, r.height]
// Expected: both values ≥ 44
```

---

## 3. Check Catalog

Check IDs follow `<MODULE>-NN`. Phase 7 has no Node unit tests; each entry specifies an exact procedure.

---

### 3.1 File Existence — FILE-01 through FILE-02

---

**FILE-01 — `src/audio.js` exists**

```bash
ls /Users/theobeack/Repo/hangman/src/audio.js
```

Expected: file listed with no error.

---

**FILE-02 — All 7 method names present in `src/audio.js`**

```bash
for method in chomp miss win loss ready tick bgm; do
  grep -q "$method" /Users/theobeack/Repo/hangman/src/audio.js \
    && echo "PASS: $method" || echo "FAIL: $method missing"
done
```

Expected: 7 PASS lines, zero FAIL lines.

---

### 3.2 Audio Stub — AUDIO-01 through AUDIO-07

Each check verifies: (a) the method is exported on the `audio` object, and (b) a call site exists in `main.js`.

---

**AUDIO-01 — `audio.chomp()` defined and wired**

```bash
grep -n 'chomp' /Users/theobeack/Repo/hangman/src/audio.js
grep -n 'audio\.chomp' /Users/theobeack/Repo/hangman/src/main.js
```

Expected: first grep shows a method definition; second grep shows at least one call site (fires on letter hit).

No-op verification — method body must contain no non-trivial statements:
```bash
grep -A 3 'chomp' /Users/theobeack/Repo/hangman/src/audio.js
```
Expected: body is `{}` or equivalent empty function; no `fetch`, `Audio`, `localStorage`, or DOM access inside the body.

---

**AUDIO-02 — `audio.miss()` defined and wired**

```bash
grep -n 'miss' /Users/theobeack/Repo/hangman/src/audio.js
grep -n 'audio\.miss' /Users/theobeack/Repo/hangman/src/main.js
```

Expected: definition present; call site fires on letter miss.

---

**AUDIO-03 — `audio.win()` defined and wired**

```bash
grep -n '\bwin\b' /Users/theobeack/Repo/hangman/src/audio.js
grep -n 'audio\.win' /Users/theobeack/Repo/hangman/src/main.js
```

Expected: definition present; call site fires on game win event.

---

**AUDIO-04 — `audio.loss()` defined and wired**

```bash
grep -n 'loss' /Users/theobeack/Repo/hangman/src/audio.js
grep -n 'audio\.loss' /Users/theobeack/Repo/hangman/src/main.js
```

Expected: definition present; call site fires on game loss event.

---

**AUDIO-05 — `audio.ready()` defined and wired**

```bash
grep -n 'ready' /Users/theobeack/Repo/hangman/src/audio.js
grep -n 'audio\.ready' /Users/theobeack/Repo/hangman/src/main.js
```

Expected: definition present; call site fires on READY! interstitial entry.

---

**AUDIO-06 — `audio.tick()` defined and wired**

```bash
grep -n 'tick' /Users/theobeack/Repo/hangman/src/audio.js
grep -n 'audio\.tick' /Users/theobeack/Repo/hangman/src/main.js
```

Expected: definition present; call site fires on alphabet button hover/focus.

---

**AUDIO-07 — `audio.bgm()` defined and wired**

```bash
grep -n 'bgm' /Users/theobeack/Repo/hangman/src/audio.js
grep -n 'audio\.bgm' /Users/theobeack/Repo/hangman/src/main.js
```

Expected: definition present; accepts a boolean `play` parameter in its signature; call site fires on title screen entry (or exit).

No-op purity check across the whole file:
```bash
grep -n 'fetch\|localStorage\|document\.\|window\.\|new Audio\|XMLHttpRequest' \
  /Users/theobeack/Repo/hangman/src/audio.js
```
Expected: zero matches. The stub must be side-effect-free.

---

### 3.3 Edge Cases — EDGE-01 through EDGE-07

---

**EDGE-01 — ESC quit uses native `<dialog>` with correct text**

Static check:
```bash
grep -n 'dialog\|showModal' \
  /Users/theobeack/Repo/hangman/src/input.js \
  /Users/theobeack/Repo/hangman/src/main.js
```
Expected: at least one reference to `<dialog` element creation or `showModal()`.

Browser check: start a game, press ESC. Confirm:
- A native `<dialog>` element appears (not a `<div>` overlay).
- Dialog text includes "QUIT RUN?" and "STREAK WILL BE LOST." (or equivalent spec wording).
- Two buttons: one to confirm quit (dispatches `QUIT`), one to cancel (closes dialog, resumes game).
- After cancel: dialog closes, game state unchanged, Pac-Man animation (if running) resumes.
- After confirm: `#app` transitions to title screen.

```js
// After pressing ESC in-game, confirm the dialog element is open:
document.querySelector('dialog').open
// Expected: true
```

---

**EDGE-02 — Tab+Space fires focused alphabet button exactly once**

Browser check:
1. Navigate to game screen, tab to an unguessed alphabet button.
2. Press Space.
3. Confirm the letter is guessed exactly once — the button transitions to guessed state (aria-pressed="true") and no duplicate guess action fires.

Console synthetic test:
```js
// Focus the first unguessed pellet button
const btn = [...document.querySelectorAll('.pellet-row button')]
  .find(b => b.getAttribute('aria-pressed') !== 'true');
btn.focus();
// Dispatch Space keydown
document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
```
Expected: exactly one guess fired — no double-dispatch, no console error.

Source check — `input.js` must guard Space to prevent both the keydown handler and the button's natural click from triggering:
```bash
grep -n 'Space\| === " "\|key === " "' /Users/theobeack/Repo/hangman/src/input.js
```
Expected: logic present that either calls `preventDefault()` on the keydown or defers to the button's native click only.

---

**EDGE-03 — `resize` listener registered; `setPacPos` called on resize**

Static check:
```bash
grep -n "'resize'\|\"resize\"" \
  /Users/theobeack/Repo/hangman/src/main.js \
  /Users/theobeack/Repo/hangman/src/input.js
grep -n 'setPacPos' \
  /Users/theobeack/Repo/hangman/src/main.js \
  /Users/theobeack/Repo/hangman/src/input.js
```
Expected: `'resize'` listener registration and `setPacPos` call both present.

Browser check: open game screen. Drag the browser window wider or narrower. Confirm no JS errors in Console. Pac-Man home position should not be frozen at the old coordinate.

---

**EDGE-04 — JSON load failure shows `.error-overlay` and disables INSERT COIN**

Using Snippet H (block the `words/*.json` request in DevTools):
1. Block the category JSON URL.
2. Reload the page or change the category select.
3. Confirm a `.error-overlay` element appears containing "NETWORK ERROR — PLEASE REFRESH" (or spec-exact wording).
4. Confirm INSERT COIN button is `disabled` while the overlay is present.

```js
// After triggering the failure:
!!document.querySelector('.error-overlay')
// Expected: true

document.querySelector('.error-overlay').textContent.toUpperCase().includes('NETWORK ERROR')
// Expected: true

[...document.querySelectorAll('button')]
  .find(b => b.textContent.toUpperCase().includes('INSERT')).disabled
// Expected: true
```

Source check — `title.js` must handle the fetch `catch` path:
```bash
grep -n 'error-overlay\|catch\|NETWORK ERROR' \
  /Users/theobeack/Repo/hangman/src/render/title.js
```
Expected: all three strings present.

---

**EDGE-05 — LOADING… text appears after 150 ms on slow fetch**

Using Snippet G (Slow 3G throttle):
1. Enable Slow 3G in DevTools Network throttle.
2. Reload the page or change the category select.
3. Within ~150–500 ms, confirm the INSERT COIN area changes its text to "LOADING…".
4. After the fetch resolves, confirm "LOADING…" reverts to "INSERT COIN".

Source check — `title.js` must use a `setTimeout` of 150:
```bash
grep -n 'setTimeout\|150\|LOADING' /Users/theobeack/Repo/hangman/src/render/title.js
```
Expected: `setTimeout` with `150` and the string "LOADING" (or "LOADING…") all present.

---

**EDGE-06 — Already-guessed letter: visual ping, "ALREADY EATEN" flash, no state change**

Browser check:
1. Guess a letter (e.g. press A).
2. Immediately guess the same letter again (press A or click the now-guessed button).
3. Confirm:
   - A ping or flash class (e.g. `already-guessed`) is briefly applied to the button.
   - "ALREADY EATEN" text (or equivalent) flashes on screen.
   - `lives` count in the HUD does not change.
   - Guess count does not increment.

Console check after repeated guess:
```js
// Assuming state is accessible:
window.__state?.lives  // or however state is exposed for debugging
// Expected: same value as before the repeated guess
```

Source check:
```bash
grep -n 'already\|ALREADY\|already-guessed\|ping' \
  /Users/theobeack/Repo/hangman/src/render/game.js \
  /Users/theobeack/Repo/hangman/src/input.js \
  /Users/theobeack/Repo/hangman/src/main.js 2>/dev/null
```
Expected: at least one match covering the visual ping and the no-state-change guard.

---

**EDGE-07 — Repeated letter in word: all positions revealed on hit**

This is a Phase 1 reducer guarantee — verify the UI reflects it correctly.

Browser check:
1. Select a category and start a game.
2. Guess a letter that appears more than once in the word (requires knowing the word — check `state` or use browser tools).
3. Confirm all occurrences of that letter are revealed in the word display simultaneously.

```js
// Count revealed letter slots matching the guessed letter:
[...document.querySelectorAll('.letter-slot')]
  .filter(s => s.textContent.trim() === 'E')  // replace 'E' with the guessed letter
  .length
// Expected: equals the count of that letter in the word
```

---

### 3.4 Mobile Layout — MOBILE-01 through MOBILE-05

---

**MOBILE-01 — `@media (max-width: 480px)` block present in `layout.css`**

```bash
grep -n 'max-width.*480\|480px' /Users/theobeack/Repo/hangman/styles/layout.css
```
Expected: at least one match.

---

**MOBILE-02 — 6-column alphabet grid in the mobile media query**

```bash
grep -A 30 'max-width.*480px' /Users/theobeack/Repo/hangman/styles/layout.css \
  | grep -i 'grid\|column\|col'
```
Expected: a rule setting the alphabet grid to 6 columns (e.g. `grid-template-columns: repeat(6, ...)` or `columns: 6`).

---

**MOBILE-03 — Ghost house at top, word in middle in mobile layout**

```bash
grep -A 40 'max-width.*480px' /Users/theobeack/Repo/hangman/styles/layout.css
```
Expected: layout rules that place the ghost house (`.ghost-house` or equivalent) at the top of the stacking order and the word display (`.word-display` or equivalent) in the middle, above the alphabet grid.

---

**MOBILE-04 — No horizontal scroll at 375×667 viewport**

In DevTools → Device toolbar → set custom size 375×667 (iPhone SE). Load game screen.

```js
document.documentElement.scrollWidth > document.documentElement.clientWidth
// Expected: false
```

Also visually confirm no content is cut off or triggering horizontal overflow.

---

**MOBILE-05 — Pac-Man traversal animation disabled on mobile**

Static check — mobile flag or `reducedMotion` must gate WAAPI traversal:
```bash
grep -n 'mobile\|isMobile\|reducedMotion\|matchMedia' \
  /Users/theobeack/Repo/hangman/src/main.js \
  /Users/theobeack/Repo/hangman/src/input.js
```
Expected: a mobile detection flag (screen width check, pointer check, or similar) and a branch that disables WAAPI traversal animation when the flag is true.

Browser check at 375×667: start a game, guess a letter. Confirm Pac-Man does not traverse the alphabet row (animation skipped), but the pellet state still updates correctly.

---

### 3.5 Accessibility — A11Y-01 through A11Y-10

---

**A11Y-01 — `#sr-announce` present with correct ARIA attributes**

```js
// Run in Console:
const el = document.getElementById('sr-announce');
[!!el, el.getAttribute('aria-live'), el.getAttribute('aria-atomic')]
// Expected: [true, "polite", "true"]
```

Static check:
```bash
grep -n 'sr-announce\|aria-live\|aria-atomic' /Users/theobeack/Repo/hangman/index.html
```
Expected: all three strings present in `index.html`.

---

**A11Y-02 — Hit announcement contains position count**

Browser check: start a game. Guess a letter that exists in the word. Immediately run:
```js
document.getElementById('sr-announce').textContent
// Expected: contains the number of positions revealed, e.g. "Letter E found — 2 positions revealed. 4 letters remaining."
```

---

**A11Y-03 — Miss announcement contains lives remaining**

Guess a letter that does not exist in the word:
```js
document.getElementById('sr-announce').textContent
// Expected: contains lives remaining, e.g. "Letter Q not in word. 5 lives remaining."
```

---

**A11Y-04 — Win announcement matches spec text**

Complete a game with a win. Immediately:
```js
document.getElementById('sr-announce').textContent
// Expected: "You win! The word was <WORD>." where <WORD> is the actual word in caps
```

---

**A11Y-05 — Loss announcement matches spec text**

Let lives reach zero (loss). Immediately:
```js
document.getElementById('sr-announce').textContent
// Expected: "Game over. The word was <WORD>."
```

---

**A11Y-06 — All SVG `<use>` elements carry `aria-hidden="true"`**

```js
[...document.querySelectorAll('use')].every(u => u.getAttribute('aria-hidden') === 'true')
// Expected: true
```

Static check:
```bash
grep -c 'aria-hidden="true"' /Users/theobeack/Repo/hangman/index.html
# Cross-check: count <use> elements
grep -c '<use' /Users/theobeack/Repo/hangman/index.html
```
Expected: counts match (every `<use>` has `aria-hidden="true"`).

---

**A11Y-07 — Alphabet buttons have correct ARIA attributes**

Unguessed button:
```js
const btn = document.querySelector('.pellet-row button');
[btn.getAttribute('aria-label'), btn.getAttribute('aria-pressed'), btn.getAttribute('aria-disabled')]
// Expected: ["Letter A", "false", "false"] (or null for aria-disabled when not guessed)
```

Guessed button (after guessing that letter):
```js
const guessed = [...document.querySelectorAll('.pellet-row button')]
  .find(b => b.getAttribute('aria-pressed') === 'true');
[guessed.getAttribute('aria-pressed'), guessed.getAttribute('aria-disabled')]
// Expected: ["true", "true"]
```

Static check:
```bash
grep -n 'aria-label\|aria-pressed\|aria-disabled' \
  /Users/theobeack/Repo/hangman/src/render/game.js \
  /Users/theobeack/Repo/hangman/src/render/shared.js 2>/dev/null
```
Expected: all three attribute names present in the render source.

---

**A11Y-08 — Focus rings are `2px solid var(--pac)` on `:focus-visible`**

Static check:
```bash
grep -n 'focus-visible\|outline' /Users/theobeack/Repo/hangman/styles/layout.css \
  /Users/theobeack/Repo/hangman/styles/screens.css 2>/dev/null
```
Expected: a rule matching `:focus-visible` with `outline: 2px solid var(--pac)` and `outline-offset: 2px`.

Browser check: tab through Title screen. Confirm each focused element shows a bright yellow (`#FFFF00`) 2px outline. Run:
```js
// After tabbing to focus an element:
getComputedStyle(document.querySelector(':focus-visible')).outline
// Expected: contains "2px" and "rgb(255, 255, 0)"
```

---

**A11Y-09 — Tab order correct on Title and Game screens**

Title screen tab order (in order):
1. Easy / Normal / Hard difficulty radio buttons
2. Category `<select>`
3. INSERT COIN button

Game screen tab order:
1. Alphabet pellet buttons A through Z
2. GUESS WORD button
3. QUIT button

Browser check: load Title screen, press Tab repeatedly. Confirm focus moves through difficulty radios → category select → INSERT COIN in that order. No focusable elements in the wrong position.

Click INSERT COIN to enter Game screen. Tab through. Confirm A–Z buttons receive focus in alphabetical order, then GUESS WORD, then QUIT.

---

**A11Y-10 — Touch targets ≥ 44×44 px**

```js
// Alphabet buttons:
const btn = document.querySelector('.pellet-row button');
const r = btn.getBoundingClientRect();
[r.width >= 44, r.height >= 44]
// Expected: [true, true]

// GUESS WORD button:
const gw = [...document.querySelectorAll('button')]
  .find(b => b.textContent.toUpperCase().includes('GUESS'));
const gr = gw.getBoundingClientRect();
gr.height >= 44
// Expected: true

// QUIT button:
const q = [...document.querySelectorAll('button')]
  .find(b => b.textContent.toUpperCase().includes('QUIT'));
q.getBoundingClientRect().height >= 44
// Expected: true
```

At 375×667 mobile viewport (DevTools device toolbar), re-run the above. Both width and height must be ≥ 44 at mobile size.

---

### 3.6 Visual Checks — VISUAL-01 through VISUAL-05

---

**VISUAL-01 — LOADING… text visible during slow fetch**

Enable Slow 3G (DevTools Network → Throttle). Change the category select. Confirm INSERT COIN area displays "LOADING…" for the duration of the pending fetch. Text reverts to "INSERT COIN" after resolve.

---

**VISUAL-02 — Error overlay visible on simulated network failure**

Block `words/*.json` (Snippet H procedure). Reload. Confirm:
- `.error-overlay` div is visible over the Title screen.
- Text reads "NETWORK ERROR — PLEASE REFRESH" or equivalent.
- INSERT COIN button is visually disabled (greyed out or `disabled` attribute set).

---

**VISUAL-03 — Mobile layout correct at 375×667**

DevTools → Device toolbar → 375×667. Confirm the game screen stacks as: ghost house (top) → word display (middle) → 6-column alphabet grid (bottom). No elements overlap. No horizontal scroll.

---

**VISUAL-04 — Focus rings clearly visible on tab**

Tab through the game on a desktop viewport. Confirm the `--pac` yellow (`#FFFF00`) outline is visible on every focusable element and is never clipped, hidden, or overridden by another style.

---

**VISUAL-05 — No console errors after full Phase 7 wiring**

Load the page, play a full game to win or loss, trigger ESC quit dialog (cancel), resize the window, and then inspect the Console. Expected: zero red error entries. Zero unhandled promise rejections.

---

## 4. Shell Static Checks

Save the following script to `scripts/check-phase7-static.sh` and run it from the repo root.

```bash
bash scripts/check-phase7-static.sh
```

See §6.1 for the full script contents.

---

## 5. Spec → Check Coverage Matrix

Every spec rule that Phase 7 modules implement maps to at least one check ID.

| Spec Rule | Section | Check IDs |
|---|---|---|
| `src/audio.js` exists | §7 | FILE-01 |
| All 7 method names present in `audio.js` | §7 | FILE-02, AUDIO-01–07 |
| `audio.chomp()` — no-op, wired on letter hit | §7 | AUDIO-01 |
| `audio.miss()` — no-op, wired on letter miss | §7 | AUDIO-02 |
| `audio.win()` — no-op, wired on game win | §7 | AUDIO-03 |
| `audio.loss()` — no-op, wired on game loss | §7 | AUDIO-04 |
| `audio.ready()` — no-op, wired on READY! interstitial | §7 | AUDIO-05 |
| `audio.tick()` — no-op, wired on alphabet button hover | §7 | AUDIO-06 |
| `audio.bgm(play)` — no-op, wired on title entry/exit | §7 | AUDIO-07 |
| `audio.js` has zero side effects | §7 | AUDIO-07, static check #5 |
| ESC mid-game → native `<dialog>` confirm | §2.3 | EDGE-01 |
| ESC dialog text: "QUIT RUN? STREAK WILL BE LOST." | §2.3 | EDGE-01 |
| ESC confirm → dispatch `QUIT`; cancel → close, resume | §2.3 | EDGE-01 |
| Tab+Space fires focused button exactly once | §2.3 | EDGE-02 |
| `resize` listener → `setPacPos` | §2.3 | EDGE-03 |
| JSON load fail → `.error-overlay` with spec text | §2.3 | EDGE-04 |
| INSERT COIN disabled during error overlay | §2.3 | EDGE-04 |
| JSON loading >150ms → "LOADING…" text in INSERT COIN | §2.3 | EDGE-05 |
| "LOADING…" clears on fetch resolve | §2.3 | EDGE-05 |
| Already-guessed letter → ping class, flash, no state change | §2.3 | EDGE-06 |
| Repeated letter in word → all positions revealed | §2.3 | EDGE-07 |
| `@media (max-width: 480px)` present in `layout.css` | §3.7 | MOBILE-01 |
| Mobile: 6-column alphabet grid | §3.7 | MOBILE-02 |
| Mobile: ghost house at top, word in middle | §3.7 | MOBILE-03 |
| Mobile: no horizontal scroll at 375×667 | §3.7 | MOBILE-04 |
| Mobile: Pac-Man traversal disabled on mobile flag | §3.7 | MOBILE-05 |
| `#sr-announce` with `aria-live="polite"` and `aria-atomic="true"` | §8 | A11Y-01 |
| Hit announcement: letter found + position count + letters remaining | §8 | A11Y-02 |
| Miss announcement: letter not in word + lives remaining | §8 | A11Y-03 |
| Win announcement: "You win! The word was <WORD>." | §8 | A11Y-04 |
| Loss announcement: "Game over. The word was <WORD>." | §8 | A11Y-05 |
| All SVG `<use>` elements: `aria-hidden="true"` | §8 | A11Y-06 |
| Alphabet `<button>`: `aria-label="Letter X"` | §8 | A11Y-07 |
| Guessed button: `aria-pressed="true"`, `aria-disabled="true"` | §8 | A11Y-07 |
| Focus rings: `outline: 2px solid var(--pac); outline-offset: 2px` | §8 | A11Y-08 |
| Tab order Title: radios → select → INSERT COIN | §8 | A11Y-09 |
| Tab order Game: alphabet A–Z → GUESS WORD → QUIT | §8 | A11Y-09 |
| Touch targets ≥ 44×44 px (alphabet buttons, GUESS WORD, QUIT) | §8 | A11Y-10 |
| LOADING… visible during slow fetch (DevTools throttle) | §2.3 | VISUAL-01 |
| Error overlay visible on simulated failure | §2.3 | VISUAL-02 |
| Mobile layout correct at 375×667 | §3.7 | VISUAL-03 |
| Focus rings clearly visible on tab | §8 | VISUAL-04 |
| No console errors after full Phase 7 wiring | §6.4 | VISUAL-05 |

---

## 6. Check Automation

### 6.1 Shell Static Checks Script

Save as `scripts/check-phase7-static.sh`:

```bash
#!/bin/bash
set -e

REPO="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Phase 7 Static Checks ==="

echo ""
echo "--- FILE: src/audio.js exists ---"
ls "$REPO/src/audio.js" && echo "PASS: src/audio.js exists" || echo "FAIL: src/audio.js missing"

echo ""
echo "--- AUDIO: all 7 method names present in audio.js ---"
for method in chomp miss win loss ready tick bgm; do
  grep -q "$method" "$REPO/src/audio.js" \
    && echo "PASS: $method" || echo "FAIL: $method not found in audio.js"
done

echo ""
echo "--- AUDIO: no-op check — methods must have empty bodies ---"
grep -A 3 'chomp\|miss\|win\b\|loss\|ready\|tick\|bgm' "$REPO/src/audio.js"
echo "(verify: each body is '{}' or equivalent — no non-trivial statements)"

echo ""
echo "--- AUDIO: no side effects in audio.js ---"
if grep -qn 'fetch\|localStorage\|document\.\|window\.\|new Audio\|XMLHttpRequest' \
     "$REPO/src/audio.js" 2>/dev/null; then
  echo "FAIL: audio.js contains side-effecting code"
else
  echo "PASS: no side effects in audio.js"
fi

echo ""
echo "--- AUDIO: all 7 call sites present in main.js ---"
for method in chomp miss win loss ready tick bgm; do
  grep -q "audio\.$method" "$REPO/src/main.js" \
    && echo "PASS: audio.$method called in main.js" \
    || echo "FAIL: audio.$method call site missing in main.js"
done

echo ""
echo "--- EDGE: @media (max-width: 480px) present in layout.css ---"
grep -n 'max-width.*480\|480px' "$REPO/styles/layout.css" \
  && echo "PASS" || echo "FAIL: mobile media query missing in layout.css"

echo ""
echo "--- MOBILE: 6-column grid rule in mobile media query ---"
grep -A 30 'max-width.*480px' "$REPO/styles/layout.css" | grep -i 'grid\|column\|col' \
  && echo "(verify: 6-column alphabet layout present)" \
  || echo "WARN: no grid/column rule found inside @media (max-width: 480px)"

echo ""
echo "--- A11Y: aria-live present in index.html on #sr-announce ---"
grep -n 'sr-announce' "$REPO/index.html" \
  && echo "(verify: element has aria-live=\"polite\" and aria-atomic=\"true\")" \
  || echo "FAIL: #sr-announce not found in index.html"
grep -n 'aria-live\|aria-atomic' "$REPO/index.html" \
  && echo "PASS: aria attributes found" \
  || echo "FAIL: aria-live or aria-atomic missing"

echo ""
echo "--- A11Y: aria-hidden on SVG <use> elements in index.html ---"
USE_COUNT=$(grep -c '<use' "$REPO/index.html" 2>/dev/null || echo 0)
HIDDEN_COUNT=$(grep -c 'aria-hidden="true"' "$REPO/index.html" 2>/dev/null || echo 0)
echo "Found $USE_COUNT <use> elements and $HIDDEN_COUNT aria-hidden=\"true\" attributes"
[ "$HIDDEN_COUNT" -ge "$USE_COUNT" ] && [ "$USE_COUNT" -gt 0 ] \
  && echo "PASS: all <use> elements appear to have aria-hidden" \
  || echo "WARN: mismatch — verify manually with Snippet D"

echo ""
echo "--- A11Y: aria-label on alphabet buttons in render source ---"
grep -n 'aria-label' \
  "$REPO/src/render/game.js" \
  "$REPO/src/render/shared.js" 2>/dev/null \
  && echo "PASS: aria-label found in render source" \
  || echo "FAIL: aria-label not found in game.js or shared.js"

echo ""
echo "--- A11Y: aria-pressed in render source ---"
grep -n 'aria-pressed' \
  "$REPO/src/render/game.js" \
  "$REPO/src/render/shared.js" 2>/dev/null \
  && echo "PASS: aria-pressed found" \
  || echo "FAIL: aria-pressed not found in render source"

echo ""
echo "--- A11Y: focus-visible outline in CSS ---"
grep -n 'focus-visible' \
  "$REPO/styles/layout.css" \
  "$REPO/styles/screens.css" 2>/dev/null \
  && echo "PASS: :focus-visible rule found" \
  || echo "FAIL: no :focus-visible rule"

echo ""
echo "--- EDGE: resize listener registered ---"
grep -n "'resize'\|\"resize\"" \
  "$REPO/src/main.js" \
  "$REPO/src/input.js" 2>/dev/null \
  && echo "PASS: resize listener found" \
  || echo "FAIL: no resize listener in main.js or input.js"

echo ""
echo "--- EDGE: ESC quit uses native <dialog> ---"
grep -n 'dialog\|showModal' \
  "$REPO/src/input.js" \
  "$REPO/src/main.js" 2>/dev/null \
  && echo "PASS: dialog/showModal found" \
  || echo "FAIL: no native <dialog> usage found"

echo ""
echo "--- EDGE: LOADING text and setTimeout(150) in title.js ---"
grep -n 'setTimeout\|150\|LOADING' "$REPO/src/render/title.js" \
  && echo "(verify: all three present — setTimeout, 150ms value, LOADING string)" \
  || echo "FAIL: missing loading text or setTimeout in title.js"

echo ""
echo "--- EDGE: error-overlay and catch path in title.js ---"
grep -n 'error-overlay\|catch\|NETWORK ERROR' "$REPO/src/render/title.js" \
  && echo "PASS: error overlay path found" \
  || echo "FAIL: error-overlay or catch handler missing in title.js"

echo ""
echo "=== Static checks complete — run browser checks manually ==="
```

Run: `bash scripts/check-phase7-static.sh`

### 6.2 Browser Checks — Manual Checklist

```
=== File & Audio Stub ===
[ ] FILE-01   src/audio.js exists
[ ] FILE-02   All 7 method names present in audio.js
[ ] AUDIO-01  audio.chomp() exported as no-op; call site in main.js on letter hit
[ ] AUDIO-02  audio.miss() exported as no-op; call site in main.js on letter miss
[ ] AUDIO-03  audio.win() exported as no-op; call site in main.js on game win
[ ] AUDIO-04  audio.loss() exported as no-op; call site in main.js on game loss
[ ] AUDIO-05  audio.ready() exported as no-op; call site in main.js on READY! interstitial
[ ] AUDIO-06  audio.tick() exported as no-op; call site in main.js on alphabet button hover
[ ] AUDIO-07  audio.bgm(play) exported as no-op; call site in main.js on title entry/exit; no side effects in audio.js

=== Edge Cases ===
[ ] EDGE-01   ESC mid-game opens native <dialog> with correct text; confirm → QUIT; cancel → resumes
[ ] EDGE-02   Tab+Space fires focused alphabet button exactly once; no double-dispatch; no error
[ ] EDGE-03   Resize listener registered; window resize causes no JS error; setPacPos called
[ ] EDGE-04   JSON failure → .error-overlay with spec text; INSERT COIN disabled
[ ] EDGE-05   Slow fetch → "LOADING…" appears after ~150ms; reverts on resolve
[ ] EDGE-06   Already-guessed letter → ping/flash class applied; no lives or guess count change
[ ] EDGE-07   Repeated letter in word → all occurrences revealed simultaneously on hit

=== Mobile Layout ===
[ ] MOBILE-01 @media (max-width: 480px) block present in layout.css
[ ] MOBILE-02 6-column alphabet grid in mobile media query
[ ] MOBILE-03 Ghost house at top, word display in middle in mobile layout
[ ] MOBILE-04 No horizontal scroll at 375×667 (DevTools device toolbar)
[ ] MOBILE-05 Pac-Man traversal disabled at mobile width; pellet state still updates

=== Accessibility ===
[ ] A11Y-01   #sr-announce present with aria-live="polite" and aria-atomic="true"
[ ] A11Y-02   After letter hit: sr-announce contains position count and letters remaining
[ ] A11Y-03   After letter miss: sr-announce contains lives remaining
[ ] A11Y-04   On win: sr-announce text matches "You win! The word was <WORD>."
[ ] A11Y-05   On loss: sr-announce text matches "Game over. The word was <WORD>."
[ ] A11Y-06   All <use> elements carry aria-hidden="true"
[ ] A11Y-07   Alphabet buttons have aria-label="Letter X"; guessed buttons have aria-pressed="true" and aria-disabled="true"
[ ] A11Y-08   :focus-visible outline is 2px solid var(--pac); outline-offset: 2px
[ ] A11Y-09   Tab order Title: difficulty radios → category select → INSERT COIN; Game: alphabet A–Z → GUESS WORD → QUIT
[ ] A11Y-10   Touch targets ≥ 44×44 px on alphabet buttons, GUESS WORD, and QUIT (verify at 375×667)

=== Visual ===
[ ] VISUAL-01 LOADING… text visible in INSERT COIN area during Slow 3G fetch
[ ] VISUAL-02 Error overlay visible and INSERT COIN disabled on simulated JSON fetch failure
[ ] VISUAL-03 Mobile layout correct at 375×667: ghost house top, word middle, 6-col alphabet bottom
[ ] VISUAL-04 Focus rings clearly visible in --pac yellow (#FFFF00) on all tab-focused elements
[ ] VISUAL-05 No console errors after full Phase 7 session (game play, ESC quit, resize, mobile)
```

---

## 7. Exit Criteria

Phase 7 is verified when **all** of the following hold:

- `bash scripts/check-phase7-static.sh` exits without FAIL lines.
- FILE-01 through FILE-02 — `src/audio.js` exists and all 7 methods are present.
- AUDIO-01 through AUDIO-07 — all 7 methods are no-ops with zero side effects; all 7 call sites present in `main.js`.
- EDGE-01 through EDGE-07 — all edge-case behaviours verified: ESC dialog, Tab+Space discipline, resize listener, error overlay, LOADING… text, already-guessed ping, repeated-letter reveal.
- MOBILE-01 through MOBILE-05 — `@media (max-width: 480px)` block correct; 6-col grid; ghost house top / word middle; no horizontal scroll at 375×667; Pac-Man traversal disabled on mobile.
- A11Y-01 through A11Y-10 — `#sr-announce` wired with correct announcement text for hit, miss, win, and loss; all `<use>` elements aria-hidden; alphabet buttons carry correct aria attributes; focus rings match spec; tab order correct on both screens; touch targets ≥ 44×44 px.
- VISUAL-01 through VISUAL-05 — all visual checks pass.

**Total: 47 checks across 6 groups.** All 47 must be green.

Do **not** proceed to Phase 8 (Firefox/Safari cross-browser matrix, E2E acceptance pass) until all mandatory items above are checked.

---

## 8. Out of Scope (defer to later phases)

| Item | Phase |
|---|---|
| Firefox + Safari cross-browser matrix | Phase 8 |
| All 14 acceptance criteria E2E pass | Phase 8 |
| Lighthouse accessibility audit score | Phase 8 |
| Real audio implementation (non-no-op) | v2 |
| Screen reader integration testing (VoiceOver, NVDA) | Phase 8 |
| Performance profiling / paint timing | Phase 8 |

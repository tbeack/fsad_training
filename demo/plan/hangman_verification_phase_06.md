# PacHangman — Phase 6 Verification Plan

> Companion to `planning/plan/hang_implementation_plan.md` §Phase 6.
> Run these checks **after** Phase 6 is complete and before Phase 7 begins.
> Spec references: `planning/design/hangman_spec.md`.

---

## 1. Context & Scope

Phase 6 delivers all `@keyframes` animation definitions, the READY! interstitial, win strobe, and death sequence. It extends `src/render/sprites.js` (Phase 4) with full ghost emergence sequencing tied to `missCount`, and wires animation triggers into `src/main.js` after Phase 5's dispatch loop.

None of these checks can be exercised by `node --test`. Verification is a mix of static grep checks, DevTools Console snippets, and interactive browser checks.

**In scope for this verification:**
- `styles/animations.css` — all 8 `@keyframes` definitions + `prefers-reduced-motion` block
- `src/render/sprites.js` — `setGhostState(missCount)` sequencing per spec §3.5 table; `animateGhostEmerge` calls
- `src/render/game.js` — READY! interstitial on `START_GAME`; win strobe; death sequence
- `src/main.js` — non-blocking animation call sites after dispatch

**Out of scope until later phases:**
- `src/audio.js` call sites — Phase 7
- Mobile layout (≤480px) and Pac-Man traversal skip on mobile — Phase 7
- Full `aria-live` guess announcements — Phase 7
- Firefox + Safari cross-browser checks — Phase 8
- All 14 acceptance criteria E2E pass — Phase 8

---

## 2. Environment & Setup

**Dev server:** `python3 -m http.server 8000` from repo root.
**Browser:** Chrome with DevTools (F12). No Node test runner needed for Phase 6.

### 2.1 Console Snippets (reference these in §3 checks)

Paste these into the DevTools Console at `localhost:8000`.

**Snippet A — read `#app` current screen:**
```js
document.getElementById('app').dataset.screen
```

**Snippet B — check OS prefers-reduced-motion:**
```js
window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

**Snippet C — confirm `animations.css` is loaded:**
```js
[...document.styleSheets].some(ss => ss.href && ss.href.includes('animations'))
// Expected: true
```

**Snippet D — confirm a specific `@keyframes` rule is parsed:**
```js
// Replace 'pacman-death' with any keyframes name to verify it was parsed
[...document.styleSheets]
  .filter(ss => ss.href && ss.href.includes('animations'))
  .flatMap(ss => [...ss.cssRules])
  .filter(r => r instanceof CSSKeyframesRule)
  .map(r => r.name)
// Expected: array includes 'pacman-death', 'pacman-chomp', 'maze-strobe',
//           'pellet-eat', 'ghost-emerge-1', 'ghost-emerge-2',
//           'ghost-emerge-3', 'pellet-ping'
```

**Snippet E — force ghost state to N misses (manual emergence trigger):**
```js
// Call setGhostState directly if exported/accessible, e.g.:
// import { setGhostState } from './src/render/sprites.js'
// Otherwise make N wrong guesses in the running game to reach miss N.
// To inspect current ghost DOM state:
document.querySelectorAll('.ghost').length
```

**Snippet F — force win screen to trigger strobe:**
```js
// Dispatch a synthetic WIN_GAME action if accessible, then observe .maze
document.querySelector('.maze').className
```

---

## 3. Check Catalog

Check IDs follow `<MODULE>-NN`. Every entry specifies an exact bash command or JS snippet.

### 3.1 File Existence & Link Order — FILE-01 through FILE-02

---

**FILE-01 — `styles/animations.css` exists**

```bash
ls /path/to/repo/styles/animations.css
```

Run from repo root:
```bash
ls styles/animations.css
```

Expected: file listed with no "No such file or directory".

---

**FILE-02 — `animations.css` linked in `index.html` after `sprites.css`, before any Phase 7 files**

```bash
grep -n 'link.*\.css' index.html
```

Expected order (lines must appear in this sequence):
1. `reset.css`
2. `theme.css`
3. `layout.css`
4. `screens.css`
5. `maze.css`
6. `sprites.css`
7. `animations.css`

`animations.css` must appear **after** `sprites.css` and before any Phase 7+ stylesheets (e.g. `mobile.css`, `audio.css`). If `animations.css` is absent or mis-ordered, cascade overrides may silently fail.

---

### 3.2 `@keyframes` Definitions — ANIM-01 through ANIM-08

All checks run against `styles/animations.css`.

---

**ANIM-01 — `pacman-chomp` keyframes defined**

```bash
grep -n '@keyframes pacman-chomp' styles/animations.css
```

Expected: at least one match. Inspect the rule body — it must alternate `#pacman-open` / `#pacman-closed` visibility (e.g. via `display` toggle or `clip-path`). Per spec §3.3.

---

**ANIM-02 — `pacman-death` keyframes defined with 1.2s reference in `sprites.js`**

```bash
grep -n '@keyframes pacman-death' styles/animations.css
```

Expected: one match. Verify the rule animates `rotate` from `0deg` to `360deg` while `scale` shrinks to `0` (spec §3.5, §3.8). Then confirm the duration constant:

```bash
grep -n '1\.2\|1200' src/render/sprites.js src/render/game.js
```

Expected: at least one match (`1.2s` or `1200` ms) in the file that applies the death animation.

---

**ANIM-03 — `maze-strobe` keyframes defined; 80ms cycle referenced**

```bash
grep -n '@keyframes maze-strobe' styles/animations.css
```

Expected: one match. The keyframes must alternate `--maze` between blue (`#2121DE`) and white (`#FFFFFF`) per spec §3.8.

Confirm the 6×80ms budget is enforced in JS:
```bash
grep -n '80\|strobe' src/render/game.js
```

Expected: `80` (ms) appears in the strobe loop logic, and `strobe` referenced ≥ 1 time.

---

**ANIM-04 — `pellet-eat` keyframes defined with correct axis and duration**

```bash
grep -n '@keyframes pellet-eat' styles/animations.css
```

Expected: one match. Rule must animate `scaleX` from `1` to `0` (spec §3.8 "underline disappears"). Duration reference `150ms` must appear in the rule or its application site:

```bash
grep -n '150' styles/animations.css src/render/game.js
```

Expected: at least one match for `150` in these files.

---

**ANIM-05 — `ghost-emerge-1` keyframes defined**

```bash
grep -n '@keyframes ghost-emerge-1' styles/animations.css
```

Expected: one match. Rule animates Blinky from inside ghost house to maze entry (spec §3.5 miss 1, 600ms ease-in-out). Verify duration is referenced:

```bash
grep -n '600' styles/animations.css src/render/sprites.js
```

Expected: `600` appears in at least one of these files (either in the CSS `animation` shorthand or in the WAAPI call).

---

**ANIM-06 — `ghost-emerge-2` keyframes defined**

```bash
grep -n '@keyframes ghost-emerge-2' styles/animations.css
```

Expected: one match. Rule handles the advance-segment animation (Blinky at miss 2, Pinky at miss 4) — translating one maze segment toward Pac-Man.

---

**ANIM-07 — `ghost-emerge-3` keyframes defined**

```bash
grep -n '@keyframes ghost-emerge-3' styles/animations.css
```

Expected: one match. Rule handles Pinky (miss 3) and Inky (miss 5) exiting ghost house — same exit path as `ghost-emerge-1` but applied to a different ghost element.

---

**ANIM-08 — `pellet-ping` keyframes defined**

```bash
grep -n '@keyframes pellet-ping' styles/animations.css
```

Expected: one match. Rule is a short ping/flash applied to already-guessed pellets on repeat-guess attempt (spec §3.8 "Already eaten" visual ping).

---

### 3.3 Reduced Motion — REDUCEDMOTION-01 through REDUCEDMOTION-03

---

**REDUCEDMOTION-01 — `@media (prefers-reduced-motion: reduce)` block present in `animations.css`**

```bash
grep -n 'prefers-reduced-motion' styles/animations.css
```

Expected: at least one match. The media query must target `reduce` (not `no-preference`).

---

**REDUCEDMOTION-02 — Duration overrides inside the block use `!important`**

```bash
grep -A 30 'prefers-reduced-motion' styles/animations.css | grep '!important'
```

Expected: at least one `!important` on an `animation-duration` or `transition-duration` override. Per spec §3.8: all animations must be zeroed out with `!important` so WAAPI timing cannot override the CSS preference.

---

**REDUCEDMOTION-03 — `sprites.js` has early-return guard for reduced motion in WAAPI paths**

```bash
grep -n 'reducedMotion\|prefers-reduced-motion\|reduce' src/render/sprites.js
```

Expected: `reducedMotion` referenced ≥ 2 times — once per async animation function (`animateGhostEmerge` and Pac-Man traverse). Each async path must check this flag and skip or collapse the animation when true (spec §6.3 / §3.8).

---

### 3.4 READY! Interstitial — READY-01 through READY-05

All READY checks are interactive. Start a game session (INSERT COIN) and observe.

---

**READY-01 — `.ready-text` element injected into maze on `START_GAME`**

After clicking INSERT COIN, immediately inspect:
```js
document.querySelector('.ready-text')
// Expected: non-null element positioned in maze center
```

Or via DevTools Elements tab: a `.ready-text` div should appear inside `.maze` for ~1.5s then disappear.

---

**READY-02 — READY! text visible and blinks during interstitial**

Visually confirm the text "READY!" (or equivalent) appears centred in the maze and blinks for approximately 1.5s before disappearing. The blink must be driven by a CSS class (not just `display` toggling) — confirm:

```bash
grep -n 'ready\|READY\|blink' src/render/game.js
```

Expected: a class name (e.g. `'ready-text'`, `'blink'`) applied to the injected element.

---

**READY-03 — Input disabled during interstitial**

During the 1.5s READY! window, confirm keyboard guesses are silently blocked. Dispatch a letter key:

```js
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
```

Expected: no letter is guessed, no state change, no console error. The game state's `guessed` set must remain unchanged. Inspect `src/render/game.js` or `src/main.js` for the guard:

```bash
grep -n 'interstitial\|ready\|disabled\|inputEnabled\|accepting' src/main.js src/render/game.js
```

Expected: at least one guard pattern preventing dispatch while the interstitial is live.

---

**READY-04 — `.ready-text` element removed after ~1.5s**

```js
// Run immediately after INSERT COIN, then re-run after 2s
setTimeout(() => {
  const el = document.querySelector('.ready-text')
  console.log('ready-text present after 2s:', el !== null)
  // Expected: false
}, 2000)
```

---

**READY-05 — READY! interstitial fires again on level-up (PLAY AGAIN)**

Complete a game (win or lose). Click PLAY AGAIN. Confirm `.ready-text` appears again for ~1.5s before the next game begins. This verifies the interstitial is tied to `START_GAME` dispatch, not a one-shot init flag.

---

### 3.5 Ghost Emergence Sequencing — EMERGE-01 through EMERGE-06

---

**EMERGE-01 — Miss 1: Blinky exits ghost house**

Make one wrong guess. Confirm:
```js
// Blinky's ghost element should have an emergence class or inline animation
document.querySelector('#ghost-blinky, [data-ghost="blinky"]').className
```

Expected: an `emerge` or `ghost-emerge-1` animation class applied. Blinky should visibly slide down through the ghost-house door into the maze (600ms). Clyde must remain inside.

```bash
grep -n 'blinky\|ghost.*1\|miss.*1\|case 1' src/render/sprites.js
```

Expected: miss-1 branch applies emergence animation to Blinky.

---

**EMERGE-02 — Miss 2: Blinky advances one maze segment**

Make a second wrong guess. Confirm Blinky moves one segment closer to Pac-Man:
```js
document.querySelector('#ghost-blinky, [data-ghost="blinky"]').style.transform
// or check applied animation class
```

Expected: an advance animation fires on Blinky. Pinky remains inside ghost house.

```bash
grep -n 'case 2\|miss.*2\|advance\|segment' src/render/sprites.js
```

Expected: miss-2 branch triggers Blinky advance step.

---

**EMERGE-03 — Miss 3: Pinky exits ghost house**

Make a third wrong guess. Confirm:
```js
document.querySelector('#ghost-pinky, [data-ghost="pinky"]').className
```

Expected: Pinky gains an emergence class and slides out of ghost house. Blinky does not re-animate. Inky and Clyde remain inside.

```bash
grep -n 'pinky\|ghost.*3\|case 3' src/render/sprites.js
```

Expected: miss-3 branch applies ghost-emerge-1 (or equivalent exit animation) to Pinky.

---

**EMERGE-04 — Miss 4: Pinky advances toward Pac-Man**

Make a fourth wrong guess. Pinky advances one segment. Blinky does not move again.

```bash
grep -n 'case 4\|miss.*4' src/render/sprites.js
```

Expected: miss-4 branch triggers Pinky advance step.

---

**EMERGE-05 — Miss 5: Inky exits ghost house; Clyde never exits**

Make a fifth wrong guess. Confirm Inky slides out of ghost house:
```js
document.querySelector('#ghost-inky, [data-ghost="inky"]').className
```

Expected: Inky gains emergence class. Clyde remains inside ghost house for the entire game — confirm by inspecting:
```js
document.querySelector('#ghost-clyde, [data-ghost="clyde"]').className
// Expected: no emergence or advance class at any miss count
```

```bash
grep -n 'clyde' src/render/sprites.js
```

Expected: `clyde` is referenced only for initial positioning — no emergence or advance dispatch.

---

**EMERGE-06 — Miss 6: Inky reaches Pac-Man; death animation fires**

Make a sixth wrong guess. Per spec §3.5: Inky reaches Pac-Man and the death animation starts immediately.

```js
document.querySelector('use.pac, [data-sprite="pac"]').getAnimations().map(a => a.animationName)
// Expected: includes 'pacman-death'
```

Inky's final position must overlap Pac-Man. Clyde must remain in ghost house throughout.

---

### 3.6 Win Animation — WIN-01 through WIN-04

Win all letters of the current word to trigger win state.

---

**WIN-01 — `maze-strobe` class applied to `.maze` on win**

Immediately after the final correct guess:
```js
document.querySelector('.maze').className
// Expected: includes 'maze-strobe' or an equivalent class that triggers the keyframes
```

Or via WAAPI inspection:
```js
document.querySelector('.maze').getAnimations().map(a => a.animationName)
// Expected: includes 'maze-strobe'
```

---

**WIN-02 — Strobe fires exactly 6 times**

```bash
grep -n 'strobe\|6\b.*80\|80\b.*6\|repeat.*6\|iterations.*6' src/render/game.js
```

Expected: the strobe is configured with 6 iterations (WAAPI `iterations: 6` or a loop counter bounded at 6). Per spec §3.8: 6 × 80ms = 480ms total.

---

**WIN-03 — Pac-Man victory loop fires after win**

After final correct guess, confirm Pac-Man enters a victory loop animation:
```js
document.querySelector('use.pac, [data-sprite="pac"]').getAnimations()
  .filter(a => a.playState === 'running')
  .map(a => a.animationName)
// Expected: includes a victory loop animation (e.g. 'pacman-chomp' in infinite mode)
```

```bash
grep -n 'victory\|win.*anim\|chomp.*infinite\|loop' src/render/game.js
```

Expected: a win-path animation call that sets Pac-Man into a repeating chomp loop.

---

**WIN-04 — Transition to Result screen after strobe completes (~480ms)**

```js
// Start a game, win it, then check screen after ~600ms
setTimeout(() => {
  console.log('screen after win:', document.getElementById('app').dataset.screen)
  // Expected: "result"
}, 600)
```

The transition must occur **after** the strobe completes, not before. The 480ms strobe + any brief tail must elapse first.

---

### 3.7 Death Animation — DEATH-01 through DEATH-04

---

**DEATH-01 — `pacman-death` animation applied to Pac-Man sprite on miss 6**

On the sixth wrong guess:
```js
document.querySelector('use.pac, [data-sprite="pac"]').getAnimations().map(a => a.animationName)
// Expected: includes 'pacman-death'
```

```bash
grep -n 'pacman-death\|death' src/render/game.js src/render/sprites.js
```

Expected: `'pacman-death'` string present as animation name in one of these files.

---

**DEATH-02 — Death animation duration is 1.2s**

```bash
grep -n '1\.2\|1200' src/render/game.js src/render/sprites.js
```

Expected: `1.2` (seconds) or `1200` (ms) referenced in the file that fires the death animation. Per spec §3.5 and §3.8.

---

**DEATH-03 — Ghost flash on loss**

At miss 6, confirm the ghost elements flash or visually indicate Pac-Man has been caught. Inspect:
```js
[...document.querySelectorAll('.ghost, [data-ghost]')].map(g => g.className)
// Expected: a flash/pulse class applied at the moment of loss
```

```bash
grep -n 'flash\|ghost.*loss\|loss.*ghost\|frightened\|blink' src/render/game.js
```

Expected: at least one match indicating a ghost flash is triggered on loss.

---

**DEATH-04 — Transition to Result screen after 1.5s total**

```js
// Trigger miss 6, then check after 1.6s
setTimeout(() => {
  console.log('screen after death:', document.getElementById('app').dataset.screen)
  // Expected: "result"
}, 1600)
```

Per spec §3.5: transition to Result after 1.5s total (the 1.2s animation completes with a 300ms tail before the screen change).

---

### 3.8 `sprites.js` Module Purity — SPRITES-01 through SPRITES-04

---

**SPRITES-01 — No `localStorage` access in `sprites.js`**

```bash
grep -n 'localStorage' src/render/sprites.js
```

Expected: no matches. Persistence is `src/persist.js` only (spec §6.2).

---

**SPRITES-02 — No `dispatch` calls in `sprites.js`**

```bash
grep -n '\bdispatch\b' src/render/sprites.js
```

Expected: no matches. `sprites.js` is a pure render module — it must not trigger state transitions (spec §6.2).

---

**SPRITES-03 — No game logic in `sprites.js`**

```bash
grep -n 'isWin\|isLoss\|outcome\|lives\|guessLetter\|pickWord\|streak' src/render/sprites.js
```

Expected: no matches. Game rule terms must not appear in the render module.

---

**SPRITES-04 — `setGhostState` handles all 6 miss values**

```bash
grep -n 'case 1\|case 2\|case 3\|case 4\|case 5\|case 6\|=== 1\|=== 2\|=== 3\|=== 4\|=== 5\|=== 6' src/render/sprites.js
```

Expected: all six numeric branches (1–6) are present in `setGhostState`. If a `switch` is used, `case 1` through `case 6` must all appear. If an `if/else if` chain is used, all six numeric comparisons must appear. Any branch count fewer than 6 indicates an incomplete implementation.

---

### 3.9 Visual / Interactive Checks — VISUAL-01 through VISUAL-06

Close DevTools before visual checks to prevent layout distortion. Use Chrome at default viewport (≥1024px).

---

**VISUAL-01 — Pac-Man chomp animation visible during letter-hit traverse**

Make a correct guess. Pac-Man must visibly alternate between open and closed mouth as it moves toward the pellet. Confirm via DevTools Animations panel (Ctrl+Shift+P → "Animations") — `pacman-chomp` should appear running during traverse.

---

**VISUAL-02 — Ghost physically emerges from ghost house on each miss**

Make wrong guesses 1 through 5. Each miss must produce a visible ghost sliding out of or advancing along the maze. The ghost must not teleport — the 600ms ease-in-out path must be observable.

---

**VISUAL-03 — Death rotation visible on miss 6**

On the sixth miss, Pac-Man must visibly rotate and collapse over ~1.2s before the screen transitions to Result. The animation must not be instant (unless reduced-motion is on).

---

**VISUAL-04 — Win strobe visible before Result screen**

Win the game. The maze walls must flash blue↔white at least twice visibly before the Result screen appears. The flash must not be imperceptible.

---

**VISUAL-05 — Zero console errors during full game session**

Play a complete game (start → several hits → several misses → end). The DevTools Console must show zero red errors throughout. Yellow warnings about deprecated APIs are acceptable.

---

**VISUAL-06 — No horizontal scroll at any point during game**

At default viewport width, confirm at game screen:
```js
document.documentElement.scrollWidth > document.documentElement.clientWidth
// Expected: false
```

Check at Title, Game (mid-game), and Result screens.

---

## 4. Shell Static Checks

Save as `scripts/check-phase6-static.sh` (see §6.1 for the runnable script). Run from repo root after Phase 6 files are written. Each command should produce the expected output; any deviation is a failure.

```bash
# 1. animations.css exists
ls styles/animations.css
# Expected: file listed

# 2. animations.css linked in index.html
grep 'animations\.css' index.html
# Expected: one match containing the link tag

# 3. All 8 @keyframes rule names present
for kf in pacman-chomp pacman-death maze-strobe pellet-eat \
           ghost-emerge-1 ghost-emerge-2 ghost-emerge-3 pellet-ping; do
  grep -q "@keyframes $kf" styles/animations.css \
    && echo "PASS: @keyframes $kf" \
    || echo "FAIL: @keyframes $kf missing"
done

# 4. prefers-reduced-motion media query present
grep -q 'prefers-reduced-motion' styles/animations.css \
  && echo "PASS: reduced-motion query present" \
  || echo "FAIL: reduced-motion query missing"

# 5. !important in reduced-motion block
grep -A 20 'prefers-reduced-motion' styles/animations.css | grep -q '!important' \
  && echo "PASS: !important override present" \
  || echo "FAIL: !important missing from reduced-motion block"

# 6. reducedMotion referenced ≥ 2 times in sprites.js
COUNT=$(grep -c 'reducedMotion\|prefers-reduced-motion' src/render/sprites.js)
[ "$COUNT" -ge 2 ] \
  && echo "PASS: reducedMotion referenced $COUNT times in sprites.js" \
  || echo "FAIL: reducedMotion referenced only $COUNT time(s) in sprites.js (expected ≥ 2)"

# 7. sprites.js has no localStorage / dispatch / game logic
if grep -qn 'localStorage\|dispatch\|isWin\|isLoss\|outcome\|streak' src/render/sprites.js; then
  echo "FAIL: sprites.js contains forbidden terms (localStorage/dispatch/game logic)"
else
  echo "PASS: sprites.js is free of storage, dispatch, and game logic"
fi

# 8. setGhostState handles all 6 miss values
for n in 1 2 3 4 5 6; do
  grep -q "case $n\|=== $n" src/render/sprites.js \
    && echo "PASS: miss $n branch present" \
    || echo "FAIL: miss $n branch missing in setGhostState"
done

# 9. 600ms ghost emerge duration referenced in sprites.js or animations.css
grep -qE '\b600\b' src/render/sprites.js styles/animations.css \
  && echo "PASS: 600ms emerge duration referenced" \
  || echo "FAIL: 600ms emerge duration not found"

# 10. 300ms pac traverse duration referenced in sprites.js or game.js
grep -qE '\b300\b' src/render/sprites.js src/render/game.js \
  && echo "PASS: 300ms traverse duration referenced" \
  || echo "FAIL: 300ms traverse duration not found"
```

---

## 5. Spec → Check Coverage Matrix

Every Phase 6 spec rule maps to at least one check ID.

| Spec Rule | Section | Check IDs |
|---|---|---|
| `animations.css` exists and is linked after `sprites.css` | §6.1 | FILE-01, FILE-02 |
| `@keyframes pacman-chomp` alternates open/closed | §3.3 | ANIM-01, VISUAL-01 |
| `@keyframes pacman-death` rotates 0°→360°, scale 1→0, 1.2s | §3.5, §3.8 | ANIM-02, DEATH-01, DEATH-02 |
| `@keyframes maze-strobe` blue↔white, 6×80ms | §3.8 | ANIM-03, WIN-01, WIN-02 |
| `@keyframes pellet-eat` scaleX 1→0, 150ms | §3.8 | ANIM-04 |
| `@keyframes ghost-emerge-1` Blinky/Pinky/Inky exit path, 600ms ease-in-out | §3.5 | ANIM-05, EMERGE-01, EMERGE-03, EMERGE-05 |
| `@keyframes ghost-emerge-2` advance one maze segment | §3.5 | ANIM-06, EMERGE-02, EMERGE-04 |
| `@keyframes ghost-emerge-3` alternate exit path | §3.5 | ANIM-07 |
| `@keyframes pellet-ping` already-eaten visual ping | §3.8 | ANIM-08 |
| `prefers-reduced-motion: reduce` zeroes all durations with `!important` | §3.8, §8 | REDUCEDMOTION-01, REDUCEDMOTION-02 |
| WAAPI paths in `sprites.js` early-return under reduced motion | §6.3, §3.8 | REDUCEDMOTION-03 |
| Miss 1: Blinky exits ghost house (600ms ease-in-out) | §3.5 | EMERGE-01 |
| Miss 2: Blinky advances one maze segment | §3.5 | EMERGE-02 |
| Miss 3: Pinky exits ghost house | §3.5 | EMERGE-03 |
| Miss 4: Pinky advances toward Pac-Man | §3.5 | EMERGE-04 |
| Miss 5: Inky exits ghost house | §3.5 | EMERGE-05 |
| Miss 6: Inky reaches Pac-Man → death animation; Clyde never exits | §3.5 | EMERGE-05, EMERGE-06, DEATH-01 |
| READY! blinks 1.5s in maze centre on `START_GAME` | §3.8, §6.4 | READY-01, READY-02, READY-04 |
| Input disabled during READY! interstitial | §3.8 | READY-03 |
| READY! fires again on level-up | §3.8 | READY-05 |
| Pac-Man traverse: home→pellet 300ms → chomp×2 150ms → return 300ms | §3.7 | ANIM-01, VISUAL-01 |
| Win: maze-strobe on `.maze`, 6 flashes, then Result | §3.8 | WIN-01, WIN-02, WIN-04 |
| Win: Pac-Man victory loop | §3.8 | WIN-03 |
| Loss: `pacman-death` on Pac-Man sprite, 1.2s, Result after 1.5s | §3.5, §3.8 | DEATH-01, DEATH-02, DEATH-04 |
| Ghost flash on loss | §3.8 | DEATH-03 |
| Positions driven by `--pac-x`, `--pac-y` CSS custom properties | §6.3 | static check #9, VISUAL-02 |
| `sprites.js` is pure render — no `localStorage`, no `dispatch` | §6.2 | SPRITES-01, SPRITES-02, SPRITES-03 |
| `setGhostState` handles all 6 miss values | §3.5 | SPRITES-04 |
| Zero console errors during play | general | VISUAL-05 |
| No horizontal scroll | §1 goals | VISUAL-06 |

---

## 6. Check Automation

### 6.1 Shell Static Checks Script

Save this as `scripts/check-phase6-static.sh` and run with `bash scripts/check-phase6-static.sh` from repo root.

```bash
#!/bin/bash
set -e

echo "=== Phase 6 Static Checks ==="

echo ""
echo "--- FILE: animations.css exists ---"
ls styles/animations.css && echo "PASS: styles/animations.css exists"

echo ""
echo "--- FILE: animations.css linked in index.html ---"
if grep -q 'animations\.css' index.html; then
  echo "PASS: animations.css link tag found in index.html"
  grep -n 'animations\.css' index.html
else
  echo "FAIL: animations.css not linked in index.html"
fi

echo ""
echo "--- ANIM: all 8 @keyframes rules present ---"
for kf in pacman-chomp pacman-death maze-strobe pellet-eat \
           ghost-emerge-1 ghost-emerge-2 ghost-emerge-3 pellet-ping; do
  if grep -q "@keyframes $kf" styles/animations.css; then
    echo "PASS: @keyframes $kf"
  else
    echo "FAIL: @keyframes $kf missing"
  fi
done

echo ""
echo "--- REDUCEDMOTION: prefers-reduced-motion block present ---"
if grep -q 'prefers-reduced-motion' styles/animations.css; then
  echo "PASS: prefers-reduced-motion media query present"
else
  echo "FAIL: prefers-reduced-motion missing from animations.css"
fi

echo ""
echo "--- REDUCEDMOTION: !important in reduced-motion block ---"
if grep -A 30 'prefers-reduced-motion' styles/animations.css | grep -q '!important'; then
  echo "PASS: !important override present in reduced-motion block"
else
  echo "FAIL: !important missing — reduced-motion cannot override WAAPI without it"
fi

echo ""
echo "--- REDUCEDMOTION: reducedMotion guard in sprites.js (expect ≥ 2) ---"
COUNT=$(grep -c 'reducedMotion\|prefers-reduced-motion' src/render/sprites.js 2>/dev/null || echo 0)
if [ "$COUNT" -ge 2 ]; then
  echo "PASS: reducedMotion referenced $COUNT time(s) in sprites.js"
else
  echo "FAIL: reducedMotion referenced only $COUNT time(s) in sprites.js (expected ≥ 2)"
fi

echo ""
echo "--- SPRITES: purity checks (no localStorage / dispatch / game logic) ---"
if grep -qn 'localStorage\|\bdispatch\b\|isWin\|isLoss\|outcome\|\bstreak\b\|pickWord' src/render/sprites.js 2>/dev/null; then
  echo "FAIL: sprites.js contains forbidden terms:"
  grep -n 'localStorage\|\bdispatch\b\|isWin\|isLoss\|outcome\|\bstreak\b\|pickWord' src/render/sprites.js
else
  echo "PASS: sprites.js free of localStorage, dispatch, and game logic"
fi

echo ""
echo "--- SPRITES: setGhostState handles all 6 miss values ---"
for n in 1 2 3 4 5 6; do
  if grep -qE "case $n[^0-9]|=== $n[^0-9]" src/render/sprites.js 2>/dev/null; then
    echo "PASS: miss $n branch present in sprites.js"
  else
    echo "FAIL: miss $n branch missing from setGhostState"
  fi
done

echo ""
echo "--- TIMING: 600ms ghost emerge duration referenced ---"
if grep -qE '\b600\b' src/render/sprites.js styles/animations.css 2>/dev/null; then
  echo "PASS: 600ms emerge duration found"
else
  echo "FAIL: 600ms emerge duration not referenced in sprites.js or animations.css"
fi

echo ""
echo "--- TIMING: 300ms pac traverse duration referenced ---"
if grep -qE '\b300\b' src/render/sprites.js src/render/game.js 2>/dev/null; then
  echo "PASS: 300ms traverse duration found"
else
  echo "FAIL: 300ms traverse duration not referenced in sprites.js or game.js"
fi

echo ""
echo "=== Static checks complete — run browser checks in §6.2 ==="
```

Run: `bash scripts/check-phase6-static.sh`

### 6.2 Browser Checks — Manual Checklist

```
=== File & CSS ===
[ ] FILE-01    styles/animations.css exists
[ ] FILE-02    animations.css linked in index.html after sprites.css, before Phase 7 files

=== @keyframes ===
[ ] ANIM-01    @keyframes pacman-chomp defined; alternates open/closed
[ ] ANIM-02    @keyframes pacman-death defined; 1.2s duration referenced in apply site
[ ] ANIM-03    @keyframes maze-strobe defined; 80ms cycle referenced in game.js
[ ] ANIM-04    @keyframes pellet-eat defined; scaleX 1→0, 150ms
[ ] ANIM-05    @keyframes ghost-emerge-1 defined; 600ms ease-in-out
[ ] ANIM-06    @keyframes ghost-emerge-2 defined (advance segment)
[ ] ANIM-07    @keyframes ghost-emerge-3 defined (alternate exit path)
[ ] ANIM-08    @keyframes pellet-ping defined

=== Reduced Motion ===
[ ] REDUCEDMOTION-01  prefers-reduced-motion block present in animations.css
[ ] REDUCEDMOTION-02  !important on duration overrides in reduced-motion block
[ ] REDUCEDMOTION-03  reducedMotion early-return guard in sprites.js WAAPI paths (≥ 2 references)

=== READY! Interstitial ===
[ ] READY-01   .ready-text injected into maze on START_GAME
[ ] READY-02   READY! text visible and blinks during interstitial (~1.5s)
[ ] READY-03   Input silently blocked during interstitial (letter key → no state change)
[ ] READY-04   .ready-text element removed after ~1.5s
[ ] READY-05   READY! interstitial fires again on PLAY AGAIN (level-up)

=== Ghost Emergence ===
[ ] EMERGE-01  Miss 1: Blinky exits ghost house (600ms, visible slide)
[ ] EMERGE-02  Miss 2: Blinky advances one maze segment
[ ] EMERGE-03  Miss 3: Pinky exits ghost house; Blinky does not re-animate
[ ] EMERGE-04  Miss 4: Pinky advances toward Pac-Man
[ ] EMERGE-05  Miss 5: Inky exits ghost house; Clyde remains inside
[ ] EMERGE-06  Miss 6: Inky reaches Pac-Man; death animation fires; Clyde still inside

=== Win Animation ===
[ ] WIN-01     maze-strobe applied to .maze element on win
[ ] WIN-02     Strobe fires exactly 6 times (iterations: 6, 80ms each)
[ ] WIN-03     Pac-Man victory loop fires after win
[ ] WIN-04     Transition to Result screen after ~480ms strobe completes

=== Death Animation ===
[ ] DEATH-01   pacman-death applied to Pac-Man sprite on miss 6
[ ] DEATH-02   Death animation duration is 1.2s
[ ] DEATH-03   Ghost flash/pulse on loss
[ ] DEATH-04   Transition to Result screen after ~1.5s total

=== sprites.js Purity ===
[ ] SPRITES-01 No localStorage in sprites.js
[ ] SPRITES-02 No dispatch calls in sprites.js
[ ] SPRITES-03 No game logic (isWin/isLoss/outcome/streak) in sprites.js
[ ] SPRITES-04 setGhostState handles all 6 miss values (cases 1–6)

=== Visual ===
[ ] VISUAL-01  Pac-Man chomp animation visible during hit traverse
[ ] VISUAL-02  Ghost physically emerges/advances on each miss (not instant)
[ ] VISUAL-03  Death rotation visible on miss 6 (not instant unless reduced-motion)
[ ] VISUAL-04  Win strobe visible before Result screen appears
[ ] VISUAL-05  Zero console errors during a full game session
[ ] VISUAL-06  No horizontal scroll at Title, Game, or Result screen
```

---

## 7. Exit Criteria

Phase 6 is verified when **all** of the following hold:

- [ ] `bash scripts/check-phase6-static.sh` exits with zero FAIL lines.
- [ ] FILE-01, FILE-02 — `animations.css` exists and is linked in correct position.
- [ ] ANIM-01 through ANIM-08 — all 8 `@keyframes` rules defined with correct properties.
- [ ] REDUCEDMOTION-01 through REDUCEDMOTION-03 — reduced-motion block with `!important`; WAAPI early-return guard in `sprites.js`.
- [ ] READY-01 through READY-05 — interstitial injects, blinks, blocks input, removes itself, and fires again on level-up.
- [ ] EMERGE-01 through EMERGE-06 — all six miss events trigger the correct ghost and animation; Clyde never exits.
- [ ] WIN-01 through WIN-04 — strobe fires 6×80ms on `.maze`, Pac-Man victory loop runs, Result screen appears after strobe.
- [ ] DEATH-01 through DEATH-04 — death animation at 1.2s, ghost flash, Result screen after 1.5s.
- [ ] SPRITES-01 through SPRITES-04 — `sprites.js` is pure; `setGhostState` covers all 6 miss values.
- [ ] VISUAL-01 through VISUAL-06 — all visual checks pass.
- [ ] Shell static checks (§4) return no FAIL lines.

**Total: 42 checks across 9 groups.** All 42 must be green.

Do **not** proceed to Phase 7 (audio, mobile layout, full a11y) until all mandatory items above are checked.

---

## 8. Out of Scope (defer to later phases)

| Item | Phase |
|---|---|
| `src/audio.js` call sites (`audio.ready()`, `audio.eat()`, `audio.miss()`, `audio.win()`, `audio.death()`) | Phase 7 |
| Mobile layout (≤480px) — compact maze view, Pac-Man traversal skip | Phase 7 |
| Full `aria-live` guess announcements and `aria-pressed` on alphabet pellets | Phase 7 |
| `prefers-reduced-motion` on mobile traversal skip (distinct from CSS media query) | Phase 7 |
| Firefox + Safari cross-browser animation matrix | Phase 8 |
| All 14 acceptance criteria E2E pass | Phase 8 |
| Power-pellet hint system (frightened-ghost mode) | Future |

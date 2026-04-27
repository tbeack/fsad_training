# PacHangman — Phase 3 Verification Plan

> Companion to `planning/plan/hang_implementation_plan.md` §Phase 3.
> Run these checks **after** Phase 3 is complete and before Phase 4 begins.
> Spec references: `planning/design/hangman_spec.md`.

---

## 1. Context & Scope

Phase 3 delivers the CSS theme system, Title and Result screen renderers, boot sequence wiring, and input event listeners — all DOM-dependent. Unlike Phase 1, nothing in this phase can be exercised by `node --test`; verification is a mix of static grep checks, DevTools Console snippets, and visual/interactive browser checks.

**In scope for this verification:**
- `styles/reset.css` — box-sizing, margin/padding zero, button reset
- `styles/theme.css` — all 14 CSS custom properties + typography rules
- `styles/layout.css` — viewport, flex column, `data-screen` visibility rules, `.sr-only`
- `styles/screens.css` — Title + Result layout, CTA button styles
- `src/render/shared.js` — `renderHUD(state, container)`: 1UP score, HIGH SCORE, CATEGORY, LEVEL
- `src/render/title.js` — difficulty radios, category select, INSERT COIN button, streak display, lazy fetch
- `src/render/result.js` — outcome banner, full word reveal, streak update, PLAY AGAIN / CHANGE CATEGORY / QUIT
- `src/main.js` — boot sequence, `dispatch` loop, `render()` screen router
- `src/input.js` — `keydown` (A–Z, Enter, Space, ESC) + click delegation wired to `dispatch`

**Out of scope until later phases:**
- Maze walls, ghost house, sprite sheet — Phase 4
- Alphabet pellet rendering, word display — Phase 5
- `@keyframes` animations — Phase 6
- Audio stub, mobile layout, full a11y — Phase 7
- Firefox/Safari matrix, E2E acceptance pass — Phase 8

---

## 2. Environment & Setup

**Dev server:** `python3 -m http.server 8000` from repo root.
**Browser:** Chrome with DevTools (F12). No Node test runner needed for Phase 3.

### 2.1 Console Snippets (reference these in §3 checks)

Paste these into the DevTools Console at `localhost:8000`.

**Snippet A — read `#app` current screen:**
```js
document.getElementById('app').dataset.screen
```

**Snippet B — read a computed CSS custom property:**
```js
// Replace --bg with any variable name
getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
```

**Snippet C — force a screen for Result-screen checks:**
```js
document.getElementById('app').setAttribute('data-screen', 'result')
```

**Snippet D — seed localStorage with a known persisted state:**
```js
localStorage.setItem('pachangman_v1', JSON.stringify({
  streak: 7, bestStreak: 10, highScore: 420,
  recentWords: [], settings: { soundEnabled: false, reducedMotion: false }
}))
```

**Snippet E — clear the seed:**
```js
localStorage.removeItem('pachangman_v1')
```

---

## 3. Check Catalog

Check IDs follow `<MODULE>-NN`. Phase 3 has no Node unit tests; each entry specifies an exact procedure.

### 3.1 Static CSS Checks — STYLE-01 through STYLE-07

---

**STYLE-01 — All 9 Phase 3 files exist**

```bash
ls styles/reset.css styles/theme.css styles/layout.css styles/screens.css \
   src/render/shared.js src/render/title.js src/render/result.js \
   src/main.js src/input.js
```

Expected: all 9 files listed, no "No such file or directory".

---

**STYLE-02 — All 14 palette variables defined in `theme.css` with correct hex values**

```bash
grep -E '^\s*--' styles/theme.css
```

Every one of the following must appear verbatim (order does not matter):

| Variable | Required value |
|---|---|
| `--bg` | `#000000` |
| `--maze` | `#2121DE` |
| `--pac` | `#FFFF00` |
| `--dot` | `#FFB8AE` |
| `--ghost-blinky` | `#FF0000` |
| `--ghost-pinky` | `#FFB8DE` |
| `--ghost-inky` | `#00FFDE` |
| `--ghost-clyde` | `#FFB847` |
| `--text` | `#FFFFFF` |
| `--text-dim` | `#555555` |
| `--hit` | `#00FF66` |
| `--miss` | `#FF0044` |
| `--hud` | `#FFB8AE` |
| `--font` | `'Press Start 2P', monospace` |

Quick count check:
```bash
grep -c '^\s*--' styles/theme.css
```
Expected: ≥ 14.

---

**STYLE-03 — Typography rules present in `theme.css`**

```bash
grep -n 'text-transform\|font-size\|letter-spacing\|font-family' styles/theme.css
```

Expected:
- `font-family: var(--font)` (or equivalent) applied globally or on `body`
- `text-transform: uppercase` on a top-level selector
- Font-size rules covering at least 24px (word letters), 12px (HUD labels), 10px (fine chrome)

---

**STYLE-04 — `data-screen` visibility selectors in `layout.css`**

```bash
grep -n 'data-screen' styles/layout.css
```

Expected — all four rules must be present:
1. `.screen` → `display: none` (hides all screens by default)
2. `[data-screen="title"] .screen--title` → `display: block` or `flex`
3. `[data-screen="game"] .screen--game` → `display: block` or `flex`
4. `[data-screen="result"] .screen--result` → `display: block` or `flex`

If any of the three `data-screen` attribute selectors is missing the screen-switching logic will fail silently.

---

**STYLE-05 — `.sr-only` visually-hidden class in `layout.css`**

```bash
grep -A 8 'sr-only' styles/layout.css
```

Expected: a rule with at minimum `position: absolute`, `width: 1px`, `height: 1px`, and a clip/overflow approach. Must **not** use `display: none` (that also hides the element from screen readers).

Acceptable pattern:
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
}
```

---

**STYLE-06 — Stylesheets linked in `index.html` in correct order**

```bash
grep -n 'link.*\.css' index.html
```

Required order:
1. `reset.css`
2. `theme.css`
3. `layout.css`
4. `screens.css`

Stylesheets belonging to later phases (`maze.css`, `sprites.css`, `game.css`, `animations.css`) must **not** appear yet.

---

**STYLE-07 — Render modules do not access `localStorage` or `window.location`**

```bash
grep -n 'localStorage\|window\.location' \
  src/render/title.js src/render/result.js src/render/shared.js
```

Expected: no matches. Persistence belongs in `src/persist.js` only.

---

### 3.2 Boot Sequence — BOOT-01 through BOOT-04

Open `localhost:8000` in Chrome. F12 → Console. Run each snippet after the page finishes loading.

---

**BOOT-01 — Page loads with zero console errors**

Load `http://localhost:8000`. Inspect the Console tab.

Expected:
- Zero red error entries (TypeError, ReferenceError, SyntaxError, Failed to load resource).
- Zero unhandled promise rejections.
- Font CDN preconnect/CORS notices are acceptable.
- `localStorage` key-not-found fallback messages are acceptable.

Failure: any single red error = Phase 3 not complete.

---

**BOOT-02 — `#app` initialises on title screen**

```js
document.getElementById('app').dataset.screen
// Expected: "title"
```

---

**BOOT-03 — Persisted state loaded and reflected in Title**

1. Run Snippet D (seed localStorage with streak 7, highScore 420).
2. Reload the page.
3. Confirm the Title screen displays streak `7` and high score `420`. Exact label text may vary; the numbers must match the seed.
4. Run Snippet E (clean up).

---

**BOOT-04 — `prefers-reduced-motion` detected**

```js
window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

Note the value. Verify `src/main.js` passes this into `state.settings.reducedMotion` (read the source if direct inspection isn't possible). This value gates Phase 6 animation skips — it only needs to be wired here, not exercised yet.

---

### 3.3 Title Screen — TITLE-01 through TITLE-07

All checks run on the Title screen at `localhost:8000`.

---

**TITLE-01 — Three difficulty radio inputs rendered**

```js
document.querySelectorAll('input[type="radio"][name="difficulty"]').length
// Expected: 3
```

Check each value:
```js
[...document.querySelectorAll('input[type="radio"][name="difficulty"]')].map(r => r.value)
// Expected: includes "easy", "normal", "hard" (order may vary)
```

---

**TITLE-02 — Normal difficulty selected by default**

```js
document.querySelector('input[type="radio"][name="difficulty"]:checked').value
// Expected: "normal"
```

---

**TITLE-03 — Category `<select>` renders with three options**

```js
document.querySelector('select').options.length
// Expected: 3
```

Check option values match categories:
```js
[...document.querySelector('select').options].map(o => o.value)
// Expected: ["arcade", "scitech", "movies"] or equivalent slugs
```

---

**TITLE-04 — INSERT COIN button present and enabled**

```js
const btn = [...document.querySelectorAll('button')]
  .find(b => b.textContent.toUpperCase().includes('INSERT'));
btn !== undefined && !btn.disabled
// Expected: true
```

---

**TITLE-05 — Streak and high score values displayed**

Visually confirm the Title screen shows:
- Current streak value (0 on fresh session)
- High score value (0 on fresh session)

After running Snippet D + reload (BOOT-03): confirm streak shows `7` and high score shows `420`.

---

**TITLE-06 — Category change triggers `fetch` for word JSON**

1. Open DevTools → Network tab. Clear request log.
2. Change the category `<select>` to a different option.
3. Confirm a request to `./words/<category>.json` appears in the Network tab.

Expected: at least one fetch per category change. The request may succeed (200) or fail (404 if words not built) — either is acceptable; the point is the fetch is fired.

---

**TITLE-07 — INSERT COIN transitions `#app` to game screen**

Ensure a category JSON has loaded (wait for TITLE-06 fetch to complete). Click INSERT COIN.

```js
document.getElementById('app').dataset.screen
// Expected: "game"
```

Also verify the Title section is no longer visible and the Game section is display:block (may be empty — maze scaffold is Phase 4).

---

### 3.4 Result Screen — RESULT-01 through RESULT-05

Phase 3 provides the Result shell. Force the screen via DevTools since the full game loop is Phase 5.

**Setup for all RESULT checks:**
```js
document.getElementById('app').setAttribute('data-screen', 'result')
```

---

**RESULT-01 — Result section becomes visible on `data-screen="result"`**

```js
getComputedStyle(document.querySelector('.screen--result')).display
// Expected: not "none" — should be "block" or "flex"
```

---

**RESULT-02 — Outcome banner conditional present in source**

Open `src/render/result.js`. Confirm the render function contains conditional logic for `outcome === 'win'` vs `outcome === 'loss'`, producing different banner text (e.g. "YOU WIN" vs "GAME OVER"). Both branches must be present.

---

**RESULT-03 — Full word slot present in result render**

Inspect the DOM after forcing result screen:
```js
document.querySelector('.screen--result').innerHTML
```

Confirm there is a DOM element (or placeholder) for the revealed word. A full game loop test (Phase 5) will verify the actual word text.

---

**RESULT-04 — Three CTAs present**

```js
const btns = [...document.querySelector('.screen--result').querySelectorAll('button')];
btns.map(b => b.textContent.toUpperCase())
// Expected: array contains "PLAY AGAIN", "CHANGE CATEGORY", "QUIT" (exact wording may vary)
```

All three must be present.

---

**RESULT-05 — QUIT button dispatches back to title screen**

With result screen visible, click the QUIT button.

```js
document.getElementById('app').dataset.screen
// Expected: "title"
```

---

### 3.5 HUD Rendering — HUD-01 through HUD-04

`renderHUD` is called on both Title and Game screens. Check on Title screen.

---

**HUD-01 — 1UP score label present**

```js
document.querySelector('.screen--title').textContent.toUpperCase().includes('1UP')
// Expected: true
```

---

**HUD-02 — HIGH SCORE label present**

```js
document.querySelector('.screen--title').textContent.toUpperCase().includes('HIGH SCORE') ||
document.querySelector('.screen--title').textContent.toUpperCase().includes('HIGHSCORE')
// Expected: true
```

---

**HUD-03 — CATEGORY label present**

Visually confirm the selected category name (e.g. "ARCADE") appears in the HUD area of the Title screen. If not on the Title HUD, verify it appears on the Game screen HUD by inspecting `src/render/shared.js`.

---

**HUD-04 — LEVEL label present**

Confirm a level counter (starts at 0 or 1 per implementation) is rendered in the HUD. Visually or:
```js
document.querySelector('.screen--title').textContent.toUpperCase().includes('LEVEL')
// Expected: true
```

---

### 3.6 Input Wiring — INPUT-01 through INPUT-05

These checks confirm no uncaught errors are thrown by event handlers. Full dispatch behaviour is Phase 5.

---

**INPUT-01 — A–Z `keydown` dispatched without error**

On the Title screen:
```js
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
```

Expected: zero errors in the Console. On Title screen the handler may be a no-op — that is correct.

---

**INPUT-02 — ESC `keydown` without error**

```js
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
```

Expected: no uncaught error. Full quit dialog is Phase 5.

---

**INPUT-03 — Enter `keydown` without error**

```js
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
```

Expected: no uncaught error. Word-guess modal is Phase 5.

---

**INPUT-04 — Space fires focused button, not double-dispatched**

Focus INSERT COIN button:
```js
document.querySelector('button').focus()
```

Dispatch Space:
```js
document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
```

Expected: button action fires once; no double-fire; no error.

---

**INPUT-05 — Click on game screen does not error**

After INSERT COIN (data-screen="game"):
```js
document.querySelector('.screen--game').dispatchEvent(new MouseEvent('click', { bubbles: true }))
```

Expected: no uncaught error. Alphabet pellet delegation handler must be registered but may be a no-op for now.

---

### 3.7 Visual Checks — VISUAL-01 through VISUAL-08

Eyeball checks — close DevTools so layout is not distorted. Use Chrome at default viewport (≥ 1024px wide).

---

**VISUAL-01 — Background is arcade black**

Page background is solid `#000000`. No white, grey, or off-black canvas visible.

Confirm via Snippet B:
```js
getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
// Expected: "#000000"
```

---

**VISUAL-02 — Press Start 2P font renders**

All text appears in the pixelated arcade font, not browser-default sans-serif. Confirm via DevTools Elements → select a text node → Computed tab → `font-family` shows `"Press Start 2P"`.

---

**VISUAL-03 — All text is uppercase**

Scan the Title screen. No lowercase text visible anywhere — game title, labels, button text, values, all uppercase.

---

**VISUAL-04 — Title screen is structured and legible**

Title screen shows (in some reasonable order):
- Game title / brand name
- Difficulty controls (Easy | Normal | Hard)
- Category selector (Arcade | Sci-Tech | Movies)
- INSERT COIN button
- Streak and high score values

No raw HTML tags or `[object Object]` visible. No elements overlapping in a broken way.

---

**VISUAL-05 — Game screen section is visible (not blank page) after INSERT COIN**

After clicking INSERT COIN: the page shows the game screen section. It will be nearly empty (maze is Phase 4) — that is expected. The section should not be `display:none`, there should be no white flash, and there should be no error banner or broken layout.

---

**VISUAL-06 — Result screen renders without overflow**

Force `data-screen="result"` via Snippet C. Confirm the result screen:
- Shows outcome area and three CTA buttons.
- No horizontal scroll.
- No text clipped or missing.

---

**VISUAL-07 — Focus rings visible on tab navigation**

On the Title screen, press Tab. Each focused element shows a visible outline. Confirm it is `2px solid var(--pac)` (yellow `#FFFF00`) and is never hidden.

```js
getComputedStyle(document.querySelector(':focus-visible')).outlineColor
// Expected: "rgb(255, 255, 0)" (#FFFF00)
```

---

**VISUAL-08 — No horizontal scroll**

At default viewport:
```js
document.documentElement.scrollWidth > document.documentElement.clientWidth
// Expected: false
```

---

## 4. Shell Static Checks

Run after Phase 3 files are written. Each command should produce the expected output; any deviation is a failure.

```bash
# 1. Pure render modules must not touch storage or routing
grep -n 'localStorage\|window\.location' \
  src/render/title.js src/render/result.js src/render/shared.js
# Expected: no matches

# 2. input.js must contain no game logic
grep -n 'lives\|outcome\|guessLetter\|isWin\|isLoss' src/input.js
# Expected: no matches

# 3. dispatch must be exported or globally accessible from main.js
grep -n 'export.*dispatch\|window\.dispatch\|globalThis\.dispatch' src/main.js
# Expected: at least one match

# 4. maze/sprites/game/animation stylesheets must NOT be linked yet
grep -n 'maze\.css\|sprites\.css\|game\.css\|animations\.css' index.html
# Expected: no matches

# 5. layout.css and screens.css must use CSS variables, not hard-coded hex
grep -nE '#[0-9a-fA-F]{3,6}' styles/layout.css styles/screens.css
# Expected: zero or only incidental matches (e.g. comments); no raw palette colours
```

---

## 5. Spec → Check Coverage Matrix

Every spec rule that Phase 3 modules implement maps to at least one check ID.

| Spec Rule | Section | Check IDs |
|---|---|---|
| Three screens — title, game, result | §2.1 | STYLE-04, BOOT-02, TITLE-07, RESULT-01 |
| Title: difficulty radios + default Normal | §2.1, §2.2 | TITLE-01, TITLE-02 |
| Title: category select (3 options) | §2.1, §2.2 | TITLE-03 |
| Title: INSERT COIN button enabled | §2.1, §2.2 | TITLE-04 |
| Title: streak + high score display | §2.1, §4.3 | TITLE-05, BOOT-03 |
| Lazy category fetch on `<select>` change | §2.2, §6.4 | TITLE-06 |
| INSERT COIN → `data-screen="game"` | §2.2, §6.4 | TITLE-07 |
| `data-screen` attribute drives visibility | §6.3 | STYLE-04, BOOT-02 |
| All 14 CSS custom properties, exact hex | §3.1 | STYLE-02 |
| Typography — Press Start 2P, sizes, uppercase | §3.2 | STYLE-03, VISUAL-02, VISUAL-03 |
| `body` background `--bg` `#000000` | §3.1 | VISUAL-01 |
| HUD row: 1UP, HIGH SCORE, CATEGORY, LEVEL | §3.4 | HUD-01, HUD-02, HUD-03, HUD-04 |
| `.sr-only` visually-hidden (not display:none) | §8 | STYLE-05 |
| Result: outcome banner (win / loss) | §2.1 | RESULT-02 |
| Result: full word revealed | §2.1 | RESULT-03 |
| Result: PLAY AGAIN / CHANGE CATEGORY / QUIT | §2.1, §2.2 | RESULT-04 |
| QUIT → returns to Title | §2.2 | RESULT-05 |
| Boot: `persist.load()` on startup | §6.4 | BOOT-03 |
| Boot: `prefers-reduced-motion` detected | §6.4, §8 | BOOT-04 |
| Boot: Title renders immediately, no errors | §6.4 | BOOT-01, VISUAL-04 |
| `dispatch(action) → reduce → render → save` | §6.4 | BOOT-01, TITLE-07 |
| Keyboard: A–Z, Enter, Space, ESC wired | §2.2, §8 | INPUT-01, INPUT-02, INPUT-03, INPUT-04 |
| Click delegation on game screen | §3.7 | INPUT-05 |
| Focus rings — `2px solid var(--pac)` | §8 | VISUAL-07 |
| Stylesheets in correct link order | §6.1 | STYLE-06 |
| Render modules must not access storage | §6.2 | STYLE-07, static check #1 |
| No hard-coded hex in layout/screens | §3.1 | static check #5 |
| No horizontal scroll | §1 goals | VISUAL-08 |
| No console errors on page load | §6.4 | BOOT-01 |

---

## 6. Check Automation

### 6.1 Shell Static Checks Script

Bundle §4 checks into `scripts/check-phase3-static.sh`:

```bash
#!/bin/bash
set -e

echo "=== Phase 3 Static Checks ==="

echo "--- File existence ---"
ls styles/reset.css styles/theme.css styles/layout.css styles/screens.css \
   src/render/shared.js src/render/title.js src/render/result.js \
   src/main.js src/input.js
echo "PASS: all 9 files exist"

echo "--- Stylesheet link order in index.html ---"
grep -n 'link.*\.css' index.html
echo "(verify: reset → theme → layout → screens; no maze/sprites/game/animations yet)"

echo "--- CSS custom property count (theme.css) ---"
COUNT=$(grep -c '^\s*--' styles/theme.css)
echo "Found $COUNT variables (expected: ≥ 14)"
[ "$COUNT" -ge 14 ] && echo "PASS" || echo "FAIL: fewer than 14 CSS variables"

echo "--- data-screen selectors (layout.css) ---"
grep 'data-screen' styles/layout.css
echo "(verify: title, game, result selectors all present)"

echo "--- .sr-only class (layout.css) ---"
grep -A 8 'sr-only' styles/layout.css
echo "(verify: position:absolute + clip/overflow, NOT display:none)"

echo "--- Render module purity ---"
if grep -qn 'localStorage\|window\.location' src/render/title.js src/render/result.js src/render/shared.js 2>/dev/null; then
  echo "FAIL: render module accesses storage or location"
else
  echo "PASS: no storage/location access in render modules"
fi

echo "--- input.js has no game logic ---"
if grep -qn 'lives\|outcome\|guessLetter\|isWin\|isLoss' src/input.js 2>/dev/null; then
  echo "WARN: input.js contains game rule logic"
else
  echo "PASS"
fi

echo "--- dispatch exported from main.js ---"
grep -n 'export.*dispatch\|window\.dispatch\|globalThis\.dispatch' src/main.js \
  && echo "PASS" || echo "WARN: dispatch may not be exported/accessible"

echo "--- Late-phase stylesheets absent from index.html ---"
if grep -qn 'maze\.css\|sprites\.css\|game\.css\|animations\.css' index.html 2>/dev/null; then
  echo "WARN: Phase 4+ stylesheet already linked — may cause errors"
else
  echo "PASS: no premature stylesheet links"
fi

echo "=== Static checks complete — run browser checks manually ==="
```

Run: `bash scripts/check-phase3-static.sh`

### 6.2 Browser Checks — Manual Checklist

```
=== Boot ===
[ ] BOOT-01   No console errors on page load
[ ] BOOT-02   #app data-screen === "title" on load
[ ] BOOT-03   Persisted streak/score loads on reload (Snippet D seed → reload → verify)
[ ] BOOT-04   prefers-reduced-motion value accessible

=== Title Screen ===
[ ] TITLE-01  3 difficulty radio inputs present
[ ] TITLE-02  Normal difficulty selected by default
[ ] TITLE-03  Category select has 3 options
[ ] TITLE-04  INSERT COIN button present and enabled
[ ] TITLE-05  Streak and high score values displayed
[ ] TITLE-06  Category change triggers fetch (Network tab)
[ ] TITLE-07  INSERT COIN → data-screen="game"

=== Result Screen ===
[ ] RESULT-01 .screen--result visible when data-screen="result"
[ ] RESULT-02 Outcome banner conditional in result.js source (win vs loss)
[ ] RESULT-03 Full word slot present in rendered HTML
[ ] RESULT-04 PLAY AGAIN, CHANGE CATEGORY, QUIT buttons present
[ ] RESULT-05 QUIT returns to data-screen="title"

=== HUD ===
[ ] HUD-01    1UP label present
[ ] HUD-02    HIGH SCORE label present
[ ] HUD-03    CATEGORY label present
[ ] HUD-04    LEVEL label present

=== Input Wiring ===
[ ] INPUT-01  A–Z keydown → no console error
[ ] INPUT-02  ESC keydown → no console error
[ ] INPUT-03  Enter keydown → no console error
[ ] INPUT-04  Space fires focused button once
[ ] INPUT-05  Click on game screen → no console error

=== Visual ===
[ ] VISUAL-01 Black background (#000000)
[ ] VISUAL-02 Press Start 2P font renders (not fallback)
[ ] VISUAL-03 All text uppercase
[ ] VISUAL-04 Title screen structured and legible
[ ] VISUAL-05 Game screen section visible (empty) after INSERT COIN
[ ] VISUAL-06 Result screen renders without overflow
[ ] VISUAL-07 Tab focus rings visible in --pac yellow
[ ] VISUAL-08 No horizontal scroll
```

---

## 7. Exit Criteria

Phase 3 is verified when **all** of the following hold:

- [ ] `bash scripts/check-phase3-static.sh` exits without file-not-found errors or FAIL lines.
- [ ] All 14 CSS custom properties present in `theme.css` with correct hex values (STYLE-02).
- [ ] All three `data-screen` visibility selectors present in `layout.css` (STYLE-04).
- [ ] BOOT-01 — zero console errors on page load.
- [ ] BOOT-02 — `#app` starts on `"title"`.
- [ ] BOOT-03 — persisted streak/score reflected in Title on reload.
- [ ] TITLE-01 through TITLE-07 — all title screen checks pass.
- [ ] RESULT-01 through RESULT-05 — result screen checks pass.
- [ ] HUD-01 through HUD-04 — all HUD fields present.
- [ ] INPUT-01 through INPUT-05 — no uncaught errors from input events.
- [ ] VISUAL-01 through VISUAL-08 — all visual checks pass.
- [ ] Shell static checks (§4) return no unexpected matches.

**Total: 40 checks across 7 groups.** All 40 must be green.

Do **not** proceed to Phase 4 (Maze + sprite sheet) until all mandatory items above are checked.

---

## 8. Out of Scope (defer to later phases)

| Item | Phase |
|---|---|
| Maze walls, ghost house, corridor layout | Phase 4 |
| SVG sprite sheet symbols, Pac-Man, ghost sprites | Phase 4 |
| `src/render/maze.js`, `src/render/sprites.js` | Phase 4 |
| Alphabet pellet rendering + all pellet states | Phase 5 |
| Word display (letter slots + underlines) | Phase 5 |
| Full keyboard + click game loop (dispatch wired to game) | Phase 5 |
| `@keyframes` animations (chomp, death, strobe, emerge, pellet-eat) | Phase 6 |
| READY! interstitial, win strobe, death animation | Phase 6 |
| Audio stub call sites | Phase 7 |
| Mobile layout (≤ 480px), Pac-Man traversal skip | Phase 7 |
| Full a11y (`aria-live` announcements, `aria-pressed`) | Phase 7 |
| Firefox + Safari cross-browser checks | Phase 8 |
| All 14 acceptance criteria E2E pass | Phase 8 |

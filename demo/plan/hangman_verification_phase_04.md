# PacHangman — Phase 4 Verification Plan

> Companion to `planning/plan/hang_implementation_plan.md` §Phase 4.
> Run these checks **after** Phase 4 is complete and before Phase 5 begins.
> Spec references: `planning/design/hangman_spec.md` §3.3 (sprites), §3.4 (layout), §3.5 (ghost house).

---

## 1. Context & Scope

Phase 4 delivers the arcade maze, SVG sprite sheet, ghost house structure, and the four Pac-Man/ghost sprite instances — everything visual on the Game screen except the interactive word display and alphabet pellets. After Phase 4 the Game screen shows a complete visual frame: maze walls, ghost house with all four ghosts inside, the pink door, Pac-Man at home, and placeholder divs for the word area and alphabet rows.

**In scope for this verification:**
- `assets/sprites.svg` — source file for the 7 `<symbol>` definitions
- `<svg id="sprites">` in `index.html` — symbols inlined for runtime access
- `styles/maze.css` — maze outer border, wall divs, ghost house, corridor layout, Pac-Man home position
- `styles/sprites.css` — `<use>` sizing, ghost `currentColor` overrides, Pac-Man colour, chomp toggle structure
- `src/render/maze.js` — injects maze scaffold HTML once on game screen mount (wrapper, ghost house, ghost slots, Pac-Man, word-area div, pellet-row placeholder divs)
- `src/render/sprites.js` — `setPacPos`, `setGhostState`, `animatePacTraverse`, `animateGhostEmerge`

**Out of scope until later phases:**
- 26 alphabet pellet `<button>` elements, word display letter slots — Phase 5
- `@keyframes` chomp, death, strobe, emerge, pellet-eat — Phase 6
- Ghost emergence triggered by actual `GUESS_LETTER` misses — Phases 5–6
- Audio, mobile layout, full a11y — Phase 7
- Firefox/Safari matrix, E2E acceptance pass — Phase 8

---

## 2. Environment & Setup

**Dev server:** `python3 -m http.server 8000` from repo root.
**Browser:** Chrome with DevTools (F12).
**Static checks:** bash grep/ls from repo root.

To mount the game screen: select a category on the Title screen, wait for the word JSON fetch to complete (Network tab shows 200), then click INSERT COIN.

### 2.1 Console Snippets (reference in §3 checks)

Paste into DevTools Console at `localhost:8000`.

**Snippet A — confirm game screen is active:**
```js
document.getElementById('app').dataset.screen
// Expected: "game"
```

**Snippet B — verify all 7 SVG symbol IDs are reachable at runtime:**
```js
['pacman-open','pacman-closed','ghost','ghost-frightened','pellet','power-pellet','ghost-door']
  .map(id => ({ id, found: !!document.getElementById(id) }))
// Expected: all entries have found: true
```

**Snippet C — inspect full maze DOM structure in one call:**
```js
({
  maze:       !!document.querySelector('.screen--game .maze'),
  ghostHouse: !!document.querySelector('.maze .ghost-house'),
  door:       !!(document.querySelector('.ghost-house__door') ||
                 document.querySelector('.ghost-house use[href="#ghost-door"]')),
  wordArea:   !!document.querySelector('.maze .word-area'),
  pelletRows: document.querySelectorAll('.maze .pellet-row').length,
  pac:        !!document.querySelector('use.pac'),
  ghosts:     document.querySelectorAll('.ghost-house use.ghost').length
})
// Expected: { maze:true, ghostHouse:true, door:true, wordArea:true, pelletRows:2, pac:true, ghosts:4 }
```

**Snippet D — confirm all four ghost colour classes are applied:**
```js
['ghost--blinky','ghost--pinky','ghost--inky','ghost--clyde']
  .every(cls => !!document.querySelector('.' + cls))
// Expected: true
```

**Snippet E — read Pac-Man's computed colour (should be yellow):**
```js
getComputedStyle(document.querySelector('use.pac')).color
// Expected: "rgb(255, 255, 0)"  (#FFFF00 = --pac)
```

---

## 3. Check Catalog

Check IDs follow `<MODULE>-NN`. All DOM/visual checks require the game screen to be mounted (INSERT COIN clicked). Static/grep checks can run from the shell at any time.

---

### 3.1 File Existence — FILE-01 through FILE-03

---

**FILE-01 — All 5 Phase 4 source files exist**

```bash
ls assets/sprites.svg styles/maze.css styles/sprites.css \
   src/render/maze.js src/render/sprites.js
```

Expected: all 5 listed, no "No such file or directory".

---

**FILE-02 — `maze.css` and `sprites.css` linked in `index.html` after Phase 3 stylesheets**

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

`game.css` and `animations.css` must **not** appear (Phase 5/6).

---

**FILE-03 — All 7 SVG symbols inlined in `index.html`**

```bash
grep -c '<symbol id=' index.html
```

Expected: `7`. The inlined count takes precedence over `assets/sprites.svg` at runtime — if symbols are only in the external file and not inlined, `<use href="#id">` will fail silently in most browsers.

---

### 3.2 SVG Symbol Checks — SVG-01 through SVG-07

One check per symbol. All checks target the `<svg id="sprites">` block in `index.html`. Cross-reference against `assets/sprites.svg` if the inline block is generated from it.

---

**SVG-01 — `#pacman-open` — 16×16 viewBox, mouth-open arc (not a full circle)**

```bash
grep -A 6 'id="pacman-open"' index.html
```

Expected:
- `viewBox="0 0 16 16"`
- A `<path>` using an SVG arc command (`A`) — confirms a partial arc, not a full `<circle>`
- Fill is `var(--pac)`, `#FFFF00`, or `currentColor` driven by CSS

---

**SVG-02 — `#pacman-closed` — 16×16 viewBox, full circle**

```bash
grep -A 5 'id="pacman-closed"' index.html
```

Expected:
- `viewBox="0 0 16 16"`
- A `<circle>` element with `r="8"` (or equivalent) — **not** a partial arc
- Same fill colour as `#pacman-open`

---

**SVG-03 — `#ghost` — 16×16 viewBox, `currentColor` body, two eyes**

```bash
grep -A 8 'id="ghost"' index.html
```

Expected:
- `viewBox="0 0 16 16"`
- Body shape (path or rect) uses `fill="currentColor"` — this is the hook that lets CSS `color:` override each ghost's colour
- Two eye shapes present (`<circle>` or `<ellipse>` elements)

---

**SVG-04 — `#ghost-frightened` — 16×16 viewBox, blue body, white rectangular eyes**

```bash
grep -A 8 'id="ghost-frightened"' index.html
```

Expected:
- `viewBox="0 0 16 16"`
- Body fill is a hard-coded blue — `#2121DE`, `var(--frightened)`, or similar; **not** `currentColor` (frightened ghosts are always blue regardless of ghost identity)
- Eye shapes are rectangular (`<rect>`) with white or light fill

---

**SVG-05 — `#pellet` — viewBox 0 0 8 8, small circle r=2 at cx=4 cy=4**

```bash
grep -A 4 'id="pellet"' index.html
```

Expected:
- `viewBox="0 0 8 8"` (spec §3.3 exact value — non-square is intentional)
- `<circle r="2" cx="4" cy="4"` (exact spec values)

---

**SVG-06 — `#power-pellet` — viewBox 0 0 14 14, larger circle r=5 at cx=7 cy=7**

```bash
grep -A 4 'id="power-pellet"' index.html
```

Expected:
- `viewBox="0 0 14 14"` (spec §3.3 exact value)
- `<circle r="5" cx="7" cy="7"` (exact spec values)

---

**SVG-07 — `#ghost-door` — viewBox 0 0 16 4, horizontal bar in `--ghost-pinky`**

```bash
grep -A 5 'id="ghost-door"' index.html
```

Expected:
- `viewBox="0 0 16 4"` (wide, short — this viewBox ratio is what makes it a bar)
- A `<rect>` spanning most or all of the 16-wide viewBox
- Fill is `var(--ghost-pinky)` or `#FFB8DE`

---

### 3.3 `maze.css` Rules — MAZECSS-01 through MAZECSS-06

---

**MAZECSS-01 — `.maze` outer border, positioning, and radius**

```bash
grep -A 6 '\.maze[^-]' styles/maze.css
```

Expected:
- `position: relative` (required for absolute-positioned children: ghost house, Pac-Man)
- `border: 4px solid var(--maze)` (spec §3.4 exact values)
- `border-radius: 4px`

---

**MAZECSS-02 — `.maze-wall` inner corridor divs**

```bash
grep -A 4 '\.maze-wall' styles/maze.css
```

Expected:
- `border: 2px solid var(--maze)`
- `border-radius: 4px`

---

**MAZECSS-03 — `.ghost-house` positioned in upper-centre**

```bash
grep -A 8 '\.ghost-house[^_\-]' styles/maze.css
```

Expected: centering rules (e.g. `margin: 0 auto`, flex centering on parent, or `position: absolute` with `left: 50%` + negative margin/transform), blue wall border matching the maze wall colour, and placement toward the top of the maze playfield.

---

**MAZECSS-04 — Ghost house door slot**

```bash
grep -A 5 '\.ghost-house__door\|ghost-door' styles/maze.css
```

Expected: a rule for the door element — typically `position: absolute` at the bottom centre of the ghost house, sized to accept the `#ghost-door` `<use>` element (16px wide × 4px tall matching the viewBox aspect ratio).

---

**MAZECSS-05 — Pac-Man home position (bottom-left of maze)**

```bash
grep -n 'bottom.*16\|left.*16\|pac.*home\|home.*pac' styles/maze.css
```

Expected: a rule placing the Pac-Man element at `bottom: 16px; left: 16px` with `position: absolute` inside the maze. Per spec §3.4 ASCII diagram, Pac-Man starts bottom-left.

---

**MAZECSS-06 — No hard-coded hex colours (CSS variables only)**

```bash
grep -nE '#[0-9a-fA-F]{3,6}' styles/maze.css
```

Expected: zero matches outside of comments. All colour values must use CSS custom properties (`var(--maze)`, `var(--pac)`, etc.) so the theme system works correctly.

---

### 3.4 `sprites.css` Rules — SPRITECSS-01 through SPRITECSS-05

---

**SPRITECSS-01 — `use.pac` sized and coloured yellow**

```bash
grep -A 4 'use\.pac\b\|\.pac\b' styles/sprites.css
```

Expected:
- `width: 16px; height: 16px`
- `color: var(--pac)` — this drives `currentColor` inside `#pacman-open`/`#pacman-closed` → yellow

---

**SPRITECSS-02 — `use.ghost` base size**

```bash
grep -A 3 'use\.ghost\b' styles/sprites.css
```

Expected: `width: 16px; height: 16px`

---

**SPRITECSS-03 — All four ghost colour classes defined**

```bash
grep -n 'ghost--blinky\|ghost--pinky\|ghost--inky\|ghost--clyde' styles/sprites.css
```

Expected: all four present, each with a `color:` rule using the correct variable:

| Class | Required rule |
|---|---|
| `.ghost--blinky` | `color: var(--ghost-blinky)` |
| `.ghost--pinky` | `color: var(--ghost-pinky)` |
| `.ghost--inky` | `color: var(--ghost-inky)` |
| `.ghost--clyde` | `color: var(--ghost-clyde)` |

The `color` property on the wrapping `<use>` propagates into the symbol as `currentColor`, so a single `#ghost` symbol yields four distinct colour instances.

---

**SPRITECSS-04 — Pac-Man chomp toggle structure established**

```bash
grep -n 'chomp\|pacman-open\|pacman-closed\|display.*none\|animation.*chomp' styles/sprites.css
```

Expected: a CSS rule or hook that sets up the alternating display mechanism between `#pacman-open` and `#pacman-closed` — e.g. a `.chomping` class or an `animation` property referencing `pacman-chomp`. The `@keyframes pacman-chomp` definition itself lives in `animations.css` (Phase 6); the selector and property referencing it belong here in Phase 4.

---

**SPRITECSS-05 — No hard-coded hex colours**

```bash
grep -nE '#[0-9a-fA-F]{3,6}' styles/sprites.css
```

Expected: zero matches outside of comments. All colours via CSS custom properties.

---

### 3.5 Maze DOM Structure (Browser) — DOM-01 through DOM-07

**Setup:** On Title screen, select a category, wait for the word JSON fetch to complete, then click INSERT COIN. Confirm `document.getElementById('app').dataset.screen === 'game'` before running these checks.

---

**DOM-01 — `.maze` wrapper injected into game screen**

```js
!!document.querySelector('.screen--game .maze')
// Expected: true
```

If this returns `false`, `renderMaze()` was not called or targeted the wrong container.

---

**DOM-02 — `.ghost-house` present inside maze**

```js
!!document.querySelector('.maze .ghost-house')
// Expected: true
```

---

**DOM-03 — Ghost house door element present**

```js
!!(document.querySelector('.ghost-house__door') ||
   document.querySelector('.ghost-house use[href="#ghost-door"]'))
// Expected: true
```

Either a wrapper `<div class="ghost-house__door">` containing a `<use>` element, or a `<use href="#ghost-door">` directly inside the ghost house, is acceptable.

---

**DOM-04 — All four ghost `<use>` elements inside ghost house with correct colour classes**

```js
document.querySelectorAll('.ghost-house use.ghost').length
// Expected: 4
```

```js
['ghost--blinky','ghost--pinky','ghost--inky','ghost--clyde']
  .every(cls => !!document.querySelector('.' + cls))
// Expected: true
```

All four ghosts start inside the house at page load. None should be positioned outside it at miss=0.

---

**DOM-05 — Pac-Man `<use>` present and references a Pac-Man symbol**

```js
!!document.querySelector('use.pac')
// Expected: true
```

```js
document.querySelector('use.pac').getAttribute('href')
// Expected: "#pacman-open" or "#pacman-closed"
```

---

**DOM-06 — `.word-area` placeholder div present inside maze**

```js
!!document.querySelector('.maze .word-area')
// Expected: true (may be empty — letter slots are Phase 5)
```

---

**DOM-07 — Two `.pellet-row` placeholder divs present**

```js
document.querySelectorAll('.maze .pellet-row').length
// Expected: 2  (row 1: A–M, row 2: N–Z; buttons are Phase 5)
```

---

### 3.6 `sprites.js` API — SPRITEJS-01 through SPRITEJS-08

ES module isolation prevents direct console calls to these functions. Verify via source inspection (bash) plus observable DOM effects.

---

**SPRITEJS-01 — All four functions exported**

```bash
grep -n '^export function\|^export async function' src/render/sprites.js
```

Expected: 4 lines, one each for `setPacPos`, `setGhostState`, `animatePacTraverse`, `animateGhostEmerge`.

---

**SPRITEJS-02 — `setPacPos` drives CSS custom properties, not inline `left`/`top`**

```bash
grep -n 'pac-x\|pac-y\|setProperty' src/render/sprites.js
```

Expected: `--pac-x` and `--pac-y` both appear, set via `element.style.setProperty(...)`. Per spec §6.3: Pac-Man position is driven by CSS custom properties (`transform: translate(var(--pac-x), var(--pac-y))`), not by mutating `style.left` / `style.top` directly.

---

**SPRITEJS-03 — `animatePacTraverse` uses Web Animations API**

```bash
grep -n '\.animate(' src/render/sprites.js
```

Expected: `.animate(` appears inside `animatePacTraverse`. Per spec §6.3 and §3.7: the 300ms-per-leg traverse is a sequenced animation, which requires WAAPI (`element.animate([...], { duration: 300 })`), not a CSS class swap.

---

**SPRITEJS-04 — `animateGhostEmerge` uses WAAPI with 600ms**

```bash
grep -n '600\|\.animate(' src/render/sprites.js
```

Expected: `.animate(` call with `duration: 600` inside `animateGhostEmerge`. Per spec §3.5: ghost emerge is 600ms ease-in-out.

Also verify `easing`:
```bash
grep -n 'ease-in-out' src/render/sprites.js
```

Expected: at least one reference matching the spec §3.5 timing function.

---

**SPRITEJS-05 — Both async functions have a `reducedMotion` fast path**

```bash
grep -n 'reducedMotion' src/render/sprites.js
```

Expected: `reducedMotion` referenced at least **twice** — once in each async function — with an early-return path or instant-state change when `true`. Per spec §3.8: all animations must be skippable. The fast path should resolve the returned promise immediately without calling `.animate(`.

---

**SPRITEJS-06 — `setGhostState(missCount)` matches spec §3.5 table; Clyde never exits**

```bash
grep -n 'missCount\|miss\|blinky\|pinky\|inky\|clyde' src/render/sprites.js
```

Confirm the source contains branching logic for all 6 miss values. Trace the branches against spec §3.5:

| Miss | Expected action |
|---|---|
| 1 | Blinky exits ghost house (emerge animation trigger) |
| 2 | Blinky advances one maze segment toward Pac-Man |
| 3 | Pinky exits ghost house |
| 4 | Pinky advances toward Pac-Man |
| 5 | Inky exits ghost house |
| 6 | Inky reaches Pac-Man (death sequence — Phase 6 drives the animation) |
| Clyde | No emerge case; stays in house throughout v1 |

```bash
grep -in 'clyde' src/render/sprites.js
```

Expected: either absent (Clyde is ignored because it never exits) or present with a comment confirming it is a no-op in v1. A case that does nothing is correct; a missing case is also acceptable only if 0–6 are handled without referencing Clyde.

---

**SPRITEJS-07 — `sprites.js` is a pure render module**

```bash
grep -n 'localStorage\|lives\|outcome\|guessLetter\|isWin\|isLoss\|dispatch' src/render/sprites.js
```

Expected: no matches. Animation functions produce DOM side-effects only; they must not contain game rule logic, read game state directly from storage, or call `dispatch`.

---

**SPRITEJS-08 — `renderMaze` guarded against re-injection on every render cycle**

Open `src/render/maze.js` and `src/main.js`. Confirm `renderMaze()` (or equivalent) is called only once per game screen mount — not on every `dispatch` cycle — otherwise live DOM (ghost positions, Pac-Man mid-traverse) would be wiped on each guess.

```bash
grep -n 'mounted\|once\|querySelector.*maze\|\.maze' src/render/maze.js src/main.js
```

Expected: an early-exit guard, e.g. `if (container.querySelector('.maze')) return;` inside `renderMaze`, or a module-level boolean flag that prevents re-injection.

---

### 3.7 Visual Browser Checks — VISUAL-01 through VISUAL-08

Eyeball checks at ≥ 1024px viewport with DevTools closed so layout is unaffected. Navigate to game screen first.

---

**VISUAL-01 — Maze visible with blue walls**

The Game screen shows a bordered rectangular maze playfield with `--maze` blue (`#2121DE`) outer walls. The border is clearly visible and corners are rounded.

---

**VISUAL-02 — Ghost house visible in upper-centre of maze**

A secondary bordered box (the ghost house) is centred horizontally in the upper portion of the maze, inset from the outer walls.

---

**VISUAL-03 — Pink ghost-door bar across ghost house opening**

A pink horizontal bar (the `#ghost-door` SVG) is visible at the bottom edge of the ghost house, closing the door opening. Colour should visually match `--ghost-pinky` (`#FFB8DE`).

---

**VISUAL-04 — All four ghost sprites inside ghost house with correct colours**

Four ghost icons are visible inside the ghost house at game screen load (miss = 0):
- Blinky: red (`#FF0000`)
- Pinky: pink (`#FFB8DE`)
- Inky: cyan (`#00FFDE`)
- Clyde: orange (`#FFB847`)

No ghost appears outside the house at this point.

---

**VISUAL-05 — Pac-Man sprite visible at bottom-left of maze in yellow**

A yellow (`#FFFF00`) Pac-Man icon sits at the bottom-left corner of the maze. Confirm via Snippet E that `getComputedStyle(use.pac).color` returns `rgb(255, 255, 0)`.

---

**VISUAL-06 — No console errors after game screen mount**

After navigating to game screen, the DevTools Console shows:
- Zero red errors (TypeError, ReferenceError, SyntaxError, Failed to load resource)
- Zero unhandled promise rejections

---

**VISUAL-07 — Sprite `<use>` elements carry `aria-hidden="true"`**

```js
document.querySelectorAll('use[aria-hidden="true"]').length
// Expected: ≥ 5 (Pac-Man + 4 ghosts + ghost-door; possibly more)
```

Per spec §8: SVG sprite instances are decorative. Screen readers must not announce them.

---

**VISUAL-08 — No horizontal scroll on game screen**

```js
document.documentElement.scrollWidth > document.documentElement.clientWidth
// Expected: false
```

---

## 4. Shell Static Checks

Save as `scripts/check-phase4-static.sh` and run from repo root.

```bash
#!/bin/bash
set -e
echo "=== Phase 4 Static Checks ==="

echo "--- File existence ---"
ls assets/sprites.svg styles/maze.css styles/sprites.css \
   src/render/maze.js src/render/sprites.js
echo "PASS: all 5 files exist"

echo "--- Stylesheet link order ---"
grep -n 'link.*\.css' index.html
echo "(verify: reset→theme→layout→screens→maze→sprites; no game.css/animations.css yet)"

echo "--- SVG symbol count in index.html ---"
COUNT=$(grep -c '<symbol id=' index.html)
echo "Inline symbol count: $COUNT (expected: 7)"
[ "$COUNT" -eq 7 ] && echo "PASS" || echo "FAIL: expected exactly 7 <symbol> elements"

echo "--- All 7 required symbol IDs present ---"
for id in pacman-open pacman-closed ghost ghost-frightened pellet power-pellet ghost-door; do
  grep -q "id=\"$id\"" index.html \
    && echo "PASS: #$id" \
    || echo "FAIL: #$id missing"
done

echo "--- currentColor in ghost symbol (colour override hook) ---"
grep -q 'currentColor' index.html \
  && echo "PASS: currentColor found" \
  || echo "FAIL: no currentColor — ghost colour override broken"

echo "--- Pellet viewBox (0 0 8 8) ---"
grep -q 'viewBox="0 0 8 8"' index.html \
  && echo "PASS" || echo "FAIL: pellet viewBox incorrect"

echo "--- Ghost-door viewBox (0 0 16 4) ---"
grep -q 'viewBox="0 0 16 4"' index.html \
  && echo "PASS" || echo "FAIL: ghost-door viewBox incorrect"

echo "--- No raw hex in maze.css ---"
if grep -qE '#[0-9a-fA-F]{3,6}' styles/maze.css 2>/dev/null; then
  echo "WARN: raw hex in maze.css — use CSS custom properties"
else
  echo "PASS"
fi

echo "--- No raw hex in sprites.css ---"
if grep -qE '#[0-9a-fA-F]{3,6}' styles/sprites.css 2>/dev/null; then
  echo "WARN: raw hex in sprites.css — use CSS custom properties"
else
  echo "PASS"
fi

echo "--- All 4 ghost colour classes in sprites.css ---"
for cls in ghost--blinky ghost--pinky ghost--inky ghost--clyde; do
  grep -q "$cls" styles/sprites.css \
    && echo "PASS: .$cls" \
    || echo "FAIL: .$cls missing"
done

echo "--- sprites.js: all 4 functions exported ---"
COUNT=$(grep -c '^export.*function' src/render/sprites.js)
echo "Exported functions: $COUNT (expected: ≥ 4)"
[ "$COUNT" -ge 4 ] && echo "PASS" || echo "FAIL"

echo "--- sprites.js: WAAPI .animate() calls (expect ≥ 2) ---"
COUNT=$(grep -c '\.animate(' src/render/sprites.js)
echo ".animate( count: $COUNT (expected: ≥ 2)"
[ "$COUNT" -ge 2 ] && echo "PASS" || echo "FAIL: WAAPI not used"

echo "--- sprites.js: reducedMotion handled (expect ≥ 2 refs) ---"
COUNT=$(grep -c 'reducedMotion' src/render/sprites.js)
echo "reducedMotion refs: $COUNT (expected: ≥ 2)"
[ "$COUNT" -ge 2 ] && echo "PASS" || echo "WARN: may not handle both async functions"

echo "--- sprites.js: no storage/dispatch/game-logic access ---"
if grep -qn 'localStorage\|lives\|outcome\|dispatch' src/render/sprites.js 2>/dev/null; then
  echo "FAIL: sprites.js contains storage or logic access"
else
  echo "PASS"
fi

echo "--- setPacPos uses --pac-x and --pac-y custom properties ---"
grep -q 'pac-x\|pac-y' src/render/sprites.js \
  && echo "PASS" || echo "FAIL: position not driven by CSS custom properties"

echo "--- game.css / animations.css absent from index.html ---"
if grep -qn 'game\.css\|animations\.css' index.html 2>/dev/null; then
  echo "WARN: Phase 5/6 stylesheet linked prematurely"
else
  echo "PASS"
fi

echo "=== Static checks done — run browser checks manually ==="
```

Run: `bash scripts/check-phase4-static.sh`

---

## 5. Spec → Check Coverage Matrix

| Spec Rule | Section | Check IDs |
|---|---|---|
| 7 SVG symbols defined and inlined | §3.3 | FILE-03, SVG-01 through SVG-07 |
| `#pacman-open`: 16×16, 240° arc | §3.3 | SVG-01 |
| `#pacman-closed`: 16×16, full circle | §3.3 | SVG-02 |
| `#ghost`: 16×16, `currentColor` body, two eyes | §3.3 | SVG-03, shell check (currentColor) |
| `#ghost-frightened`: blue body, white rectangular eyes | §3.3 | SVG-04 |
| `#pellet`: viewBox 0 0 8 8, r=2 cx=4 cy=4 | §3.3 | SVG-05, shell check (viewBox) |
| `#power-pellet`: viewBox 0 0 14 14, r=5 cx=7 cy=7 | §3.3 | SVG-06 |
| `#ghost-door`: viewBox 0 0 16 4, horizontal bar, `--ghost-pinky` | §3.3 | SVG-07, shell check (viewBox) |
| `.maze` outer border 4px `--maze`, border-radius 4px | §3.4 | MAZECSS-01, VISUAL-01 |
| `.maze-wall` inner border 2px `--maze`, border-radius 4px | §3.4 | MAZECSS-02 |
| Ghost house centred, upper maze, blue walls | §3.4, §3.5 | MAZECSS-03, VISUAL-02 |
| Ghost house door pink horizontal bar | §3.5 | MAZECSS-04, SVG-07, VISUAL-03 |
| Pac-Man home: bottom-left, `position:absolute` | §3.4 | MAZECSS-05, VISUAL-05 |
| All colours via CSS custom properties | §3.1 | MAZECSS-06, SPRITECSS-05 |
| `use.pac`: 16×16, `color: var(--pac)` → yellow | §3.3 | SPRITECSS-01, VISUAL-05 |
| `use.ghost`: 16×16 | §3.3 | SPRITECSS-02 |
| Four ghost colour classes with correct `--ghost-*` vars | §3.3 | SPRITECSS-03, VISUAL-04 |
| Pac-Man chomp toggle mechanism in sprites.css | §3.3 | SPRITECSS-04 |
| `.maze` injected into game screen DOM | §3.4, §6.3 | DOM-01 |
| `.ghost-house` inside maze | §3.5 | DOM-02, VISUAL-02 |
| Ghost house door element present | §3.5 | DOM-03, VISUAL-03 |
| 4 ghost `<use>` elements in ghost house, all colour classes | §3.5 | DOM-04, VISUAL-04 |
| Pac-Man `<use>` referencing correct symbol at home | §3.4 | DOM-05, VISUAL-05 |
| `.word-area` placeholder present in maze | §3.6 | DOM-06 |
| Two `.pellet-row` placeholder divs present | §3.7 | DOM-07 |
| `setPacPos` drives `--pac-x`/`--pac-y` CSS props | §6.3 | SPRITEJS-02, shell check |
| `animatePacTraverse` uses WAAPI, 300ms per leg | §3.7, §3.8 | SPRITEJS-03, shell check |
| `animateGhostEmerge` uses WAAPI, 600ms ease-in-out | §3.5 | SPRITEJS-04, shell check |
| Both async functions skip animations if `reducedMotion` | §3.8 | SPRITEJS-05 |
| `setGhostState` maps miss 0–6 per §3.5 table | §3.5 | SPRITEJS-06 |
| Clyde never exits ghost house in v1 | §3.5 | SPRITEJS-06 |
| `renderMaze` called once per mount (not every render) | §6.3 | SPRITEJS-08 |
| `sprites.js` is pure render — no game logic/storage | §6.2 | SPRITEJS-07, shell check |
| Sprite `<use>` elements `aria-hidden="true"` | §8 | VISUAL-07 |
| No console errors after game screen mount | §6.4 | VISUAL-06 |
| No horizontal scroll on game screen | §1 goals | VISUAL-08 |

---

## 6. Check Automation

### 6.1 Shell Static Checks Script

The bash block in §4 above is the complete script. Save it as `scripts/check-phase4-static.sh`.

Run: `bash scripts/check-phase4-static.sh`

### 6.2 Browser Checks — Manual Checklist

```
=== Files & SVG (static) ===
[ ] FILE-01   assets/sprites.svg + styles/maze.css + styles/sprites.css + render/maze.js + render/sprites.js exist
[ ] FILE-02   maze.css + sprites.css linked after screens.css; game.css/animations.css absent
[ ] FILE-03   7 <symbol> elements inlined in index.html

[ ] SVG-01    #pacman-open: viewBox 0 0 16 16, arc path (not full circle)
[ ] SVG-02    #pacman-closed: viewBox 0 0 16 16, full circle
[ ] SVG-03    #ghost: viewBox 0 0 16 16, currentColor body, two eyes
[ ] SVG-04    #ghost-frightened: viewBox 0 0 16 16, hard-coded blue body, white rect eyes
[ ] SVG-05    #pellet: viewBox 0 0 8 8, <circle r="2" cx="4" cy="4">
[ ] SVG-06    #power-pellet: viewBox 0 0 14 14, <circle r="5" cx="7" cy="7">
[ ] SVG-07    #ghost-door: viewBox 0 0 16 4, rect bar, --ghost-pinky fill

=== maze.css ===
[ ] MAZECSS-01   .maze: position:relative, border 4px solid var(--maze), border-radius 4px
[ ] MAZECSS-02   .maze-wall: border 2px solid var(--maze), border-radius 4px
[ ] MAZECSS-03   .ghost-house: centred upper area, blue walls
[ ] MAZECSS-04   .ghost-house__door rule present and correctly sized
[ ] MAZECSS-05   Pac-Man home: position:absolute, bottom:16px, left:16px
[ ] MAZECSS-06   No raw hex colours in maze.css

=== sprites.css ===
[ ] SPRITECSS-01   use.pac: width:16px, height:16px, color:var(--pac)
[ ] SPRITECSS-02   use.ghost: width:16px, height:16px
[ ] SPRITECSS-03   .ghost--blinky/pinky/inky/clyde each have correct --ghost-* color var
[ ] SPRITECSS-04   Pac-Man chomp toggle selector/animation property present
[ ] SPRITECSS-05   No raw hex colours in sprites.css

=== DOM structure (game screen) ===
[ ] DOM-01   .maze injected into .screen--game
[ ] DOM-02   .ghost-house inside .maze
[ ] DOM-03   Ghost house door element present
[ ] DOM-04   4 ghost <use> elements in .ghost-house; all 4 colour classes applied
[ ] DOM-05   use.pac present, href="#pacman-open" or "#pacman-closed"
[ ] DOM-06   .word-area placeholder div in maze (may be empty)
[ ] DOM-07   2 .pellet-row divs in maze (no buttons yet)

=== sprites.js API ===
[ ] SPRITEJS-01   setPacPos, setGhostState, animatePacTraverse, animateGhostEmerge all exported
[ ] SPRITEJS-02   setPacPos sets --pac-x and --pac-y via setProperty
[ ] SPRITEJS-03   animatePacTraverse uses Element.animate() (WAAPI)
[ ] SPRITEJS-04   animateGhostEmerge uses Element.animate() with 600ms, ease-in-out
[ ] SPRITEJS-05   Both async functions have reducedMotion early-return path
[ ] SPRITEJS-06   setGhostState handles misses 0–6 per spec table; Clyde stays in house
[ ] SPRITEJS-07   sprites.js has no localStorage/dispatch/game-logic access
[ ] SPRITEJS-08   renderMaze guarded against re-injection on repeated render cycles

=== Visual (game screen) ===
[ ] VISUAL-01   Blue (#2121DE) maze walls visible
[ ] VISUAL-02   Ghost house visible in upper-centre of maze
[ ] VISUAL-03   Pink ghost-door bar across ghost house opening
[ ] VISUAL-04   4 ghost sprites inside house: Blinky red, Pinky pink, Inky cyan, Clyde orange
[ ] VISUAL-05   Yellow (#FFFF00) Pac-Man at bottom-left of maze
[ ] VISUAL-06   No console errors after game screen mount
[ ] VISUAL-07   Sprite <use> elements carry aria-hidden="true"
[ ] VISUAL-08   No horizontal scroll on game screen
```

---

## 7. Exit Criteria

Phase 4 is verified when **all** of the following hold:

- [ ] `bash scripts/check-phase4-static.sh` exits without FAIL lines.
- [ ] All 7 SVG symbol IDs present in `index.html` with correct viewBoxes (FILE-03, SVG-01–07).
- [ ] `currentColor` used for `#ghost` body — ghost colour override confirmed working.
- [ ] MAZECSS-01 through MAZECSS-06 — all maze.css rules verified.
- [ ] SPRITECSS-01 through SPRITECSS-05 — all sprites.css rules verified.
- [ ] DOM-01 through DOM-07 — all 7 DOM structure checks pass on mounted game screen.
- [ ] SPRITEJS-01 through SPRITEJS-08 — all sprites.js API checks pass.
- [ ] VISUAL-01 through VISUAL-08 — all visual checks pass, including zero console errors.

**Total: 44 checks across 7 groups.** All 44 must be green.

Do **not** proceed to Phase 5 (Game screen + interactions) until all mandatory items above are checked.

---

## 8. Out of Scope (defer to later phases)

| Item | Phase |
|---|---|
| 26 alphabet pellet `<button>` elements | Phase 5 |
| Word display: letter slots and underlines | Phase 5 |
| Full keyboard + click game loop | Phase 5 |
| Ghost emergence triggered by `GUESS_LETTER` misses | Phases 5–6 |
| `@keyframes pacman-chomp` definition | Phase 6 |
| `@keyframes pacman-death`, `maze-strobe`, `ghost-emerge-*`, `pellet-eat`, `pellet-ping` | Phase 6 |
| READY! interstitial, win strobe, death animation sequence | Phase 6 |
| Audio stub call sites | Phase 7 |
| Mobile layout (≤ 480px), Pac-Man traversal skip on mobile | Phase 7 |
| Full a11y: `aria-live` guess announcements, `aria-pressed` on pellets | Phase 7 |
| Firefox + Safari cross-browser matrix | Phase 8 |
| All 14 acceptance criteria E2E pass | Phase 8 |

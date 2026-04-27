# PacHangman — Design Specification

> Design + requirements for **PacHangman**, a Pac-Man–inspired browser Hangman.
> Date: 2026-04-27. Owner: Theo Beack. Status: Draft v2.
> Inputs: `planning/research/hangman_research.md` + confirmed decisions (personal project, vanilla stack, arcade-enthusiast audience).

---

## 1. Goals & Non-Goals

### Goals (v1)
- Single-page browser game served via a local static server, zero build step required to play.
- **Classic Arcade Pixel** visual theme: the game *feels* like a retro Pac-Man arcade cabinet — maze playfield, animated character, ghost house, alphabet-as-pellets.
- **Hangman rules** with Pac-Man mechanics: lives = ghosts emerging from ghost house, not a stick figure.
- **3 difficulty tiers** (Easy / Normal / Hard) and **3 categories** (Arcade, Sci-Tech, Movies), 1,000 words per difficulty per category.
- Words shipped as static plain JSON, lazy-loaded per category at run start.
- Keyboard + mouse/touch input.
- Streak persistence in `localStorage`.

### Non-goals (v1)
- Daily challenge (v2).
- Hint power-pellets / frightened-ghost mode (v2).
- Sound (v2 — stub wired in, real audio ships later).
- Multi-theme switcher / Synthwave + Modern Cute themes (v2).
- Stats screen, achievements, leaderboard, share-result (v3).
- Random category, more than 3 categories (v2+).
- gzip word bundle compression (v2 deferred optimization).
- Accounts, backend, multiplayer.
- Internationalisation.

---

## 2. User Experience

### 2.1 Screens
Three screens. Single HTML page, screens toggled via `data-screen` attribute on a root container.

| Screen | Purpose |
|---|---|
| **Title** | Splash + brand. Difficulty + category selectors. "INSERT COIN" CTA. Shows current streak + high score. |
| **Game** | Active gameplay — maze playfield, Pac-Man character, ghost house with 4 ghosts, word display, alphabet pellets. |
| **Result** | Win or lose state. Reveal full word, show streak update, "PLAY AGAIN" / "CHANGE CATEGORY" / "QUIT" CTAs. |

No router; state-driven visibility. Title ↔ Game ↔ Result.

### 2.2 Primary user flow

```
Title
  ├─ pick Difficulty (radio: Easy | Normal | Hard) — defaults to Normal
  ├─ pick Category (select: Arcade | Sci-Tech | Movies)
  │     └─ on change: lazy-fetch words/<category>.json (preload, cache)
  └─ press SPACE / click "INSERT COIN"
        ↓
Game                         "READY!" interstitial (1.5s) → play
  ├─ guess letters (A–Z keyboard, click alphabet pellets)
  │     ├─ HIT: Pac-Man traverses to pellet, eats it, letter revealed
  │     └─ MISS: ghost emerges from house, advances; letter dims
  ├─ guess full word (Enter → modal input → Submit)
  ├─ ESC → confirm → return to Title
  └─ all letters revealed (WIN) OR 6 misses (LOSS)
        ↓
Result
  ├─ reveal word + category + lives left
  ├─ streak: +1 (win) or reset to 0 (loss)
  ├─ "PLAY AGAIN" (same difficulty + category, level ticks up)
  ├─ "CHANGE CATEGORY"
  └─ "QUIT" → Title
```

### 2.3 Edge-case behaviour
| Case | Behaviour |
|---|---|
| Letter already guessed | Visual ping on the pellet tile; "ALREADY EATEN" flash. No penalty; no state change. |
| Wrong full-word guess | Costs 1 miss → one ghost advances. |
| ESC mid-game | Confirm dialog: "QUIT RUN? STREAK WILL BE LOST". |
| Tab + Space | Space triggers focused button only; does not double-fire as a guess action. |
| Repeated letter in word | All positions revealed on hit. |
| Window resize / mobile rotate | Layout reflows; Pac-Man snaps back to home position. |
| Category JSON load fails | Show "NETWORK ERROR — PLEASE REFRESH" overlay; game blocked. |
| Category JSON loading (>150ms) | Show "LOADING…" blinking text in INSERT COIN button. |

---

## 3. Visual Design System

Theme: **Classic Arcade Pixel** (research §3, Direction #1). The game must feel like a Pac-Man arcade cabinet running a Hangman mode — not a hangman game with Pac-Man stickers on it. The maze *is* the play area.

### 3.1 Palette (CSS custom properties)
```css
:root {
  --bg:           #000000;   /* arcade black */
  --maze:         #2121DE;   /* maze wall blue */
  --pac:          #FFFF00;   /* Pac-Man yellow */
  --dot:          #FFB8AE;   /* pellet peach */
  --ghost-blinky: #FF0000;   /* red */
  --ghost-pinky:  #FFB8DE;   /* pink */
  --ghost-inky:   #00FFDE;   /* cyan */
  --ghost-clyde:  #FFB847;   /* orange */
  --frightened:   #2121DE;   /* blue ghost (v2) */
  --text:         #FFFFFF;
  --text-dim:     #555555;
  --hit:          #00FF66;   /* correct guess flash */
  --miss:         #FF0044;   /* wrong guess flash */
  --hud:          #FFB8AE;   /* HUD label color (peach) */
}
```

### 3.2 Typography
- All text: **Press Start 2P** — Google Fonts CDN, single `<link>` tag in `<head>`. Fallback: `monospace`.
- Font sizes: 24px for word letters, 12px for HUD labels, 10px for fine chrome.
- All caps everywhere — arcade convention.
- Letter-spacing: `0.05em` for word display, `0` for HUD numbers.

### 3.3 SVG Sprite Sheet (`assets/sprites.svg`)
Single inline `<svg>` embedded in `index.html` with `display:none`. All characters defined as `<symbol>` elements; instances via `<use href="#id">`.

| Symbol ID | Content | Size |
|---|---|---|
| `#pacman-open` | Pac-Man, mouth open (240° arc facing right) | 16×16 |
| `#pacman-closed` | Pac-Man, mouth closed (full circle) | 16×16 |
| `#ghost` | Ghost body + two eyes (coloured via `currentColor`) | 16×16 |
| `#ghost-frightened` | Blue ghost with white dot eyes | 16×16 |
| `#pellet` | Small dot (4×4 circle) | 8×8 |
| `#power-pellet` | Large blinking dot (10×10 circle) | 14×14 |
| `#ghost-door` | Horizontal pink bar (ghost house entry) | 16×4 |

Ghost colour controlled by CSS `color` property on the wrapping `<use>` element — one symbol, four colours. Pac-Man chomp animation: alternates `#pacman-open` / `#pacman-closed` via CSS `animation` toggling `display`.

### 3.4 Layout — Game Screen

```
┌──────────────────────────────────────────────────────┐
│ 1UP      HIGH SCORE    CATEGORY: ARCADE   LEVEL: 03  │  ← HUD row
│ 0150       07820                                     │
├──────────────────────────────────────────────────────┤
│ ╔════════════════════════════════════════════════╗   │
│ ║ ┌──┐ ┌────┐ ┌──┐                  ┌──┐ ┌──┐   ║   │
│ ║ └──┘ └────┘ └──┘  ┌────────────┐  └──┘ └──┘   ║   │
│ ║                   │ 👻 👻 👻 👻  │               ║   │  ← ghost house (center)
│ ║                   │            │               ║   │
│ ║                   └─────╥──────┘               ║   │
│ ║                         ║                      ║   │
│ ║       _ _ _ _ _ _ _ _ _ _ _ _                  ║   │  ← word display
│ ║                                                ║   │
│ ║  •A •B •C •D •E •F •G •H •I •J •K •L •M       ║   │
│ ║  •N •O •P •Q •R •S •T •U •V •W •X •Y •Z       ║   │  ← alphabet pellets
│ ║                                                ║   │
│ ║  🟡                                            ║   │  ← Pac-Man at home (bottom-left)
│ ╚════════════════════════════════════════════════╝   │
│  [ GUESS WORD ]                      [ QUIT (ESC) ]  │
└──────────────────────────────────────────────────────┘
```

**Maze walls:** CSS `border` with `border-radius: 4px` for rounded corners on each corridor section, colour `--maze`. Walls are structural `<div>`s; no canvas.

**Ghost house:** centred `<div>` with blue walls and a `#ghost-door` SVG across the opening. Ghosts are positioned inside it with `position: absolute`; emerge via `transform: translateY` animation down through the door.

**Pac-Man home position:** bottom-left corner of the maze. This is the rest position after each guess.

### 3.5 Lives System — Maze + Ghost House

Replaces the "chase row". 6 misses = 4 ghost emergences + 2 advance steps:

| Miss | Event |
|---|---|
| 1 | Blinky exits ghost house, enters maze (slides down through door). |
| 2 | Blinky advances one maze segment toward Pac-Man. |
| 3 | Pinky exits ghost house. |
| 4 | Pinky advances toward Pac-Man. |
| 5 | Inky exits ghost house. |
| 6 | Inky reaches Pac-Man → **death animation** (Pac-Man rotation-collapse over 1.2s); Clyde never leaves the house. |

Each emergence: CSS `@keyframes` translating the ghost sprite along a fixed path (down from ghost house → into maze corridors → toward Pac-Man at bottom-left). Duration 600ms ease-in-out.

On miss 6: Pac-Man death animation (`@keyframes pacman-death` — rotate 0° → 360° while scale shrinks to 0, 1.2s), then transition to Result screen after 1.5s.

Frightened mode (ghosts turn blue) reserved for v2 power-pellet hints.

### 3.6 Word Display

Located in the center-upper area of the maze, inside a `<div class="word-area">`.

- Each letter slot: a flex column of `<span class="letter">` (character) + `<span class="underline">` (pellet-bar underneath).
- Blank letter: underline shows `--dot` colour; letter `<span>` hidden.
- Revealed letter: `--pac` yellow, letter fades in (`opacity 0 → 1`, 200ms). Underline disappears with `@keyframes pellet-eat` (scale 1 → 0, 150ms simultaneous).
- Spaces in multi-word entries (v2): wider gap, no underline, auto-revealed.

### 3.7 Alphabet Pellets

26 `<button>` elements arranged as two rows of 13 across the lower maze paths.

States:
| State | Visual |
|---|---|
| Default | `--dot` pellet background, white letter, maze-blue border. |
| Hover/focus | Scale 1.1, `text-shadow` glow (`--pac`). |
| Hit (just guessed, correct) | Flash `--hit` green 300ms → settles to `--text-dim`, opacity 0.4. |
| Miss (just guessed, wrong) | Flash `--miss` red 300ms → settles to `--text-dim`, opacity 0.4. |
| Already guessed | Opacity 0.25, `pointer-events: none`, `aria-disabled="true"`. |

On any guess:
1. Pac-Man animates from home to the selected pellet (`transform: translate(x, y)`, 300ms ease-in-out, disabled under `prefers-reduced-motion`).
2. Pac-Man plays chomp animation (open/close, 150ms each × 2 cycles).
3. Pac-Man returns to home position (300ms).
4. HIT or MISS visual applied to the pellet.
5. MISS also triggers ghost emergence.

Mobile (≤480px width): maze collapses to a compact view — ghost house at top, word display in middle, alphabet in a 6-column grid at the bottom. Pac-Man traversal animation skipped.

### 3.8 Animation Budget

| Event | Animation |
|---|---|
| Game start / new word | "READY!" text blinks for 1.5s in maze center, then disappears; Pac-Man animates in. |
| Letter hit | Pac-Man eats pellet; pellet underline shrinks; letter fades in. |
| Letter miss | Ghost emerge path; miss-flash on pellet. |
| Win | Maze walls strobe blue → white (6 rapid cycles, 80ms each). Pac-Man victory loop (circles once). |
| Loss | Pac-Man death rotation (1.2s). Ghosts flash. "GAME OVER" text blinks. |
| Level up (play again) | Level number ticks up in HUD; "READY!" plays again. |
| Power pellet (v2) | Ghost turns `--frightened` blue, wobbles. |

All animations respect `@media (prefers-reduced-motion: reduce)` — disable transforms, replace strobe with instant colour change, replace Pac-Man traverse with instant eat.

---

## 4. Information Architecture

### 4.1 Game State (single source of truth)

```js
const state = {
  screen: 'title' | 'game' | 'result',

  // Run config (set when leaving title)
  difficulty: 'easy' | 'normal' | 'hard',
  category:   'arcade' | 'sciTech' | 'movies',
  level: number,                 // increments each play-again in same session

  // Active word
  word: string,                  // canonical lower-case
  revealed: boolean[],           // same length as word; true = position shown
  guessed: Set<string>,          // letters tried, lower-case

  // Run progress
  lives: number,                 // starts at 6; 0 = loss
  outcome: null | 'win' | 'loss',

  // Word loading cache
  wordsCache: {                  // populated lazily per category
    arcade:  { easy: string[], normal: string[], hard: string[] } | null,
    sciTech: { ... } | null,
    movies:  { ... } | null,
  },

  // Persisted (localStorage key: 'pachangman_v1')
  streak: number,
  bestStreak: number,
  highScore: number,
  recentWords: string[],         // last 50, rolling
  settings: {
    soundEnabled: boolean,       // v1 default false; stub only
    reducedMotion: boolean,      // mirrors prefers-reduced-motion
  }
};
```

### 4.2 State Transitions

```
  PLAYING
   │
   ├── on guessLetter(L)
   │     ├── L in word & not guessed   → reveal all positions; if all revealed → WIN
   │     ├── L not in word & not guessed → lives--; if lives === 0 → LOSS
   │     └── L already guessed           → no-op (UI ping)
   │
   ├── on guessWord(W)
   │     ├── W === word → WIN
   │     └── W !== word → lives--; if lives === 0 → LOSS
   │
   └── on quit → confirm → TITLE

  WIN  → score = compute(state); streak++; bestStreak = max; highScore = max; save → RESULT
  LOSS → streak = 0; save → RESULT
```

Reducer pattern: `reduce(state, action) → state`. No DOM access inside reducer — pure function, unit-testable in Node.

### 4.3 Persistence
- Key: `pachangman_v1`.
- Written on every run-end and settings change.
- Read once at boot; if missing or JSON-parse fails, initialise with defaults.
- `wordsCache` is NOT persisted (memory-only; fetched fresh each session).

---

## 5. Game Mechanics

### 5.1 Rules (formalised)
1. Word selected per `difficulty` + `category` at run start; stored as canonical lowercase.
2. Letter guesses are case-insensitive, A–Z only. Non-letters ignored.
3. Letter hit → reveal all matching positions.
4. Letter miss → `lives--`.
5. Whole-word guess via CTA. Wrong → `lives--`. Correct → WIN.
6. WIN = all positions revealed before `lives === 0`.
7. LOSS = `lives === 0`.

### 5.2 Difficulty Parameters
| Tier | Word length | Lives | Notes |
|---|---|---|---|
| Easy | 3–5 | 6 | Common, high-frequency words. |
| Normal (default) | 6–8 | 6 | Mid-frequency. Sweet spot. |
| Hard | 9–14 | 6 | Long tail; rare letters permitted. |

Lives are 6 uniformly across all difficulties. Hard mode difficulty comes from word length + rarity alone.

### 5.3 Categories

Three categories. Each ships as `words/<category>.json` with shape `{ easy: string[], normal: string[], hard: string[] }` — 1,000 words per tier, 3,000 per file, 9,000 total.

**Arcade** — retro gaming terms
- Seeds: `pacman, tetris, pinball, joystick, asteroid, frogger, galaga, sprite, pixel, arcade, atari, nintendo, donkey, pong, breakout, centipede, defender, galaxis, tempest, zaxxon, mame, rom, bios, cheat, combo, respawn, loot, hitbox, vector, raster, cabinet, marquee, bezel, trackball, flipper, plunger, bumper, paddle, quarter, token, highscore…`
- Build: filter `dwyl` dictionary by stem-match against seed list + gaming-related suffixes; bucket by length.

**Sci-Tech** — science and technology terms
- Seeds: `electron, quantum, neuron, satellite, pixel, kernel, photon, capacitor, algorithm, binary, matrix, circuit, voltage, genome, protein, catalyst, osmosis, entropy, isotope, fractal, topology, compiler, bandwidth, latency, firmware, semiconductor, transistor, telescope, microscope, polymer, polymer, alloy, neutron, proton…`
- Build: filter `dwyl` by STEM/science domain patterns; bucket by length.

**Movies** — single-word film titles
- Seeds: `alien, jaws, frozen, gladiator, inception, matrix, avatar, oppenheimer, beetlejuice, grease, tenet, dune, prey, heat, leon, speed, signs, crash, up, it, us, ed, se7en, whiplash, parasite, uncut, clue, misery, psycho, grease, rocky, fargo, oldboy, joker, moonlight, nomadland, spotlight, arrival, logan, solo, thor, hulk, blade…`
- **Single-word titles only.** Multi-word titles (v2).
- Build: hand-curated list of single-word titles; filter by length tiers (3–5 / 6–8 / 9–14); supplement with `dwyl` words that are known as film titles.

**File layout:**
```
words/
  arcade.json      // { easy: [...1000], normal: [...1000], hard: [...1000] }  ~50KB
  scitech.json     // same structure                                           ~50KB
  movies.json      // same structure                                           ~50KB
```

### 5.4 Word Selection Algorithm
```js
// Runtime
async function loadCategory(category) {
  if (state.wordsCache[category]) return;
  const data = await fetch(`./words/${category}.json`).then(r => r.json());
  state.wordsCache[category] = data;
}

function pickWord({ difficulty, category, recentWords }) {
  const pool = state.wordsCache[category][difficulty];
  const candidates = pool.filter(w => !recentWords.includes(w));
  const source = candidates.length > 0 ? candidates : pool;
  return source[Math.floor(Math.random() * source.length)];
}
```
- `recentWords` capped at 50 (rolling).
- Profanity filtering applied at **build time**, not runtime.

### 5.5 Word List Build Script (dev-time only, not shipped)

`tools/build-wordlists.js` — Node script, run once during development:

1. Download `dwyl/english-words` `words_dictionary.json` (~479k words) to `tools/cache/`.
2. Download `first20hours/google-10000-english` frequency list to `tools/cache/`.
3. For each category, read seed file from `tools/seeds/<category>.txt`.
4. Filter `dwyl` dictionary: keep words whose stems/substrings match any seed (edit-distance-1 or exact substring).
5. Bucket by length into `easy` (3–5), `normal` (6–8), `hard` (9–14).
6. Apply LDNOOBW profanity blocklist (filter out matches).
7. If a tier has fewer than 1,000 candidates: backfill from `google-10000-english` filtered to matching length, ensuring no duplicates.
8. Shuffle each tier, cap at 1,000.
9. Write `words/arcade.json`, `words/scitech.json`, `words/movies.json`.

### 5.6 Scoring (lightweight v1)
```
score = base(difficulty) × livesRemaining × lengthBonus
  base: easy=10, normal=20, hard=40
  lengthBonus: 1 + (wordLength - minLengthForTier) × 0.1
```
High score persisted; displayed in HUD. No dedicated stats screen (v3).

---

## 6. Architecture

### 6.1 File Structure (vanilla, zero build step)
```
hangman/
├── index.html                    ← entry point; inline <svg id="sprites"> at top
├── styles/
│   ├── reset.css
│   ├── theme.css                 ← CSS custom properties (palette, type scale)
│   ├── layout.css                ← grid, flex, viewport units
│   ├── maze.css                  ← wall divs, ghost house, pellet positions
│   ├── sprites.css               ← SVG use element sizing + Pac-Man/ghost animations
│   ├── game.css                  ← word display, alphabet pellet states
│   ├── animations.css            ← @keyframes: chomp, death, strobe, emerge, pellet-eat
│   └── screens.css               ← title + result screens
├── src/
│   ├── main.js                   ← bootstrap; wire DOM ↔ dispatch; load fonts
│   ├── state.js                  ← initial state + pure reducer(state, action)
│   ├── game.js                   ← guessLetter, guessWord, isWin, isLoss, computeScore
│   ├── words.js                  ← loadCategory (fetch + cache), pickWord
│   ├── render/
│   │   ├── title.js              ← title screen render
│   │   ├── game.js               ← word, alphabet pellets, HUD
│   │   ├── maze.js               ← maze walls + ghost house (mostly static; re-renders on screen change)
│   │   ├── sprites.js            ← Pac-Man + ghost SVG instances + animation triggers
│   │   ├── result.js             ← result screen render
│   │   └── shared.js             ← HUD (score, streak, level, category)
│   ├── input.js                  ← keyboard + click handlers → dispatch
│   ├── persist.js                ← localStorage read/write (persisted slice only)
│   └── audio.js                  ← stub (all methods no-ops in v1; real in v2)
├── assets/
│   └── sprites.svg               ← referenced inline into index.html at build or just inline
├── words/
│   ├── arcade.json               ← { easy, normal, hard } 1000 words each
│   ├── scitech.json
│   └── movies.json
└── tools/                        ← dev-time only; not served
    ├── build-wordlists.js
    ├── seeds/
    │   ├── arcade.txt
    │   ├── scitech.txt
    │   └── movies.txt
    └── cache/                    ← downloaded source dictionaries (gitignored)
```

### 6.2 Module Boundaries
- **Pure logic** (`state.js`, `game.js`, `words.js`): zero DOM access, zero globals → unit-testable in Node.
- **Render layer** (`render/*.js`): receives `state`, writes to specific DOM subtrees, returns nothing.
- **Animation layer** (`render/sprites.js`, `animations.css`): read-only on state; side-effects are CSS class toggles only.
- **Wiring** (`main.js`): `dispatch(action)` → `reduce` → `render` → `persist`.
- **I/O** (`input.js`, `persist.js`, `audio.js`): isolated adapters; no business logic.

### 6.3 Render Strategy
- DOM-based, no canvas. Static HTML skeleton in `index.html`; renderers set `textContent` + `className` + `data-*` attributes.
- Drive visual state via `<body data-screen="game" data-lives="4" data-outcome="">` — CSS rules keyed on these attributes avoid JavaScript style mutations.
- Pac-Man/ghost positions driven by CSS custom properties (`--pac-x`, `--pac-y`) set via JS → CSS `transform: translate(var(--pac-x), var(--pac-y))`.
- Web Animations API for sequenced animations (emerge path); CSS `@keyframes` for loops (chomp, idle).

### 6.4 Boot Sequence
1. `DOMContentLoaded` fires; `main.js` wires all event listeners.
2. `persist.js` loads `pachangman_v1` from `localStorage` (or returns initial state).
3. Detect `prefers-reduced-motion`; set `state.settings.reducedMotion`.
4. `render/title.js` paints Title screen.
5. When user picks a category → `words.loadCategory(category)` fires a `fetch('./words/<category>.json')` in the background; result cached in `state.wordsCache`. If still loading when "INSERT COIN" clicked, show "LOADING…" until resolved.
6. On "INSERT COIN" → `pickWord` → `dispatch({ type: 'START_GAME' })` → "READY!" interstitial → Game screen.

---

## 7. Audio Design (v2-bound — stub wired in v1)

`audio.js` exposes these methods; all are no-ops in v1:

| Method | Event | SFX (v2) |
|---|---|---|
| `audio.chomp()` | Letter hit | Pac-Man chomp (CC0, Freesound) |
| `audio.miss()` | Letter miss | Low siren blip |
| `audio.win()` | Game win | Intermission jingle (CC0 or original) |
| `audio.loss()` | Game loss | Death wail |
| `audio.ready()` | READY! interstitial | "Waka" startup blip |
| `audio.tick()` | Alphabet hover | Soft tick |
| `audio.bgm(play)` | Title screen | 8s looping chiptune |

Mute toggle (top-right HUD), persisted in `state.settings.soundEnabled`.

---

## 8. Accessibility

Required for v1:

- **Keyboard:** A–Z keys guess letters; Enter opens word-guess input; Esc confirms quit. Tab order on Title: difficulty → category → INSERT COIN. Tab order in Game: alphabet pellets (A–Z) → GUESS WORD → QUIT.
- **Focus rings:** `2px solid var(--pac)` — never hidden without replacement.
- **Contrast:** white on black passes WCAG AA. `--dot` peach on black: 3.1:1 — used only as decorative background on pellets, not primary text. Bump letter text to white on non-default pellet states.
- **Screen reader:**
  - `<div aria-live="polite" aria-atomic="true" class="sr-only">` announces results: "Letter E found — 2 positions revealed. 4 letters remaining." or "Letter Q not in word. 5 lives remaining."
  - Pac-Man traversal animation is decorative only (`aria-hidden="true"` on sprite elements).
  - Win/loss announced: "You win! The word was JOYSTICK." or "Game over. The word was JOYSTICK."
  - Alphabet `<button>` elements: `aria-label="Letter A"`, `aria-pressed="true"` when guessed, `aria-disabled="true"` when guessed.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables Pac-Man traversal (instant eat), maze strobe (instant colour flip), death rotation (instant hide), ghost emerge (instant position). Result is still visually clear.
- **Touch targets:** alphabet pellet buttons ≥ 44×44 px CSS. GUESS WORD + QUIT ≥ 44px height.

---

## 9. Resolved Decisions

All open questions from the previous draft are now answered:

| Decision | Choice | Rationale |
|---|---|---|
| Word source | `dwyl/english-words` + hand-curated category seed files | 479k-word pool; seeds guide category tagging without a paid API. |
| Categories | **Arcade, Sci-Tech, Movies** (3 total) | Cohesive for arcade-enthusiast audience; manageable curation. |
| Words per category | 1,000 per difficulty × 3 = 3,000 per category, **9,000 total** | Large enough for variety; small enough as plain JSON (~150KB). |
| Art format | **SVG sprite sheet** (`assets/sprites.svg`) | Animatable via CSS; scalable; single file. |
| Font | **Google Fonts CDN** (Press Start 2P) | One `<link>` tag; cached after first load. |
| Lives model | **6 uniformly** across all difficulties | Standard hangman; ghosts double-up (misses 1+2 = Blinky, 3+4 = Pinky, 5+6 = Inky). |
| Movies content | **Single-word titles only** at v1 | Avoids multi-word UX complexity; multi-word deferred to v2. |
| Word file format | **Plain JSON, lazy-loaded per category** | Simplest; ~50KB per fetch; no DecompressionStream complexity. |

### Remaining implementation calls (low-stakes, use these defaults unless objection)
| Call | Default |
|---|---|
| Seed file size per category | ~50 core seeds; expand to 200 if a tier under-fills. |
| READY! interstitial duration | 1.5s. |
| Pac-Man traversal duration | 300ms per leg. |
| Ghost emerge duration | 600ms. |
| Maze strobe cycle count (win) | 6 flashes × 80ms each. |
| Profanity blocklist | LDNOOBW JSON (en). |

---

## 10. Acceptance Criteria (v1 "playable")

The build is done when **all** of these hold:

- [ ] Game runs via `python3 -m http.server 8000` → `localhost:8000` in Chrome/Firefox/Safari with no console errors.
- [ ] Title screen: difficulty + category selectors functional. Category JSON begins fetching on selection.
- [ ] "INSERT COIN" starts game; "READY!" text appears for 1.5s, then play begins.
- [ ] All 26 letters guessable via keyboard (A–Z keys) **and** clicking alphabet pellets.
- [ ] Hit: Pac-Man visibly traverses to the pellet, eats it, letter fills into word display.
- [ ] Miss: ghost visibly emerges from ghost house and advances each miss.
- [ ] 6 misses: Pac-Man death animation plays, result screen appears.
- [ ] Word-guess CTA (Enter/click): correct → WIN; wrong → 1 miss.
- [ ] Win: maze walls strobe; Pac-Man victory loop; result screen shows streak +1.
- [ ] Streak + best streak + recent words + high score persist across page reloads.
- [ ] Guessing an already-guessed letter produces a UI ping, no penalty.
- [ ] Each of the 3 category JSON files contains at least 900 words per tier (documented if under 1,000).
- [ ] Game playable on 375×667 viewport — simplified mobile layout, no horizontal scroll.
- [ ] `prefers-reduced-motion` respected: all CSS transitions and keyframe animations disabled.
- [ ] Pure-logic modules (`state.js`, `game.js`, `words.js`) have unit tests covering: hit, miss, repeat-letter, win, loss, full-word (correct + wrong), `pickWord` avoiding `recentWords`.

---

## 11. Roadmap

### v1 — retro Pac-Man hangman (this spec)
Maze playfield, SVG sprites, ghost house lives, 3 categories × 3 difficulties, streak persistence, accessibility baseline.

### v2 — sound, hints, daily challenge, more content
- Audio (chomp, miss, win, loss, title chiptune) per §7.
- Power-pellet hint system: **frightened-ghost mode** — 4 ghost hints mapped to Blinky/Pinky/Inky/Clyde personalities (research §5.7).
- Daily challenge: deterministic word seeded by UTC date; shareable result grid.
- Synthwave + Modern Cute themes (CSS variable swap).
- Multi-word movie titles.
- Random category (pulls from all three pools).
- gzip compression on word bundles if 150KB plain becomes slow over a real network.

### v3 — depth + share
- Stats screen (win rate, avg guesses, fastest win, letter heatmap).
- Achievements / badges.
- Share-result emoji grid (Wordle-style).
- Optional: tiny serverless leaderboard.

---

## 12. Source References
- Research doc: `planning/research/hangman_research.md`
- Pac-Man palette: [SchemeColor](https://www.schemecolor.com/pac-man-game-colors.php), [Lospec Pac-Man 10](https://lospec.com/palette-list/pac-man-10)
- Hangman rules: [Hasbro](https://instructions.hasbro.com/en-us/instruction/hangman-game-instructions), [Wikipedia](https://en.wikipedia.org/wiki/Hangman_(game))
- Word lists: [dwyl/english-words](https://github.com/dwyl/english-words), [google-10000-english](https://github.com/first20hours/google-10000-english)
- Profanity filter: [LDNOOBW](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words)
- Letter frequency strategy: [Datagenetics](https://datagenetics.com/blog/april12012/), [Wolfram blog](https://blog.wolfram.com/2010/08/13/25-best-hangman-words/)

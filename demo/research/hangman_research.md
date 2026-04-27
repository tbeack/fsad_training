# PacHangman — Research

> Background research for **PacHangman**, a Pac-Man–inspired browser Hangman.
> Date: 2026-04-27. Owner: Theo Beack.

## 1. Rules of the Game

### Core mechanic
- One player (or computer) selects a secret **word, phrase, or short sentence**.
- Word is rendered as a row of blanks (`_ _ _ _`), one per letter. Spaces and punctuation are usually shown as-is.
- Guesser proposes one letter at a time.
  - **Hit:** every occurrence of the letter is filled into its blanks.
  - **Miss:** one element is added to the hangman figure (or one life is lost).
- Guesser may attempt the **whole word at any time**. Wrong full-word guess traditionally costs an extra body part.
- Guesser **wins** by completing the word before the figure is finished.
- Guesser **loses** when the figure is complete.

### Lives / drawing budget
The standard figure has **6 parts** drawn in this order: head → body → left arm → right arm → left leg → right leg. So default = **6 wrong guesses allowed**. Extended variants add hands, feet, eyes, mouth, hair, noose, gallows for up to 10–13 misses (used to scale difficulty).

### Edge-case rules to decide upfront
| Question | Common answer |
|---|---|
| Repeat-letter guess penalised? | No — usually ignored, or shown as already-tried. |
| Wrong full-word guess penalty? | Adds 1 body part (Hasbro rules). |
| Numbers / punctuation guessable? | No — letters only; non-letters are pre-revealed. |
| Case sensitivity | Always case-insensitive. |
| Empty / single-letter word | Disallow at word-list filter stage. |

### History (one-paragraph)
A guessing game using "letters and dashes" appears in Alice Bertha Gomme's 1894 *Traditional Games*; the **hanged-figure** scoring imagery is documented in a 1902 *Philadelphia Inquirer* piece. The modern paper-and-pencil and Hasbro board-game (1976) versions codified the 6-part figure.

Sources: [Wikipedia — Hangman](https://en.wikipedia.org/wiki/Hangman_(game)), [Hasbro official rules](https://instructions.hasbro.com/en-us/instruction/hangman-game-instructions), [UltraBoardGames rules](https://www.ultraboardgames.com/hangman/game-rules.php).

---

## 2. Gameplay Options

### 2.1 Difficulty levels
A 3-tier model is standard across modern digital hangmans:

| Tier | Word length | Lives | Word source | Notes |
|---|---|---|---|---|
| Easy | 3–5 letters | 6 | Top 1–2k common words | Common-letter-heavy; kid-friendly. |
| Normal | 6–8 letters | 6 | Top 5–10k words | Sweet spot per most game blogs. |
| Hard | 9+ letters or rare | 5 | Long tail; allow `j q x z` | Wolfram's analysis flags `jazz`, `buzz`, `fuzz`, `hajj` as hardest. |

Optional 4th tier — **Phrases / multi-word**, 7 lives, kept-spaces shown.

### 2.2 Visualisations
- **Classic stick figure** — six parts, draw on each miss.
- **Reverse-progress bar** — life meter shrinking (modern mobile pattern).
- **Themed character animation** — replace gallows entirely (this is where the Pac-Man theme lives — see §3).
- **Letter board state** — render full alphabet with used letters greyed out; correct = green, wrong = red. Strongly recommended for usability.
- **Win/lose flourish** — confetti / shake / death animation. Pac-Man's intermission cutscenes are a strong reference.

### 2.3 Gamification mechanics
Patterns that show up in top-rated mobile hangmans:

- **Streaks** — current win streak, best streak (persist in `localStorage`).
- **Daily challenge** — one shared word per UTC day; result shareable as emoji grid (Wordle-style is the obvious reference).
- **Categories / themes** — animals, movies, food, sports, sci-tech. Category shown to player as a free hint.
- **Hints / power-pellets** — spend a finite resource (or earn by streaking) to: reveal a letter, eliminate 5 wrong letters, freeze a wrong guess.
- **Score system** — base points × (lives remaining) × difficulty multiplier; speed bonus optional.
- **Achievements / badges** — "win without a miss", "3 wins in a row", "vowel-only victory".
- **Adaptive difficulty** — bump tier after N consecutive wins, drop after N losses.
- **Stats screen** — win rate, avg guesses, fastest win, letter accuracy heatmap.
- **Coop / vs. mode** (stretch) — async friend challenge: pick a word, send link.

Sources: [Hangman digital app patterns — Google Play listings](https://play.google.com/store/apps/details?id=com.cooltime.hangman), [Coolmath Hangman](https://www.coolmathgames.com/0-hangman).

---

## 3. Visual Design — Top 3 Pac-Man-Inspired Directions

Pac-Man's brand canon gives us three eras with their own dedicated style guides. Ranked by recognition / popularity:

### #1 — Classic Arcade Pixel (1980 original)
**Why pick it:** Most universally recognisable Pac-Man look; small asset budget; renders crisply on every screen.

- **Palette** (Lospec "Pac-Man 10" / SchemeColor): black `#000000` background, Pac-Man yellow `#FFFF00`, ghost red `#FF0000` (Blinky), pink `#FFB8DE` (Pinky), cyan `#00FFDE` (Inky), orange `#FFB847` (Clyde), maze blue `#2121DE`, dot peach `#FFB8AE`. ~13 unique colors.
- **Typography:** 8×8 pixel arcade font (e.g. *Press Start 2P*, *VT323* fallback).
- **Layout:** Word blanks sit inside a horizontal "maze corridor"; revealed letters appear as eaten pellets along the path.
- **Hangman replacement:** 4 ghost icons act as lives; each miss, one ghost lights up & advances toward Pac-Man. 6th miss = Pac-Man's classic *flat-spin death animation*.
- **Power pellet:** Hint token in the corner; click to reveal a letter (Pac-Man eats it).

> **PacHangman mapping:** alphabet letters laid out as pellets in a maze pattern; clicking a letter "eats" it; correct = pellet pop sound, wrong = ghost siren.

### #2 — Neon / Synthwave Retro-Futurism (Pac-Man Championship Edition era, 2007+)
**Why pick it:** Most popular *modern* Pac-Man aesthetic; trendy for indie web games; works beautifully with CSS glow filters; mobile-friendly.

- **Palette:** dark navy/purple gradient background `#0A0A2A → #2D0B4E`, neon cyan `#00FFFF`, hot magenta `#FF00FF`, electric yellow `#FFEA00`. Heavy use of glow / bloom.
- **Typography:** Geometric sans (e.g. *Orbitron*, *Audiowide*) with letter-spacing and a soft text-shadow glow.
- **Layout:** Wireframe / vector look. Maze drawn as glowing lines; word blanks pulse softly.
- **Hangman replacement:** A "trail" — Pac-Man flees down a corridor with ghosts in pursuit; each miss, ghost gap closes. Particle effects on hits.
- **Animations:** CSS `filter: drop-shadow` + `@keyframes` glow pulses; canvas-rendered trail particles.

> **PacHangman mapping:** great for daily-challenge / streak mode where the tone is sleeker.

### #3 — Modern Cute / 2.5D (Pac-Man World, Pac-Man 256, mobile branding)
**Why pick it:** What kids and casual mobile players currently associate with the brand; warmest, most accessible; lowest barrier for non-arcade audiences.

- **Palette:** brighter, softer — sky blue `#7FD7FF`, pastel yellow `#FFE066`, mint `#A0E8B7`, coral `#FF8A8A`. Off-white background instead of black.
- **Typography:** Rounded sans (e.g. *Fredoka*, *Baloo 2*).
- **Layout:** Soft drop-shadows, rounded card UI, chibi character mascots. Friendly ghost expressions (smiling/sad).
- **Hangman replacement:** Pac-Man on a single screen; each miss adds a ghost surrounding him until he's cornered. Final "miss" = ghosts win, Pac-Man pouts.
- **Mood:** suits the kid / education audience and category-heavy modes.

> **PacHangman mapping:** default theme for casual / education users; complements category packs (animals, food, sports).

### Theme switcher
Recommend shipping #1 as default (cheapest, most iconic), with #2 + #3 selectable from a settings cog. CSS variables make swapping palettes a one-file change.

Sources: [Pac-Man Game Color Scheme — SchemeColor](https://www.schemecolor.com/pac-man-game-colors.php), [Lospec Pac-Man 10 palette](https://lospec.com/palette-list/pac-man-10), [History of Pac-Man artwork style guides — Pac-Man Wiki](https://pacman.fandom.com/wiki/History_of_Pac-Man_artwork_style_guides), [Arcadecore aesthetic](https://aesthetics.fandom.com/wiki/Arcadecore), [80s game design — 99designs](https://99designs.com/blog/design-history-movements/video-game-design-influence/).

---

## 4. Word / Dictionary Selection & Integration

### 4.1 Sources (recommendation: ship offline-first)

| Source | Type | Size | Cost | Notes |
|---|---|---|---|---|
| **`dwyl/english-words`** | GitHub repo, JSON | ~479k words | Free, MIT | Full but unfiltered (proper nouns, rude). |
| **`first20hours/google-10000-english`** | GitHub repo, txt | 10k by frequency | Free | Best for difficulty tiers. |
| **`wordnik/wordlist`** | GitHub repo | curated for games | Free | Maintained for word-game use. |
| **Datamuse API** | REST, no key | huge | Free | Filter by length / theme on the fly. |
| **Random Word API (api-ninjas)** | REST | curated | Free tier, key required | Filter by part of speech. |
| **WordsAPI** | REST | 325k + definitions | Paid | Includes synonyms/defs (could power "definition" hints). |

**Recommendation:**
- **Ship a static JSON bundle in the repo** (no network at runtime; works offline; predictable difficulty).
- Build it at dev time from `google-10000-english` (filter to A–Z only, length 3–14, strip slurs/proper nouns) split into `words_easy.json`, `words_normal.json`, `words_hard.json`, plus per-category packs (animals, food, sports, movies, sci-tech, **arcade/retro-gaming** for thematic synergy).
- Optional later: Datamuse for "definition" or "rhymes-with" hint power-ups.

### 4.2 Word selection algorithm
1. Pick category (or "random").
2. Filter dictionary by tier length range.
3. Reject any word in `recently_used` (last 50, persisted).
4. Reject any word matching a profanity blocklist.
5. (Optional, hard mode) bias toward words containing rare letters (`j q x z v k`) using the canonical English frequency `e t a o i n s h r d l u`.

### 4.3 Profanity / safety
- Filter list against a curated blocklist (e.g. `bad-words` npm package, or LDNOOBW JSON).
- For kid mode: intersect with a known-safe word list (e.g. EFF wordlist, Wordnik wordlist).

### 4.4 Letter-frequency reference (for hint UI ordering / hard-mode word selection)
Most-frequent → least-frequent: **E T A O I N S H R D L U C M F W Y G P B V K J X Q Z**.

Sources: [Datamuse API](https://www.datamuse.com/api/), [dwyl/english-words](https://github.com/dwyl/english-words), [google-10000-english](https://github.com/first20hours/google-10000-english), [Wordnik wordlist](https://github.com/wordnik/wordlist), [Datagenetics — Better Hangman strategy](https://datagenetics.com/blog/april12012/), [Wolfram — 25 Best Hangman Words](https://blog.wolfram.com/2010/08/13/25-best-hangman-words/).

---

## 5. What I Think You're Missing

Things to decide / consider that aren't in the original brief but will save rework:

### 5.1 Legal / IP
- **"Pac-Man" is a Bandai Namco trademark.** Using the name "PacHangman" or directly copying Pac-Man / ghost sprites in a *publicly distributed* game is a real risk. Two paths:
  - **(A) Personal / unpublished project.** Fine to use the name as a working title.
  - **(B) Public release.** Rebrand to an *original mascot* "inspired by" arcade aesthetics (a generic dot-eater, original ghost-like enemies, custom palette). Keep the *vibe*, drop the IP.
- Same applies to the original Pac-Man chomp/death audio — use original or CC0 sound effects.

### 5.2 Tech stack (the repo's open question per `CLAUDE.md`)
- For a single-screen browser game: **vanilla HTML + CSS + ES modules + `<canvas>`** (or pure DOM) is enough and matches the "no over-engineering" preference. No build step needed.
- Reach for Vite + TypeScript only if multiplayer / leaderboard / multi-screen scope shows up.
- If a framework is wanted anyway: pick one and don't mix — React *or* Svelte, not both.

### 5.3 Accessibility (often skipped, easy to do early)
- WCAG AA contrast for the neon themes (the synthwave palette will need careful checks against bg).
- Full keyboard play: A–Z keys for guesses, Enter for word-guess, Esc for menu.
- Screen-reader friendly: announce hits/misses + remaining lives via `aria-live`.
- Reduced-motion media query for the death/ghost animations.
- Optional dyslexia-friendly font toggle.

### 5.4 Input modalities
- Hover/click letter board for desktop.
- Tap targets ≥ 44×44 px for mobile.
- Physical keyboard support — many users will type rather than click.

### 5.5 Audio
- Chomp on hit, ghost-siren on miss, intermission jingle on win, death wail on loss.
- Mute toggle persisted in `localStorage`.
- Use CC0 sources (Freesound / OpenGameArt) — see §5.1.

### 5.6 Persistence model
- `localStorage` is enough for: settings, theme, streak, best score, daily-challenge result.
- Only reach for a backend if you want a real leaderboard or cross-device sync.

### 5.7 Ghost-as-mechanic mapping (design hook)
Pac-Man's four ghosts have distinct AI personalities — map each to a hint behaviour to give the theme real depth instead of a pure reskin:
- **Blinky (red, chaser)** — reveals one wrong letter from the alphabet (eliminates a bad guess).
- **Pinky (pink, ambusher)** — reveals one *correct* letter in the word.
- **Inky (cyan, erratic)** — randomises: 50/50 reveal correct OR eliminate wrong.
- **Clyde (orange, scatter)** — gives a definition/category clue.

Player earns one "ghost call" per power-pellet collected.

### 5.8 Daily-challenge spec (if you want it)
- Seed RNG with `YYYY-MM-DD` (UTC) → deterministic word per day → shareable result.
- Result string: emoji grid of green/red squares per guess (Wordle copy-paste pattern).

### 5.9 Telemetry (if going public)
- Track: completion rate, avg guesses per win, hint-usage rate. Use a privacy-respecting analytics tool or none at all.

### 5.10 Internationalisation (if relevant)
- Keep words list pluggable (`words_<lang>_<tier>.json`). Letter-frequency rules and alphabets differ per language — Spanish needs `ñ`, German `ß ä ö ü`, etc.

### 5.11 Testing
- Pure logic (word picker, guess validator, win/loss state) → unit tests.
- Render / animation → visual smoke test, manual.
- Hangman state machine is small enough that exhaustive unit tests are realistic.

### 5.12 Scope guardrails (recommendation)
**v1 (MVP):** single difficulty, one theme (classic arcade), offline JSON word list, keyboard + click, win/lose, streak counter. Done = playable end-to-end.  
**v2:** themes, categories, hint power-pellets, sound, daily challenge.  
**v3:** stats, achievements, leaderboard, share-result, accessibility polish.

---

## Open Questions for Theo

1. Personal/portfolio project, or intended for public release? (drives §5.1 legal scope)
2. Tech stack — vanilla browser stack OK, or a preference for a framework?
3. Audience — kids/education, casual adult, or arcade enthusiasts? (drives default theme: #3 vs #1)
4. Categories required at v1, or word-only is enough?
5. Daily challenge wanted at v1 or v2?

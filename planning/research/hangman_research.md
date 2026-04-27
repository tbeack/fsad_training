# PacHangman Research

## Rules of Hangman

Traditional hangman is a word-guessing game played between two parties:

- One player (or the system) selects a secret word; the other player guesses letters one at a time.
- **Correct guess:** the letter is revealed in every position it appears.
- **Wrong guess:** one body part is added to the gallows (classic sequence: head, body, left arm, right arm, left leg, right leg — 6 misses allowed by default).
- **Win condition:** all letters are revealed before the figure is complete.
- **Lose condition:** the figure is completed before the word is guessed.
- Players may also guess the full word at any time; an incorrect word guess counts as a wrong letter guess.

---

## Gameplay Options

### Difficulty Levels

| Level | Word length | Vocabulary | Wrong guesses allowed |
|---|---|---|---|
| Easy | 3–5 letters | Common (top 1000 words) | 8 |
| Medium | 5–8 letters | General | 6 |
| Hard | 8+ letters | Advanced / uncommon | 4 |
| Expert | Any | Obscure; timed (10 s/guess) | 3 |

### Visualizations
- **Classic gallows** — progressive stick-figure build (universal recognition)
- **Pac-Man ghost chase** — ghosts advance on Pac-Man with each wrong guess (on-theme)
- **Dot depletion** — Pac-Man's power-pellet bar drains; ghost threat rises
- **Maze reveal** — wrong guesses erase maze walls, cornering Pac-Man

### Gamification
- Streak multiplier for consecutive correct guesses
- Hint tokens purchasable with score (reveal a letter, eliminate 5 wrong letters, show word category)
- Speed bonus for guesses under 3 seconds
- Daily challenge word with global leaderboard
- Combo animations and sound effects on correct guesses

---

## Visual Design — Top 3 Pac-Man-Inspired Concepts

Ranked by pattern popularity in retro/arcade web games:

### 1. Ghost Chase (most popular)
The four classic ghosts (Blinky, Pinky, Inky, Clyde) start at the far side of the screen and advance one step toward Pac-Man with each wrong guess. On the 6th miss the lead ghost reaches Pac-Man — death animation plays.

- **Background:** dark maze tile grid with faint dot pattern
- **Palette:** `#1a1a2e` (bg), `#FFD700` (Pac-Man), `#FF0000` (Blinky), `#FFB8FF` (Pinky), `#00FFFF` (Inky), `#FFB852` (Clyde)
- **Font:** Press Start 2P or VT323 for labels; system sans for body text
- **Why it works:** the advancing threat creates mounting tension that mirrors the dread of a wrong guess

### 2. Pac-Man Maze Reveal
Word letters are displayed as maze openings. Wrong guesses darken segments of the maze, progressively trapping Pac-Man in a shrinking path.

- **Background:** full maze grid (28 × 31 tile layout reference from original arcade)
- **Palette:** `#0000FF` (walls), `#FFD700` (Pac-Man + pellets), `#000000` (bg)
- **Interaction:** keyboard letter tiles styled as maze corridor segments
- **Why it works:** familiar spatial layout; strong brand recall

### 3. Power-Pellet Depletion
Pac-Man starts with 4 power pellets (classic number). Each wrong guess consumes one pellet and makes the ghosts progressively more opaque/threatening on screen. Final wrong guess: all pellets gone, frightened mode ends, game over.

- **Background:** minimal — black with single corridor strip
- **Palette:** `#FFD700`, `#1a1a2e`, ghost quartet colors
- **Why it works:** cleanest layout; strong metaphor (you lose your power as mistakes accumulate); most mobile-friendly

---

## Word / Dictionary Selection

### Options Evaluated

| Option | Pros | Cons |
|---|---|---|
| Local bundled wordlist | Offline; instant; no API rate limits | Must be manually curated; static |
| Random Word API | Free, filterable by length | Requires network; words unrated for difficulty |
| Wordnik API | Large, difficulty-rated, categorized | Requires API key; rate-limited free tier |
| Datamuse API | Themed lists (animals, foods, etc.) | Network required; response latency |

### Recommendation
Bundle a curated local wordlist of ~3 000 words organized by tier:
- **Easy:** 3–5 letter common nouns and verbs (frequency rank < 1 000)
- **Medium:** 5–8 letter general vocabulary
- **Hard:** 8+ letters, low-frequency words

Optionally layer in Datamuse for themed category rounds when online. Validates the "categories" gameplay option without hard-coupling the core game to network availability.

Exclude proper nouns, abbreviations, and words with hyphens or apostrophes from all tiers.

---

## Missing Considerations

The following were not in the original prompt but surfaced during research:

1. **Accessibility** — keyboard-only navigation is required; screen readers need ARIA live regions to announce each letter reveal.
2. **Content filtering** — the bundled wordlist should exclude words that could be inappropriate for all-ages audiences.
3. **Category mode** — letting players pick a theme (animals, movies, geography) dramatically increases replay value.
4. **Multiplayer** — player 1 types a secret word, player 2 guesses; simple and high-value for classroom or party use.
5. **State persistence** — `localStorage` save/restore so a game survives a page refresh.
6. **Mobile virtual keyboard** — on-screen A–Z grid is essential; native keyboard is hard to use on mobile for single-letter guessing.
7. **Internationalization** — Spanish and French wordlists are low-effort additions given the bundled-wordlist architecture.
8. **Word validation feedback** — when the full-word guess is wrong, briefly show it crossed out before clearing so the player knows it was registered.

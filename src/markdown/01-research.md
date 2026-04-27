# Research — PacHangman

## Prompt

> I am creating a new word game titled "PacHangman". Do research on the game "hangman" and output your research to `./planning/research/hangman_research.md`. The research should include the following:
>
> - rules of the game
> - game play options (difficulty levels, visualizations, gamification)
> - visual design, focus on a pac-man inspired theme for the visual designs. pick top 3 visual designs based on popularity
> - word/dictionary selection and integration
> - suggest anything I am missing

---

**Output:** [`./demo/research/hangman_research.md`](../demo/research/hangman_research.md)

[View session replay →](../session-replay/Hangman%20-%20Start%20the%20Research%20and%20Spec.html)

---

## hangman_research.md

```markdown
# PacHangman Research

## Rules of Hangman

Traditional hangman is a word-guessing game played between two parties:

- One player (or the system) selects a secret word; the other player guesses letters one at a time.
- **Correct guess:** the letter is revealed in every position it appears.
- **Wrong guess:** one body part is added to the gallows (classic sequence: head, body, left arm,
  right arm, left leg, right leg — 6 misses allowed by default).
- **Win condition:** all letters are revealed before the figure is complete.
- **Lose condition:** the figure is completed before the word is guessed.
- Players may also guess the full word at any time; an incorrect word guess counts as a wrong
  letter guess.

---

## Gameplay Options

### Difficulty Levels

| Level  | Word length  | Vocabulary              | Wrong guesses allowed |
|--------|--------------|-------------------------|-----------------------|
| Easy   | 3–5 letters  | Common (top 1000 words) | 8                     |
| Medium | 5–8 letters  | General                 | 6                     |
| Hard   | 8+ letters   | Advanced / uncommon     | 4                     |
| Expert | Any          | Obscure; timed (10s)    | 3                     |

### Visualizations
- **Classic gallows** — progressive stick-figure build (universal recognition)
- **Pac-Man ghost chase** — ghosts advance on Pac-Man with each wrong guess (on-theme)
- **Dot depletion** — Pac-Man's power-pellet bar drains; ghost threat rises
- **Maze reveal** — wrong guesses erase maze walls, cornering Pac-Man

### Gamification
- Streak multiplier for consecutive correct guesses
- Hint tokens purchasable with score (reveal a letter, eliminate 5 wrong letters, show category)
- Speed bonus for guesses under 3 seconds
- Daily challenge word with global leaderboard
- Combo animations and sound effects on correct guesses

---

## Visual Design — Top 3 Pac-Man-Inspired Concepts

### 1. Ghost Chase (most popular)
The four classic ghosts (Blinky, Pinky, Inky, Clyde) advance toward Pac-Man with each wrong
guess. On the 6th miss the lead ghost reaches Pac-Man — death animation plays.
- Palette: #1a1a2e (bg), #FFD700 (Pac-Man), #FF0000 / #FFB8FF / #00FFFF / #FFB852 (ghosts)
- Font: Press Start 2P or VT323 for labels

### 2. Pac-Man Maze Reveal
Word letters are displayed as maze openings. Wrong guesses darken segments of the maze,
progressively trapping Pac-Man.
- Full maze grid (28 × 31 tile layout reference from original arcade)
- Keyboard letter tiles styled as maze corridor segments

### 3. Power-Pellet Depletion
Pac-Man starts with 4 power pellets. Each wrong guess consumes one and makes ghosts more
threatening. Final wrong guess: all pellets gone, game over.
- Minimal layout — single corridor strip; strongest mobile layout

---

## Word / Dictionary Selection

| Option           | Pros                                   | Cons                                |
|------------------|----------------------------------------|-------------------------------------|
| Local wordlist   | Offline; instant; no API rate limits   | Must be manually curated; static    |
| Random Word API  | Free, filterable by length             | Requires network; no difficulty     |
| Wordnik API      | Large, difficulty-rated, categorized   | API key required; rate-limited      |
| Datamuse API     | Themed lists (animals, foods, etc.)    | Network required; latency           |

**Recommendation:** Bundle a curated local wordlist of ~3 000 words by tier. Layer in Datamuse
for themed category rounds when online.

---

## Missing Considerations

1. **Accessibility** — keyboard-only nav + ARIA live regions for letter reveals
2. **Content filtering** — exclude inappropriate words from all-ages wordlist
3. **Category mode** — themed word sets (animals, movies, geography)
4. **Multiplayer** — player 1 types word, player 2 guesses
5. **State persistence** — localStorage save/restore across page refresh
6. **Mobile virtual keyboard** — on-screen A–Z grid essential on touch devices
7. **Internationalization** — Spanish/French wordlists (low-effort with bundled arch)
8. **Word validation feedback** — show wrong full-word guess crossed out before clearing
```

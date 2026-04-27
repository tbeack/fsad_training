# PacHangman — Todo

## v1 — Shipped ✓

- [x] Phase 1: Project scaffold, word lists, core game state
- [x] Phase 2: Alphabet pellet grid + Pac-Man traversal animation
- [x] Phase 3: Ghost house — emerge sequence, 6-miss death
- [x] Phase 4: Win condition — maze strobe, victory loop, score formula
- [x] Phase 5: Word-guess CTA, already-guessed ping, duplicate-guess guard
- [x] Phase 6: Persistence — streak, best streak, high score, recent words
- [x] Phase 7: Mobile layout (375×667), reduced-motion support, accessibility
- [x] Phase 8: Verification — 52 checks across AC, browser matrix, E2E, unit tests

## v2 — Backlog (deferred from spec)

- [ ] Real audio: chomp, miss, win, loss, title chiptune
- [ ] Daily challenge mode (fixed word per day, shareable result)
- [ ] Hint power-pellets (spend score to reveal a letter)
- [ ] Frightened-ghost mode (bonus round after eating a power pellet)
- [ ] Column selection for word-guess modal
- [ ] Stats screen: win rate, average guesses, streak history
- [ ] Achievements + leaderboard
- [ ] Multi-theme switcher (classic, neon, retro)
- [ ] XLSX export of word-guess history
- [ ] Multiplayer / async challenge (send a word to a friend)
- [ ] i18n (first target: Spanish word lists)

## Post-ship notes

- Streaming threshold of 50 words/category is right — no reports needed lower.
- `prefers-reduced-motion` fix was the highest-impact a11y win from verify.
- Two product asks landed within 24 h of ship: audio and daily challenge — both already in v2 backlog.
- Start next loop with audio: small scope, high visible impact, unblocks daily challenge chiptune.

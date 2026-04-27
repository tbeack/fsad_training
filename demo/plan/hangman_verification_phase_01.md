# PacHangman — Phase 1 Verification Plan

> Companion to `planning/plan/hang_implementation_plan.md` §Phase 1.  
> Run these checks **after** Phase 1 is complete and before Phase 2 begins.  
> Spec references: `planning/design/hangman_spec.md`.

---

## 1. Context & Scope

Phase 1 delivers all game rules, state transitions, and persistence as pure, DOM-free modules. Nothing in this phase touches the browser; everything is testable in Node.

**In scope for this verification:**
- `src/state.js` — `initialState`, `reduce(state, action)`
- `src/game.js` — `guessLetter`, `guessWord`, `isWin`, `isLoss`, `computeScore`
- `src/words.js` — `loadCategory`, `pickWord`
- `src/persist.js` — `load`, `save`
- Test files: `tests/state.test.js`, `tests/game.test.js`, `tests/words.test.js`
- Recommended addition: `tests/persist.test.js` (see §3.4 — the implementation plan bundles persist tests informally; a dedicated file is cleaner)

**Out of scope until later phases:**
- DOM, render layer, animations — Phase 3+
- Word file content / word counts — Phase 2
- Browser E2E, mobile layout, a11y — Phase 7–8
- CI gating — deferred (personal project)

---

## 2. Environment & Runner

**Node version:** ≥ 20 (for `node:test`). Node ≥ 22 recommended for built-in coverage.  
**Runner:** `node --test tests/` — zero deps, matches implementation plan §1 Pinned Calls.  
**Dev server:** not needed for Phase 1 tests.

### 2.1 Test Shims (zero deps)

#### localStorage shim (add at top of `tests/persist.test.js`)

```js
import { beforeEach } from 'node:test';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

beforeEach(() => store.clear());
```

#### fetch shim (add at top of `tests/words.test.js`)

```js
import { mock } from 'node:test';

// Usage: call mockFetch(data, ok) before each test that exercises loadCategory
function mockFetch(data, ok = true) {
  globalThis.fetch = mock.fn(async () => ({
    ok,
    json: async () => data,
  }));
}
```

---

## 3. Unit Test Catalog

Test IDs follow the pattern `<MODULE>-NN`. Every test must use only `node:test` + `node:assert`.

### 3.1 `tests/state.test.js` — STATE-01 through STATE-13

---

**STATE-01 — `START_GAME` sets word and resets revealed/guessed/lives/outcome**

Setup: `initialState` with `streak: 3`. Dispatch `START_GAME { word: 'joystick', difficulty: 'normal', category: 'arcade' }`.

Expected:
- `state.word === 'joystick'`
- `state.revealed` is `[false, false, false, false, false, false, false, false]` (length 8, all false)
- `state.guessed` is empty (`state.guessed.size === 0`)
- `state.lives === 6`
- `state.outcome === null`
- `state.difficulty === 'normal'`
- `state.category === 'arcade'`
- Prior `streak` (3) is preserved

---

**STATE-02 — `START_GAME` increments level**

Setup: `initialState` with `level: 0`. Dispatch `START_GAME { word: 'cat', difficulty: 'easy', category: 'movies' }`.

Expected: `state.level === 1`.

---

**STATE-03 — `GUESS_LETTER` hit: reveals all matching positions, no life lost**

Setup: after `START_GAME { word: 'joystick' }`. Dispatch `GUESS_LETTER { letter: 'j' }`.

Expected:
- `state.revealed[0] === true`
- All other `revealed` entries remain `false`
- `state.lives === 6`
- `state.outcome === null`
- `state.guessed` contains `'j'`

---

**STATE-04 — `GUESS_LETTER` hit with multi-position letter**

Setup: after `START_GAME { word: 'pepper' }`. Dispatch `GUESS_LETTER { letter: 'p' }`.

Expected: `state.revealed` is `[true, false, true, true, false, false]` (positions 0, 2, 3).

---

**STATE-05 — `GUESS_LETTER` miss: decrement lives, no reveal**

Setup: after `START_GAME { word: 'joystick' }`. Dispatch `GUESS_LETTER { letter: 'z' }`.

Expected:
- `state.lives === 5`
- No `revealed` position changed
- `state.outcome === null`

---

**STATE-06 — `GUESS_LETTER` miss to zero lives: `outcome` becomes `'loss'`**

Setup: state with `lives: 1`, word `'joystick'`, all letters still hidden. Dispatch `GUESS_LETTER { letter: 'z' }`.

Expected:
- `state.lives === 0`
- `state.outcome === 'loss'`
- `state.streak === 0`

---

**STATE-07 — `GUESS_LETTER` repeat: no-op (idempotent)**

Setup: state with `'j'` already in `guessed`, `lives: 6`. Dispatch `GUESS_LETTER { letter: 'j' }`.

Expected: `state.lives === 6`, `revealed` unchanged, no duplicate in `guessed`.

---

**STATE-08 — `GUESS_LETTER` hit completing word: `outcome` becomes `'win'`, streak increments**

Setup: state where word is `'cat'` and `revealed` is `[true, true, false]`, `lives: 6`, `streak: 2`, `bestStreak: 2`. Dispatch `GUESS_LETTER { letter: 't' }`.

Expected:
- `state.outcome === 'win'`
- `state.revealed` is `[true, true, true]`
- `state.streak === 3`
- `state.bestStreak === 3`

---

**STATE-09 — `GUESS_WORD` correct: `outcome` becomes `'win'`**

Setup: after `START_GAME { word: 'joystick' }`. Dispatch `GUESS_WORD { word: 'joystick' }`.

Expected:
- `state.outcome === 'win'`
- `state.streak` incremented by 1

---

**STATE-10 — `GUESS_WORD` wrong: lives decremented**

Setup: after `START_GAME { word: 'joystick' }`, `lives: 6`. Dispatch `GUESS_WORD { word: 'wrong' }`.

Expected:
- `state.lives === 5`
- `state.outcome === null`

---

**STATE-11 — `QUIT` transitions screen to `'title'` and resets streak**

Setup: state in game screen with `streak: 4`. Dispatch `QUIT`.

Expected:
- `state.screen === 'title'`
- `state.streak === 0`

---

**STATE-12 — `SET_SCREEN` transitions screen**

Setup: any state with `screen: 'game'`. Dispatch `SET_SCREEN { screen: 'result' }`.

Expected: `state.screen === 'result'`.

---

**STATE-13 — Reducer is pure (does not mutate input state)**

Setup: `const s0 = reduce(initialState, { type: 'START_GAME', word: 'cat', difficulty: 'easy', category: 'arcade' })`. Freeze `s0` (`Object.freeze`). Call `reduce(s0, { type: 'GUESS_LETTER', letter: 'c' })`.

Expected: no `TypeError` thrown (frozen object untouched); returned state is a different object reference.

---

### 3.2 `tests/game.test.js` — GAME-01 through GAME-18

---

**GAME-01 — `guessLetter` single hit: reveals matching position**

Setup: `{ word: 'cat', revealed: [false, false, false], guessed: new Set(), lives: 6 }`. Call `guessLetter(state, 'c')`.

Expected: delta includes `revealed[0] === true`; `lives` unchanged; `outcome === null`.

---

**GAME-02 — `guessLetter` multi-position hit: reveals all occurrences**

Setup: `{ word: 'pepper', revealed: Array(6).fill(false), guessed: new Set(), lives: 6 }`. Call `guessLetter(state, 'p')`.

Expected: `revealed` is `[true, false, true, true, false, false]`.

---

**GAME-03 — `guessLetter` miss: lives decremented, no reveal**

Setup: `{ word: 'cat', revealed: [false, false, false], guessed: new Set(), lives: 6 }`. Call `guessLetter(state, 'z')`.

Expected: `lives === 5`; `revealed` unchanged; `outcome === null`.

---

**GAME-04 — `guessLetter` miss to zero: `outcome` is `'loss'`**

Setup: same as GAME-03 but `lives: 1`. Call `guessLetter(state, 'z')`.

Expected: `lives === 0`; `outcome === 'loss'`.

---

**GAME-05 — `guessLetter` repeat: returns empty/no-op delta**

Setup: state where `guessed` already contains `'c'`. Call `guessLetter(state, 'c')`.

Expected: `lives` and `revealed` unchanged; `guessed` size unchanged.

---

**GAME-06 — `guessLetter` case-insensitive: uppercase treated as lowercase**

Setup: `{ word: 'cat', revealed: [false, false, false], guessed: new Set(), lives: 6 }`. Call `guessLetter(state, 'C')`.

Expected: same delta as guessing `'c'` — `revealed[0] === true`.

---

**GAME-07 — `guessLetter` non-letter input: no state change**

Setup: word `'cat'`, lives: 6. Call `guessLetter(state, '1')`.

Expected: `lives === 6`; `revealed` unchanged.

---

**GAME-08 — `guessLetter` hit completing last position: `outcome === 'win'`**

Setup: `{ word: 'cat', revealed: [true, true, false], guessed: new Set(['c','a']), lives: 6 }`. Call `guessLetter(state, 't')`.

Expected: `revealed` all true; `outcome === 'win'`.

---

**GAME-09 — `guessWord` correct: `outcome === 'win'`, all positions revealed**

Setup: `{ word: 'joystick', revealed: Array(8).fill(false), lives: 6 }`. Call `guessWord(state, 'joystick')`.

Expected: `outcome === 'win'`; `revealed` all true.

---

**GAME-10 — `guessWord` correct is case-insensitive**

Setup: same as GAME-09. Call `guessWord(state, 'JOYSTICK')`.

Expected: `outcome === 'win'`.

---

**GAME-11 — `guessWord` wrong: lives decremented, `outcome === null`**

Setup: `{ word: 'joystick', lives: 6 }`. Call `guessWord(state, 'notright')`.

Expected: `lives === 5`; `outcome === null`.

---

**GAME-12 — `guessWord` wrong to zero lives: `outcome === 'loss'`**

Setup: `{ word: 'joystick', lives: 1 }`. Call `guessWord(state, 'notright')`.

Expected: `lives === 0`; `outcome === 'loss'`.

---

**GAME-13 — `isWin` returns `true` when all positions revealed**

Call `isWin([true, true, true])`.

Expected: `true`.

---

**GAME-14 — `isWin` returns `false` when any position is hidden**

Call `isWin([true, false, true])`.

Expected: `false`.

---

**GAME-15 — `isLoss` returns `true` at zero lives**

Call `isLoss(0)`.

Expected: `true`.

---

**GAME-16 — `isLoss` returns `false` when lives remain**

Call `isLoss(3)`.

Expected: `false`.

---

**GAME-17 — `computeScore` formula: correct values at each difficulty**

| Call | Expected |
|---|---|
| `computeScore({ difficulty: 'easy', lives: 6, word: 'cat' })` | `60` (10 × 6 × 1.0) |
| `computeScore({ difficulty: 'normal', lives: 6, word: 'electron' })` | `144` (20 × 6 × 1.2) |
| `computeScore({ difficulty: 'hard', lives: 6, word: 'algorithm' })` | `240` (40 × 6 × 1.0) |

Formula: `base(difficulty) × lives × (1 + (word.length - minLength) × 0.1)`.  
Min lengths: easy=3, normal=6, hard=9.

---

**GAME-18 — `computeScore` lives factor and length bonus scale correctly**

Two assertions:
1. `computeScore({ difficulty: 'easy', lives: 3, word: 'cat' }) === 30` (half of GAME-17 easy).
2. `computeScore({ difficulty: 'easy', lives: 6, word: 'quest' })` (length 5) `=== 72` (10 × 6 × 1.2).

---

### 3.3 `tests/words.test.js` — WORDS-01 through WORDS-07

---

**WORDS-01 — `pickWord` returns a string from the correct tier**

Setup: `wordsCache = { arcade: { easy: ['cat','bat','hat'], normal: ['joystick'], hard: ['algorithm'] } }`.  
Call `pickWord({ difficulty: 'easy', category: 'arcade', recentWords: [], wordsCache })`.

Expected: result is one of `['cat','bat','hat']`; type is `string`.

---

**WORDS-02 — `pickWord` avoids `recentWords`**

Setup: pool `['cat','bat','hat']`, `recentWords: ['cat','bat']`.  
Call `pickWord({ difficulty: 'easy', category: 'arcade', recentWords: ['cat','bat'], wordsCache })`.

Expected: result is `'hat'` every time.

---

**WORDS-03 — `pickWord` falls back to full pool when all words in `recentWords`**

Setup: pool `['cat','bat']`, `recentWords: ['cat','bat']`.  
Call `pickWord(...)` 20 times.

Expected: result is always `'cat'` or `'bat'` (no `undefined`).

---

**WORDS-04 — `pickWord` membership: 100 random calls always return pool members**

Setup: pool of 10 words. Call `pickWord` 100 times with empty `recentWords`.

Expected: every returned value is a member of the pool.

---

**WORDS-05 — `loadCategory` returns cached value on second call without re-fetching**

Setup: `wordsCache = { arcade: { easy: ['cat'], normal: [], hard: [] } }`. Mock `fetch` to track call count.  
Call `loadCategory('arcade', wordsCache, () => {})`.

Expected: `fetch` never called; returned value is the pre-populated cache.

---

**WORDS-06 — `loadCategory` fetches, parses, and calls `setCache` exactly once on cold load**

Setup: empty `wordsCache = { arcade: null }`. `mockFetch({ easy: ['cat'], normal: [], hard: [] })`.  
Call `await loadCategory('arcade', wordsCache, setCacheSpy)`.

Expected: `fetch` called once; `setCacheSpy` called once with `{ easy: ['cat'], normal: [], hard: [] }`.

---

**WORDS-07 — `loadCategory` throws on non-ok HTTP response**

Setup: `mockFetch(null, false)` (ok=false).  
Call `await loadCategory('arcade', { arcade: null }, () => {})`.

Expected: throws (or rejects). Caller is responsible for showing error overlay — not covered here.

---

### 3.4 `tests/persist.test.js` — PERSIST-01 through PERSIST-06

> **Note for implementation:** The implementation plan (`hang_implementation_plan.md`) groups persistence tests inside `tests/state.test.js`. A dedicated `tests/persist.test.js` file is recommended — it keeps concerns separated and lets the localStorage shim be scoped to one file. Add to the test runner call and to Phase 1's step list when implementing.

---

**PERSIST-01 — `load()` returns defaults when key is missing**

Setup: localStorage is empty (shim cleared).  
Call `load()`.

Expected: returns an object with `streak: 0`, `bestStreak: 0`, `highScore: 0`, `recentWords: []`, and `settings` with default values. Does not throw.

---

**PERSIST-02 — `load()` returns the stored slice when key is valid**

Setup: `localStorage.setItem('pachangman_v1', JSON.stringify({ streak: 5, bestStreak: 7, highScore: 300, recentWords: ['cat'], settings: { soundEnabled: false, reducedMotion: false } }))`.  
Call `load()`.

Expected: `streak === 5`, `bestStreak === 7`, `highScore === 300`, `recentWords` equals `['cat']`.

---

**PERSIST-03 — `load()` returns defaults on JSON.parse failure (no throw)**

Setup: `localStorage.setItem('pachangman_v1', '{{broken json')`.  
Call `load()`.

Expected: returns defaults; no exception thrown.

---

**PERSIST-04 — `load()` merges missing fields with defaults**

Setup: stored value is `{ streak: 3 }` (no other fields).  
Call `load()`.

Expected: returned object includes `bestStreak: 0`, `highScore: 0`, `recentWords: []` — missing fields filled with defaults.

---

**PERSIST-05 — `save()` only persists the persisted slice**

Setup: call `save({ streak: 2, bestStreak: 4, highScore: 100, recentWords: ['bat'], settings: { soundEnabled: false, reducedMotion: false } })`.  
Inspect `JSON.parse(localStorage.getItem('pachangman_v1'))`.

Expected: the stored object contains only `streak`, `bestStreak`, `highScore`, `recentWords`, `settings`. It does **not** contain `word`, `revealed`, `guessed`, `lives`, `outcome`, `screen`, `wordsCache`.

---

**PERSIST-06 — `save()` / `load()` round-trip**

Setup: slice `{ streak: 9, bestStreak: 12, highScore: 500, recentWords: ['cat','bat'], settings: { soundEnabled: false, reducedMotion: true } }`.  
Call `save(slice)`, then `load()`.

Expected: `load()` result deep-equals `slice`.

---

## 4. Static Checks

Run these grep commands after Phase 1 modules are written. No output = pass.

```bash
# Pure logic modules must have zero DOM / storage access
grep -nE 'document|window\.' src/state.js src/game.js
# Expected: no matches

# words.js may use fetch but not DOM or localStorage
grep -nE 'document|window\.|localStorage' src/words.js
# Expected: no matches

# persist.js may use localStorage but not DOM
grep -nE 'document|window\.' src/persist.js
# Expected: no matches
```

If any of these return matches, the module is not pure — fix before calling Phase 1 verified.

---

## 5. Spec → Test Coverage Matrix

Every spec rule that Phase 1 modules implement maps to at least one test ID.

| Spec Rule | Section | Test IDs |
|---|---|---|
| State shape — `screen`, `difficulty`, `category`, `level` | §4.1 | STATE-01, STATE-02, STATE-12 |
| State shape — `word`, `revealed`, `guessed`, `lives`, `outcome` | §4.1 | STATE-01, STATE-03, STATE-05 |
| State shape — `streak`, `bestStreak`, `highScore`, `recentWords` | §4.1 | STATE-06, STATE-08, STATE-11 |
| State shape — `settings` | §4.1 | PERSIST-01, PERSIST-06 |
| `START_GAME` transition | §4.2 | STATE-01, STATE-02 |
| `GUESS_LETTER` hit path | §4.2 | STATE-03, STATE-04, GAME-01, GAME-02, GAME-06 |
| `GUESS_LETTER` miss path | §4.2 | STATE-05, GAME-03, GAME-04 |
| `GUESS_LETTER` repeat no-op | §4.2 | STATE-07, GAME-05 |
| `GUESS_WORD` correct | §4.2 | STATE-09, GAME-09, GAME-10 |
| `GUESS_WORD` wrong | §4.2 | STATE-10, GAME-11 |
| `QUIT` resets streak | §4.2 | STATE-11 |
| `RESTART` same config, new word | §4.2 | (implied STATE-02; reducer handles same as START_GAME + level bump) |
| `SET_SCREEN` | §4.2 | STATE-12 |
| WIN detection (all revealed) | §4.2, §5.1 | STATE-08, GAME-08, GAME-13 |
| LOSS detection (lives=0) | §4.2, §5.1 | STATE-06, GAME-04, GAME-12, GAME-15, GAME-16 |
| Reducer is pure | §4.2 | STATE-13 |
| `wordsCache` not persisted | §4.3 | PERSIST-05 |
| Persistence key `pachangman_v1` | §4.3 | PERSIST-02, PERSIST-06 |
| Parse-fail returns defaults | §4.3 | PERSIST-03, PERSIST-04 |
| Letter hit reveals all positions | §5.1 rule 3 | GAME-02, STATE-04 |
| Letter miss decrements lives | §5.1 rule 4 | GAME-03, STATE-05 |
| Wrong word guess costs 1 miss | §5.1 rule 5 | GAME-11, STATE-10 |
| WIN = all positions revealed | §5.1 rule 6 | GAME-08, GAME-13 |
| LOSS = lives === 0 | §5.1 rule 7 | GAME-04, GAME-15 |
| All difficulty tiers have 6 lives | §5.2 | STATE-01 (lives init) |
| Word length tiers per difficulty | §5.2 | WORDS-01 (tier correctness) |
| `pickWord` avoids `recentWords` | §5.4 | WORDS-02 |
| `pickWord` fallback to full pool | §5.4 | WORDS-03 |
| `loadCategory` fetch + cache | §5.4 | WORDS-05, WORDS-06 |
| `loadCategory` throws on non-ok | §5.4 | WORDS-07 |
| `computeScore` formula | §5.6 | GAME-17, GAME-18 |
| Score formula per tier (easy/normal/hard) | §5.6 | GAME-17 |

---

## 6. Test Automation

### 6.1 npm Script

Add `"test"` to `package.json` `scripts` (currently only `"build-words"` exists):

```json
{
  "name": "pachangman",
  "type": "module",
  "scripts": {
    "build-words": "node tools/build-wordlists.js",
    "test": "node --test tests/"
  }
}
```

**Run all tests:** `npm test`

### 6.2 Run Individual Test Files

```bash
node --test tests/state.test.js
node --test tests/game.test.js
node --test tests/words.test.js
node --test tests/persist.test.js
```

### 6.3 Optional: Built-in Coverage (Node ≥ 22)

No deps required. Run:

```bash
node --test --experimental-test-coverage tests/
```

Target thresholds (aspirational, not blocking):

| Module | Line coverage target |
|---|---|
| `src/state.js` | ≥ 90% |
| `src/game.js` | ≥ 90% |
| `src/words.js` | ≥ 85% |
| `src/persist.js` | ≥ 90% |

If coverage falls short, identify uncovered branches and either add a test case or confirm the branch is defensive dead code.

---

## 7. Exit Criteria

Phase 1 is verified when **all** of the following hold:

- [ ] `npm test` → `node --test tests/` exits 0 — all 43 test cases pass with zero failures.
- [ ] Static checks — all four `grep` commands above return zero matches.
- [ ] Coverage matrix — every row in §5 has at least one green test ID (no uncovered spec rule).
- [ ] Optional: `node --test --experimental-test-coverage tests/` reports ≥ 90% line coverage on the four pure modules (Node ≥ 22 only).

Do **not** proceed to Phase 2 (word list build pipeline) until all mandatory items above are checked.

---

## 8. Out of Scope (defer to later phases)

| Item | Phase |
|---|---|
| Word JSON file content, word counts (≥ 900/tier) | Phase 2 |
| DOM, render layer, screen switching | Phase 3 |
| Maze, sprites, animations | Phases 4–6 |
| Mobile layout, a11y, keyboard-only runs | Phase 7 |
| Browser E2E, cross-browser matrix | Phase 8 |
| CI / GitHub Actions | Deferred (personal project) |
| Manual REPL smoke tests | Omitted — Phase 3 render layer integration covers this |

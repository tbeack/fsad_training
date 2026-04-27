# PacHangman — Phase 2 Verification Plan

> Companion to `planning/plan/hang_implementation_plan.md` §Phase 2.  
> Run these checks **after** Phase 2 is complete and before Phase 3 begins.  
> Spec references: `planning/design/hangman_spec.md`.

---

## 1. Context & Scope

Phase 2 delivers the dev-time word-list build pipeline. The deliverables are:

- Three seed files consumed by the build script
- `tools/build-wordlists.js` — the build script itself
- Three output JSON files consumed by the game at runtime

This phase has no pure-function unit tests in the same sense as Phase 1. Verification is instead a combination of static checks on source files, behavioral checks on build-script execution, and structural + content assertions on the generated JSON files.

**In scope for this verification:**
- `tools/seeds/arcade.txt`
- `tools/seeds/scitech.txt`
- `tools/seeds/movies.txt`
- `tools/build-wordlists.js`
- `words/arcade.json`, `words/scitech.json`, `words/movies.json` (generated output)
- `tests/words-output.test.js` (new test file prescribed below — runs post-build)

**Out of scope until later phases:**
- Runtime word loading and caching (`src/words.js`) — already verified in Phase 1
- DOM, render layer, game screen — Phase 3+
- Browser E2E, mobile, a11y — Phases 7–8

---

## 2. Environment & Runner

**Prerequisite:** `npm run build-words` has been run at least once, producing `words/*.json`.  
**Node version:** ≥ 20 (for `node:test`).  
**Runner for output tests:** `node --test tests/words-output.test.js`.  
**Dev server:** not needed.

The checks in §3 are grouped into two categories:
- **Shell / static checks** — bash one-liners, run manually, zero deps.
- **Automated test cases** — inside `tests/words-output.test.js`, run with `node:test`.

---

## 3. Verification Check Catalog

Check IDs follow the pattern `<GROUP>-NN`.

---

### 3.1 Seed Files — SEED-01 through SEED-06

---

**SEED-01 — `arcade.txt` has ≥ 40 non-empty lines**

```bash
grep -c '[a-z]' tools/seeds/arcade.txt
# Expected: prints a number ≥ 40
```

---

**SEED-02 — `scitech.txt` has ≥ 40 non-empty lines**

```bash
grep -c '[a-z]' tools/seeds/scitech.txt
# Expected: prints a number ≥ 40
```

---

**SEED-03 — `movies.txt` has ≥ 60 non-empty lines**

Movies needs more seeds than the other categories because each curated title maps directly into the output word pool — the script does not expand them via dictionary lookup.

```bash
grep -c '[a-z]' tools/seeds/movies.txt
# Expected: prints a number ≥ 60
```

---

**SEED-04 — All seed lines contain only lowercase a-z characters (no digits, spaces, punctuation)**

```bash
grep -vnE '^[a-z]+$' tools/seeds/arcade.txt tools/seeds/scitech.txt tools/seeds/movies.txt
# Expected: no output (every non-empty line is purely lowercase alpha)
```

---

**SEED-05 — No duplicate lines within each seed file**

```bash
sort tools/seeds/arcade.txt  | uniq -d
sort tools/seeds/scitech.txt | uniq -d
sort tools/seeds/movies.txt  | uniq -d
# Expected: no output from any command (no duplicates)
```

---

**SEED-06 — Representative seeds are present in each file**

```bash
# Arcade: spot-check 5 canonical gaming terms
for w in pixel joystick arcade sprite combo; do
  grep -qx "$w" tools/seeds/arcade.txt && echo "OK $w" || echo "MISSING $w"
done

# Sci-Tech: spot-check 5 canonical STEM terms
for w in algorithm electron quantum circuit genome; do
  grep -qx "$w" tools/seeds/scitech.txt && echo "OK $w" || echo "MISSING $w"
done

# Movies: spot-check across all three length tiers
for w in jaws frozen inception; do
  grep -qx "$w" tools/seeds/movies.txt && echo "OK $w" || echo "MISSING $w"
done
# Expected: all lines say "OK <word>"
```

---

### 3.2 Build Script Behavior — BUILD-01 through BUILD-05

---

**BUILD-01 — `npm run build-words` exits 0**

```bash
npm run build-words
echo "Exit code: $?"
# Expected: 0
```

---

**BUILD-02 — Build is idempotent: running twice does not corrupt output**

```bash
# Run once, record counts
npm run build-words 2>&1 | grep -E 'easy:|normal:|hard:' > /tmp/run1.txt

# Run again, record counts
npm run build-words 2>&1 | grep -E 'easy:|normal:|hard:' > /tmp/run2.txt

# Compare tier count lines (counts must be identical)
diff /tmp/run1.txt /tmp/run2.txt
# Expected: no diff output (counts unchanged across runs)
```

---

**BUILD-03 — Console output includes count lines for all three categories**

```bash
npm run build-words 2>&1 | grep -E '(arcade|scitech|movies)' | grep -E 'easy:|normal:|hard:'
# Expected: 9 lines total (3 categories × 3 tiers) — each line shows a count
```

---

**BUILD-04 — Console output contains no "UNDER 900" warnings**

```bash
npm run build-words 2>&1 | grep 'UNDER 900'
# Expected: no output (empty — no tier fell below 900)
```

---

**BUILD-05 — Cache files are written on first run and reused on second run**

Check that after the first `npm run build-words`, all three cache files exist and have non-zero size:

```bash
ls -lh tools/cache/words_dictionary.json tools/cache/google-10000-english.txt tools/cache/ldnoobw-en.txt
# Expected: all three files present with size > 0

# Confirm second run does NOT re-download (no "Downloading" lines)
npm run build-words 2>&1 | grep 'Downloading'
# Expected: no output (all sources already cached)
```

---

### 3.3 Output File Structure — STRUCT-01 through STRUCT-06

These checks belong in `tests/words-output.test.js`.

---

**STRUCT-01 — All three output files exist and parse as valid JSON**

For each of `words/arcade.json`, `words/scitech.json`, `words/movies.json`:

Setup: `JSON.parse(readFileSync(path, 'utf8'))`.

Expected: does not throw; returns an object.

---

**STRUCT-02 — Each file has exactly the keys `easy`, `normal`, `hard` (no extras)**

Setup: `Object.keys(parsed).sort()`.

Expected: deep-equals `['easy', 'hard', 'normal']` (sorted).

---

**STRUCT-03 — `easy`, `normal`, and `hard` values are non-empty arrays**

Expected: `Array.isArray(tier) && tier.length > 0` for each of the three tiers in each file.

---

**STRUCT-04 — Every element in every tier is a non-empty string**

For each tier array, every element satisfies `typeof el === 'string' && el.length > 0`.

---

**STRUCT-05 — Every word contains only lowercase a-z characters (no digits, spaces, hyphens)**

Expected: `el.match(/^[a-z]+$/)` truthy for every word in every tier.

---

**STRUCT-06 — No word appears in more than one tier of the same file (cross-tier uniqueness)**

For each file: `arcade.json` easy ∩ normal, easy ∩ hard, normal ∩ hard must all be empty sets.

Rationale: the length-bucket filter is mutually exclusive (3–5, 6–8, 9–14 are disjoint ranges), so any cross-tier duplicate signals a bucketing bug.

---

### 3.4 Word Counts — COUNT-01 through COUNT-09

These checks belong in `tests/words-output.test.js`.

---

**COUNT-01 — `arcade.json` easy tier has exactly 1,000 words**

`assert.strictEqual(arcade.easy.length, 1000)`.

---

**COUNT-02 — `arcade.json` normal tier has exactly 1,000 words**

`assert.strictEqual(arcade.normal.length, 1000)`.

---

**COUNT-03 — `arcade.json` hard tier has exactly 1,000 words**

`assert.strictEqual(arcade.hard.length, 1000)`.

---

**COUNT-04 — `scitech.json` easy tier has exactly 1,000 words**

---

**COUNT-05 — `scitech.json` normal tier has exactly 1,000 words**

---

**COUNT-06 — `scitech.json` hard tier has exactly 1,000 words**

---

**COUNT-07 — `movies.json` easy tier has exactly 1,000 words**

---

**COUNT-08 — `movies.json` normal tier has exactly 1,000 words**

---

**COUNT-09 — `movies.json` hard tier has exactly 1,000 words**

> **Minimum bar:** The implementation plan specifies ≥ 900 as the floor and 1,000 as the cap. COUNT-01–09 assert exactly 1,000, which is the expected output when the build script has enough candidates (backfill from the frequency list guarantees this). If a tier legitimately cannot reach 1,000 even with backfill, record the shortfall at the top of `words/README.md` and lower the assertion to `tier.length >= 900`.

---

### 3.5 Word Length Constraints — LEN-01 through LEN-09

These checks belong in `tests/words-output.test.js`.

---

**LEN-01 — All words in `arcade.json` easy tier are 3–5 characters**

```js
const invalid = arcade.easy.filter(w => w.length < 3 || w.length > 5);
assert.strictEqual(invalid.length, 0);
```

---

**LEN-02 — All words in `arcade.json` normal tier are 6–8 characters**

---

**LEN-03 — All words in `arcade.json` hard tier are 9–14 characters**

---

**LEN-04 through LEN-06 — Same length checks for `scitech.json`**

---

**LEN-07 through LEN-09 — Same length checks for `movies.json`**

---

### 3.6 Content Integrity — CONTENT-01 through CONTENT-08

---

**CONTENT-01 — No intra-tier duplicate words**

For each tier of each file, `new Set(tier).size === tier.length`.

Test placement: `tests/words-output.test.js`.

---

**CONTENT-02 — Key arcade seeds appear in `arcade.json`**

Check that representative seeds are present somewhere across the three tiers (the build preserves seeds for movies; for arcade/scitech, seeds pass through the dictionary filter):

```bash
node -e "
const a = JSON.parse(require('fs').readFileSync('words/arcade.json','utf8'));
const all = new Set([...a.easy, ...a.normal, ...a.hard]);
['pixel','joystick','arcade','sprite','combo','score','laser'].forEach(w => {
  console.log(all.has(w) ? 'OK   ' + w : 'WARN ' + w + ' (not present — may be filtered)');
});
"
```

> **Note:** Seeds that are not in the dwyl dictionary (e.g., proper nouns like `pacman`, `atari`) may not appear in the output — this is expected. The check is informational, not a hard failure.

---

**CONTENT-03 — Key sci-tech seeds appear in `scitech.json`**

```bash
node -e "
const s = JSON.parse(require('fs').readFileSync('words/scitech.json','utf8'));
const all = new Set([...s.easy, ...s.normal, ...s.hard]);
['binary','circuit','kernel','matrix','entropy','genome'].forEach(w => {
  console.log(all.has(w) ? 'OK   ' + w : 'WARN ' + w);
});
"
```

---

**CONTENT-04 — Curated movie seeds appear in the correct tier of `movies.json`**

Movies seeds are the primary pool (not filtered via dwyl). All should be present in their correct tier.

```bash
node -e "
const m = JSON.parse(require('fs').readFileSync('words/movies.json','utf8'));
const checks = [
  ['jaws',         'easy'],
  ['alien',        'easy'],
  ['tenet',        'easy'],
  ['frozen',       'normal'],
  ['matrix',       'normal'],
  ['joker',        'easy'],
  ['gladiator',    'hard'],
  ['inception',    'hard'],
  ['beetlejuice',  'hard'],
  ['parasite',     'normal'],
];
let pass = true;
checks.forEach(([w, tier]) => {
  const found = m[tier].includes(w);
  console.log((found ? 'OK   ' : 'FAIL ') + w + ' in ' + tier);
  if (!found) pass = false;
});
process.exit(pass ? 0 : 1);
"
# Expected: all lines say "OK   <word>" and exit code is 0
```

---

**CONTENT-05 — No word is shorter than 3 or longer than 14 characters across any file**

```bash
node -e "
['arcade','scitech','movies'].forEach(cat => {
  const data = JSON.parse(require('fs').readFileSync('words/' + cat + '.json','utf8'));
  ['easy','normal','hard'].forEach(tier => {
    const bad = data[tier].filter(w => w.length < 3 || w.length > 14);
    if (bad.length) console.error('FAIL', cat, tier, bad.slice(0,3));
    else console.log('OK', cat, tier);
  });
});
"
# Expected: all lines say "OK <category> <tier>"
```

---

**CONTENT-06 — Profanity spot-check (known entries absent)**

Spot-check a small set of well-known profane words that appear in LDNOOBW. If any are present, the profanity filter is broken.

```bash
node -e "
const knownBad = ['shit', 'fuck', 'cunt', 'ass', 'bitch'];
['arcade','scitech','movies'].forEach(cat => {
  const data = JSON.parse(require('fs').readFileSync('words/' + cat + '.json','utf8'));
  const all = new Set([...data.easy, ...data.normal, ...data.hard]);
  knownBad.forEach(w => {
    if (all.has(w)) console.error('FAIL profanity in', cat + ':', w);
  });
});
console.log('Profanity spot-check done');
"
# Expected: no FAIL lines
```

---

**CONTENT-07 — Word lists are shuffled (not alphabetically ordered)**

The build script runs Fisher-Yates shuffle on each tier. A fully alphabetical output means shuffle was skipped.

```bash
node -e "
const a = JSON.parse(require('fs').readFileSync('words/arcade.json','utf8'));
const tier = a.easy;
let sorted = 0;
for (let i = 0; i < tier.length - 1; i++) {
  if (tier[i] < tier[i+1]) sorted++;
}
const ratio = sorted / (tier.length - 1);
// A shuffled list will have ~50% ascending pairs; > 95% signals no shuffle
console.assert(ratio < 0.95, 'easy tier looks unshuffled: ' + ratio.toFixed(2));
console.log('Shuffle check: ascending ratio =', ratio.toFixed(2), '(expected ≈ 0.50)');
"
```

---

**CONTENT-08 — `words/` directory contains exactly three files after build**

```bash
ls words/*.json | wc -l | tr -d ' '
# Expected: 3
```

---

## 4. Static Checks

Run these after Phase 2 implementation but before running the automated tests. No output = pass (for the grep commands).

```bash
# Build script uses only Node built-ins — no third-party imports
grep -nE "^import .* from '(?!node:|fs|path|url)" tools/build-wordlists.js
# Expected: no matches (only 'fs', 'path', 'url' built-in imports)

# Build script must not use synchronous network calls (XMLHttpRequest etc.)
grep -nE 'XMLHttpRequest' tools/build-wordlists.js
# Expected: no matches

# All seed files use Unix line endings (LF), no Windows CRLF
file tools/seeds/arcade.txt tools/seeds/scitech.txt tools/seeds/movies.txt
# Expected: all reported as "ASCII text" (not "CRLF line terminators")

# words/ output files must not be committed to git (they are generated artifacts)
git status words/ 2>/dev/null || echo "(not a git repo — skip)"
```

---

## 5. Test File: `tests/words-output.test.js`

This file is prescribed by this verification plan (not in the original implementation plan). It reads the generated JSON files and asserts structural + count + length invariants. It must be run **after** `npm run build-words`.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const load = cat => JSON.parse(readFileSync(join(__dirname, '..', 'words', cat + '.json'), 'utf8'));

const CATEGORIES = ['arcade', 'scitech', 'movies'];
const TIERS      = [['easy', 3, 5], ['normal', 6, 8], ['hard', 9, 14]];

for (const cat of CATEGORIES) {
  test(`${cat}.json — valid JSON with correct keys`, () => {
    const data = load(cat);                                        // STRUCT-01
    assert.deepStrictEqual(Object.keys(data).sort(), ['easy', 'hard', 'normal']); // STRUCT-02
  });

  for (const [tier, min, max] of TIERS) {
    test(`${cat}.json ${tier} — count is 1000`, () => {
      const data = load(cat);
      assert.ok(Array.isArray(data[tier]), 'not an array');        // STRUCT-03
      assert.strictEqual(data[tier].length, 1000);                // COUNT-01..09
    });

    test(`${cat}.json ${tier} — all words are lowercase alpha strings`, () => {
      const data = load(cat);
      const invalid = data[tier].filter(w => typeof w !== 'string' || !/^[a-z]+$/.test(w));
      assert.strictEqual(invalid.length, 0, `invalid words: ${invalid.slice(0, 3)}`); // STRUCT-04, STRUCT-05
    });

    test(`${cat}.json ${tier} — all word lengths are ${min}–${max}`, () => {
      const data = load(cat);
      const invalid = data[tier].filter(w => w.length < min || w.length > max);
      assert.strictEqual(invalid.length, 0, `out-of-range: ${invalid.slice(0, 3)}`); // LEN-01..09
    });

    test(`${cat}.json ${tier} — no duplicate words`, () => {
      const data = load(cat);
      const unique = new Set(data[tier]);
      assert.strictEqual(unique.size, data[tier].length);         // CONTENT-01
    });
  }

  test(`${cat}.json — no word appears in more than one tier`, () => {
    const data = load(cat);
    const easySet   = new Set(data.easy);
    const normalSet = new Set(data.normal);
    const easyNormal = data.normal.filter(w => easySet.has(w));
    const easyHard   = data.hard.filter(w => easySet.has(w));
    const normalHard = data.hard.filter(w => normalSet.has(w));
    assert.strictEqual(easyNormal.length, 0, `easy∩normal: ${easyNormal.slice(0, 3)}`); // STRUCT-06
    assert.strictEqual(easyHard.length,   0, `easy∩hard: ${easyHard.slice(0, 3)}`);
    assert.strictEqual(normalHard.length, 0, `normal∩hard: ${normalHard.slice(0, 3)}`);
  });
}

// CONTENT-04: curated movie seeds present in correct tiers
test('movies.json — curated seeds present in correct tiers', () => {
  const m = load('movies');
  const seedsInTier = [
    ['jaws',        'easy'],
    ['alien',       'easy'],
    ['tenet',       'easy'],
    ['frozen',      'normal'],
    ['matrix',      'normal'],
    ['gladiator',   'hard'],
    ['inception',   'hard'],
    ['beetlejuice', 'hard'],
  ];
  for (const [word, tier] of seedsInTier) {
    assert.ok(m[tier].includes(word), `"${word}" missing from movies.${tier}`);
  }
});
```

**Run:** `node --test tests/words-output.test.js`

**Test count:** 43 test cases (3 categories × (1 keys check + 3 tiers × 4 checks + 1 cross-tier check) + 1 movie seeds check).

---

## 6. Spec → Check Coverage Matrix

Every spec requirement that Phase 2 must satisfy maps to at least one check ID.

| Spec Rule | Section | Check IDs |
|---|---|---|
| Three categories: arcade, scitech, movies | §5.3 | STRUCT-01, BUILD-01 |
| File layout: `words/<category>.json` | §5.3 | STRUCT-01 |
| Shape: `{ easy: string[], normal: string[], hard: string[] }` | §5.3, §5.4 | STRUCT-02, STRUCT-03, STRUCT-04 |
| 1,000 words per difficulty tier per category | §5.3 | COUNT-01–09 |
| Easy = 3–5 char words | §5.2 | LEN-01, LEN-04, LEN-07 |
| Normal = 6–8 char words | §5.2 | LEN-02, LEN-05, LEN-08 |
| Hard = 9–14 char words | §5.2 | LEN-03, LEN-06, LEN-09 |
| Words are lowercase alpha only (valid hangman tokens) | §5.3 | STRUCT-05, CONTENT-05 |
| No duplicate words within a tier | §5.5 step 8 (shuffle+cap implies unique source) | CONTENT-01 |
| No cross-tier duplicates (disjoint length ranges) | §5.5 steps 4–5 | STRUCT-06 |
| Seed file present per category | §5.5 step 3 | SEED-01–SEED-06 |
| Seeds contain only lowercase alpha words | §5.3 (seed format implied) | SEED-04 |
| Build downloads and caches source dictionaries | §5.5 steps 1–3 | BUILD-05 |
| Build applies profanity blocklist | §5.5 step 6 | CONTENT-06 |
| Backfill from frequency list when tier < 1,000 | §5.5 step 7 | COUNT-07–09 (movies needs backfill) |
| Shuffle each tier before output | §5.5 step 8 | CONTENT-07 |
| Build script is zero-dependency (dev-time Node only) | §1 Pinned Calls | Static check (§4) |
| Cache reuse on repeated runs | §5.5 step 1 ("if missing") | BUILD-05 |
| Idempotent output shape | (implied: running twice must not corrupt) | BUILD-02 |
| Movies: curated single-word titles present | §5.3 Movies | CONTENT-04 |

---

## 7. Automation

### 7.1 npm Script (post-build test)

Add an optional `"test:words"` script to `package.json` for quick re-verification after a rebuild:

```json
{
  "scripts": {
    "build-words":  "node tools/build-wordlists.js",
    "test":         "node --test tests/",
    "test:words":   "node --test tests/words-output.test.js"
  }
}
```

### 7.2 Recommended Run Order

```bash
# 1. Build word lists
npm run build-words

# 2. Run structural + content tests
node --test tests/words-output.test.js

# 3. Run manual shell checks from §3.1–§3.2 and §4 (copy-paste into terminal)
```

### 7.3 Full Test Suite (Phase 1 + Phase 2)

After Phase 2, `npm test` runs `node --test tests/` which discovers all `*.test.js` files, including both Phase 1 tests and `tests/words-output.test.js`. Confirm the combined run is still green:

```bash
npm test
# Expected: all test cases pass (zero failures)
```

---

## 8. Exit Criteria

Phase 2 is verified when **all** of the following hold:

- [ ] `npm run build-words` exits 0 — no errors, no "UNDER 900" warnings (BUILD-01, BUILD-04).
- [ ] `node --test tests/words-output.test.js` exits 0 — all 43 test cases green (COUNT-01–09, LEN-01–09, STRUCT-01–06, CONTENT-01, CONTENT-04).
- [ ] SEED-04 static check passes — no seed line contains non-alpha characters.
- [ ] SEED-05 static check passes — no duplicate seeds within any file.
- [ ] CONTENT-04 shell script exits 0 — curated movie seeds present in correct tiers.
- [ ] CONTENT-06 profanity spot-check passes — no known-bad words in output files.
- [ ] BUILD-05 cache check passes — second run prints no "Downloading" lines.
- [ ] Coverage matrix — every row in §6 has at least one passing check.

Do **not** proceed to Phase 3 (theme + screens shell) until all mandatory items above are checked.

---

## 9. Out of Scope (defer to later phases)

| Item | Phase |
|---|---|
| Runtime `loadCategory` / `pickWord` integration | Phase 1 (already done) |
| DOM rendering of category selector, word fetch | Phase 3 |
| Game screen word display from loaded JSON | Phase 5 |
| Slow-network "LOADING…" spinner verification | Phase 7 |
| Browser E2E, cross-browser word rendering | Phase 8 |
| Word count documentation in `words/README.md` (only if any tier < 1,000) | Phase 8 AC #12 |
| Daily-challenge deterministic word selection | v2 (out of v1 scope) |
| gzip word bundle compression | v2 |

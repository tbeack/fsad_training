# FSD_Train-021 — Replace search with MiniSearch + semantic layer (port CBP-148)

## Source
User request: replicate the search upgrade done in FSAD Playbook task CBP-148 — replace the plain `String.includes()` keyword filter with a two-tier search system (MiniSearch + Transformers.js semantic layer).

Reference task: `/Users/theobeack/Repo/fsad_playbook/markdown/to do/completed/task-cbp-148.md`

## Summary
The training app's search currently uses a plain `String.includes()` filter with no ranking, fuzzy matching, or stemming. This task replaces it with the same approach shipped in the FSAD Playbook: Phase 1 inlines MiniSearch v7.1.1 (BM25 + fuzzy + prefix, ~19KB, zero CDN dependency), Phase 2 layers Transformers.js semantic search as a progressive enhancement. The training app is smaller than the playbook, so Phase 2 skips the Python embeddings pre-computation and instead populates `TRAINING_EMBEDDINGS` from the DOM at runtime — cleaner and simpler given ~50–100 chunks vs the playbook's 219.

## Assessment
**Current search:** `src/index.html:3721–3828`
- `let searchIndex = []` flat array, `buildSearchIndex()` fills it, `handleSidebarSearch()` filters with `.includes()`
- Result items use `item.id` for navigation (not `item.sectionId`)
- `handleSidebarSearchKeydown()` + `updateSelectedResult()` handle keyboard nav — keep as-is

**Playbook reference (post CBP-148):** `fsad-playbook.html:13071–13609`
- MiniSearch UMD block in its own `<script>` at line 13071
- `PLAYBOOK_EMBEDDINGS` fallback + main script at 13076
- `buildSearchIndex()` populates MiniSearch and kicks off semantic load
- `loadSemanticSearch()` → Transformers.js pipeline → IndexedDB cache
- `renderSearchResults()` extracted from `handleSidebarSearch()`
- CSS: `.search-semantic-badge` + `#semanticSearchStatus` (lines 313–325)
- HTML: `<div id="semanticSearchStatus"></div>` inside the sidebar popover

**Key adaptation for training app:** The playbook uses `build-embeddings.py` (Python) to pre-extract content and inject `PLAYBOOK_EMBEDDINGS` at build time. The training app has a simpler Node.js bundler. Instead of adding a Python script, `TRAINING_EMBEDDINGS` is populated dynamically from the DOM inside `buildSearchIndex()` — the same docs already extracted for MiniSearch. The Phase 2 logic (Transformers.js load, cosine similarity, IndexedDB cache) is otherwise identical.

**Location:** `src/index.html` — search system section (~line 3721), style section (~line 121), sidebar HTML (~line 2060)

## Plan

### Phase 1 — MiniSearch upgrade

1. **Copy MiniSearch UMD block** from `fsad-playbook.html:13071–13074` (the `<script>` block containing the minified MiniSearch v7.1.1 UMD). Paste it into `src/index.html` immediately before the main closing `</script>` tag. The MiniSearch block should be its own `<script>` block above the main script.

2. **Add CSS** for `.search-semantic-badge` and `#semanticSearchStatus` into `src/index.html`'s `<style>` block. Copy exact rules from the playbook (lines 313–325). Place after the existing `.search-result-item p` block.

3. **Add HTML** `<div id="semanticSearchStatus"></div>` inside `.sidebar-search-popover` in `src/index.html` (after the `<div class="sidebar-search-popover" ...>` element). Match playbook placement: `fsad-playbook.html:1925`.

4. **Replace the SEARCH SYSTEM section** (`src/index.html:3721–3803`) with the MiniSearch-based implementation. Key changes:
   - Remove `let searchIndex = []`
   - Add `const miniSearch = new MiniSearch({...})` with the same config as the playbook (idField: `docId`, fields: `['title', 'label', 'text']`, storeFields include `sectionId`)
   - Add semantic state vars (`semanticReady`, `semanticLoading`, `semanticEmbedder`, `semanticVectors`)
   - Add `let trainingEmbeddings = []` (populated at runtime from DOM — replaces the playbook's pre-computed `PLAYBOOK_EMBEDDINGS`)
   - Rewrite `buildSearchIndex()` to push docs into MiniSearch and also populate `trainingEmbeddings`; after indexing, call `loadSemanticSearch()` (the array is already populated, unlike playbook which checks if `PLAYBOOK_EMBEDDINGS.length > 0`)
   - Update `handleSidebarSearch()` to use `miniSearch.search(query, { fuzzy: 0.2, prefix: true, combineWith: 'OR' })` for keyword results; overlay semantic results on ≥3-word queries or `?`-containing queries
   - Extract `renderSearchResults()` from `handleSidebarSearch()` (same as playbook)
   - In `renderSearchResults()`, navigation uses `item.sectionId` (stored field) instead of `item.id`
   - Keep `handleSidebarSearchKeydown()` and `updateSelectedResult()` unchanged

### Phase 2 — Semantic layer

5. **Add semantic functions** (after `buildSearchIndex()`):
   - `loadSemanticSearch()` — async; lazy-loads Transformers.js from CDN, calls `readSemanticCache()`, if miss embeds all `trainingEmbeddings` texts, caches result in IndexedDB (`fsad-training-semantic` DB name)
   - `updateSemanticStatus(state)` — updates `#semanticSearchStatus` with loading/ready/offline text
   - `readSemanticCache()` / `writeSemanticCache()` — IndexedDB helpers (identical to playbook, same structure)
   - `cosineSimilarity(a, b, offset, dims)` — identical to playbook
   - `semanticSearch(query, topK)` — uses `trainingEmbeddings` instead of `PLAYBOOK_EMBEDDINGS`

### Phase 3 — Rebuild and verify

6. Run `npm run bundle` to regenerate `dist/fsad-training.html`.
7. Open `dist/fsad-training.html` from `file://` and smoke-test:
   - Fuzzy query with typo (e.g. "specdriven" should return spec section)
   - Prefix query ("specifi" → spec section)
   - Natural-language query ("how do I create a spec?") → triggers semantic tier once loaded
   - Status indicator shows "Loading smart search…" then "Smart search ready"

### Phase 4 — CHANGELOG + version bump

8. Update `CHANGELOG.md` and bump version in `package.json` + the three version locations in `dist/fsad-training.html` (`<title>`, sidebar brand badge, changelog modal). This is a minor feature bump.

All criteria verified 2026-05-29 before commit.

## Acceptance Criteria
- [x] MiniSearch v7.1.1 UMD block is inlined in `src/index.html` — confirmed in dist
- [x] Fuzzy search "claud md" returns CLAUDE.md as #1 result — Playwright verified
- [x] Prefix search "perm" returns Permissions as #1 result — Playwright verified
- [x] Existing keyword search results not regressed — multiple sections returned across all test queries
- [x] `trainingEmbeddings` populated from DOM at runtime — no Python script required
- [x] Semantic layer degrades gracefully — try/catch leaves semanticReady=false; MiniSearch always runs
- [x] Status indicator "⟳ Loading smart search…" visible — screenshot confirmed; all three states implemented
- [x] `dist/fsad-training.html` opens from `file://` with zero JS errors — Playwright confirmed
- [x] CHANGELOG updated, version bumped to v1.11.0 — package.json, title, sidebar badge updated
- [x] Todo entry marked complete

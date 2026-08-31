# FSAD Training — Implementation Plan

## Context

Theo is leading a 3-day workshop introducing software engineers and PMs to spec-driven and agentic development with Claude Code. The most intensive lecture block needs an HTML app that: (a) drives the lecture live from a single browser tab, (b) doubles as a self-contained takeaway artifact attendees revisit afterward, (c) reads as a sibling to the existing `fsad_playbook` app (matching its visual identity and architectural pattern).

The full design spec is at `/Users/theobeack/Repo/fsad_training/planning/design/training_spec.md`. This plan implements that spec.

**Distribution constraint:** attendees must be able to clone the repo and double-click an HTML file to view it. `fetch()` over `file://` is blocked by Chrome, so any markdown content must reach the browser already inlined as HTML — i.e. via a build step that pre-renders sibling `.md` files into a single self-contained output.

## Approach

Vanilla HTML/CSS/JS app shell mirroring `fsad_playbook` patterns, with a tiny Node-based bundle script that pre-renders sibling markdown artifacts into the output HTML at build time. No framework, no preprocessor, no runtime markdown library. One shell file, one bundle script, one shippable artifact.

### Stack
- HTML5 + CSS3 + ES2020 vanilla JS, embedded in a single shell file (matches `fsad-playbook.html`)
- Google Fonts CDN: Inter, IBM Plex Mono, Source Serif 4
- Build dep: `marked` (markdown → HTML at build time only — does not ship)
- Node 20+ ESM for the bundle script

### Directory layout (final)

```
/Users/theobeack/Repo/fsad_training/
├── package.json                 # type:"module"; scripts: bundle, dev
├── package-lock.json
├── .gitignore                   # node_modules/, .DS_Store  (NOT dist/)
├── README.md                    # how to bundle + open
├── scripts/
│   └── bundle.mjs               # ~35 lines, single MD substitution pass
├── src/
│   ├── index.html               # shell: head, sidebar, all pages, embedded CSS+JS, MD placeholders
│   └── markdown/
│       ├── 01-research-prompt.md
│       ├── 02-spec.md
│       ├── 03-plan.md
│       ├── 04-implementation-notes.md
│       ├── 05-verify-checklist.md
│       └── 06-iterate-followup.md
├── dist/
│   └── fsad-training.html       # generated, single self-contained file — COMMITTED
└── planning/                    # already exists
    ├── design/training_spec.md
    └── plan/fsad_implementation_plan.md
```

`dist/` is committed so attendees who don't have Node can clone and open the file directly. Treat re-bundles like generated lockfiles.

### Bundle script (`scripts/bundle.mjs`)

Single-pass substitution. Reads `src/markdown/*.md`, renders each via `marked`, replaces `<!-- @@MD:<id> -->` placeholders in `src/index.html` with rendered HTML wrapped in `<div class="md-artifact" data-md="<id>">`. Strips numeric `NN-` prefix from filenames so artifact IDs stay stable across reorders. Throws on unknown placeholder; warns on unused MD file.

Configure marked with `mangle: false, headerIds: true`. No DOMPurify — single author, controlled input.

Approx 35 lines. Add chokidar watch mode later only if authoring loop feels slow.

### Patterns inherited from `fsad_playbook`

Confirmed against `/Users/theobeack/Repo/fsad_playbook/fsad-playbook.html`:

- Body: `<aside class="sidebar">` (~290px, hand-coded nav HTML) + `<div class="main">` containing all pages in DOM, one shown via `.page.active`
- Hash routing `#pageId/sectionId`; `handleRoute()` → `switchPage()` swaps visible page (~lines 7646–7737 in playbook)
- Top progress bar driven by scroll position; page indicator shows breadcrumb (~lines 144–210, 8013–8030)
- `IntersectionObserver` for fade-in animations on scroll
- Responsive: sidebar transforms off-canvas below 900px breakpoint with hamburger toggle
- Reusable styled primitives: `.callout` (tip/warning/best-practice variants), `.code-block`, `.collapsible` (`.open` class toggle), `.tab`/tabpanel pattern, card patterns
- Design tokens (CSS custom properties): `--bg`, `--bg-surface`, `--text-primary/secondary/muted`, `--accent-blue`/`--accent-violet` (both `#6f6fb5`), `--accent-emerald/amber/rose`, `--font-hero/display/body/mono`, `--sidebar-w: 290px`, `--radius`/`--radius-lg`

Strategy: copy `fsad-playbook.html` to `src/index.html` as the starting shell, strip playbook-specific page content while preserving the chrome (head, fonts, CSS variables, sidebar shell, routing JS, progress bar, observers, responsive logic), then rewire sidebar nav to the 5 training sections.

### Section 4 interactivity model — the heart of the app

Six steps (Research → Spec → Plan → Implement → Verify → Iterate), each with one inline-rendered markdown artifact. Pattern:

- **Top:** horizontal stepper — 6 numbered pills. Active pill uses `--accent-violet` (`#6f6fb5`), inactive pills muted. Click any pill or use ←/→ to advance. Completed pills get a muted check.
- **Below:** split pane.
  - Left ~40%: step description ("what happens here," "what you produce")
  - Right ~60%: artifact pane that swaps the rendered MD when the active step changes
- **Mobile <900px:** collapse to vertical stack — description above, artifact below, stepper becomes horizontal-scroll row.
- **Implementation:** the bundler emits each artifact as `<div class="md-artifact" data-md="<id>">…</div>`. Section 4 JS toggles `.active` on the matching `[data-md]` div based on selected step. ~20 lines of JS. Reuses the playbook's `.tab` / tabpanel pattern (steps = tabs, artifact pane = tabpanel) — not `.collapsible` (six open accordions kills the loop metaphor).
- **Bonus:** a "next" arrow inside the artifact pane mirrors the loop's iterative cadence and helps presenter pacing.

### Five sections — content shape

1. **Workflow orientation** — the loop diagram (Research → Spec → Plan → Implement → Verify → Iterate) with a one-line explainer per phase. Pure HTML, no MD artifacts.
2. **Claude Code basics** — launch, basic permissions, model & effort settings, statusline. Use `.callout` and `.code-block` primitives for command snippets.
3. **Slash command reference** — table (or card grid) covering `/clear`, `/context`, `/skills`, `/plugin`, `/doctor`, `/compact`, `/resume`, `/plan`, `/init`, `/login`, `exit`. Static.
4. **Workflow deep-dive** — the stepper described above, surfacing the 6 sibling MD artifacts inline.
5. **Single-shot vs spec-driven infographic** — placeholder section in v1 (visual concept TBD per spec open question). A `.callout` reading "concept in development" so the section exists in nav but doesn't block shipping.

## Build sequence

Implementation is sequential — each step lands a working artifact before the next begins.

1. **Scaffold + bundler first.** Create `package.json` (npm, ESM, single dep `marked`), `scripts/bundle.mjs`, `.gitignore`, `README.md`. Stub `src/index.html` with one `<!-- @@MD:hello -->` placeholder and `src/markdown/hello.md` containing a heading. Run `npm run bundle`; confirm `dist/fsad-training.html` opens in a browser and shows the heading. Locks the build pipeline before any UI work.
2. **Port playbook shell.** Copy `/Users/theobeack/Repo/fsad_playbook/fsad-playbook.html` to `src/index.html`. Strip page-content `<div class="page">` blocks but keep: `<head>` (fonts, meta, all CSS), top progress bar markup, `.page-indicator` markup, `<aside class="sidebar">` shell, all `<script>` block routing/observer logic. Replace sidebar nav-group HTML with 5 training-section entries. Add 5 empty `<div class="page" id="page-{id}">` stubs. Bundle, open, verify routing works between empty pages and the chrome looks right.
3. **Section 1 + Section 2 content.** Workflow orientation + Claude Code basics. Pure prose, diagrams, callouts, code blocks. Lowest-risk; shakes out typography and primitives in the new app.
4. **Section 3 content.** Slash command reference table or card grid. Static, mostly mechanical.
5. **Section 4 UX scaffolding.** Build the stepper + split-pane layout with placeholder content for each step. Wire keyboard navigation and mobile collapse. Verify visual feel before authoring artifact content.
6. **Section 4 markdown artifacts.** Author the 6 sibling `.md` files (`01-research-prompt.md` through `06-iterate-followup.md`). Add `<!-- @@MD:* -->` placeholders inside the section 4 markup. Re-bundle; verify each artifact renders correctly into its tabpanel.
7. **Section 5 placeholder.** Add the section with a "concept in development" callout — don't block shipping on the infographic open question.
8. **Polish pass.** Sweep responsive breakpoint at 900px, scroll-anchor offsets under the fixed page indicator, IntersectionObserver hits all new sections for fade-in, sidebar active-state stays in sync with hash route during scrolling.

## Things explicitly NOT to do

- No runtime markdown library (no `marked.min.js` in the output)
- No framework (no React, Vue, Svelte, Alpine, htmx)
- No CSS preprocessor, no PostCSS, no Tailwind — raw CSS variables only, matching playbook
- No bundler beyond the ~35-line script (no Vite, esbuild, Rollup, Webpack)
- No TypeScript, even for the build script
- No HTML templating / partials — one shell file, hand-written sidebar nav
- No router library — copy playbook's hash routing
- No HMR / live-reload (re-run `npm run bundle` + refresh is fine for 5 sections)
- No `dist/` in `.gitignore` — distribution requires it committed
- No `DOMPurify` / sanitization — single author, controlled markdown
- No tests for the 35-line bundler — if it breaks, the build crashes loudly
- No section 5 infographic build until the visual concept lands

## Spec follow-up (post-approval, outside plan mode)

The spec at `planning/design/training_spec.md` currently says "no build step" and implies runtime fetch of sibling files. After plan approval, update two passages to match the build-time bundling decision:

- **"Non-Functional"** — change "no build step, vanilla assets" to "minimal Node build step (`npm run bundle`); output is a single self-contained HTML file with no runtime dependencies"
- **"Technical Approach"** — change "fetched at runtime and rendered inline" to "pre-rendered to HTML at build time and inlined into the output via `<!-- @@MD:id -->` placeholders"

This is a documentation reconciliation only; the spec's intent is preserved.

## Critical files

- `/Users/theobeack/Repo/fsad_playbook/fsad-playbook.html` — architecture reference (read-only; copy patterns)
- `/Users/theobeack/Repo/fsad_training/planning/design/training_spec.md` — requirements (update post-approval per above)
- `/Users/theobeack/Repo/fsad_training/package.json` — to create
- `/Users/theobeack/Repo/fsad_training/scripts/bundle.mjs` — to create
- `/Users/theobeack/Repo/fsad_training/src/index.html` — to create (port playbook shell)
- `/Users/theobeack/Repo/fsad_training/src/markdown/*.md` — to create (6 artifacts)
- `/Users/theobeack/Repo/fsad_training/dist/fsad-training.html` — generated; committed

## Verification

End-to-end checks at each milestone:

**After step 1 (bundler):**
- `npm run bundle` exits 0
- `dist/fsad-training.html` exists, opens via double-click in Chrome on macOS
- Test heading from `hello.md` renders correctly
- Bundler errors loudly when a placeholder ID has no matching `.md` file

**After step 2 (shell port):**
- Sidebar renders with 5 training-section entries
- Clicking each entry updates the hash and shows the corresponding empty page
- Top progress bar moves on scroll
- Page indicator updates on section change
- At <900px viewport width, sidebar collapses, hamburger toggle works
- Visual identity matches playbook side-by-side (fonts, colors, spacing)

**After steps 3–7 (content + section 4):**
- All 5 sections accessible from sidebar
- Section 4: clicking any of the 6 step pills swaps the artifact pane to the matching MD content; ←/→ keys advance/retreat; mobile layout reflows correctly
- Each MD artifact renders with proper typography (headings, code blocks, lists, blockquotes)
- No console errors
- Reload preserves the active section via hash routing

**Final ship check:**
- Clone repo to a fresh directory
- Open `dist/fsad-training.html` directly via `file://` in Chrome, Firefox, Safari — all five sections render and section 4's stepper works without a server

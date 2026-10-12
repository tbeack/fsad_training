# FSD_Train-027 — Make the left nav collapsible and resizable (port of fsad_playbook CBP-680 and CBP-681)

## Source
User request on 2026-10-12. This ports `fsad_playbook` CBP-680 (shipped in PR #273, v4.1.57) and the CBP-681 storage guard. The original instruction for CBP-680 was: "make the left nav collapsible and resizable."

## Summary
The left sidebar has a fixed width of 290px. Add a drag handle, a collapse button and an expand button. Save both choices between visits. Guard the theme toggle against blocked `localStorage`.

## Assessment
`fsad_training` shares the `fsad_playbook` design. The sidebar width comes from one CSS variable, `--sidebar-w: 290px`. Four rules read it: `.sidebar` (line 362), `.main` margin, `.progress-container` (line 145) and `.page-indicator` (line 157). Changing the variable at run time moves all four.

Differences from `fsad_playbook`:
- All CSS, markup and JS live in one file, `src/index.html` (about 4,540 lines). There is no `src/js/` tree and no `build-source.py`. The only build step is `npm run bundle`, which writes `dist/fsad-training.html`.
- The bundle must work from `file://` (see `CLAUDE.md`). Persistence must not depend on a server. Browser automation cannot load `file://`, so verify against a local HTTP server.
- `src/index.html` lines 3716 and 3733 call `localStorage` for the theme, with no `try/catch`. This is the same bug as CBP-681.
- Version is semver in `package.json`, with `CHANGELOG.md` at the project root.

**Overlap:** `FSD_Train-026` (redo the UI with the Diataxis conventions) is open and may change the sidebar. Do this task first, or merge the work and re-check the selectors below. Do not run both in parallel.

**Location:** `src/index.html` — `:root` (line 53), `.sidebar` (lines 350-393), `@media (max-width: 900px)` blocks (lines 206, 1356, 1460), theme script (lines 3716-3733)

## Plan

Decisions below carry over from `fsad_playbook` CBP-680. Keep them unless the user changes them.

1. **Handle placement.** The sidebar has `overflow-y: auto`, so a handle inside it scrolls away. Make the handle a sibling element placed after `</aside>`, `position: fixed`, 6px wide, at `left: calc(var(--sidebar-w) - 3px)`, `z-index: 201`, `cursor: col-resize`.
2. **Desktop only.** Put all new rules inside `@media (min-width: 901px)`. Hide the handle and both buttons by default. Below 901px the sidebar stays an off-canvas drawer. Add `width: 290px` to the mobile `.sidebar` rule so a saved width cannot change the drawer.
3. **Width rules.** Default 290px. Range 220-520px. Double-click on the handle resets the width to 290px. Left and Right arrow keys change the width by 16px. Give the handle `role="separator"`, `aria-orientation="vertical"`, `aria-label` and `tabindex="0"`.
4. **Collapse.** A « button in the sidebar header collapses the sidebar. A » button, fixed at the top left, expands it. Collapse sets `body.sidebar-collapsed { --sidebar-w: 0px; }`, so the main area and the top bars follow. Also set `visibility: hidden; overflow: hidden; border-right-width: 0` on the collapsed sidebar. Without `border-right-width: 0` the computed width stays at 1px, which fails a check for 0.
5. **Colors.** Use `var(--gradient-brand)` for the handle hover and drag state. Check the variable names in this file first. `--accent` did not exist in `fsad_playbook`.
6. **Persistence.** Save width under `fsad-sidebar-w` and collapsed state under `fsad-sidebar-collapsed`. Wrap every `localStorage` call in `try/catch`, through two small `store` and `load` helpers. Restore both on load. Set the width on `document.documentElement`, and read it back from there.
7. **Transitions.** Animate width and margin for 0.2s. Turn transitions off while dragging (`body.sidebar-resizing`).
8. **Theme guard (CBP-681).** Wrap `localStorage.getItem('theme')` and `setItem` in `try/catch`. Fall back to the OS theme. Run the sidebar script so that a storage error elsewhere cannot stop it.
9. Run `npm run bundle`. Serve `dist/` with `python3 -m http.server 8000` and test in the browser.
10. Add a `CHANGELOG.md` entry. Cut a patch version in `package.json` at ship time, as `fsad_playbook` did (v4.1.56 to v4.1.57).

**Verification method used in `fsad_playbook` (repeat it):**
- Use independent read-only verifier agents, 3 criteria per agent, then one refuter agent per PASS. Check each refutation yourself at its cited `file:line`.
- Test blocked storage in the browser. Fetch the built page, inject a script that makes the `localStorage` getter throw, load it in a blob-URL iframe, then read the iframe's errors and computed width.
- Test mobile with an iframe of width 800px. Real drag tests need coordinates scaled to the screenshot size (about 0.71 of the real viewport in that session).
- The visual criterion needs the user to confirm it. Do not mark it passed alone.

## Acceptance Criteria
All criteria verified 2026-10-12 before commit.
- [x] A drag on the handle at 1280px viewport width changes `--sidebar-w`, and the computed `margin-left` of `.main` equals the new sidebar width.
- [x] The width never goes below 220px or above 520px during a drag.
- [x] Double-click on the handle sets the width back to 290px.
- [x] The collapse button sets the `.sidebar` computed width to 0 and the `.main` computed `margin-left` to 0. The expand button restores the saved width.
- [x] After a page reload, the saved width and the collapsed state apply.
- [x] With the `localStorage` getter throwing, the built page loads with no uncaught error and the sidebar shows at 290px.
- [x] At 800px viewport width, the handle and both buttons are hidden, and the hamburger drawer opens and closes as before.
- [x] The left edge of `.progress-container` and `.page-indicator` equals the sidebar width at every desktop width and in the collapsed state.
- [x] The handle has `role="separator"`, and Left and Right arrow keys change the width by 16px when it has focus.
- [x] `npm run bundle` passes, and `dist/fsad-training.html` contains `sidebarResizer` and the key `fsad-sidebar-w`.
- [x] The theme toggle still saves the choice when storage works.
- [x] Visual check: the handle hover state and the collapse animation look right in dark and light theme. The user confirms this one.

## Agent Decisions Made
- 2026-10-12 — **Question:** Which project config applies, since the working directory is `fsad_playbook`? **Decision:** Use the `fsad_training` entry. **Why:** The user named the `fsad_training` repo as the target.
- 2026-10-12 — **Question:** Which ID does the task take? **Decision:** `FSD_Train-027`. **Why:** The highest existing number is 026.
- 2026-10-12 — **Question:** Port 8000 was taken by another server. **Decision:** Serve `dist/` on port 8027. **Why:** The plan names no fixed port.

# FSD_Train-020 — Add entry to left nav: FSAD Playbook

## Summary
Add a "FSAD Playbook" external link entry to the left sidebar nav in `src/index.html`, linking to `https://fsad-playbook.vercel.app/`. This gives attendees a one-click path from the training material to the companion reference playbook.

## Assessment
The sidebar nav lives in `src/index.html` at the `<aside class="sidebar">` block (~line 2039). It ends with five `.nav-group` divs followed by `</nav>` at ~line 2128, then a `.sidebar-footer` div with a tagline. The external link should appear at the bottom of the nav, between the last `.nav-group` and the `</nav>` close tag — visually separated from the page-nav groups as a distinct "companion resource" entry.

No analogous external-link entry currently exists in the sidebar; this is a new pattern. A simple `<a>` tag styled to fit the sidebar's visual language (muted text, border-top separator, external-link icon) is the right approach — no JS needed.

**Location:** `src/index.html` — `<nav class="sidebar-nav">` block, ~line 2128

## Plan

1. Add CSS for `.nav-external-link` to the `<style>` block — a bottom-bordered anchor styled like a quiet sidebar item with an `↗` or `⬡` glyph, muted color that brightens on hover, consistent with existing `.sidebar-footer` typography.
2. Add the HTML anchor inside `<nav class="sidebar-nav">` after the last `</div>` (compare nav group) and before `</nav>`:
   ```html
   <a class="nav-external-link" href="https://fsad-playbook.vercel.app/" target="_blank" rel="noopener">
     FSAD Playbook ↗
   </a>
   ```
3. Run `npm run bundle` to regenerate `dist/fsad-training.html`.
4. Open `dist/fsad-training.html` in a browser to verify the link appears and works correctly.

All criteria verified 2026-05-29 before commit.

## Acceptance Criteria
- [x] "FSAD Playbook ↗" link is visible in the sidebar below the Compare nav group
- [x] Clicking the link opens `https://fsad-playbook.vercel.app/` in a new tab
- [x] Link style fits the sidebar's visual language (muted text, hover highlight, no broken layout)
- [x] `dist/fsad-training.html` is rebuilt and the link appears in the distribution file

# FSD_Train-015 — How to manage your context window

**Section:** Claude Code Basics (page-basics)
**Position:** New subsection after Statusline (§04), before CLAUDE.md (renumber to §06)
**Status:** Complete

## Goal

Add a "How to manage your context window" subsection that teaches attendees:
- What `/context` is and what it shows
- A realistic example of `/context` output
- The three commands for context management and when to use each

## Acceptance Criteria

- [x] New section `<section id="context-window">` inserted after `#statusline`, before `#claude-md`
- [x] Section label updated to `05 — Context Window`; CLAUDE.md section label updated to `06 — CLAUDE.md`
- [x] Sidebar nav item added: `context-window` → "Context Window", between Statusline and CLAUDE.md
- [x] Hero subtitle on page-basics updated to mention context window management
- [x] `/context` example prompt shown in the same pill-card style used in Statusline section
- [x] Realistic `/context` output shown in a `code-block`
- [x] Overview cards for `/context`, `/compact`, `/clear` explain when to use each
- [x] `npm run bundle` passes with no errors or warnings
- [x] `dist/fsad-training.html` regenerated

## Implementation Steps

1. Edit `src/index.html`:
   a. Add `context-window` nav item in sidebar after `statusline`
   b. Insert new `<section id="context-window">` block after `#statusline` `<hr>` divider
   c. Renumber CLAUDE.md section label from `05` to `06`
   d. Update hero subtitle to mention context management
2. Run `npm run bundle`
3. Mark task complete in `planning/to do/todo.md`
4. Release v1.8

## /context output (reference mock)

```
Context window: 47,200 / 200,000 tokens (23%)

System prompt        8,340 tokens  ████░░░░░░░░░░░░░░░░
Conversation           812 tokens  ░░░░░░░░░░░░░░░░░░░░
Files read           2,104 tokens  ░░░░░░░░░░░░░░░░░░░░
  src/index.html     1,847 tokens
  planning/todo.md     257 tokens
CLAUDE.md (global)   1,142 tokens  ░░░░░░░░░░░░░░░░░░░░
CLAUDE.md (project)    873 tokens  ░░░░░░░░░░░░░░░░░░░░
Memory                 320 tokens  ░░░░░░░░░░░░░░░░░░░░
```

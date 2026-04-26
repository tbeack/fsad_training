---
name: cbp-commit-changes
description: Finalize a batch of completed FSD_Train tasks for the FSAD Training app and commit them to git. Re-bundles `dist/fsad-training.html` if any source files changed, stages the relevant files (training app source, planning artifacts, todo.md), writes a scoped commit message referencing each FSD_Train task, and pushes. Use whenever the user says "/commit-cbp-changes", "commit these changes to git", "ship these FSD_Train changes", "push the training updates", "finalize this batch", or any similar phrasing that follows finishing a task. This is the natural step that runs AFTER `cbp-add-task` tasks have been implemented — so even if the user just says "we're done, commit it", trigger this skill.
argument-hint: `[optional commit subject override]`
---

# Commit FSD_Train Changes Skill

You finalize a batch of completed FSD_Train work on the FSAD Training app. Two phases: **verify**, **commit & push**. Do not skip verification — silent typos in the bundled output ship to every workshop attendee opening the file from `file://`.

## Inputs you need before doing anything

1. **Repo state.** Run `git status` first. If the project is not yet a git repository, stop and tell the user — they need to `git init`, configure user.name / user.email, and set a remote before this skill can run.
2. **Which FSD_Train tasks are being shipped.** Read `planning/to do/todo.md` and identify FSD_Train items that are:
   - marked complete (`- [x]`), AND
   - reference uncommitted changes (cross-check with `git status` / `git log`).
   If ambiguous (multiple newly-completed tasks but the user wanted only some), ask the user to confirm the list before committing.
3. **Today's date.** ISO format `YYYY-MM-DD`. Use the current date in context — do not guess.

## Step 1 — Gather change summaries for each task

For each FSD_Train task being shipped, read its `planning/to do/task-fsd_train-NNN.md` file to pull out:
- The task title
- A short prose summary of what changed (1–4 bullet points)

If a task file doesn't exist, fall back to the title from `todo.md` and any diff context you can see. Don't invent details — if a task is opaque, ask the user what to write.

## Step 2 — Re-bundle if any source touched the app

If the task changed any file under `src/`, run `npm run bundle` and confirm:
- Bundler exits 0
- `dist/fsad-training.html` is updated (check `git status` again — `dist/` should now show as modified)
- No unexpected "unused markdown artifact" warnings (an expected warning for a deliberately unused stub is fine; new ones aren't)

If the bundle fails, stop and report. Do not commit a broken build.

## Step 3 — Verify before committing

Run these checks and show the user a short summary:

```bash
git status
git diff --stat
```

Visually sanity-check:
- Every file in the diff is intentional
- `dist/fsad-training.html` was rebundled if `src/` changed
- No stray edits to unrelated files

If anything looks off, fix it before proceeding. If you can't tell, ask the user.

## Step 4 — Stage scoped files

Stage only the files you intentionally changed. Do not use `git add -A` — `planning/` often contains work-in-progress notes the user may not want shipped. Typical stage list:

```bash
git add \
  src/index.html \
  "src/markdown/*.md" \
  dist/fsad-training.html \
  "planning/to do/todo.md" \
  "planning/to do/task-fsd_train-NNN.md"
```

Include task files for the FSD_Trains being shipped (they often contain final notes) and the updated `todo.md` if completion checkboxes changed. Adjust the list based on what `git status` actually shows — don't blindly stage files that weren't touched.

## Step 5 — Commit

Match the project's existing commit style (see `git log` if there's prior history; otherwise use a clean conventional default):

```
<one-line rollup> (FSD_Train-NNN, FSD_Train-NNN, ...)

- <bullet per task, terse>
- <bullet>
```

If the user passed `$ARGUMENTS`, use that as the commit subject instead.

Use a HEREDOC and include the Claude co-author trailer per the user's global conventions.

## Step 6 — Push

```bash
git push
```

If the branch has no upstream, set it with `git push -u origin <branch>`. If the push fails (non-fast-forward, auth, hooks), stop and report — do not force-push.

## Step 7 — Report back

Tell the user:
- FSD_Train tasks included
- Commit SHA (short)
- Confirmation that push succeeded (or the error, if it didn't)

## When to pause and ask

- The project isn't yet a git repository.
- The list of "completed but unshipped" FSD_Train tasks is ambiguous.
- A task file is missing and you can't confidently summarize the change.
- `git status` shows unexpected modifications outside the FSD_Train scope.
- The user's working tree has uncommitted changes unrelated to this batch.
- Push requires force, rebase, or branch setup decisions.

Short, specific questions — don't dump a wall of options.

## Why this skill exists

The FSAD Training app is shared with workshop attendees as a takeaway artifact; shipping a half-rebundled version (e.g., `src/` updated but `dist/` stale) breaks the live presentation and confuses attendees. The sequencing above — verify, then bundle, then a single scoped commit, then push — keeps the source and the shipped artifact in sync.

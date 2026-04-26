---
name: cbp-add-task
description: Add a new FSD_Train task to the FSAD Training todo list. Creates a new entry in `planning/to do/todo.md` with the next available `FSD_Train-###` number, then prompts for task details (source, summary, plan, acceptance criteria) and generates the corresponding `task-fsd_train-NNN.md` file. Use when the user wants to add a task, track a new TODO, or capture a new idea for the training app.
argument-hint: `[brief task title]`
---

# Add FSD_Train Task Skill

You help the user add new FSD_Train tasks to the FSAD Training task tracker. Follow this exact workflow.

## Step 1: Get the next FSD_Train number

Read `planning/to do/todo.md` to find the highest existing `FSD_Train-###` number. Increment by 1 to get the new number. Format as 3 digits with leading zeros (e.g., `FSD_Train-031`, not `FSD_Train-31`).

If `planning/to do/todo.md` does not exist yet, create it with the header `# FSAD Training — Todo` and start at `FSD_Train-001`.

## Step 2: Get the task title

If the user provided a brief title as `$ARGUMENTS`, use that. Otherwise, ask:
> "What's the task title? (one-liner — I'll prompt for details next)"

## Step 3: Add the entry to todo.md

Append a new line at the end of the list. Format:

```
- [ ] `FSD_Train-NNN` [Title] → [task-fsd_train-NNN.md](task-fsd_train-NNN.md)
```

Use the `Edit` tool with a unique surrounding context to insert the line.

## Step 4: Gather task details

Ask the user these questions **one at a time** (not all at once):

1. **Source** — Where did this task come from? (e.g., workshop feedback, bug report, own idea). Skip if not applicable.
2. **Summary** — What needs to change and why? 1-3 sentences.
3. **Assessment** — What's the current state? Does related content already exist in the training app? Where?
4. **Plan** — Step-by-step implementation. Include file paths and line numbers where possible.
5. **Acceptance Criteria** — Bullet list of verification steps. Use `- [ ]` checkboxes.

If the user says "use your best judgment" or "fill it in", proceed without blocking — make reasonable inferences from the title and context.

## Step 5: Create the task file

Write `planning/to do/task-fsd_train-NNN.md` using this exact template:

```markdown
# FSD_Train-NNN — [Task Title]

## Source
[Where the task came from — or omit this section if not applicable]

## Summary
[1-3 sentences: what's changing and why]

## Assessment
[Current state of the relevant content. Does it exist? Where? What needs to change?]

**Location:** `[file path]` — [section/line reference]

## Plan

[Step-by-step implementation]

1. [Step one]
2. [Step two]

## Acceptance Criteria
- [ ] [Verification step 1]
- [ ] [Verification step 2]
```

## Step 6: Confirm completion

Tell the user:
- The new FSD_Train number
- That the entry was added to `todo.md`
- That the task file was created at `planning/to do/task-fsd_train-NNN.md`

## Conventions to Match

- **FSD_Train number format:** Always 3 digits with leading zeros (`FSD_Train-031`, not `FSD_Train-31`)
- **todo.md entry:** Single line with backtick-wrapped FSD_Train identifier, em-dash separator, and markdown link to task file
- **Task file location:** `planning/to do/task-fsd_train-NNN.md` (lowercase prefix, hyphenated, underscore preserved)
- **Task file heading:** `# FSD_Train-NNN — [Title]` (em-dash, not hyphen)
- **Sections:** Source (optional), Summary, Assessment, Plan, Acceptance Criteria

## Guardrails

- **Always read `todo.md` first** — don't guess the next FSD_Train number
- **Don't duplicate titles** — scan existing tasks for similar entries before creating
- **One question at a time** when gathering details — don't dump a form on the user
- **Don't implement the task** — only create the planning artifacts. The user will implement separately.

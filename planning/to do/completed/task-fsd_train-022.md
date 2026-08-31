# FSD_Train-022 — Sync updated fsad_playbook skills, package as a local plugin, and ship an installer

## Summary
FSD_Train-009 copied 16 skills verbatim from `fsad_playbook/skills/` into `fsad_training/skills/`. `fsad_playbook`'s skills have since moved on upstream — 14 of the 16 copied skills now differ from the current `fsad_playbook` HEAD. This task re-syncs those 16 skills, packages `fsad_training` itself as an installable Claude Code plugin (mirroring how `fsad_playbook` packages its own `fsad-harness` plugin), documents local install in the README, and ships `scripts/fsad_harness_install.sh` to automate it.

## Assessment

**Skills drift since FSD_Train-009:** Diffed all 16 copied skill directories against current `fsad_playbook` HEAD (`git -C fsad_playbook archive HEAD -- skills/<name>` vs the copies in `fsad_training/skills/<name>`):
- **Changed (14):** `ac`, `add-task` (+ `add-task-projects.yaml`), `code-review-team`, `do-task`, `estimate`, `next`, `plan`, `plan-review` (+ `checks/hygiene-check.py`, `lenses.md`, `report-template.md`), `prd`, `sec-review-team`, `set-context`, `ship`, `ship-it`, `spec-review`.
- **Unchanged (2):** `prompt-improver`, `sec-review-fixes`.
- The skill-directory *set* itself is unchanged (still the same 16; `init`/`playbook-assistant`/`sync` remain excluded per FSD_Train-009, and `engineering-skills`/`product-skills` are still untracked third-party clones in `fsad_playbook`, not real playbook skills).

**How fsad_playbook packages itself as a plugin** (`fsad_playbook/.claude-plugin/`):
- `plugin.json`: `{"name": "fsad-harness", "description": "...", "version": "0.1.0", "author": {"name": "Theo Beack"}, "license": "MIT", "keywords": [...]}`
- `marketplace.json`: `{"name": "fsad-playbook", "owner": {"name": "Theo Beack"}, "metadata": {"description": "..."}, "plugins": [{"name": "fsad-harness", "source": "./", ...same fields as plugin.json}]}`
- `fsad_training` has neither file at its root today.

**Install mechanism** (confirmed via `claude plugin --help` / `claude plugin marketplace --help`):
```bash
claude plugin marketplace add <path-or-url>   # registers a marketplace from a local path, URL, or GitHub repo
claude plugin install <plugin>@<marketplace>  # installs a plugin from a registered marketplace
claude plugin validate <path>                 # validates a plugin/marketplace manifest before shipping
```

**README.md** has no plugin-install section at all today (confirmed: no "plugin" or "install" hits outside the generic npm `## Development` block).

**Naming:** Using the *same* plugin/marketplace names as `fsad_playbook` (`fsad-harness` / `fsad-playbook`) would collide if a user ever registers both repos' marketplaces in the same Claude Code install. This task gives `fsad_training`'s copy distinct names: plugin `fsad-training-harness`, marketplace `fsad-training`.

## Plan

1. **Re-sync the 14 changed skills** verbatim from `fsad_playbook`, same method as FSD_Train-009:
   ```bash
   git -C /Users/theobeack/repo/fsad_playbook archive HEAD -- skills/ac skills/add-task skills/code-review-team skills/do-task skills/estimate skills/next skills/plan skills/plan-review skills/prd skills/sec-review-team skills/set-context skills/ship skills/ship-it skills/spec-review | tar -x -C /Users/theobeack/Repo/fsad_training/
   ```
   Leave `prompt-improver` and `sec-review-fixes` untouched (no upstream changes — re-copying is harmless but unnecessary).

2. **Create `.claude-plugin/plugin.json`** at the `fsad_training` repo root: `name: "fsad-training-harness"`, a description adapted for this repo (training-app skill mirror, not the playbook itself), `version: "0.1.0"`, author, MIT license, keywords.

3. **Create `.claude-plugin/marketplace.json`** at the repo root: `name: "fsad-training"`, owner, metadata description, one `plugins` entry (`name: "fsad-training-harness"`, `source: "./"`, mirroring `plugin.json`'s fields).

4. **Validate both manifests**: `claude plugin validate .` from the repo root — must report no errors before proceeding.

5. **Add a "Local Plugin Setup" section to `README.md`** (after `## Development`, before `## Layout`) documenting the exact commands:
   ```bash
   claude plugin marketplace add /path/to/fsad_training
   claude plugin install fsad-training-harness@fsad-training
   ```
   Note the `-s/--scope` option (`user` default, or `project`/`local`), and how to confirm install (`claude plugin list`).

6. **Write `scripts/fsad_harness_install.sh`**:
   - Resolves the repo root relative to the script's own location (`SCRIPT_DIR`/`dirname`), not a hardcoded path.
   - Runs `claude plugin marketplace add "$REPO_ROOT"` then `claude plugin install fsad-training-harness@fsad-training -y`.
   - Prints a success message pointing the user at `claude plugin list` to confirm.
   - `chmod +x scripts/fsad_harness_install.sh`.

7. **Test end-to-end**: run the install script in a real shell, confirm `claude plugin list` shows `fsad-training-harness` installed, then uninstall it (`claude plugin uninstall fsad-training-harness`) to leave the tester's environment clean after verification.

## Acceptance Criteria
- [x] All 14 skills with upstream changes are byte-identical to `fsad_playbook`'s current HEAD versions inside `fsad_training/skills/` (verified via `diff -rq` per skill, not just presence).
- [x] `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` exist at the `fsad_training` repo root and both pass `claude plugin validate .` with zero errors.
- [x] `README.md` has a new section giving the exact `claude plugin marketplace add` / `claude plugin install` commands for local setup, plus a scope note and a verification command.
- [x] `scripts/fsad_harness_install.sh` exists, is executable, and running it results in `claude plugin list` showing `fsad-training-harness` installed (then cleanly uninstallable).
- [x] `npm run bundle` still completes cleanly afterward, with no missing-placeholder or unused-artifact warnings introduced by the re-synced skill content.

All criteria verified 2026-08-31 before commit, via independent fan-out + adversarial refuter gate (all 5 refuter-confirmed).

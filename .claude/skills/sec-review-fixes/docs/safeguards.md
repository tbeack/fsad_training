# sec-review-fixes — Safeguards

This skill mutates code. Every safeguard below is **load-bearing** — do not relax without a written-down reason.

## Tier 1: Never, under any circumstance

These are non-overridable. The skill must refuse to execute if any is requested.

- **Never push to `main` / `master` / `trunk` / the remote default branch.** Always operate on `sec-review-fix/*` branches.
- **Never force-push.** `git push --force` / `--force-with-lease` is disabled. If a non-fast-forward push is blocked by remote, surface the error to the user and stop.
- **Never amend an existing commit** (`git commit --amend` is disabled). Fixes go in NEW commits.
- **Never rebase a branch someone else may have already pulled** (anything on `origin/*` that isn't yours).
- **Never bypass pre-commit / pre-push hooks** (`--no-verify` is disabled).
- **Never modify `.git/` directly** (e.g., overwrite refs, rewrite reflog).
- **Never run a fix without running its regression test first** and confirming pass.
- **Never proceed past a failed Tier-1 check** — abort the whole run, explain clearly.

## Tier 2: Preflight — verified before any mutation

Checked at Step 2 of the orchestration. If any fails, skip or abort per severity below.

| Check | Failure action |
|---|---|
| Working tree clean (`git status --porcelain` empty) | Abort. User must stash/commit manually. |
| Current branch is NOT the default | Offer to branch to `sec-review-fix/<timestamp>`. |
| No in-progress merge/rebase/cherry-pick | Abort. |
| Remote reachable (if PR mode) | Abort or downgrade to `--dry-run`. |
| `gh` CLI available + authenticated (if PR mode) | Abort or downgrade to commit-only (no PR). |
| Target repo is a git repo | Abort. |
| Regression-test framework is detectable | Abort for that finding (skip); log to report. |

## Tier 3: Per-fix gates

For each approved finding:

1. **Diff applies cleanly** (`git apply --check` passes). If not: mark as `apply-failed`, skip.
2. **Regression test passes after fix** (`<test runner>` exits 0). If not: `git checkout -- <affected>`, skip.
3. **No unintended file mutations.** After applying the diff + test, `git status` should show only the expected paths. If unexpected paths appear, abort.
4. **Commit message includes `Fixes-finding: <id>` trailer.** Every commit traces back to a finding.

## Tier 4: User choice gates

- **Interactive approval is default** — no fix applies without an explicit "a" (approve).
- **Timeout = skip, not apply.** If the user walks away during interactive approval, the finding is marked skipped, not auto-approved.
- **`--dry-run` skips all mutation.** Produces artifacts only.
- **`--yes` is NOT accepted** as an auto-approve flag for mutation. There is no auto-apply path.

## Recovery if something goes wrong

If a fix is committed that shouldn't have been:

1. **Don't panic, don't force-push.**
2. **Revert on the fix branch:** `git revert <sha>`. New commit inverting the change — preserves history.
3. **Document in the PR** why the revert landed.
4. If the PR was already merged — open a new PR with the revert. Do NOT delete the commit from history.

## What this skill cannot guarantee

Even with all safeguards, an auto-generated fix can still:

- Pass the regression test but miss a related edge case not covered by the test.
- Introduce a new vulnerability while fixing the old one (e.g., fixing SQLi by escaping but missing a different injection vector on the same input).
- Refactor too aggressively for the surrounding codebase's style.

The human reviewer on the PR is not optional. **This skill assists, it does not replace manual review.**

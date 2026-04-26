# REPORT.md Consolidation Template

This template defines how the orchestrator synthesizes `<agent>.findings.jsonl` and `<agent>.coverage.jsonl` from all specialists into a single deduped `REPORT.md`.

## Pipeline (pseudocode)

```
# 1. Read all findings
findings = []
for f in .planning/security-review/*.findings.jsonl:
    for line in f:
        finding = validate_against(finding.schema.json, parse(line))
        findings.append(finding)

# 2. Read coverage
coverage = []
for f in .planning/security-review/*.coverage.jsonl:
    for line in f:
        coverage.append(parse(line))

# 3. Dedupe by root_issue
groups = group_by(findings, key=root_issue)
for group in groups:
    merged = {
        root_issue: group[0].root_issue,
        severity: max_severity(group),  # critical > high > medium > low > info
        confidence: max_confidence(group),  # certain > likely > possible > unverified
        title: group[0].title,
        raised_by: distinct([f.specialist for f in group]),
        files: distinct([f.file for f in group]),
        exploits: [f.exploit for f in group],
        fixes: [f.fix for f in group],
        evidence: [f.evidence for f in group],
        count: len(group)
    }

# 4. Split by actionable vs worth-investigating
actionable = [g for g in merged_groups if g.confidence in (certain, likely)]
worth_investigating = [g for g in merged_groups if g.confidence in (possible, unverified)]

# 5. Coverage matrix
matrix = pivot(coverage, rows=category, cols=specialist, values=status+confidence)

# 6. Completeness score
score = (checked-clean + checked-issues-found) / total_categories
```

## Output structure

```markdown
# <Target> — Consolidated Security Review

**Target:** <absolute path>
**Model:** <current model name>
**Date:** <ISO date>
**Team:** sec-review-team (<N> specialists, <typed|general-purpose> subagent types)
**Runtime:** <total wall time>
**Coverage completeness:** <score>% (<checked>/<total> categories checked)

## Aggregate severity counts

| Severity | Raw | After dedupe (action items) | Worth investigating |
|----------|-----|------------------------------|----------------------|
| Critical | …   | …                            | …                    |
| High     | …   | …                            | …                    |
| Medium   | …   | …                            | …                    |
| Low      | …   | …                            | …                    |

## Unified threat model
<3–5 sentences from orchestrator, based on stack signals>

## Action items (confidence: certain / likely)

### <severity> — <title>
**Root issue:** <root_issue>
**Raised by:** <list of specialists>
**Confidence:** <max confidence across group>
**Files:** <list>

**Exploit scenario:** <synthesized from exploits[]>

**Recommended fix:** <synthesized from fixes[]>

**Evidence:**
```<lang>
<first evidence snippet>
```
<additional evidence snippets if different files>

## Worth investigating (confidence: possible / unverified)
<same structure, shorter entries>

## Coverage matrix
<category × specialist table with status+confidence cells>

## Verified clean / N/A
<categories with status=checked-clean, grouped by specialist, with search summary>

## Scanner-sourced findings (if any)
<findings where source=scanner-*; separate section so provenance is visible>

## Recommended fix order
<grouped by effort, ordered by impact, with engineer-day estimates>

## Tooling caveats
<which scanners couldn't run, which specialists had to fall back to general-purpose, etc.>

## Per-specialist report links
- [auth-authz-auditor.md](auth-authz-auditor.md) — <severity counts> — [findings.jsonl](auth-authz-auditor.findings.jsonl) — [coverage.jsonl](auth-authz-auditor.coverage.jsonl)
<etc>
```

## Severity / confidence precedence

```
SEVERITY: critical > high > medium > low > info
CONFIDENCE: certain > likely > possible > unverified
```

When merging a group, `severity` takes the max (most severe wins), `confidence` takes the max (most certain wins). Rationale: if one specialist says `high/certain` and another says `medium/possible`, the issue is high severity with certainty — don't down-rank for disagreement.

## Dedupe rules

1. Findings share a `root_issue` → merge into one entry.
2. Findings share `file:line_range` but different `root_issue` → keep separate (they're different issues at the same location).
3. Findings with different `root_issue` but identical `title` or `fix` → orchestrator flags as "possibly related" but does not auto-merge (avoid collapsing distinct issues).

## Cross-references

Use each finding's `related` field (IDs from other specialists) to build a cross-reference section at the end of REPORT.md showing which findings touch each other's scope.

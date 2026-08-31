# FSAD Training

HTML app for the most intensive lecture block of a 3-day FSAD workshop. Sibling to `fsad_playbook` — same visual language, same self-contained single-file distribution. Complements the playbook rather than duplicating it.

## Version

| Field | Value |
|-------|-------|
| **Current version** | v1.12 |
| **Date updated** | 2026-08-31 |
| **File** | `dist/fsad-training.html` |

See [CHANGELOG.md](CHANGELOG.md) for the detailed history of changes by version.

## Usage

Attendees: open `dist/fsad-training.html` in a browser. No server, no install.

## Development

```bash
npm install
npm run bundle
```

`npm run bundle` reads `src/index.html` + `src/markdown/*.md` + `skills/*/SKILL.md`, pre-renders the markdown with `marked`, and writes the self-contained `dist/fsad-training.html`.

## Local Plugin Setup

This repo packages its own `skills/` directory as a Claude Code plugin (`fsad-training-harness`, in the `fsad-training` marketplace), separate from `fsad_playbook`'s own `fsad-harness`/`fsad-playbook` plugin so the two can coexist without a naming collision.

```bash
claude plugin marketplace add /path/to/fsad_training
claude plugin install fsad-training-harness@fsad-training
```

Or just run the installer, which resolves the repo path for you:

```bash
./scripts/fsad_harness_install.sh
```

`claude plugin install` defaults to `-s/--scope user` (available in every project); pass `-s project` or `-s local` to scope it narrower. Confirm the install with:

```bash
claude plugin list
```

## Layout

```
src/
  index.html          app shell (CSS + JS embedded)
  markdown/*.md       sibling markdown artifacts surfaced in Section 4
skills/
  <name>/SKILL.md     installable skills copied from fsad_playbook, surfaced in the Skills Library page
scripts/
  bundle.mjs          ~85-line MD + SKILL.md substitution build
dist/
  fsad-training.html  generated, single-file, committed
planning/
  design/             design spec
  plan/               implementation plan
```

## Authoring markdown artifacts

1. Add a file under `src/markdown/`, e.g. `02-spec.md`. The numeric prefix is for filesystem ordering only — the bundler strips it.
2. Reference it in `src/index.html` via `<!-- @@MD:spec -->`.
3. Re-run `npm run bundle`.

The bundler throws on a placeholder with no matching markdown file, and warns on a markdown file with no matching placeholder. The same pattern applies to `skills/<name>/SKILL.md` via `<!-- @@SKILL:name -->` placeholders in the Skills Library page.

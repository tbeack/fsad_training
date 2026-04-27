# FSAD Training

HTML app for the most intensive lecture block of a 3-day FSAD workshop. Sibling to `fsad_playbook` — same visual language, same self-contained single-file distribution. Complements the playbook rather than duplicating it.

## Version

| Field | Value |
|-------|-------|
| **Current version** | v1.2 |
| **Date updated** | 2026-04-27 |
| **File** | `dist/fsad-training.html` |

See [CHANGELOG.md](CHANGELOG.md) for the detailed history of changes by version.

## Usage

Attendees: open `dist/fsad-training.html` in a browser. No server, no install.

## Development

```bash
npm install
npm run bundle
```

`npm run bundle` reads `src/index.html` + `src/markdown/*.md`, pre-renders the markdown with `marked`, and writes the self-contained `dist/fsad-training.html`.

## Layout

```
src/
  index.html          app shell (CSS + JS embedded)
  markdown/*.md       sibling markdown artifacts surfaced in Section 4
scripts/
  bundle.mjs          ~35-line MD substitution build
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

The bundler throws on a placeholder with no matching markdown file, and warns on a markdown file with no matching placeholder.

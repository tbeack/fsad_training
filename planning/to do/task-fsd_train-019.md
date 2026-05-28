# FSD_Train-019 — Setup the training material as a Vercel instance

## Summary
Add a `vercel.json` to the repo root so Vercel can serve `dist/fsad-training.html` as a hosted URL, mirroring the approach already in place for `fsad_playbook`. No build step is needed because `dist/` is committed and tracked in git. Once the file is committed, the user creates a Vercel project via the web UI and links it to the GitHub repo.

## Assessment
`fsad_playbook` already has a working `vercel.json`:
- `outputDirectory: "dist"` — tells Vercel which directory to serve
- A single catch-all rewrite routing `/(.*) → /fsad-playbook.html`

`fsad_training` has `dist/fsad-training.html` committed (`.gitignore` only excludes `node_modules/` and `.DS_Store`). No `vercel.json` exists yet. GitHub remote: `https://github.com/tbeack/fsad_training.git`.

**Location:** `vercel.json` — does not exist yet; will be created at repo root.

## Plan

1. Create `vercel.json` at repo root, adapting the playbook's config for the training file name:
   ```json
   {
     "outputDirectory": "dist",
     "rewrites": [
       { "source": "/(.*)", "destination": "/fsad-training.html" }
     ]
   }
   ```
2. Commit `vercel.json` and push to `main`.
3. **(User action)** Go to [vercel.com/new](https://vercel.com/new), click **Import Git Repository**, select `tbeack/fsad_training`.
4. **(User action)** On the project configuration screen: set Framework Preset to **Other**, leave the build command blank, leave output directory blank (vercel.json overrides it). Click **Deploy**.
5. **(User action)** After the first deploy, confirm the live URL loads the training app correctly.

All criteria verified 2026-05-28 before commit.

## Acceptance Criteria
- [x] `vercel.json` exists at the repo root with `outputDirectory: "dist"` and a rewrite from `/(.*) → /fsad-training.html`
- [x] The JSON content matches the playbook's structure (same two keys, same pattern)
- [ ] `vercel.json` is committed and present on the `main` branch
- [x] User instructions for creating the Vercel project are documented in this plan (Steps 3–5 above)

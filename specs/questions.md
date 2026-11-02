# Questions

Decisions a run couldn't make. `/run-phase` stops at a phase while a box under its heading is unticked.

To answer: write the answer under the question, tick the box, commit on the phase branch, run `sdd-next` again. The run folds the answer into the spec.

## Phase 4 — Daily data workflow (2026-11-02)
- [ ] The `protect-main` ruleset requires a pull request for every change to `main`, with no bypass actors, so `update-data.yml` can't push its daily data commit. How should the data reach `main`? — options: (A, recommended) add the "GitHub Actions" app to protect-main's bypass list (Settings → Rules → protect-main → Bypass list), so the workflow pushes directly with `GITHUB_TOKEN` (`contents: write`), as BRIEF §6.3 describes. PRs stay required for people. / (B) the workflow opens a daily PR and auto-merges it: needs "Allow auto-merge" and "Allow GitHub Actions to create and approve pull requests" switched on, and the site trigger must follow the merge, not the run; more moving parts and a PR per day in the history. / (C) the workflow commits `data/` to a separate `data` branch outside the ruleset, and `build-site.yml` takes `data/` from there; `main` then no longer holds current data, which changes BRIEF §6.3. blocks: specs/2026-11-02-daily-data/requirements.md § Decisions (permissions and push step)

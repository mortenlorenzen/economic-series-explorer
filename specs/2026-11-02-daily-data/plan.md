# Plan — Daily data workflow

Roadmap: Phase 4 · Branch: `phase-4-daily-data`

## Approach
Add `update-data.yml`, which runs `get_data.R` on a daily schedule and commits changed `data/` to `main`, and let `build-site.yml` also run when that workflow succeeds (the `workflow_run` decision in tech-stack.md). How the data commit gets past the `protect-main` ruleset is open (see Open questions); the rest is decided.

## Task groups
1. Data workflow: `.github/workflows/update-data.yml` (schedule + manual dispatch; R 4.6.1 + renv restore; run the pipeline; commit and push `data/` only when it changed).
2. Site trigger: `build-site.yml` also on `workflow_run` of "Update data", deploying only when that run succeeded.

## Open questions
- How the daily data commit reaches `main` under the `protect-main` ruleset: see specs/questions.md, Phase 4.

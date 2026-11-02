# Plan — Daily data workflow

Roadmap: Phase 4 · Branch: `phase-4-daily-data`

## Approach
Add `update-data.yml`, which runs `get_data.R` on a daily schedule and commits changed `data/` to `main`, and let `build-site.yml` also run when that workflow succeeds (the `workflow_run` decision in tech-stack.md). The data reaches `main` through a PR the workflow opens and merges itself, because `protect-main` requires PRs (questions.md Phase 4, revised answer B).

## Task groups
1. Data workflow: `.github/workflows/update-data.yml` (schedule + manual dispatch; R 4.6.1 + renv restore; run the pipeline; when `data/` changed, open a PR and squash-merge it).
2. Site trigger: `build-site.yml` also on `workflow_run` of "Update data", deploying only when that run succeeded.

## Open questions
- None (Phase 4 question answered: B).

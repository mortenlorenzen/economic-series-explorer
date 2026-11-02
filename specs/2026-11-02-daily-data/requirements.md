# Requirements — Daily data workflow

## Scope
- In: `update-data.yml`; a `workflow_run` trigger on `build-site.yml`.
- Out: any pipeline or page change.

## Decisions
- Workflow name "Update data". Triggers: `schedule` daily at 06:00 UTC (`0 6 * * *`), after the US close and the previous day's FRED releases; plus `workflow_dispatch` for manual runs.
- Runner `ubuntu-latest`. Setup: `actions/checkout@v7`, `r-lib/actions/setup-r@v2` with `r-version: 4.6.1` and `use-public-rspm: true`, `r-lib/actions/setup-renv@v2` (restores `renv.lock`, cached).
- Steps: `Rscript get_data.R`. A non-zero exit fails the job before the commit step, so a failed run commits nothing (BRIEF §6.3; the pipeline itself writes nothing on failure).
- Commit only when `git status --porcelain data/` is non-empty: author `github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>`, message `Update series data [automated]`, only `data/` staged.
- `concurrency: update-data`, no cancel, so two runs never push at once.
- `build-site.yml` gets `workflow_run: { workflows: ["Update data"], types: [completed] }`. Its build job runs when the event isn't `workflow_run` or the run's conclusion is `success`. For `workflow_run`, checkout takes the latest `main`, which includes the new data commit.
- A run with no data change still triggers a rebuild. This is harmless, and keeps the trigger simple.
- **Push to `main`** (questions.md Phase 4, answer A): the "GitHub Actions" app is on the `protect-main` ruleset's bypass list, so the job pushes directly with `GITHUB_TOKEN`. `permissions: contents: write` on update-data only. The checkout keeps its default credentials, and the push is a plain `git push` (fast-forward; the ruleset still blocks force-pushes and deletion). Pull requests stay required for people.

## Context
- Roadmap Phase 4 (BRIEF §6.3 workflows). Tech stack decisions log, 2026-11-02: `build-site.yml` runs on `workflow_run` because pushes made with `GITHUB_TOKEN` don't trigger other workflows.

## Scenarios

### Requirement: Daily update
#### Scenario: data changed
- WHEN the scheduled run fetches new observations
- THEN `main` gets one commit "Update series data [automated]" touching only `data/`, and the site rebuilds

#### Scenario: no change
- WHEN the data is identical
- THEN no commit is made and the job succeeds

#### Scenario: pipeline fails
- WHEN `get_data.R` exits non-zero
- THEN the job fails, nothing is committed, and `build-site.yml` doesn't deploy

### Requirement: Site rebuild after data
#### Scenario: successful update run
- WHEN "Update data" completes with success
- THEN "Build site" renders and deploys from the latest `main`

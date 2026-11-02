# Requirements — Daily data workflow

## Scope
- In: `update-data.yml`; a `workflow_run` trigger on `build-site.yml`.
- Out: any pipeline or page change.

## Decisions
- Workflow name "Update data". Triggers: `schedule` daily at 06:00 UTC (`0 6 * * *`), after the US close and the previous day's FRED releases; plus `workflow_dispatch` for manual runs.
- Runner `ubuntu-latest`. Setup: `actions/checkout@v7` with `ref: main` (a manual run from another branch must not merge that branch's commits), `r-lib/actions/setup-r@v2` with `r-version: 4.6.1` and `use-public-rspm: true`, `r-lib/actions/setup-renv@v2` (restores `renv.lock`, cached).
- Steps: `Rscript get_data.R`. A non-zero exit fails the job before the commit step, so a failed run commits nothing (BRIEF §6.3; the pipeline itself writes nothing on failure).
- Only when `git status --porcelain data/` is non-empty: on a new branch `update-data/<run id>`, commit only `data/` as `github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>` with message `Update series data [automated]`; push the branch; `gh pr create` into `main`; then `gh pr merge --squash --subject "Update series data [automated]"` straight away and delete the branch with `git push origin --delete`, skipped if GitHub already deleted it on merge. `main` gets exactly one commit per changed run, with that message.
- `concurrency: update-data`, no cancel, so two runs never push at once.
- `build-site.yml` gets `workflow_run: { workflows: ["Update data"], types: [completed] }`. Its build job runs when the event isn't `workflow_run` or the run's conclusion is `success`. For `workflow_run`, checkout takes the latest `main`, which includes the new data commit.
- A run with no data change still triggers a rebuild. This is harmless, and keeps the trigger simple.
- **Reaching `main`** (questions.md Phase 4, revised answer B): `protect-main` requires a PR, with 0 approvals and no required checks. A personal repo can't put the GitHub Actions app on the bypass list, so the job opens a PR and merges it itself with `GITHUB_TOKEN`. `permissions: contents: write, pull-requests: write` on update-data only. Requires the repo setting "Allow GitHub Actions to create and approve pull requests". "Allow auto-merge" isn't needed, because nothing makes the PR wait. The run-id branch name never collides; a run that fails after opening its PR leaves that PR open and the job red.
- The merge happens inside the job, so the `workflow_run` trigger (which fires when the job completes) checks out a `main` that already holds the data.

## Context
- Roadmap Phase 4 (BRIEF §6.3 workflows). Tech stack decisions log, 2026-11-02: `build-site.yml` runs on `workflow_run` because pushes made with `GITHUB_TOKEN` don't trigger other workflows.

## Scenarios

### Requirement: Daily update
#### Scenario: data changed
- WHEN the scheduled run fetches new observations
- THEN a PR from `update-data/<run id>` is opened and squash-merged, `main` gets one commit "Update series data [automated]" touching only `data/`, the branch is deleted, and the site rebuilds

#### Scenario: no change
- WHEN the data is identical
- THEN no branch, PR or commit is made and the job succeeds

#### Scenario: pipeline fails
- WHEN `get_data.R` exits non-zero
- THEN the job fails, no PR is opened, nothing is committed, and `build-site.yml` doesn't deploy

### Requirement: Site rebuild after data
#### Scenario: successful update run
- WHEN "Update data" completes with success
- THEN "Build site" renders and deploys from the latest `main`

# Requirements — Scaffold

## Scope
- In: Quarto website skeleton, `run-tests.sh`, renv with `renv.lock`, `js/series.js` with one pure function, `LICENSE`, `build-site.yml` deploying to GitHub Pages.
- Out: `series.csv`, `get_data.R`, any data or chart (phase 2); `update-data.yml` and the `workflow_run` trigger (phase 4); `about.qmd` and full site metadata (phase 11).

## Decisions
- `js/series.js` starts with `plottedValue(kind, value, anchor)` from BRIEF §6.5 (`level` → 100 × value / anchor, `rate` → value − anchor); unknown kind throws. Small, already specified, and gives the JS test something real.
- The R side has no code yet; the testthat test checks that `tests/fixtures/` exists, so the R half of the harness runs and can fail.
- `run-tests.sh` runs `Rscript tests/testthat.R` (testthat, `stop_on_failure = TRUE`) and then `node --test tests/js/`; it exits non-zero if either fails. Uses `set -euo pipefail`; no `package.json` (Node 26 detects ES module syntax); runs from the repo root regardless of the caller's directory.
- renv: implicit snapshot; `renv.lock` records renv, testthat and its dependencies only. The testthat call lives in `tests/testthat.R` (not inline in the shell script) so renv's dependency scan sees it. `renv/library/` is not committed (renv's own `renv/.gitignore`).
- `index.qmd` uses only OJS cells, so Quarto renders it with the markdown engine and CI needs no R.
- `_quarto.yml`: website project, output `_site/`, title "Economic Series Explorer". `render: ["*.qmd"]` so BRIEF, specs and other Markdown files are never published; `resources: [/js/]` (root-anchored, so `tests/js/` stays out) publishes the module.
- `build-site.yml` triggers: push to `main` and `workflow_dispatch`. Actions pinned to current major versions: `actions/checkout@v7`, `quarto-dev/quarto-actions/setup@v2` with Quarto 1.10.19, `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`. Concurrency group `pages`, no cancel of an in-progress deploy.
- CI does not run the tests in this phase: the tech stack names the Stop hook as the test runner, not CI.
- LICENSE: MIT, "Copyright (c) 2026 Morten Lorenzen".
- Placeholder text: the site title and one line saying the explorer is being built.

## Context
- Roadmap Phase 1 (BRIEF §3, §4, §6.3 build-site, §6.9). Mission: static files only; every phase leaves the deployed site working; Pages on from phase 1.

## Scenarios

### Requirement: Test harness
The project SHALL run all tests with `./run-tests.sh`, without network, exiting non-zero on any failure.

#### Scenario: all tests pass
- WHEN `./run-tests.sh` runs on a clean checkout with the renv library restored
- THEN testthat and `node --test` both run and the script exits 0

#### Scenario: a test fails
- WHEN any R or JS test fails
- THEN the script exits non-zero

### Requirement: plottedValue
`js/series.js` SHALL export `plottedValue(kind, value, anchor)`.

#### Scenario: level
- WHEN kind is `level`, value 150, anchor 100
- THEN it returns 150; and value equal to anchor returns 100

#### Scenario: rate
- WHEN kind is `rate`, value 5.5, anchor 4
- THEN it returns 1.5; and value equal to anchor returns 0

#### Scenario: unknown kind
- WHEN kind is anything else
- THEN it throws

### Requirement: Site renders
`quarto render` SHALL produce `_site/index.html` showing the site title, and `_site/js/series.js`.

#### Scenario: module import works
- WHEN the rendered page loads in a browser
- THEN `_site/` holds only `index.html`, `js/series.js` and Quarto's own files, and the OJS cell shows `plottedValue("level", 150, 100)` = 150, with no console errors

### Requirement: Deploy
`build-site.yml` SHALL render the site and deploy it to GitHub Pages on every push to `main`.

#### Scenario: merge to main
- WHEN this phase's PR is merged
- THEN the workflow succeeds and the Pages URL shows the placeholder page

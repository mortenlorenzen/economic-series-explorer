# Plan — Scaffold

Roadmap: Phase 1 · Branch: `phase-1-scaffold`

## Approach
Set up the empty Quarto website, the test harness and the Pages deploy, so every later phase lands on a working site with a check that can fail. `index.qmd` is a placeholder whose one OJS cell imports `js/series.js`, proving the browser module path works end to end. renv is initialised with only what the tests need now; later phases add packages to the same lockfile.

## Task groups
1. Test harness — `run-tests.sh`, `tests/testthat/` with one R test, `js/series.js` with `plottedValue`, `tests/js/series.test.js`, `tests/fixtures/`, renv init with `renv.lock`.
2. Site — `_quarto.yml`, placeholder `index.qmd` importing `js/series.js`, `.gitignore` for render output, `LICENSE` (MIT).
3. Deploy — `.github/workflows/build-site.yml`: on push to `main` (and manual dispatch), `quarto render`, deploy to GitHub Pages.

## Open questions
- None.

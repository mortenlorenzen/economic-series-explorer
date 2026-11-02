# Plan — First series end to end

Roadmap: Phase 2 · Branch: `phase-2-first-series`

## Approach
Add the registry with one row (S&P 500), a `get_data.R` that reads it, fetches Yahoo adjusted close, cleans it and writes `data/sp500.json` and `data/series.json`, and replace the placeholder page with a line chart of that file. Fetching, cleaning and writing are separate functions so tests run on a saved fixture. Full registry validation, transforms, retries, staleness and regression checks stay in phase 3.

## Task groups
1. Registry and pipeline — `series.csv`, `get_data.R` (read registry, fetch Yahoo, clean, build JSON, write), testthat tests on fixtures, renv lockfile updated.
2. Data — run `Rscript get_data.R`, commit `data/sp500.json` and `data/series.json`.
3. Page — `js/series.js` `toRows`, node test, `index.qmd` loads the data and plots it, `/data/` published.

## Open questions
- None.

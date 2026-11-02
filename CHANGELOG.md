# Changelog

## 2026-11-02
- Phase 4: daily `update-data.yml` (06:00 UTC) merges changed data into `main` through its own PR; the site rebuilds after each successful run
- Phase 3: all eleven series from Yahoo and FRED; registry validation, `yoy` transform, retries, staleness and regression checks; a failed run writes nothing
- Phase 2: `series.csv` registry with S&P 500, `get_data.R` pipeline writing `data/sp500.json` and `data/series.json`, first chart on the site
- Phase 1: Quarto site scaffold, test harness (`./run-tests.sh`), renv lockfile, MIT license, GitHub Pages deploy

## 2026-11-01
- Project set up for spec-driven development

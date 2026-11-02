# Changelog

## 2026-11-02
- Phase 9: PNG and CSV export of the current chart; CSV in long format at full resolution, PNG with every panel, title and source caption at 2×
- Phase 8: series files cached after the first download; daily series drawn as weekly averages for windows over 10 years
- Phase 7: Display (Indexed / Actual values) and Y-axis scale (Linear / Log) controls; actual-values chart for one series; log on the levels panel
- Phase 6: all eleven series pickable; rate series as percentage-point change in a second panel under the levels
- Phase 5: series picker (level series, max 8), date-range presets and From/To, indexed chart with end labels and tooltip
- Phase 4: daily `update-data.yml` (06:00 UTC) merges changed data into `main` through its own PR; the site rebuilds after each successful run
- Phase 3: all eleven series from Yahoo and FRED; registry validation, `yoy` transform, retries, staleness and regression checks; a failed run writes nothing
- Phase 2: `series.csv` registry with S&P 500, `get_data.R` pipeline writing `data/sp500.json` and `data/series.json`, first chart on the site
- Phase 1: Quarto site scaffold, test harness (`./run-tests.sh`), renv lockfile, MIT license, GitHub Pages deploy

## 2026-11-01
- Project set up for spec-driven development

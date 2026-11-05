# Changelog

## 2026-11-05
- Core visual: a one-page explainer of what makes the app work (`visuals/economic-series-explorer/`), made with the visual skill's core lens; not part of the site

## 2026-11-02
- R code style: `get_data.R` rewritten with dplyr, purrr and the native pipe; output unchanged
- More series: Hang Seng, CSI 300 China Tracker, MSCI AC World ETF, Gold, Crude Oil (WTI), Copper, Bitcoin, Consumer Prices Denmark and the Federal Funds Rate; selected lines never share a colour
- Tweaks: controls in a top bar over a full-width chart, series checkboxes in one row, two-handle date slider, PNG with series descriptions and a date · URL · © line, actual end labels at 2 decimals, About and footer text
- Phase 11: series descriptions above the chart (collapsed past two series), About page with sources and credit, navbar About and GitHub links, site description, Open Graph and footer
- Phase 10: a series that fails to load is named above the chart while the others still plot; all six edge cases in the brief checked; y-axis labels no longer touch the top tick
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

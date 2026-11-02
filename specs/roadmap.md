# Roadmap

Very small phases. Each phase = one branch = one `specs/YYYY-MM-DD-feature-name/` folder. Every phase leaves the deployed site working.

- [x] Phase 1 — Scaffold: Quarto site with placeholder `index.qmd`, `_quarto.yml`, `run-tests.sh` (testthat + `node --test`, one trivial test each), `js/series.js` stub, renv init with `renv.lock`, `LICENSE` (MIT), `build-site.yml` deploying to GitHub Pages (covers BRIEF §3, §4, §6.3 build-site, §6.9)
- [ ] Phase 2 — First series end to end: `series.csv` with S&P 500 only, `get_data.R` writing `data/sp500.json` and `data/series.json`, `index.qmd` plotting it (covers BRIEF §6.1, §6.2 steps 1–3 and 7, §6.3 JSON)
- [ ] Phase 3 — Registry and pipeline: all eleven series and descriptions, registry validation, `transform` lookup (`yoy`), retries, staleness and regression checks (covers BRIEF §6.1, §6.2)
- [ ] Phase 4 — Daily data workflow: `update-data.yml` committing changed `data/`, `build-site.yml` also on `workflow_run` (covers BRIEF §6.3 workflows)
- [ ] Phase 5 — Front end core: date x-axis, category picker (max 8), date-range presets and From/To, indexed levels in one panel (covers BRIEF §6.4, §6.5 levels only)
- [ ] Phase 6 — Rates and stacked panels (covers BRIEF §6.5 rates, two panels)
- [ ] Phase 7 — Actual-values mode and log scale (covers BRIEF §6.4 Display/Y-axis, §6.6 actual values)
- [ ] Phase 8 — Loading cache and downsampling (covers BRIEF §6.4 Loading, §6.6 Downsampling)
- [ ] Phase 9 — PNG and CSV export (covers BRIEF §6.7 export)
- [ ] Phase 10 — Edge cases (covers BRIEF §6.7 table)
- [ ] Phase 11 — Description note, about page and site metadata (covers BRIEF §6.6 Description note, §6.9 about.qmd, _quarto.yml)

## Later / maybe
- BRIEF §6.8: more series, more transforms, recession shading, shareable URLs, common-frequency resampling.
- See `specs/research/`

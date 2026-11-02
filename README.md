# Economic Series Explorer

Compare economic time series from Yahoo Finance and FRED on one date axis: indexed to a common start, or one series at a time as actual values.

**Live site:** https://mortenlorenzen.github.io/economic-series-explorer/

A personal project, built to explore growth scenarios and have quick access to the time series I follow.

## What it does

- Twenty series:
  - Markets: S&P 500, Dow Jones, NASDAQ, Hang Seng, CSI 300 China Tracker, MSCI AC World ETF, US Dollar Index
  - Commodities: Gold, Crude Oil (WTI), Copper
  - Crypto: Bitcoin
  - Output: Real GDP
  - Prices: Home Price Index, Inflation Rate, Consumer Prices Denmark
  - Labour: Unemployment Rate, Labor Force Participation
  - Rates: Federal Funds Rate, 10-Year Treasury Yield
  - Fiscal: Federal Debt to GDP
- Up to 8 series at once on a shared date axis. Level series are indexed to 100 on the start date. Rate series are shown as the change in percentage points, in a second panel.
- A single series as actual values, on a linear or log scale.
- Presets (1Y–Max) or a two-handle slider for the window. Windows over 10 years draw daily series as weekly averages, but indexing and export always use the full data.
- PNG export (chart, descriptions, source, date) and CSV export (long format, full resolution).

## How it works

```
series.csv ──► get_data.R ──► data/*.json ──► index.qmd (Quarto + Observable) ──► GitHub Pages
 (registry)    (daily, R)     (in the repo)   (all computation in the browser)
```

- `.github/workflows/update-data.yml` runs `get_data.R` every day at 06:00 UTC. When the data has changed, it opens a PR and squash-merges it, because `main` only accepts changes through PRs. A failed fetch commits nothing.
- `.github/workflows/build-site.yml` renders the site and deploys it to GitHub Pages after every push to `main` and after each successful data update.

## Run it locally

You need R 4.6.1, Quarto 1.10 and Node (for the JS tests).

```sh
Rscript -e 'renv::restore()'   # R packages from renv.lock
Rscript get_data.R             # refresh data/ (network)
quarto preview                 # local site with live reload
./run-tests.sh                 # testthat + node --test, on saved fixtures
```

## Adding a series

Add one row to `series.csv`; no other file changes. The next pipeline run fetches the series and it shows up in the picker.

| Column | Meaning |
| --- | --- |
| `id` | File name and URL key, e.g. `sp500` → `data/sp500.json` |
| `name`, `category`, `description` | As shown in the picker and the description note |
| `source`, `symbol` | `yahoo` with a ticker (`^GSPC`) or `fred` with a series id (`UNRATE`) |
| `kind` | `level` (indexed to 100) or `rate` (change in percentage points) |
| `transform` | `none` or `yoy` (year-over-year % change) |
| `unit` | Y-axis label in actual-values mode |
| `max_stale_days` | The pipeline warns if the newest observation is older than this, and fails above twice this |

## Repository layout

| Path | Holds |
| --- | --- |
| `series.csv` | The registry |
| `get_data.R` | The data pipeline |
| `index.qmd`, `about.qmd`, `_quarto.yml` | The site |
| `js/series.js` | Indexing, anchoring, downsampling and export logic, as pure functions |
| `data/` | Generated JSON, one file per series plus `series.json` |
| `tests/` | testthat and `node --test` tests, with `fixtures/` |
| `specs/` | Mission, tech stack, roadmap and one spec folder per feature |
| `BRIEF.md` | The original product brief (kept as written; `specs/` supersedes it) |

## Development

The project is built spec-first with Claude Code: each change gets a spec folder in `specs/`, code and spec change together, and every change reaches `main` through a PR. See `CLAUDE.md` and `CHANGELOG.md`.

## Credit and licence

Inspired by [jhelvy/potus-econ-scorecard](https://github.com/jhelvy/potus-econ-scorecard), used as a behaviour reference only; no code or text is copied. Data from [Yahoo Finance](https://finance.yahoo.com/) and [FRED](https://fred.stlouisfed.org/), Federal Reserve Bank of St. Louis.

MIT licence, © 2026 Morten Lorenzen. See `LICENSE`.

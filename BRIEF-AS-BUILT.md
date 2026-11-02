---
project: Economic Series Explorer
status: built
updated: 2026-11-02
source: "BRIEF.md, specs/"
---

# Economic Series Explorer — Brief (as built)

<!--
BRIEF.md is the original brief and stays as written. This file describes the app
as built on 2026-11-02, after Phases 1–11, the tweaks and the nine extra series.
A change that alters what this brief describes updates it in the same branch.
The reasons behind each change live in specs/ (decisions log in
specs/tech-stack.md, one folder per feature). Where specs/ and this brief
disagree, specs/ wins.
-->

## 1. Starting point

- Inspiration: https://github.com/jhelvy/potus-econ-scorecard (CC BY-SA 4.0) — **reference for behaviour only**. No code, texts, descriptions or styling copied; the same kind of app built independently.
- Ideas taken from it: daily R pipeline → JSON in the repo → Quarto static site on GitHub Pages → all computation in the browser; fail loudly on fetch errors; controls-plus-chart layout; direct end labels.
- Not wanted: anything presidential (inauguration dates, party colours, president picker, day-number x-axis).

## 2. Mission

### Why
A static web app for comparing economic time series on a shared date axis.

### Who it's for
- Morten, as a personal tool — published as a public site anyone can open. The about page stays short and factual; no teaching texts.

### Success looks like
- All series in the registry (twenty) load with full history and the daily pipeline stays green.
- Any 1–8 series can be compared indexed on one date axis, levels and rates together.
- Adding a series is one row in `series.csv` and nothing else.

### In scope
- Several series charted together, indexed to 100 at the start of a chosen date window (levels), or as percentage-point change (rates).
- A single series charted as actual values, with a linear or log y-axis.
- Twenty series from Yahoo Finance and FRED (§6.1), with full available history.
- A registry file that makes adding further series a one-row change.
- PNG and CSV export of the current chart (§6.7).

### Out of scope
- **Free choice of series in the browser** — Yahoo blocks cross-site browser requests and the FRED API needs a key that a public page cannot hide. Would need a proxy server.
- Copying code or text from the inspiration repo (§1).
- Later, not now: see §6.8 Future extensions.

## 3. Tech stack and constraints

| Layer | Choice | Version | Why |
|---|---|---|---|
| Data pipeline | R script `get_data.R` | R 4.6.1 | Good fetchers for FRED and Yahoo |
| R packages | quantmod (Yahoo), httr2 + readr (FRED CSV), jsonlite, testthat; pinned with renv | see `renv.lock` | CI installs exactly the local versions |
| Site | Quarto, rendered to GitHub Pages | Quarto 1.10.19 | Static site, OJS built in |
| Front end | Observable JS + Observable Plot inside `index.qmd` | as bundled with Quarto (Plot 0.6.11) | Reactive controls without a JS build step |
| JS logic + tests | Plain ES module `js/series.js`, `node --test` | Node 26.8.1 | Testable outside the browser |
| Automation | GitHub Actions: `update-data.yml` (daily), `build-site.yml` | — | Data change triggers the site build |
| Data sources | Yahoo Finance (adjusted close), FRED (public CSV download) | — | No keys |

Exact versions: `specs/tech-stack.md` and `renv.lock`.

Constraints:
- Static files only: no server, no R at runtime.
- The browser fetches only files in `data/`.
- Expected size: ~500 KB for the longest daily series, 1–3 MB for all of `data/`.

Conventions not visible in code:
- The R script names no series itself; everything comes from `series.csv`.
- Colours are assigned by registry order, so a series keeps its colour when others are toggled; only when two selected series would share a colour does the later one take the first free colour (§6.6).
- Indexing, anchoring, downsampling, colours and export logic live in a plain JS module (`js/series.js`) that `index.qmd` imports, so they can be tested outside the browser.

## 4. How to check work

- Run pipeline locally: `Rscript get_data.R` — fails loudly on any registry or fetch error.
- Preview site: `quarto preview` (render: `quarto render`).
- Tests: `./run-tests.sh` — runs `testthat` (registry validation, transforms) and `node --test` (`js/series.js`) on saved fixture data in `tests/fixtures/`. No network, non-zero exit on failure.
- Manual check: open the preview; try the edge cases in §6.7.

## 5. Roadmap

Built in eleven phases plus two follow-ups; every phase left the deployed site working. Details in `specs/roadmap.md`.

- [x] Phase 1 — Scaffold: Quarto site, test harness, renv, MIT licence, `build-site.yml` (§3, §4)
- [x] Phase 2 — First series end to end: S&P 500 in `series.csv`, `get_data.R`, first chart (§6.1–§6.3)
- [x] Phase 3 — Registry and pipeline: the first eleven series, validation, `yoy`, retries, staleness and regression checks (§6.1, §6.2)
- [x] Phase 4 — Daily data workflow `update-data.yml` (§6.3)
- [x] Phase 5 — Front end core: series picker (max 8), date-range presets, indexed levels in one panel (§6.4, §6.5)
- [x] Phase 6 — Rates and stacked panels (§6.5)
- [x] Phase 7 — Actual-values mode and log scale (§6.4, §6.6)
- [x] Phase 8 — Loading cache and downsampling (§6.4 Loading, §6.6)
- [x] Phase 9 — PNG and CSV export (§6.7)
- [x] Phase 10 — Edge cases (§6.7 table)
- [x] Phase 11 — Description note, about page and site metadata (§6.6, §6.9)
- [x] Tweaks — top bar with series checkboxes, date slider, PNG descriptions and footer, actual end labels at 2 decimals, About and footer text (§6.4, §6.6, §6.7)
- [x] More series — nine more series and the colour clash rule (§6.1, §6.6)

## 6. Product design

### 6.1 Series registry — `series.csv`

All series are predefined, one row per series. The R script reads this file; adding a series means adding a row, and the next daily run fetches it.

| Column | Example | Meaning |
| --- | --- | --- |
| `id` | `sp500` | File name and internal key; lowercase, no spaces |
| `name` | S&P 500 | Label in picker, end labels and tooltip |
| `category` | Markets | Group heading in the picker; groups show in order of first appearance |
| `source` | `yahoo` | `yahoo` or `fred` |
| `symbol` | `^GSPC` | Yahoo ticker or FRED series id |
| `kind` | `level` | `level` (indexed as ratio) or `rate` (shown as percentage-point change) |
| `transform` | `none` | `none` or `yoy`; extensible later (e.g. `log`, `diff`) |
| `unit` | Index points | Y-axis label in actual-values mode |
| `max_stale_days` | 7 | Days before the run warns; fails at twice this |
| `description` | The S&P 500 tracks… | Text shown above the chart and in the PNG |

Series, in registry order (start year from `data/series.json`, 2026-11-02):

| id | Name | Category | Source / symbol | Kind | Transform | Stale (days) | Start |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sp500` | S&P 500 | Markets | Yahoo `^GSPC` | level | none | 7 | 1927 |
| `djia` | Dow Jones | Markets | Yahoo `^DJI` | level | none | 7 | 1992 |
| `nasdaq` | NASDAQ | Markets | Yahoo `^IXIC` | level | none | 7 | 1971 |
| `hsi` | Hang Seng Index | Markets | Yahoo `^HSI` | level | none | 7 | 1986 |
| `csi300` | CSI 300 China Tracker | Markets | Yahoo `2827.HK` | level | none | 7 | 2024 |
| `msci_acwi` | MSCI AC World ETF | Markets | Yahoo `XMAW.DE` | level | none | 7 | 2014 |
| `dxy` | US Dollar Index | Markets | Yahoo `DX-Y.NYB` | level | none | 7 | 1971 |
| `gold` | Gold | Commodities | Yahoo `GC=F` | level | none | 7 | 2000 |
| `oil` | Crude Oil (WTI) | Commodities | FRED `DCOILWTICO` | level | none | 14 | 1986 |
| `copper` | Copper | Commodities | FRED `PCOPPUSDM` | level | none | 100 | 1992 |
| `bitcoin` | Bitcoin | Crypto | FRED `CBBTCUSD` | level | none | 7 | 2014 |
| `gdp` | Real GDP | Output | FRED `GDPC1` | level | none | 200 | 1947 |
| `housing` | Home Price Index | Prices | FRED `CSUSHPISA` | level | none | 130 | 1987 |
| `inflation` | Inflation Rate | Prices | FRED `CPIAUCSL` | rate | yoy | 90 | 1948 |
| `cpi_dk` | Consumer Prices Denmark | Prices | FRED `CP0000DKM086NEST` | level | none | 70 | 1996 |
| `unemployment` | Unemployment Rate | Labour | FRED `UNRATE` | rate | none | 70 | 1948 |
| `labor_participation` | Labor Force Participation | Labour | FRED `CIVPART` | rate | none | 70 | 1948 |
| `fedfunds` | Federal Funds Rate | Rates | FRED `FEDFUNDS` | rate | none | 70 | 1954 |
| `treasury10yr` | 10-Year Treasury Yield | Rates | FRED `DGS10` | rate | none | 10 | 1962 |
| `debt_gdp` | Federal Debt to GDP | Fiscal | FRED `GFDEGDQ188S` | rate | none | 300 | 1966 |

The first eleven come from BRIEF.md; the nine others were added on 2026-11-02 (`specs/2026-11-02-more-series/`). Copper is the IMF global price `PCOPPUSDM` ("Copper" is no FRED id); Danish CPI is the Eurostat HICP, as the OECD series stopped in 2025.

Known data limits: Yahoo has `2827.HK` only from 2024-04-24, so selecting it moves the effective start there; WTI oil was negative on 2020-04-20, so Log is disabled for windows that include that day.

Descriptions: our own, 1–2 plain sentences each — what the series measures, its source and frequency.

### 6.2 Pipeline — `get_data.R`

1. Read and validate the registry at startup: ten columns, unique lowercase ids, `source` in {yahoo, fred}, `kind` in {level, rate}, a known `transform`, numeric `max_stale_days` > 0, no empty text fields. Every problem is reported in one error and stops the run.
2. Fetch each series with full available history: Yahoo adjusted close from `1900-01-01` (quantmod); FRED via its public CSV download (httr2). Three tries, waiting 2 s and 4 s.
3. Drop NA and duplicate dates; sort by date.
4. Apply `transform`: `none` passes through, `yoy` = year-over-year percentage change against the same calendar date a year earlier.
5. Staleness: last observation older than `max_stale_days` → warning; older than twice that → the run fails.
6. Regression check: a new file with fewer observations than the published one → the run fails.
7. Write `data/<id>.json` and `data/series.json` (§6.3), values at 7 significant digits. All series finish before anything is written, so a failed run writes nothing.

Fetching and transforming are separate functions, so tests run the transform and validation on saved fixture data.

### 6.3 JSON output and workflows

One file per series, `data/<id>.json`, parallel-array layout:

```json
{
  "id": "sp500", "name": "S&P 500", "category": "Markets",
  "source": "yahoo", "symbol": "^GSPC",
  "kind": "level", "unit": "Index points", "description": "…",
  "first_date": "1927-12-30", "last_date": "2026-10-29", "n": 24800,
  "dates": ["1927-12-30", …], "values": [17.66, …]
}
```

`data/series.json` holds the same metadata for all series without `dates` and `values`, in registry order; the page builds the picker from it.

Workflows:
- `update-data.yml`: daily at 06:00 UTC (and on demand), runs `get_data.R`. When `data/` changed, it commits it on a branch as "Update series data [automated]", opens a PR into `main` and squash-merges it itself (`main` is protected and requires PRs). A failed run commits nothing.
- `build-site.yml`: on every push to `main` and after each successful `update-data.yml` run, `quarto render` and deploy to GitHub Pages; `data/` copied into the site.

### 6.4 Top bar and loading

All controls sit in one framed, light grey bar above the chart, so the chart uses the full page width. The series checkboxes form the top row; a thin line separates them from the other controls, in this order: Date range, Display, Y-axis scale, Export. The bar wraps on narrow screens. The description note, title, subtitle, panels and notes sit together in one bordered card under the bar.

| Control | Type | Default | Behaviour |
| --- | --- | --- | --- |
| Series | Checkboxes grouped by category, always visible, with Deselect All | S&P 500, NASDAQ | At most 8 selected; further boxes disabled until one is cleared |
| Date range | Presets 1Y, 5Y, 10Y, 20Y, Max plus one slider with two handles (From, To) | 10Y | The slider spans the earliest `first_date` to the latest `last_date` in the registry, one day per step; handles can't cross; the chosen dates show beside it; arrow keys move a focused handle one day; the chart redraws when a handle is released. A preset sets both handles (To = data end) and stays highlighted until a handle moves |
| Display | Inline radio: Indexed / Actual values | Indexed | Enabled only when exactly one series is selected; otherwise fixed to Indexed |
| Y-axis scale | Inline radio: Linear / Log | Linear | Indexed: disabled with a tooltip when the levels panel isn't shown or any plotted *level* value is ≤ 0 (rates are always linear). Actual: when any value in the window is ≤ 0 |
| Export | Buttons PNG, CSV | — | Disabled when no chart is drawn |

Loading: `data/series.json` loads at start. Each selected series is fetched from `data/<id>.json` in parallel (`Promise.all`) and cached in a `Map`, so re-ticking a series doesn't download it again. A failed fetch is dropped from the cache, so unticking and ticking retries it.

### 6.5 Indexed mode

- **Effective start** = the later of the window's From date and the latest `first_date` among selected series. All lines begin together; the subtitle names the series that moved the start, e.g. "Window starts 1992-01-02, when Dow Jones data begins".
- **Anchor**: each series at its first valid observation on or after the effective start. More than 180 days later → series left out and named in a note under the chart.
- **Plotted value** by `kind`:
  - `level`: 100 × value / anchor → starts at 100.
  - `rate`: value − anchor, in percentage points → starts at 0.
- **Two panels** when both kinds are selected: identical x-domain and margins. Top: levels, "Index, start = 100", reference line at 100. Bottom: rates, "Change, percentage points", reference line at 0. A panel appears only if it has a series; levels get 60% of the height when both show.
- **Log scale** applies to the levels panel only; rates are always linear.

### 6.6 Actual values, downsampling, chart

Actual-values mode (single series only): values as stored, clipped to the window, `unit` as y-axis label; no start clamping, no anchor. Log allowed when every value in the window is above zero. Rates on a linear scale start the y-axis at zero when no value is negative, with a reference line at 0.

Downsampling: window longer than 10 years → daily series (median gap ≤ 7 days) drawn as weekly averages (ISO weeks, plotted at each week's last trading day). Monthly and quarterly series are never resampled. Indexing is computed on raw data first; the first point (the anchor) and the last point are always drawn exactly. CSV export uses full resolution.

Chart:
- X-axis: date, domain = effective start to To date (actual mode: From to To), ticks adapting to window length.
- Colours: Observable10 palette, by registry order. When two selected series would share a colour, the later one in registry order takes the first colour not yet used, so no two lines ever share one.
- End labels: name plus last value, decluttered so labels don't overlap, per panel. Indexed: 1 decimal ("S&P 500 (184.3)", "Unemployment Rate (+1.2 pp)"). Actual: 2 decimals ("Inflation Rate (3.72)").
- Tooltip: series name, date, plotted value and actual value. A weekly-averaged point shows "Week to <date>".
- Title: "Indexed performance since <start date>", or the series name in actual mode.
- Subtitle: "100 = value on <start date>; rates as change in percentage points" (the parts that apply), or "<unit>, <linear|log> scale" in actual mode.

Description note: above the chart, "**Name**: description" for each selected series. More than two series → collapses into a `<details>` element listing the names.

### 6.7 Export and edge cases

Both exports show the chart as on screen: same mode, window, scale and series; left-out series are not included.

PNG export: one image with the title, subtitle, every panel, the left-out note, then "Name: description" for every exported series (whether or not the note is collapsed on screen), the source line ("Source: Yahoo Finance, FRED.") and a footer line `<export date> · mortenlorenzen.github.io/economic-series-explorer · © 2026 Morten Lorenzen`. Text wraps to the chart width; webfonts are inlined; rasterised at 2×.

CSV export: long format, full resolution, one row per series and date:

```csv
series,date,value,plotted,mode
sp500,2016-10-31,2126.15,100,indexed
unemployment,2016-10-01,4.9,0,indexed
```

File name: `<ids joined by +>_<mode>_<from>_<to>_<today>.csv`, e.g. `sp500+nasdaq_indexed_2016-10-31_2026-10-30_2026-10-30.csv`. The PNG uses the same name with `.png`.

| Situation | Behaviour |
| --- | --- |
| No series selected | Placeholder "Select at least one series"; export buttons disabled |
| A series has no observation within 180 days of the start | Series left out; note under the chart names it |
| The window ends before the effective start | Placeholder naming the series whose start date caused it, suggesting a later To date (From after To can't happen: the slider handles can't cross) |
| Log scale with zero or negative values | Log option disabled with a tooltip; scale falls back to Linear |
| Display set to Actual, then a second series is ticked | Display returns to Indexed automatically |
| A series fails to load | "Could not load <names>. Untick and tick again to retry." above the chart; the other series still plot |

### 6.8 Future extensions (not in this roadmap)

- Further series: rows in `series.csv`; FRED also carries many non-US series (OECD, Eurostat, ECB).
- More transforms: `log`, `diff`, moving averages.
- Shaded recession periods from FRED `USREC`.
- Shareable URLs encoding selection, window and mode in the hash.
- Resampling all series to a common frequency, for aligned CSV export.

### 6.9 Files

| File | Holds |
| --- | --- |
| `series.csv` | The registry |
| `get_data.R` | The pipeline (§6.2) |
| `index.qmd` | Controls, chart, export |
| `js/series.js` | Indexing, anchoring, downsampling, colours, export logic — pure functions |
| `about.qmd` | Purpose, how it works, a sources table built from `data/series.json`, credit to potus-econ-scorecard as inspiration |
| `run-tests.sh` | Runs all tests (§4) |
| `_quarto.yml` | Site title, URLs, navbar (Explorer, About, GitHub), footer ("© 2026 Morten Lorenzen" · "Data: Yahoo Finance, FRED · MIT licence") |
| `renv.lock` | Pinned R package versions |
| `data/*.json`, `data/series.json` | Generated data |
| `tests/` | `testthat` and `node --test` tests, `fixtures/` with saved data |
| `.github/workflows/update-data.yml`, `build-site.yml` | Automation |
| `README.md`, `CHANGELOG.md` | Project overview; one line per merged change |
| `LICENSE` | MIT |

## 7. Decisions made

- Build independently instead of forking — an own repo, history and license; the inspiration repo is a behaviour reference only.
- Same kind of architecture as the inspiration: R pipeline, JSON in the repo, Quarto + Observable on GitHub Pages — static, no server.
- Predefined series only, no free entry — no proxy server (§2 Out of scope).
- Full available history over a fixed earliest date — one rule for every source.
- A registry file over series named in code — adding a series becomes a one-row change.
- `rate` series shown as percentage-point change, not as a ratio — a ratio of rates is meaningless.
- Weekly averages above 10 years, raw data for indexing and export — fast charts without changing the numbers.
- Browser logic in a plain JS module — testable without a browser.
- MIT license, with credit to potus-econ-scorecard as inspiration on the about page — nothing is copied, so credit is courtesy, not a licence term.
- Tests from phase 1, on saved data, through one `./run-tests.sh` — unattended runs need a check that can fail.
- Pages on from phase 1, every phase leaves the site working — progress is visible after each merge.
- Log scale in indexed mode depends on the levels panel only — the rates panel always contains 0 and is always linear.
- Daily data reaches `main` through a PR the workflow opens and merges itself — a personal repo can't let GitHub Actions bypass the PR rule.
- All controls in a top bar, series as always-visible checkboxes, a two-handle date slider instead of From/To inputs — a full-width chart (owner's tweaks).
- Twenty series instead of eleven; colours re-assigned on a clash so selected lines never share one.
- BRIEF.md stays as the original; this file describes the app as built.

## 8. Links

| Link | Use it for |
|---|---|
| https://mortenlorenzen.github.io/economic-series-explorer/ | The live site |
| https://github.com/jhelvy/potus-econ-scorecard | Behaviour reference only — not a code source |
| https://fred.stlouisfed.org/ | Checking FRED series ids and start dates |
| https://finance.yahoo.com/ | Checking Yahoo tickers |

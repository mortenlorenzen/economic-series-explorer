---
project: Economic Series Explorer
status: ready
updated: 2026-11-01
source: "raw/economic-series-explorer-spec.md"
---

# Economic Series Explorer — Brief

<!--
Built from Morten's spec (raw/economic-series-explorer-spec.md) using
templates/project-brief.md. sdd-init.sh copies it to the project root as BRIEF.md.
Claude: read this before the constitution interview and ask only about gaps,
contradictions and §8 Open questions. Once specs/ exists, specs/ wins.
-->

## 1. Starting point

- Type: **new project** → constitution prompt 1. The repo starts empty.
- Inspiration: https://github.com/jhelvy/potus-econ-scorecard (CC BY-SA 4.0) — **reference for behaviour only**. Don't copy its code, texts, descriptions or styling; build the same kind of app independently.
- What to take from it as ideas: daily R pipeline → JSON in the repo → Quarto static site on GitHub Pages → all computation in the browser; fail loudly on fetch errors; sidebar-plus-chart layout; direct end labels.
- Not wanted: anything presidential (inauguration dates, party colours, president picker, day-number x-axis).

## 2. Mission

### Why
A static web app for comparing economic time series on a shared date axis.

### Who it's for
- Morten, as a personal tool — published as a public site anyone can open. The about page stays short and factual; no teaching texts.

### Success looks like
- Proposed, confirm in interview:
  - All eleven series load with full history and the daily pipeline stays green.
  - Any 1–8 series can be compared indexed on one date axis, levels and rates together.
  - Adding a series is one row in `series.csv` and nothing else.

### In scope
- Several series charted together, indexed to 100 at the start of a chosen date window.
- A single series charted as actual values, with a linear or log y-axis.
- Eleven series from Yahoo Finance and FRED (§6.1), with full available history.
- A registry file that makes adding further series a one-row change.

### Out of scope
- **Free choice of series in the browser** — Yahoo blocks cross-site browser requests and the FRED API needs a key that a public page cannot hide. Would need a proxy server.
- Copying code or text from the inspiration repo (§1).
- Later, not now: see §6.8 Future extensions.

## 3. Tech stack and constraints

| Layer | Choice | Version | Why |
|---|---|---|---|
| Data pipeline | R script `get_data.R` | R 4.6.1 (installed) | Good fetchers for FRED and Yahoo |
| Site | Quarto, rendered to GitHub Pages | Quarto 1.10.19 (installed) | Static site, OJS built in |
| Front end | Observable JS + Observable Plot inside `index.qmd` | as bundled with Quarto | Reactive controls without a JS build step |
| Automation | GitHub Actions: `update-data.yml` (daily), `build-site.yml` | — | Data commit triggers the site build |
| Data sources | Yahoo Finance (adjusted close), FRED (public CSV download) | — | FRED CSV needs no key |

Versions: Claude pins R packages (e.g. via `renv`) during the constitution and records them in `specs/tech-stack.md`.

Constraints:
- Static files only: no server, no R at runtime.
- The browser fetches only files in `data/`.
- Expected size: ~500 KB for the longest daily series, 1–3 MB for all of `data/`.

Conventions not visible in code:
- The R script names no series itself; everything comes from `series.csv`.
- Colours are assigned by registry order, so a series keeps its colour when others are toggled.
- Indexing, anchoring and downsampling live in a plain JS module (`js/series.js`) that `index.qmd` imports, so they can be tested outside the browser.

## 4. How to check work

- Run pipeline locally: `Rscript get_data.R` — must fail loudly on any registry or fetch error.
- Preview site: `quarto preview` (render: `quarto render`).
- Tests: `./run-tests.sh` — runs `testthat` (registry validation, transforms) and `node --test` (`js/series.js`) on saved fixture data in `tests/fixtures/`. No network, non-zero exit on failure. This is the Stop hook's test command; phase 1 creates it.
- Manual check: open the preview; try the edge cases in §6.7.

## 5. Roadmap seed

Proposed; Claude may merge or split. Every phase leaves the deployed site working; GitHub Pages is on from phase 1.

- [ ] Phase 1 — Scaffold: Quarto site, test harness, `series.csv` with S&P 500 only, `get_data.R` writing `data/sp500.json` and `data/series.json`, `index.qmd` plotting it, `build-site.yml` (§3, §4, §6.3)
- [ ] Phase 2 — Registry and pipeline: all eleven series, registry validation, `transform` lookup, staleness and regression checks (§6.1, §6.2)
- [ ] Phase 3 — Daily data workflow `update-data.yml` (§6.3)
- [ ] Phase 4 — Front end core: date x-axis, category picker (max 8), date-range presets, indexed levels in one panel (§6.4, §6.5 levels only)
- [ ] Phase 5 — Rates and stacked panels (§6.5 rates, two panels)
- [ ] Phase 6 — Actual-values mode and log scale (§6.4 Display/Y-axis, §6.6)
- [ ] Phase 7 — Loading cache and downsampling (§6.4 Loading, §6.6 Downsampling)
- [ ] Phase 8 — PNG and CSV export (§6.7)
- [ ] Phase 9 — Edge cases, description note, about page and site metadata (§6.7 table, §6.6 Description note, §6.9)

## 6. Product design

### 6.1 Series registry — `series.csv`

All series are predefined, one row per series. The R script reads this file; adding a series means adding a row, and the next daily run fetches it.

| Column | Example | Meaning |
| --- | --- | --- |
| `id` | `sp500` | File name and internal key; lowercase, no spaces |
| `name` | S&P 500 | Label in picker, end labels and tooltip |
| `category` | Markets | Group heading in the picker |
| `source` | `yahoo` | `yahoo` or `fred` |
| `symbol` | `^GSPC` | Yahoo ticker or FRED series id |
| `kind` | `level` | `level` (indexed as ratio) or `rate` (shown as percentage-point change) |
| `transform` | `none` | `none` or `yoy`; extensible later (e.g. `log`, `diff`) |
| `unit` | Index points | Y-axis label in actual-values mode |
| `max_stale_days` | 7 | Days before the run warns; fails at twice this |
| `description` | The S&P 500 tracks… | Text shown above the chart |

Initial series (start dates approximate; the first pipeline run confirms them):

| id | Name | Category | Source / symbol | Kind | Transform | Stale (days) | Approx. start |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sp500` | S&P 500 | Markets | Yahoo `^GSPC` | level | none | 7 | 1927 |
| `djia` | Dow Jones | Markets | Yahoo `^DJI` | level | none | 7 | 1992 |
| `nasdaq` | NASDAQ | Markets | Yahoo `^IXIC` | level | none | 7 | 1971 |
| `dxy` | US Dollar Index | Markets | Yahoo `DX-Y.NYB` | level | none | 7 | 1971 |
| `gdp` | Real GDP | Output | FRED `GDPC1` | level | none | 200 | 1947 |
| `housing` | Home Price Index | Prices | FRED `CSUSHPISA` | level | none | 130 | 1987 |
| `inflation` | Inflation Rate | Prices | FRED `CPIAUCSL` | rate | yoy | 90 | 1948 |
| `unemployment` | Unemployment Rate | Labour | FRED `UNRATE` | rate | none | 70 | 1948 |
| `labor_participation` | Labor Force Participation | Labour | FRED `CIVPART` | rate | none | 70 | 1948 |
| `treasury10yr` | 10-Year Treasury Yield | Rates | FRED `DGS10` | rate | none | 10 | 1962 |
| `debt_gdp` | Federal Debt to GDP | Fiscal | FRED `GFDEGDQ188S` | rate | none | 300 | 1966 |

Descriptions: new, 1–2 plain sentences each — what the series measures, its source and frequency.

### 6.2 Pipeline — `get_data.R`

1. Read and validate the registry at startup: unique ids, `source` in {yahoo, fred}, `kind` in {level, rate}, a known `transform`, numeric `max_stale_days`. Any error stops the run.
2. Fetch each series with full available history: Yahoo adjusted close from `1900-01-01`; FRED via its public CSV download. Retry transient failures.
3. Drop NA and duplicate dates; sort by date.
4. Apply `transform`: `none` passes through, `yoy` = year-over-year percentage change.
5. Staleness: last observation older than `max_stale_days` → warning; older than twice that → the run fails.
6. Regression check: a new file with fewer observations than the published one → the run fails.
7. Write `data/<id>.json` and `data/series.json` (§6.3).

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

`data/series.json` holds the same metadata for all series without `dates` and `values`; the page builds the picker from it.

Workflows:
- `update-data.yml`: daily, runs `get_data.R`, commits changed `data/` as "Update series data [automated]". A failed run commits nothing.
- `build-site.yml`: on every push to `main`, `quarto render` and deploy to GitHub Pages; `data/` copied into the site.

### 6.4 Sidebar and loading

| Control | Type | Default | Behaviour |
| --- | --- | --- | --- |
| Series | Checkboxes grouped by category, with Deselect All | S&P 500, NASDAQ | At most 8 selected; further boxes disabled until one is cleared |
| Date range | Presets 1Y, 5Y, 10Y, 20Y, Max plus From/To date inputs | 10Y | A preset sets From/To; editing a date clears the preset highlight |
| Display | Radio: Indexed / Actual values | Indexed | Enabled only when exactly one series is selected; otherwise fixed to Indexed |
| Y-axis scale | Radio: Linear / Log | Linear | Indexed: disabled with a tooltip when any plotted *level* value is ≤ 0 (rates are always linear). Actual: when any value in the window is ≤ 0 |

Loading: `data/series.json` loads at start. Each selected series is fetched from `data/<id>.json` in parallel (`Promise.all`) and cached in a `Map`, so re-ticking a series doesn't download it again.

### 6.5 Indexed mode

- **Effective start** = the later of the window's From date and the latest `first_date` among selected series. All lines begin together; the subtitle names the series that moved the start, e.g. "Window starts 1992-01-02, when Dow Jones data begins".
- **Anchor**: each series at its first valid observation on or after the effective start. More than 180 days later → series left out and named in a note under the chart.
- **Plotted value** by `kind`:
  - `level`: 100 × value / anchor → starts at 100.
  - `rate`: value − anchor, in percentage points → starts at 0.
- **Two panels** when both kinds are selected: identical x-domain and margins. Top: levels, "Index, start = 100", reference line at 100. Bottom: rates, "Change, percentage points", reference line at 0. A panel appears only if it has a series; levels get ~60% of the height when both show.
- **Log scale** applies to the levels panel only; rates are always linear.

### 6.6 Actual values, downsampling, chart

Actual-values mode (single series only): values as stored, clipped to the window, `unit` as y-axis label; no start clamping, no anchor. Log allowed when every value in the window is above zero. Rates on a linear scale start the y-axis at zero.

Downsampling: window longer than 10 years → daily series drawn as weekly averages (ISO weeks, plotted at each week's last trading day). Monthly and quarterly series are never resampled. Indexing is computed on raw data first; the anchor point is always drawn exactly. CSV export uses full resolution.

Chart:
- X-axis: date, domain = effective start to To date, year ticks adapting to window length.
- Colours: Observable10 palette, by registry order.
- End labels: name plus last value ("S&P 500 (184.3)", "Unemployment (+1.2 pp)"), decluttered so labels don't overlap, per panel.
- Tooltip: series name, date, plotted value and actual value.
- Title: "Indexed performance since <start date>", or the series name in actual mode.
- Subtitle: "100 = value on <start date>; rates as change in percentage points", or unit and scale in actual mode.

Description note: above the chart, the description of each selected series. More than two series → collapses into a `<details>` element listing the names.

### 6.7 Export and edge cases

PNG export: clone the chart SVG, inline webfonts, add a source caption, rasterise at 2×. With two panels, both go into one SVG so the export matches the screen.

CSV export: long format, full resolution, one row per series and date:

```csv
series,date,value,plotted,mode
sp500,2016-10-31,2126.15,100,indexed
unemployment,2016-10-01,4.9,0,indexed
```

File name: `<ids joined by +>_<mode>_<from>_<to>_<today>.csv`, e.g. `sp500+nasdaq_indexed_2016-10-31_2026-10-30_2026-10-30.csv`.

| Situation | Behaviour |
| --- | --- |
| No series selected | Placeholder "Select at least one series"; export buttons disabled |
| A series has no observation within 180 days of the start | Series left out; note under the chart names it |
| The window ends before the effective start | Placeholder naming the series whose start date caused it, suggesting a later To date |
| Log scale with zero or negative values | Log option disabled with a tooltip; scale falls back to Linear |
| Display set to Actual, then a second series is ticked | Display returns to Indexed automatically |
| A series fails to load | Message naming the series; the other series still plot |

### 6.8 Future extensions (not in this roadmap)

- More series: rows in `series.csv`; FRED also carries many non-US series (OECD, Eurostat, ECB).
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
| `js/series.js` | Indexing, anchoring, downsampling — pure functions |
| `about.qmd` | Purpose, sources, credit to potus-econ-scorecard as inspiration |
| `run-tests.sh` | Runs all tests (§4) |
| `_quarto.yml` | Site title, URLs, navbar |
| `data/*.json`, `data/series.json` | Generated data |
| `tests/` | `testthat` and `node --test` tests, `fixtures/` with saved data |
| `.github/workflows/update-data.yml`, `build-site.yml` | Automation |
| `LICENSE` | MIT |

## 7. Decisions already made

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

## 8. Open questions

All closed 2026-11-01:

- [x] App name: **Economic Series Explorer**; repo `economic-series-explorer`.
- [x] Default series: **S&P 500 and NASDAQ**.
- [x] Who it's for: **personal tool, public site** (§2).
- [x] License: **MIT**, credit the original as inspiration (§7).
- [x] Tests: **as in §4**, wrapper `./run-tests.sh`.
- [x] Every phase leaves the site working; **Pages from phase 1**.
- [x] Log-scale rule: **levels panel only** (§6.4).

## 9. Links

| Link | Use it for | Pinned |
|---|---|---|
| https://github.com/jhelvy/potus-econ-scorecard | Behaviour reference only — how the original looks and works. Not a code source | `8bc3eb6`, 2026-10-30 |
| https://fred.stlouisfed.org/ | Checking FRED series ids and start dates | — |
| https://finance.yahoo.com/ | Checking Yahoo tickers | — |

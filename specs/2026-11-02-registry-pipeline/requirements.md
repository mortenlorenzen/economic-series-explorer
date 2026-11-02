# Requirements — Registry and pipeline

## Scope
- In: BRIEF §6.1 registry with all eleven series; BRIEF §6.2 steps 1–7 in full; regenerated `data/`.
- Out: the daily workflow (phase 4); any front-end change — the page keeps plotting the first registry entry (S&P 500).

## Decisions
- **Validation** (`validate_registry()`, run by `read_registry()`), every problem collected and reported in one error:
  - `id`: matches `^[a-z0-9_]+$` (lowercase, no spaces) and is unique.
  - `source` ∈ {yahoo, fred}; `kind` ∈ {level, rate}; `transform` is a name in the transform lookup.
  - `max_stale_days`: numeric and > 0.
  - `name`, `category`, `symbol`, `unit`, `description`: not empty.
  - The ten-column check from phase 2 stays.
- **FRED fetch**: `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<symbol>` with httr2. The CSV has columns `observation_date,<symbol>`; empty cells are missing values (FRED's public CSV leaves them blank, e.g. holidays in DGS10). `parse_fred_csv(text)` turns it into `date`, `value`; a header that doesn't match the symbol stops with an error.
- **Retries**: `with_retry(f, tries = 3, wait = 2)` retries any error with waits of 2 s and 4 s, then rethrows with the series id. Used for both Yahoo and FRED; the httr2 request gets no extra retry of its own, so the retry rule is the same for both sources. Tests pass `wait = 0`.
- **Transforms**: a named list `transforms` of functions `(df) -> df`; adding one later (`log`, `diff`) is one entry.
  - `none`: passes through.
  - `yoy`: for each date, the value at the same calendar date one year earlier must exist; result is `100 * (value / earlier − 1)`, in percent. Dates without an exact one-year-earlier match are dropped, so a monthly series loses its first 12 observations. Clean runs before transform, so duplicates are already gone.
  - Transformed values are rounded only when written (7 significant digits, phase 2).
- **Staleness** (`check_staleness(row, df, today)`): age = `today − last date` in days, `today` = the run's UTC date. Age > `max_stale_days` → warning naming the series and age; age > 2 × `max_stale_days` → error. Dates are FRED's period start dates (e.g. 2026-07-01 for Q3), and the §6.1 thresholds are set for that.
- **Regression** (`check_regression(id, n, dir = "data")`): if `data/<id>.json` exists and its `n` is greater than the new `n` → error naming both counts. No existing file → fine (a new series).
- **Run**: `main()` processes every series, collecting errors instead of stopping at the first, so one run reports every broken series. Any error → stop with all messages, nothing written. Warnings are printed and don't stop the run. Step order: fetch → clean → transform → staleness → regression; all series finish before `write_data()`.
- **Units** come from FRED's series metadata, checked 2026-11-02; the Yahoo indices use "Index points":
  - sp500, djia, nasdaq, dxy: Index points.
  - gdp: Billions of chained 2017 dollars.
  - housing: Index, Jan 2000 = 100.
  - inflation: Percent, year over year. This is the unit after `yoy`, not CPI's raw index.
  - unemployment, labor_participation, treasury10yr: Percent.
  - debt_gdp: Percent of GDP.
- **Descriptions**: new, 1–2 plain sentences each — what it measures, source and frequency. Nothing taken from the inspiration repo.
- Registry order and every other column as the table in BRIEF §6.1.

## Context
- Roadmap Phase 3 (BRIEF §6.1, §6.2). Mission: all eleven series with full history; fail loudly; adding a series is one row in `series.csv`.

## Scenarios

### Requirement: Registry validation
#### Scenario: the real registry
- WHEN `series.csv` is read
- THEN it validates, has eleven rows, and its ids are in BRIEF §6.1 order

#### Scenario: every rule
- WHEN a fixture registry has a duplicate id, an id with a capital or space, an unknown source, kind or transform, a non-numeric or zero `max_stale_days`, or an empty name
- THEN one error lists every problem with its row id

### Requirement: FRED fetch
#### Scenario: parse with missing values
- WHEN `parse_fred_csv()` gets a fixture with blank values
- THEN it returns `date` (Date) and `value` (numeric), with NA where blank (clean drops them)

#### Scenario: wrong header
- WHEN the header names another symbol
- THEN it stops naming both

### Requirement: Retries
#### Scenario: transient failure
- WHEN a fetch fails twice and then succeeds
- THEN `with_retry()` returns the result after three calls

#### Scenario: persistent failure
- WHEN it fails three times
- THEN it stops with the series id and the last error message

### Requirement: Transforms
#### Scenario: none
- WHEN `transform` is `none`
- THEN the data is unchanged

#### Scenario: yoy on monthly data
- WHEN `yoy` runs on 25 monthly CPI fixture values
- THEN 13 rows remain, starting one year after the first date, each `100 × (v / v one year earlier − 1)`

#### Scenario: gaps
- WHEN the one-year-earlier date is missing
- THEN that row is dropped

### Requirement: Staleness
#### Scenario: fresh / stale / too stale
- WHEN the last date is within `max_stale_days`, past it, or past twice it
- THEN no warning; a warning naming the series and its age; an error

### Requirement: Regression
#### Scenario: fewer observations
- WHEN the published file has `n` = 10 and the new data has 9
- THEN it stops with "sp500: 9 observations, published file has 10"

#### Scenario: equal, more, or new
- WHEN the new `n` is equal or larger, or there's no published file
- THEN it passes

### Requirement: Nothing written on failure
#### Scenario: one series fails
- WHEN one of several series fails a check
- THEN `run_pipeline()` stops listing that series, and no file in the data directory changes

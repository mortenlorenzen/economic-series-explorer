# Requirements — First series end to end

## Scope
- In: `series.csv` with the S&P 500 row; `get_data.R` steps 1–3 and 7 of BRIEF §6.2 for Yahoo; `data/sp500.json`, `data/series.json`; `index.qmd` showing the S&P 500 as a line over its full history.
- Out (phase 3): the other ten series, FRED fetch, full registry validation (allowed values, unique ids, numeric `max_stale_days`), `transform` lookup, retries, staleness and regression checks. Out (phase 5+): controls, date window, indexing, colours, labels.

## Decisions
- `series.csv` columns and order as BRIEF §6.1: `id,name,category,source,symbol,kind,transform,unit,max_stale_days,description`. S&P 500 row: `sp500`, `S&P 500`, `Markets`, `yahoo`, `^GSPC`, `level`, `none`, `Index points`, `7`, and a new description (not from the inspiration repo).
- Registry check this phase: the file has exactly the ten columns above, otherwise the run stops. The rest of §6.2 step 1 is phase 3.
- A `source` other than `yahoo` stops the run with "unsupported source" until phase 3 adds FRED.
- `transform` other than `none` stops the run until phase 3 adds the lookup.
- Fetch: `quantmod::getSymbols(symbol, src = "yahoo", from = "1900-01-01", auto.assign = FALSE)`, adjusted close (`Ad()`). Returns a data frame `date` (Date), `value` (numeric).
- Clean: drop rows with NA value, drop duplicate dates (keep the first), sort by date. An empty result after cleaning stops the run.
- JSON: per-series object in the field order of BRIEF §6.3 (`id, name, category, source, symbol, kind, unit, description, first_date, last_date, n, dates, values`). Dates as `YYYY-MM-DD` strings; values written with jsonlite `digits = 4` (at most four decimals; enough for every series in §6.1). `series.json` is an array of the same objects without `dates` and `values`, in registry order. `transform` and `max_stale_days` are pipeline settings and stay out of the JSON, as in the §6.3 example.
- All series are fetched and cleaned before any file is written, so a failed run writes nothing. Files are UTF-8, pretty-printed off (smaller), one trailing newline.
- `get_data.R` runs `main()` only when executed with `Rscript`, so tests can `source()` it without fetching.
- R packages added to renv: quantmod 0.4.29 (with its dependencies), readr 2.2.0, jsonlite 2.0.0.
- Page: OJS loads `data/series.json` and `data/<id>.json` for the first registry entry with `fetch` (as in §6.4), turns parallel arrays into rows with `toRows` in `js/series.js`, and draws an Observable Plot line: x = date, y = value, y label = `unit`, title = the series name. No controls yet.
- `_quarto.yml` publishes `/data/` as a resource (root-anchored, like `/js/`).

## Context
- Roadmap Phase 2 (BRIEF §6.1, §6.2 steps 1–3 and 7, §6.3 JSON). Mission: adding a series is one row in `series.csv`; fail loudly. Tech stack: the R script names no series itself.

## Scenarios

### Requirement: Registry
`get_data.R` SHALL read `series.csv` and stop on a malformed file.

#### Scenario: valid registry
- WHEN `series.csv` has the ten columns
- THEN `read_registry()` returns one row per series with `max_stale_days` numeric

#### Scenario: missing column
- WHEN a column is missing or extra
- THEN `read_registry()` stops with an error naming the columns

### Requirement: Clean
`clean_series()` SHALL drop NA values and duplicate dates and sort by date.

#### Scenario: messy input
- WHEN the fixture has an NA, a duplicate date and unsorted rows
- THEN the result is sorted, has no NA and no duplicate dates, and keeps the first of the duplicates

#### Scenario: nothing left
- WHEN every value is NA
- THEN it stops with an error naming the series

### Requirement: JSON output
`series_json()` SHALL build the §6.3 object and `write_data()` SHALL write `data/<id>.json` and `data/series.json`.

#### Scenario: per-series file
- WHEN a cleaned fixture series is written to a temporary directory
- THEN `<id>.json` has the §6.3 fields in order, `first_date`/`last_date`/`n` match the data, and `dates`/`values` have length `n`

#### Scenario: index file
- WHEN the same series is written
- THEN `series.json` is an array with one object holding the metadata and no `dates` or `values`

### Requirement: Unsupported settings stop the run
#### Scenario: unknown source or transform
- WHEN a registry row has `source` other than `yahoo` or `transform` other than `none`
- THEN `fetch_series()` / the pipeline stops with an error naming the series

### Requirement: Rows for the chart
`toRows(series)` in `js/series.js` SHALL turn the parallel arrays into `{date: Date, value}` rows.

#### Scenario: arrays to rows
- WHEN given `{dates: ["2020-01-02","2020-01-03"], values: [1, 2]}`
- THEN it returns two rows with UTC `Date` objects and the values

#### Scenario: length mismatch
- WHEN `dates` and `values` differ in length
- THEN it throws

### Requirement: Page shows the S&P 500
#### Scenario: render
- WHEN the site is rendered and opened
- THEN it shows a line chart titled "S&P 500" from 1927 to the last date, y-axis "Index points", no console errors

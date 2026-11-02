# Requirements — R code style

## Scope
- In: the owner's R convention (tidyverse, native pipe `|>`, `<-` assignment, snake_case) applied to `get_data.R`; dplyr and purrr in `renv.lock`; the convention written into tech-stack and BRIEF-AS-BUILT.
- Out: any change in behaviour, output or error messages; the FRED fetcher (stays httr2); `tests/` (they test behaviour, which doesn't change).

## Decisions
- **Convention** (owner, 2026-11-02): R code uses the tidyverse (dplyr, purrr, readr, tibble), the native pipe `|>`, `<-` for assignment and snake_case names. Short anonymous functions use `\(x)`.
- **Calls stay namespaced** (`dplyr::filter()`, not `library(dplyr)`), as before, so sourcing `get_data.R` in tests attaches nothing.
- **One fetcher not possible**: quantmod 0.4.29's FRED method failed three times in a row on `DCOILWTICO` without an API key ("requests without an API key are not guaranteed to succeed"; HTTP/2 stream error), while httr2 fetched the same `fredgraph.csv`. The owner keeps httr2 for FRED rather than adding a FRED API key secret.
- **Kept as base R where tidyverse adds nothing**: the retry loop in `with_retry()` (purrr's `insistently()` adds jitter, which changes the waits) and the `match()` lookup in `yoy()` (no lubridate needed).
- Data frames become tibbles; the JSON is built from vectors, so the output doesn't change.

## Context
- Owner's request after the roadmap; tech-stack had no R style rule.

## Scenarios

### Requirement: Same behaviour
`get_data.R` SHALL produce the same files and the same errors as before the rewrite.

#### Scenario: tests
- WHEN `./run-tests.sh` runs
- THEN every existing test passes unchanged

#### Scenario: byte-identical output
- WHEN the old and new pipeline run on the same saved raw fetches of all twenty series
- THEN every file in the output directory is byte-identical

#### Scenario: fetchers
- WHEN the new `fetch_series()` fetches all twenty series live
- THEN each result equals the old fetcher's result from the same day

# Plan — Registry and pipeline

Roadmap: Phase 3 · Branch: `phase-3-registry-pipeline`

## Approach
Grow `get_data.R` from one Yahoo series to the full BRIEF §6.2 pipeline: validate the registry, fetch Yahoo and FRED with retries, clean, apply `transform`, check staleness and regressions, then write. Every check is a separate function tested on fixtures. `series.csv` gets all eleven rows with new descriptions, and the data files are regenerated.

## Task groups
1. Registry validation — `validate_registry()` and its tests.
2. Fetch — FRED CSV via httr2 (`parse_fred_csv()` on fixtures), `with_retry()` around both sources, source dispatch.
3. Transform — `transform` lookup with `none` and `yoy`, tests on a CPI fixture.
4. Checks — staleness (warn / fail at 2×) and regression (fewer observations than published fails); `main()` collects errors across series and writes nothing if any.
5. Registry and data — all eleven rows in `series.csv`, run the pipeline, commit `data/`.

## Open questions
- None.

# Validation — Registry and pipeline

## Automated
- [ ] `./run-tests.sh` passes; each scenario has a test (no network)
- [ ] `quarto render` succeeds and `ls _site/data/*.json | wc -l` is 12 (eleven series + `series.json`)
- [ ] Lint/typecheck: none

## Manual
- [ ] `Rscript get_data.R` (network) exits 0; prints one line per series with count and date range; start dates close to BRIEF §6.1
- [ ] `du -ch data/*.json | tail -1` is within 1–3 MB
- [ ] Break a symbol in a scratch copy of `series.csv` → run fails naming that series and `git status data/` shows no change
- [ ] After merge: the site still shows the S&P 500 chart

## Done when
All boxes ticked, roadmap phase ticked, CHANGELOG updated.

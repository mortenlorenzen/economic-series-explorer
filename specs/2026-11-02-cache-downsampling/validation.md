# Validation — Loading cache and downsampling

## Automated
- [ ] `./run-tests.sh` passes; each logic scenario has a node test
- [ ] `quarto render` succeeds
- [ ] Lint/typecheck: none

## Manual
- [ ] Headless or real browser: untick and re-tick NASDAQ → `performance.getEntriesByName(".../data/nasdaq.json")` has one entry
- [ ] S&P 500 over Max → line has ~5,200 points; over 10Y ~2,500; label equals the real last value
- [ ] Unemployment over Max → every month drawn (not resampled)
- [ ] Tooltip on a downsampled line reads "Week to …"
- [ ] No console errors; after merge the Pages site shows the same

## Done when
All boxes ticked, roadmap phase ticked, CHANGELOG updated.

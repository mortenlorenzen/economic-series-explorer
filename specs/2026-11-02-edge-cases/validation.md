# Validation — Edge cases

## Automated
- [ ] `./run-tests.sh` passes; `loadAll`, `failureMessage` and the series check have node tests
- [ ] `quarto render` succeeds
- [ ] Lint/typecheck: none

## Manual
Headless or real browser, one check per §6.7 row:
- [ ] Deselect all → "Select at least one series"; PNG and CSV disabled
- [ ] S&P 500 + Federal Debt to GDP, From 2026-06-01 → Debt to GDP left out, note names it
- [ ] Dow Jones + S&P 500, From 1980-01-01, To 1990-01-01 → placeholder names Dow Jones and its first date, suggests a later To date
- [ ] Unemployment alone in actual mode, window with a 0 or negative → n/a with stored data; indexed S&P 500 log is allowed, and a rates-only selection disables Log with its tooltip
- [ ] Actual values for S&P 500, then tick NASDAQ → Display back to Indexed
- [ ] Block `data/djia.json`, select S&P 500 + Dow Jones → message names Dow Jones, S&P 500 still plots, CSV only sp500; unblock, untick and tick Dow Jones → message gone
- [ ] Rates panel: the y-axis label doesn't touch the top tick label
- [ ] No console errors apart from the blocked request; after merge the Pages site does the same

## Done when
All boxes ticked, roadmap phase ticked, CHANGELOG updated.

# Validation — PNG and CSV export

## Automated
- [ ] `./run-tests.sh` passes; each logic scenario has a node test
- [ ] `quarto render` succeeds
- [ ] Lint/typecheck: none

## Manual
- [ ] Headless or real browser, default view (S&P 500 + NASDAQ, 10Y): CSV downloads as `sp500+nasdaq_indexed_<start>_<to>_<today>.csv`, first row after the header has `plotted` 100
- [ ] S&P 500 + Unemployment over Max: CSV has every daily S&P 500 row (~24,800, not weekly); PNG shows both panels, title, subtitle and "Source: Yahoo Finance, FRED." caption, at 2× the SVG size
- [ ] Actual mode (one series): CSV `mode` is `actual` and `plotted` equals `value`
- [ ] Deselect all: both buttons disabled
- [ ] The PNG title is drawn in Source Sans Pro (not a serif fallback)
- [ ] No console errors; after merge the Pages site does the same

## Done when
All boxes ticked, roadmap phase ticked, CHANGELOG updated.

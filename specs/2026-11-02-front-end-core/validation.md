# Validation — Front end core

## Automated
- [ ] `./run-tests.sh` passes; each logic scenario has a node test
- [ ] `quarto render` succeeds; `_site/index.html` and `_site/js/series.js` exist
- [ ] Lint/typecheck: none

## Manual
- [ ] `quarto preview`, defaults: S&P 500 and NASDAQ ticked, 10Y highlighted, two lines from 100 with end labels, no console errors
- [ ] Tick Dow Jones with Max → title starts 1992-01-02, the subtitle names Dow Jones
- [ ] Tick 8 series… (only 6 level series exist this phase, so the limit is checked by the `canSelect` test)
- [ ] Edit From → preset highlight clears; Deselect All → "Select at least one series"
- [ ] Set To before 1992 with Dow Jones ticked → the window-ends placeholder
- [ ] Tooltip shows name, date, plotted and actual value
- [ ] After merge: the Pages site shows the same

## Done when
All boxes ticked, roadmap phase ticked, CHANGELOG updated.

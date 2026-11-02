# Validation — Scaffold

## Automated
- [ ] `./run-tests.sh` passes; each scenario has a test
- [ ] `quarto render` succeeds and `test -f _site/index.html && test -f _site/js/series.js`
- [ ] Failure is detected: temporarily breaking a JS assertion makes `./run-tests.sh` exit non-zero (checked once, not committed)
- [ ] Lint/typecheck: none

## Manual
- [ ] `quarto preview`: page shows "Economic Series Explorer" and the OJS cell value 150; no console errors
- [ ] After merge: "Build site" workflow on `main` is green and https://mortenlorenzen.github.io/economic-series-explorer/ shows the placeholder

## Done when
All boxes ticked, roadmap phase ticked, CHANGELOG updated.

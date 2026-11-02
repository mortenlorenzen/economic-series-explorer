# Validation — Rates and stacked panels

## Automated
- [ ] `./run-tests.sh` passes; each logic scenario has a node test
- [ ] `quarto render` succeeds
- [ ] Lint/typecheck: none

## Manual
- [ ] Headless or real browser: S&P 500 + Unemployment Rate → two panels, labels "Index, start = 100" / "Change, percentage points", end labels "S&P 500 (…)" / "Unemployment Rate (±… pp)", subtitle as specified, no console errors
- [ ] Only rates (e.g. Unemployment + Inflation) → one panel from 0; subtitle "Rates as change in percentage points"
- [ ] Both panels' plot areas start and end at the same x pixel
- [ ] Tooltip on each panel shows Index / Change in the right format
- [ ] After merge: the Pages site shows the same

## Done when
All boxes ticked, roadmap phase ticked, CHANGELOG updated.

# Validation — Actual values and log scale

## Automated
- [ ] `./run-tests.sh` passes; each logic scenario has a node test
- [ ] `quarto render` succeeds
- [ ] Lint/typecheck: none

## Manual
- [ ] Headless or real browser: defaults → Display disabled (two series); untick NASDAQ → Display enabled; Actual + Log + Max on S&P 500 → title "S&P 500", subtitle "Index points, log scale"
- [ ] Tick a second series while Actual → back to Indexed, Display disabled
- [ ] Indexed with rates only → Log disabled with tooltip; Actual on Inflation Rate with Max → Log disabled (negative years)
- [ ] Indexed S&P 500 + Unemployment on Log → levels panel log, rates panel linear
- [ ] No console errors; after merge the Pages site shows the same

## Done when
All boxes ticked, roadmap phase ticked, CHANGELOG updated.

# Validation — Tweaks after the roadmap

## Automated
- [ ] `./run-tests.sh` passes; slider day mapping, end label, PNG footer and layout have node tests
- [ ] `quarto render` succeeds
- [ ] Lint/typecheck: none

## Manual
- [ ] 1400 px screen: controls in one bar above the chart, no sidebar, chart wider than 1,100 px
- [ ] Series dropdown: opens, ticks update the chart and the count, closes on an outside click and on Escape
- [ ] Slider: dragging updates the dates live and redraws on release; handles can't cross; the arrow keys move one day; presets set it
- [ ] Actual mode on Inflation Rate: the end label has 2 decimals
- [ ] PNG with 3 series: three description lines, source line, footer line with today's date, the URL and © 2026 Morten Lorenzen
- [ ] About page has the personal-project sentence; site footer shows © 2026 Morten Lorenzen
- [ ] Phone width: the bar wraps, nothing overflows
- [ ] No console errors

## Done when
All boxes ticked, CHANGELOG updated, PR open.

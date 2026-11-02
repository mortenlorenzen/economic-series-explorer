# Plan — Edge cases

Roadmap: Phase 10 · Branch: `phase-10-edge-cases`

## Approach
Five of the six rows in the BRIEF §6.7 edge-case table were built in Phases 5–9. This phase builds the sixth, a series that fails to load, and checks all six again in the browser. Loading becomes "settled": each series either loads or is reported by name, and the chart, window, controls and export work from the series that loaded. The logic is pure and tested in `js/series.js`. The rates-panel axis-label overlap found in Phase 9 is fixed here too.

## Task groups
1. Load-failure logic: `loadAll(ids, load)` (successes in order plus failed ids, never rejects), `failureMessage(names)`, and a page loader that treats an HTTP error as a failure + tests.
2. Page: the chart, window, log rule and export use only the loaded series; a message above the chart names the failed series; all six table rows checked in the browser.
3. Axis label: more top margin, so a panel's y-axis label doesn't touch its top tick label.

## Open questions
- None.

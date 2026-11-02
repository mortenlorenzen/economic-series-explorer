# Plan — Actual values and log scale

Roadmap: Phase 7 · Branch: `phase-7-actual-log`

## Approach
Add the Display (Indexed / Actual values) and Y-axis scale (Linear / Log) controls from BRIEF §6.4, and the actual-values chart from §6.6. The rules for when each control is enabled, the actual-values window and log-aware domains and label placement go into `js/series.js` with tests; `index.qmd` keeps one panel-drawing function for both modes.

## Task groups
1. Logic: `displayMode`, `logScale` (allowed + reason), `actualPoints`, log-aware `yDomain` and `declutterValues`, `formatActual`, `actualSubtitle` + tests.
2. Controls: Display and Y-axis radios in the sidebar, enabled/disabled with a tooltip, falling back automatically.
3. Chart: actual-values mode (single series, unit label, linear/log), log on the levels panel in indexed mode.

## Open questions
- None.

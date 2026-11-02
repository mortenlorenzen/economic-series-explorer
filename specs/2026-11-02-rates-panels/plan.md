# Plan — Rates and stacked panels

Roadmap: Phase 6 · Branch: `phase-6-rates-panels`

## Approach
Open the picker to all eleven series and draw `rate` series as percentage-point change from the anchor in their own panel under the levels panel. Panel layout (which panels, heights) and rate labels are pure functions in `js/series.js`; `index.qmd` draws each panel with one shared function so both use the same x-domain and margins.

## Task groups
1. Logic: `formatEndLabel` with kind (rate → "+1.2 pp"), `PANELS` settings, `panelHeights` + tests.
2. Page: all series in the picker; one panel function drawing levels (top) and rates (bottom) with identical x-domain and margins; per-panel end labels and tooltip; subtitle covers both kinds.

## Open questions
- None.

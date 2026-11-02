# Plan — Front end core

Roadmap: Phase 5 · Branch: `phase-5-front-end-core`

## Approach
Replace the single fixed chart with a sidebar of controls (series picker, date range) and an indexed chart of the selected *level* series in one panel. All window, anchor, indexing, colour and label logic goes into `js/series.js` as pure functions with node tests; `index.qmd` only wires controls, fetches and Plot marks.

## Task groups
1. Window logic: `shiftYears`, `presetRange`, `effectiveStart` + tests.
2. Indexing logic: `anchorAndIndex` (anchor, 180-day rule, plotted values), `colorFor`, `formatEndLabel`, `declutter` + tests.
3. Controls: series picker grouped by category (max 8, Deselect All, defaults) and date-range presets + From/To in the sidebar; `canSelect` + tests.
4. Chart: indexed levels panel with date x-axis, reference line at 100, coloured lines, decluttered end labels, tooltip, title, subtitle, left-out note, two placeholders.

## Open questions
- None.

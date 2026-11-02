# Plan — Loading cache and downsampling

Roadmap: Phase 8 · Branch: `phase-8-cache-downsampling`

## Approach
Cache each series' fetch in a `Map`, so re-ticking a series doesn't download it again. When the drawn window is longer than 10 years, draw daily series as ISO-week averages, computed after indexing, with the anchor and last points kept exact. All of it is pure functions in `js/series.js` with node tests; `index.qmd` only calls them.

## Task groups
1. Cache: `createLoader(fetchJson)` (Map of promises, failed fetches not kept) + tests; the page loads through it.
2. Downsampling logic: `isDaily`, `isoWeekKey`, `windowOverTenYears`, `downsampleWeekly` + tests.
3. Page: downsample drawn points in both modes when the window is over 10 years; tooltip says when a value is a weekly average.

## Open questions
- None.

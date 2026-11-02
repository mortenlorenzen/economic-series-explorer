# Plan — PNG and CSV export

Roadmap: Phase 9 · Branch: `phase-9-export`

## Approach
Two buttons in the sidebar, PNG and CSV, export what the chart shows. Everything that can be pure is pure and lives in `js/series.js` with node tests: the CSV rows and text, the file name, the source caption, the PNG layout, and picking the `@font-face` rules to inline. `index.qmd` only does the DOM work: it builds one SVG from the header, the panels, the note and the caption, inlines the webfont, rasterises at 2× and triggers the download.

## Task groups
1. CSV logic: `exportRows`, `toCsv`, `exportFileName`, `todayLocal` + tests.
2. PNG logic: `sourceCaption`, `exportLayout`, `parseFontFaces`, `pickFontFaces` + tests on a saved Google Fonts CSS fixture.
3. Page: the chart cell becomes a named `chart` element; an Export group in the sidebar with PNG and CSV buttons, disabled when no chart is drawn; CSV download; PNG build, font inlining, 2× rasterising and download.

## Open questions
- None.

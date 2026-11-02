# Plan — Description note, about page and site metadata

Roadmap: Phase 11 · Branch: `phase-11-about-metadata`

## Approach
The description note comes from the registry's `description` field. Choosing between plain paragraphs and a `<details>` element is a pure function in `js/series.js`, with node tests; `index.qmd` only renders the result. `about.qmd` is a short page of our own text. Its source table is built from `data/series.json`, so adding a series still needs one row in `series.csv` and nothing else. `_quarto.yml` gains the About link and site metadata.

## Task groups
1. Note logic: `descriptionNote(selected)` + tests.
2. Page: the note above the chart in `index.qmd`.
3. About page and metadata: `about.qmd`, plus `_quarto.yml` navbar, description, Open Graph and footer.

## Open questions
- None.

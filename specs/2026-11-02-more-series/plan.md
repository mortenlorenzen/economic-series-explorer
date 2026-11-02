# Plan — More series

Branch: `more-series` (owner's request after the roadmap)

## Approach
Adding a series is one row in `series.csv` (mission), so the nine series are nine rows. Two things change around them:
- Colours: 20 series share 10 palette colours, so two selected series must never get the same one.
- Text that says "eleven series".

Data for the new series is fetched once locally, so the site shows them as soon as this merges. After that, the daily pipeline keeps them current.

## Task groups
1. Colours: `assignColors(ids, indexOf)` — registry colour, or the next free palette colour on a clash — + tests; the page uses it.
2. Registry: nine rows in `series.csv`, two new categories (Commodities, Crypto); registry test updated; `Rscript get_data.R` run to write `data/`.
3. Text: mission, README and About updated from "eleven" to twenty series and the new sources.

## Open questions
- None (copper and Danish CPI answered by the owner on 2026-11-02).

# Plan — R code style

Branch: `r-style` (owner's request after the roadmap; builds on `align-specs-brief`)

## Approach
Rewrite `get_data.R` in the owner's R style with no change in behaviour. Every function keeps its name, arguments and error messages, so the tests stay as they are. Proof of no change: the old and new code run on the same saved raw fetches, and the output is compared byte for byte.

## Task groups
1. Setup: install dplyr and purrr; `renv::snapshot()`.
2. Baseline: save one raw fetch of every series (scratch, not committed); run the old pipeline on it.
3. Core: rewrite `get_data.R` — dplyr for cleaning, `yoy`, parsing; purrr for validation, the pipeline loop and writing; pipes throughout.
4. Check: tests, byte-identical output, live fetch comparison.
5. Text: tech-stack convention and stack row, BRIEF-AS-BUILT §3, roadmap, retro, CHANGELOG.

## Open questions
- None (owner chose httr2 for FRED on 2026-11-02).

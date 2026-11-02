# Retro

One line per phase: what went wrong, what the spec missed, what to change in the kit.
- 2026-11-02 Phase 1 scaffold: Quarto rendered every .md (BRIEF, specs) into the public site and a bare `js/` resource glob also published `tests/js/`; renv implicit snapshot missed testthat called only from a shell script → kit: tech-stack template should prompt for "what the site publishes" (render list, resources) on Quarto projects
- 2026-11-02 Phase 2 first-series: spec said "4 decimals" without looking at the data — Yahoo float32 noise needed 7 significant digits; jsonlite auto_unbox turned 1-element arrays into scalars (caught by reviewer) → kit: feature-spec step should fetch one real sample before fixing number formats

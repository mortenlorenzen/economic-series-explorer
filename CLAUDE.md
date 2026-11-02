# economic-series-explorer

## Commands
<!-- How to check work. The constitution fills these in. The Stop hook runs the Test command; `none` or a <placeholder> disables it. -->
- Test: `./run-tests.sh`
- Lint/typecheck: `none`
- Preview: `quarto preview` (site on localhost, live reload)
- Refresh data: `Rscript get_data.R` (network; tests never need it)

## Git
- `main` is protected: every change goes through a branch and a PR, merged by the owner. Never push to `main`.

## Specs
This project uses spec-driven development.
- BRIEF.md, if present, is the original product brief: input for writing specs, never edited.
- BRIEF-AS-BUILT.md describes the app as built: a change that alters what it describes updates it in the same branch. Where specs/ and either brief disagree, specs/ wins.
- Read specs/mission.md, specs/tech-stack.md and specs/roadmap.md before any feature work.
- Feature specs live in specs/YYYY-MM-DD-feature-name/ (plan.md, requirements.md, validation.md).
- When writing spec files, use the headings in specs/_templates/.
- Change specs and code together; never let them drift.
- Never guess a product decision: undecided → specs/questions.md under the phase's heading.
- After each phase, one line in specs/retro.md: what went wrong, what to change in the kit.

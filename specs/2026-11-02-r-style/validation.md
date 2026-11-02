# Validation — R code style

## Automated
- [x] `./run-tests.sh` passes with no test changed (74 R, 73 JS)
- [x] Old and new pipeline on the same saved raw fetches: all 21 output files byte-identical
- [x] New fetchers live vs old fetchers' results the same day: all twenty series equal
- [x] `renv::status()` reports a consistent state

## Manual
- [x] The first `update-data.yml` run after merge is green (manual run 41530641698, data merged in #18)

## Done when
All boxes ticked, CHANGELOG updated, PR open.

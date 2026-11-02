# Validation — Description note, about page and site metadata

## Automated
- [ ] `./run-tests.sh` passes; `descriptionNote` has node tests for 0, 1, 2 and 3 series
- [ ] `quarto render` succeeds and writes `_site/about.html`
- [ ] `grep -c 'og:title' _site/index.html _site/about.html` gives at least 1 for each
- [ ] Lint/typecheck: none

## Manual
- [ ] Default view: two description lines above the title
- [ ] Tick Unemployment: a closed "About the series: …" `<details>`; it opens to three lines
- [ ] Deselect all: no note
- [ ] Block `data/djia.json`, select Dow Jones: its description line still shows above the load-failure message
- [ ] Export a PNG with the note showing: the note is not in the image
- [ ] About page: the table has eleven rows, and the credit link and MIT are shown; the navbar About link works
- [ ] No console errors; after merge the Pages site shows the same

## Done when
All boxes ticked, roadmap phase ticked, CHANGELOG updated.

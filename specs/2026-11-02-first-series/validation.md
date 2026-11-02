# Validation — First series end to end

## Automated
- [ ] `./run-tests.sh` passes; each scenario has a test (no network)
- [ ] `quarto render` succeeds and `test -f _site/data/sp500.json && test -f _site/data/series.json`
- [ ] Nothing private published: `find _site -not -path '*/site_libs/*' -type f` lists only `index.html`, `js/series.js`, `data/sp500.json`, `data/series.json`, `search.json`, `sitemap.xml`, `robots.txt`
- [ ] Lint/typecheck: none

## Manual
- [ ] `Rscript get_data.R` (network) exits 0 and rewrites `data/sp500.json` (~24,800 observations from 1927-12-30, ~500 KB)
- [ ] `quarto preview`: the S&P 500 line chart shows full history with y-axis "Index points"; no console errors
- [ ] After merge: "Build site" is green and the Pages URL shows the chart

## Done when
All boxes ticked, roadmap phase ticked, CHANGELOG updated.

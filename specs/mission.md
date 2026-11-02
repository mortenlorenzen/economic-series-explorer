# Mission

## Why
A static web app for comparing economic time series on a shared date axis: market indices, output, prices, labour and rates, charted together and indexed to a common start, or one at a time as actual values. All data is prepared daily by a pipeline and committed to the repo, so the site needs no server.

## Who it's for
- Primary: Morten, as a personal tool.
- Secondary: anyone who opens the public site. The about page stays short and factual; no teaching texts.

## What success looks like
- All series in the registry (twenty since 2026-11-02) load with full history and the daily pipeline stays green.
- Any 1–8 series can be compared indexed on one date axis, levels and rates together.
- Adding a series is one row in `series.csv` and nothing else.

## In scope
- Several series charted together, indexed to 100 at the start of a chosen date window (levels), or as percentage-point change (rates).
- A single series charted as actual values, with a linear or log y-axis.
- Twenty series from Yahoo Finance and FRED (BRIEF §6.1's eleven plus nine added by the owner on 2026-11-02), with full available history.
- A registry file (`series.csv`) that makes adding further series a one-row change.
- PNG and CSV export of the current chart.

## Out of scope (non-goals)
- Free choice of series in the browser — Yahoo blocks cross-site browser requests and the FRED API needs a key a public page cannot hide; would need a proxy server.
- Copying code, texts, descriptions or styling from the inspiration repo (jhelvy/potus-econ-scorecard) — behaviour reference only.
- Anything presidential: inauguration dates, party colours, president picker, day-number x-axis.
- For later, not this roadmap: more transforms (`log`, `diff`, moving averages), recession shading, shareable URLs, common-frequency resampling (BRIEF §6.8).

## Tone / principles
- Static files only; all computation in the browser.
- Fail loudly: a registry or fetch error stops the pipeline and commits nothing.
- The numbers are never changed for speed: indexing and export use raw data.
- Short, plain, factual text.

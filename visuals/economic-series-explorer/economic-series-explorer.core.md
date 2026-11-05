---
title: What makes the Economic Series Explorer work
source: economic-series-explorer (16 files, see files.txt)
source_title: Economic Series Explorer
author: Morten Lorenzen
date: 2026-11-02
lens: core
theme: fjord
language: en
note: Core lens on the repo: docs, specs, the registry, get_data.R, the workflows, js/series.js and index.qmd. Tools such as Quarto, Observable and renv are left out; the architecture they implement is kept. Where specs/ and the brief disagree, specs/ wins.
---

A good chart here is an *honest comparison*: twenty predefined series, prepared daily and served as static files, land on one date axis from a common start in the browser. The numbers are never changed for speed, and a run would rather fail than publish bad data.

## Objective

title: Compare series on a shared date axis, without bending the numbers
lede: A personal tool, published as a public site. A good result is recognised by three things.

- All series in the registry (twenty) load with full history and the daily pipeline stays green.
- Any 1–8 series can be compared indexed on one date axis, levels and rates together.
- Adding a series is one row in `series.csv` and nothing else.

## Architecture

title: Prepared daily, served static, computed in the browser
lede: Static files only: no server, no R at runtime. The browser fetches only files in `data/`. Each rule forces something.

- **Static files only → predefined series only.** Free choice in the browser would need a proxy server: Yahoo blocks cross-site browser requests and the FRED API needs a key a public page cannot hide.
- **Data prepared daily and committed → fail loudly.** `update-data.yml` runs `get_data.R` at 06:00 UTC. Changed data reaches `main` through a PR the workflow opens and squash-merges itself; `build-site.yml` deploys only after a successful run. A failed run commits nothing.
- **All computation in the browser → pure functions.** Indexing, anchoring, downsampling, colours and export logic live in `js/series.js`, testable without a browser. Expected size: ~500 KB for the longest daily series, 1–3 MB for all of `data/`.

```figure
title: Two halves and one handover
caption: GitHub Actions prepare the data and the site; from the handover on, everything happens in the browser on static files.
group: GitHub Actions = update-data.yml, get_data.R, build-site.yml
group: browser = index.qmd, js/series.js
series.csv | one row per series; kind, transform, max_stale_days
get_data.R | validate registry; three tries; staleness; regression check
data/<id>.json | full history; 7 significant digits
index.qmd | controls, chart, export; cached in a Map
js/series.js | effective start; anchor; downsampling; colours
update-data.yml -> get_data.R : daily 06:00 UTC
series.csv -> get_data.R
get_data.R -> data/<id>.json : all or nothing
data/<id>.json -> build-site.yml
build-site.yml -> index.qmd : GitHub Pages [accent]
index.qmd -> js/series.js
```

## Domain model

title: Two kinds of series, one registry
lede: `get_data.R` names no series itself; everything comes from `series.csv`. Each row's `kind` decides the arithmetic, because a ratio of rates is meaningless.

| | `level` | `rate` |
|---|---|---|
| Indexed as | 100 × value / anchor | value − anchor, in percentage points |
| Panel | Top: "Index, start = 100" | Bottom: "Change, percentage points" |
| Log scale | Allowed when every plotted value is above zero | Always linear |
| Examples | S&P 500, Gold, Real GDP | Inflation Rate, Unemployment Rate |

Each row also carries `source` (`yahoo` or `fred`), `transform` (`none` or `yoy`), `unit` and `max_stale_days`. A new transform is one entry in a list in `get_data.R`.

## Guardrails

title: A daily run that would rather fail than publish bad data
lede: `get_data.R` builds every series and collects the errors, so one run reports every broken series. It writes only when all of them pass.

| Guardrail | Rule |
|---|---|
| **Validate the registry** | Ten columns, unique lowercase ids, known `source`, `kind` and `transform`, `max_stale_days` > 0, no empty text fields. Every problem in one error. |
| **Fetch and clean** | No keys. Three tries, waiting 2 s and 4 s. Drop NA and duplicate dates; `yoy` against the same calendar date a year earlier. |
| **Staleness** | Older than `max_stale_days` → warning; older than twice that → the run fails. |
| **Regression** | Fewer observations than the published file → the run fails. |
| **All or nothing** | A failed run writes nothing, and the site isn't rebuilt. |

## Decision logic

title: Small rules with large effects
lede: The chart rules live in `js/series.js`; the interface rules decide what the user can ask for at all.

| Rule | What it does |
|---|---|
| **Effective start** | The later of From and the latest `first_date` among selected series. All lines begin together; the subtitle names the series that moved the start. |
| **Anchor** | First observation on or after the effective start. More than 180 days later → series left out and named in a note. |
| **Downsampling** | Window longer than 10 years → daily series drawn as weekly averages. Indexing is computed on raw data first; the anchor and the last point are drawn exactly; CSV export uses full resolution. |
| **At most 8, from 10 colours** | Colours follow registry order; on a clash the later series takes the first free colour. With at most 8 selected and 10 colours, no two lines share one. |
| **Actual values** | Only with exactly one series; ticking a second returns Display to Indexed. |
| **Log scale** | Disabled with a tooltip when any plotted level is ≤ 0. WTI oil was negative on 2020-04-20. |
| **Failed load** | Dropped from the cache, so untick and tick retries it; the other series still plot. |

## Human judgment and feedback

title: Checks that can fail, and a person who decides
lede: Unattended runs need a check that can fail, so tests came in phase 1. The decisions stay with the owner.

| Loop | How it works |
|---|---|
| `./run-tests.sh` | testthat and `node --test` on saved fixture data, no network; non-zero exit on failure |
| Owner merges | `main` is protected: every change goes through a PR, merged by the owner. Only the daily data PR is merged by the workflow. |
| Questions stop a phase | Never guess a product decision: undecided → `specs/questions.md`, and `/run-phase` stops while a box is unticked. |
| Reviewer | Caught bugs the specs and tests missed, such as a test that failed both series and so proved nothing, and about-page text that overstated facts. |
| Retro | One line per phase in `specs/retro.md`: what went wrong, what to change in the kit. |

# Tech stack

## Stack (pinned)
| Layer | Choice | Version | Why |
|---|---|---|---|
| Data pipeline | R script `get_data.R` | R 4.6.1 | Good fetchers for FRED and Yahoo |
| R package pinning | renv, `renv.lock` committed | renv 1.3.1 | CI installs exactly the local versions |
| Yahoo fetch | quantmod (`getSymbols`, adjusted close) | 0.4.29 | Mature Yahoo fetcher |
| FRED fetch | httr2 + readr on FRED's public CSV (`fredgraph.csv`) | httr2 1.3.0, readr 2.2.0 | No API key needed; httr2 gives retries |
| JSON | jsonlite | 2.0.0 | Writes `data/*.json` |
| R tests | testthat | 3.3.2 | Registry validation and transforms on fixtures |
| Site | Quarto, rendered to GitHub Pages | 1.10.19 | Static site, OJS built in |
| Front end | Observable JS + Observable Plot in `index.qmd` | as bundled with Quarto 1.10.19 | Reactive controls without a JS build step |
| JS logic + tests | Plain ES module `js/series.js`, `node --test` | Node 26.8.1 | Testable outside the browser |
| Automation | GitHub Actions: `update-data.yml` (daily), `build-site.yml` | — | Data commit → site rebuild |
| Data sources | Yahoo Finance (adjusted close), FRED (public CSV) | — | No keys |

## Conventions not visible in code
- `get_data.R` names no series itself; everything comes from `series.csv`.
- Fetching and transforming are separate functions, so tests run transform and validation on saved fixtures.
- Colours are assigned by registry order (Observable10), so a series keeps its colour when others are toggled; when two selected series would share a colour, the later one takes the first free colour.
- `BRIEF.md` is the original brief and is never edited; `BRIEF2.md` describes the app as built, and a change that alters what it describes updates it in the same branch.
- Indexing, anchoring and downsampling live in `js/series.js` as pure functions that `index.qmd` imports.
- The browser fetches only files in `data/`.
- No code, text or styling from potus-econ-scorecard.

## Testing & quality
- Tests: `./run-tests.sh` — runs testthat and `node --test` on fixtures in `tests/fixtures/`; no network; non-zero exit on failure · Lint/typecheck: none · Every feature ships with tests

## Constraints
- Static files only: no server, no R at runtime.
- Expected size: ~500 KB for the longest daily series, 1–3 MB for all of `data/`.
- Every phase leaves the deployed site working; GitHub Pages is on from phase 1.
- A failed pipeline run commits nothing.

## Decisions log
- 2026-11-01 — build independently instead of forking: own repo, history and license; inspiration repo is a behaviour reference only.
- 2026-11-01 — R pipeline → JSON in repo → Quarto + Observable on GitHub Pages, static, no server.
- 2026-11-01 — predefined series only, no free entry: no proxy server.
- 2026-11-01 — full available history over a fixed earliest date: one rule for every source.
- 2026-11-01 — registry file over series named in code: adding a series is a one-row change.
- 2026-11-01 — `rate` series as percentage-point change, not a ratio: a ratio of rates is meaningless.
- 2026-11-01 — weekly averages above 10 years; raw data for indexing and export: fast charts, unchanged numbers.
- 2026-11-01 — browser logic in a plain JS module: testable without a browser.
- 2026-11-01 — MIT license; credit potus-econ-scorecard as inspiration on the about page (courtesy, not a licence term).
- 2026-11-01 — tests from phase 1 on saved data through one `./run-tests.sh`: unattended runs need a check that can fail.
- 2026-11-01 — Pages on from phase 1; every phase leaves the site working.
- 2026-11-01 — log scale in indexed mode depends on the levels panel only; rates panel always linear.
- 2026-11-01 — name Economic Series Explorer, repo `economic-series-explorer`; default series S&P 500 and NASDAQ; personal tool, public site.
- 2026-11-02 — success criteria kept as proposed in the brief.
- 2026-11-02 — `build-site.yml` runs on push to `main` and on `workflow_run` after a successful `update-data.yml`, over a PAT or a combined workflow: pushes with `GITHUB_TOKEN` don't trigger other workflows, and this needs no secret.
- 2026-11-02 — quantmod for Yahoo, httr2 + readr for FRED CSV, over httr2 against Yahoo's undocumented chart endpoint.
- 2026-11-02 — renv lockfile over versions listed only here: CI reproduces local versions.
- 2026-11-02 — brief's phase 1 split into scaffold/harness and first series; brief's phase 9 split into edge cases and description/about/metadata: each phase reviewable in one sitting.
- 2026-11-02 — CLAUDE.md Test command is `./run-tests.sh` from the start; phase 1 creates it first.
- 2026-11-02 — no lint/typecheck command; tests are the check.
- 2026-11-02 — daily data reaches `main` through a PR that `update-data.yml` opens and squash-merges itself, because `protect-main` requires PRs and a personal repo can't add the GitHub Actions app as a bypass actor; chosen over a separate `data` branch (main would no longer hold current data). Replaces the same day's direct-push decision.
- 2026-11-02 — owner's tweaks (`specs/2026-11-02-tweaks/`): all controls in a top bar instead of the sidebar, for a full-width chart, with the series as always-visible checkboxes (a dropdown was tried and dropped); a two-handle date slider replaces the From/To inputs; the PNG always lists every series description and ends with date · URL · © 2026 Morten Lorenzen; actual end labels at 2 decimals.
- 2026-11-02 — nine more series (`specs/2026-11-02-more-series/`): Hang Seng, CSI 300 tracker, MSCI ACWI ETF, gold, WTI oil, copper (`PCOPPUSDM`; "Copper" is no FRED id), Bitcoin, Danish HICP (`CP0000DKM086NEST`; the OECD CPI stopped in 2025) and the federal funds rate; new categories Commodities and Crypto; colours re-assigned on a clash so selected lines never share one.
- 2026-11-02 — a second brief, `BRIEF2.md`, describes the app as built, while `BRIEF.md` stays the untouched original: the owner wants a brief that matches the current app, and the original stays readable next to it. specs/ still wins where they differ.

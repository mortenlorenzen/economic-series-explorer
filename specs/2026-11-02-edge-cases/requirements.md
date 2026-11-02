# Requirements — Edge cases

## Scope
- In: the BRIEF §6.7 edge-case table, all six rows: build "A series fails to load" and check the other five, which already exist. Also the y-axis label overlap noted in the Phase 9 retro.
- Out: the description note and about page (Phase 11).

## Decisions
- **Already built, re-checked only**:
  - No series → "Select at least one series", export disabled (Phases 5, 9).
  - No observation within 180 days of the start → left out, with a note under the chart (Phase 5).
  - Window ends before the effective start → placeholder naming the series, suggesting a later To date (Phase 5).
  - Log with values ≤ 0 → Log disabled with a tooltip, falls back to Linear (Phase 7).
  - Actual, then a second series → back to Indexed (Phase 7).
- **What counts as a failed load**: the fetch rejects (network error), the response is not OK (e.g. 404), or the body isn't JSON with `dates` and `values` arrays of equal length.
- **Loading never fails as a whole**: `loadAll(ids, load)` waits for every selected series in parallel and returns `{ series, failed }`. `series` holds the ones that loaded, in selection (registry) order; `failed` holds the ids that didn't.
- **Failed series are treated as not drawn**. They don't move the effective start, they get no panel, they don't count for the log rule, and they're not exported.
  - The selection itself doesn't change: the box stays ticked, and it still counts toward the 8-series limit and the Display rule.
  - In actual mode, a failed single series shows only the message.
- **Message**: above the chart, in the page's danger colour: `Could not load <names>. Untick and tick again to retry.` Names are joined with ", " in registry order.
  - With some series loaded, the chart draws under the message.
  - With none loaded, the message is shown alone and export is disabled.
- **Retry**: the loader drops a failed fetch from its cache (Phase 8), so unticking and ticking the series fetches it again.
- **Axis label**: panel top margin goes from 12 to 22 px, so the "↑ label" line clears the top tick label. Panel heights stay as before (`panelHeights`), so the plot area shrinks by 10 px.

## Context
- Roadmap Phase 10 (BRIEF §6.7 table). Phase 8 spec: "A rejected fetch is removed from the cache… Phase 10 handles showing the failure." Phase 9 retro: rates-panel y-axis label overlaps its top tick.

## Scenarios

### Requirement: Settled loading
#### Scenario: one of two fails
- WHEN sp500 loads and djia rejects
- THEN `loadAll` gives series [sp500] and failed [djia], and doesn't reject

#### Scenario: HTTP error
- WHEN `data/djia.json` answers 404
- THEN djia counts as failed

#### Scenario: malformed body
- WHEN the body has 3 dates and 2 values
- THEN that series counts as failed

### Requirement: Message
#### Scenario: names
- WHEN Dow Jones and NASDAQ fail
- THEN the message reads "Could not load Dow Jones, NASDAQ. Untick and tick again to retry."

#### Scenario: others still plot
- WHEN S&P 500 and Dow Jones are selected and Dow Jones fails in the browser
- THEN the message names Dow Jones, the chart shows S&P 500, and the CSV holds only sp500

#### Scenario: retry
- WHEN the failure clears and Dow Jones is unticked and ticked again
- THEN Dow Jones loads and the message goes away

### Requirement: Table rows 1–5
#### Scenario: each row
- WHEN each situation in the §6.7 table is set up in the browser
- THEN the behaviour matches the table

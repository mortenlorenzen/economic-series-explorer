# Requirements — Loading cache and downsampling

## Scope
- In: BRIEF §6.4 Loading (parallel fetch, `Map` cache); §6.6 Downsampling.
- Out: CSV export at full resolution (phase 9; downsampling only touches drawn rows, never the data the export will use).

## Decisions
- **Cache**: `createLoader(fetchJson)` returns `load(id)`, which keeps one promise per id in a `Map`. A second `load` of the same id returns the same promise without fetching. A rejected fetch is removed from the cache, so a later tick tries again. Phase 10 handles showing the failure. The selected series still load in parallel with `Promise.all`.
- **Daily series**: the median gap between consecutive observations is ≤ 7 days, computed once per series and cached with it.
  - That makes sp500, djia, nasdaq, dxy and treasury10yr daily.
  - Monthly (median ~31 days) and quarterly (~91) series are never resampled.
- **"Window longer than 10 years"**: the drawn x-domain start is before To − 10 years (`shiftYears`), strictly.
  - Indexed mode uses [effective start, To]; actual mode uses [From, To].
  - So the 10Y preset (exactly 10 years) is drawn at full resolution, and 20Y and Max are downsampled.
- **Weekly average**:
  - Group points by ISO 8601 week (Monday start, ISO week-year) and average the drawn value in each week.
  - The average is plotted at the week's last observation date.
  - The tooltip's actual value is the average of the stored values in that week.
  - Indexed mode averages the plotted (indexed) values, computed on raw data first; actual mode averages the stored values.
- **Exact points**: the first point (the anchor in indexed mode, 100 or 0) and the last point are always drawn as they are, not averaged. Other points in their weeks are averaged into one point at that week's last remaining date. Keeping the last point exact keeps the end label at the real last value ("name plus last value", BRIEF §6.6).
- **What downsampling changes**: only the rows drawn.
  - Anchor, log rule, empty-window and left-out checks use the raw points.
  - The y-domain and label positions use the drawn rows.
- **Tooltip**: on a downsampled series, the plotted and value channels are weekly averages, so the date row reads "Week to <date>" instead of "Date". This keeps the averaged values from being read as a single day's.

## Context
- Roadmap Phase 8 (BRIEF §6.4 Loading, §6.6 Downsampling). Decisions log: weekly averages above 10 years, raw data for indexing and export.

## Scenarios

### Requirement: Cache
#### Scenario: re-tick
- WHEN a series is loaded, unticked and ticked again
- THEN the fetch runs once

#### Scenario: failed fetch
- WHEN a fetch rejects
- THEN the next `load` of that id fetches again

### Requirement: Daily detection
#### Scenario: frequencies
- WHEN dates are trading days, month starts or quarter starts
- THEN `isDaily` is true, false and false

### Requirement: ISO weeks
#### Scenario: year boundary
- WHEN dates are 2020-12-31 (Thu) and 2021-01-03 (Sun), and 2021-01-04 (Mon)
- THEN the first two share "2020-W53" and the third is "2021-W01"

### Requirement: Ten-year threshold
#### Scenario: exactly and over
- WHEN To is 2026-10-30 and the start is 2016-10-30, or 2016-10-29
- THEN the first is not over ten years, and the second is

### Requirement: Weekly average
#### Scenario: averages at the week's last day, ends exact
- WHEN two weeks of daily points are downsampled
- THEN the first point and the last point are unchanged, and the points between are one per week: the mean of that week's values, at its last remaining date

#### Scenario: anchor week
- WHEN the anchor is a Wednesday
- THEN the anchor stays its own point, and Thursday–Friday of that week become one averaged point at Friday

### Requirement: Page
#### Scenario: Max is lighter, 10Y is exact
- WHEN S&P 500 is shown over Max
- THEN about one point per week is drawn (~5,200 rather than ~24,800), starting at 100 and ending at the real last value
- AND over 10Y every trading day is drawn

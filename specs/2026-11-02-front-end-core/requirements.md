# Requirements — Front end core

## Scope
- In: BRIEF §6.4 Series and Date range controls; §6.5 indexed mode for `level` series in one panel; the §6.6 Chart bullets for that panel (x-axis, colours, end labels, tooltip, title, subtitle).
- Out: rates and two panels (phase 6); Display and Y-axis controls, actual values, log (phase 7); the fetch cache and downsampling (phase 8); export (phase 9); the rest of the §6.7 edge-case table (phase 10); the description note (phase 11).

## Decisions
- **Picker lists only `kind: level` series in this phase** (sp500, djia, nasdaq, dxy, gdp, housing). Rate series join in phase 6 with their own panel; until then they can't be selected, so the site never shows them wrongly indexed as ratios.
- Picker: one group per `category`, in registry order of first appearance; checkboxes in registry order. Default selection: sp500 and nasdaq. At most 8 selected; once 8 are ticked, every unticked box is disabled. "Deselect All" clears the selection.
- Date range: preset buttons 1Y, 5Y, 10Y, 20Y, Max, plus From and To date inputs. Default 10Y.
  - A preset sets To = the latest `last_date` across all series in `series.json` (the data end, so the chart has no empty tail), and From = To − N years, with 29 Feb → 28 Feb.
  - Max sets From = the earliest `first_date` across all series.
  - The active preset button is highlighted; editing either date clears the highlight.
  - From after To is treated like "window ends before the effective start" (placeholder below).
- **Effective start** = the later of From and the latest `first_date` among the selected series. When a series moved it, the subtitle adds "Window starts <date>, when <name> data begins". On a tie, the first in registry order is named.
- **Anchor**: each series' first observation on or after the effective start. If that's more than 180 days after the effective start, or there's none up to To, the series is left out, and a note under the chart says "Left out (no data within 180 days of <start>): <names>".
- **Plotted value**: `100 × value / anchor` (`plottedValue("level", …)` from phase 1). Points run from the anchor date to To, inclusive; the anchor point is always included.
- **Colours**: Observable10 (`#4269d0 #efb118 #ff725c #6cc5b0 #3ca951 #ff8ab7 #a463f2 #97bbf5 #9c6b4e #9498a0`), by registry index (all eleven series, not only the visible ones), wrapping after ten. Quarto 1.10.19 loads Plot 0.6.11, which has no built-in `observable10` scheme, so the hex list lives in `js/series.js`. With wrapping, the 11th series (debt_gdp, a rate) shares sp500's colour; they'll sit in different panels from phase 6.
- **End labels**: "<name> (<last plotted value, 1 decimal>)", e.g. "S&P 500 (184.3)", at the last point, right of the line.
  - Decluttered: label y positions are pushed apart in pixels to at least 14 px, keeping their order, within the plot area.
  - To make that exact, the y domain is computed in `js/series.js` (min/max of plotted values and 100, padded 5%) and passed to Plot with `nice: false`. The right margin leaves room for the labels.
- **Axes**: x is a UTC time scale with domain [effective start, To]; Plot's default ticks adapt to the window length. The y label is "Index, start = 100". Reference line at 100.
- **Tooltip**: Plot `tip` with the pointer, showing series name, date (YYYY-MM-DD), plotted value (1 decimal) and actual value (as stored).
- **Title** "Indexed performance since <effective start>". **Subtitle** "100 = value on <effective start>", plus the window-start sentence when it applies. Dates are YYYY-MM-DD.
- **Placeholders**, needed so the page never breaks; the rest of the §6.7 table is phase 10:
  - No series selected → "Select at least one series".
  - Effective start after To → "The window ends before <name>'s data begins on <date>. Choose a later To date."
- **Loading**: `data/series.json` once; the selected series' files with `Promise.all` on each change. No cache yet (phase 8).
- **Layout**: Quarto `.panel-sidebar` with the controls, `.panel-fill` with the chart.

## Context
- Roadmap Phase 5 (BRIEF §6.4, §6.5 levels only, §6.6 Chart). Tech stack: indexing and anchoring live in `js/series.js` as pure functions; colours by registry order.

## Scenarios

### Requirement: Preset window
#### Scenario: 10Y
- WHEN data ends 2026-10-30 and 10Y is chosen
- THEN From = 2016-10-30 and To = 2026-10-30

#### Scenario: leap day
- WHEN To is 2024-02-29 and 1Y is chosen
- THEN From = 2023-02-28

#### Scenario: Max
- WHEN Max is chosen
- THEN From = the earliest `first_date` in the registry

### Requirement: Effective start
#### Scenario: window starts after every series
- WHEN From is 2016-10-30 and all selected series start earlier
- THEN the effective start is 2016-10-30 and no series is named

#### Scenario: a series moves the start
- WHEN From is 1980-01-01 and Dow Jones (first 1992-01-02) is selected with S&P 500
- THEN the effective start is 1992-01-02 and Dow Jones is named

### Requirement: Anchor and index
#### Scenario: levels start at 100
- WHEN a daily series has a value on the effective start
- THEN the first plotted point is 100 on that date, later points are 100 × value / anchor, and none fall after To

#### Scenario: anchor after a gap
- WHEN the first observation on or after the start is 3 days later (weekend)
- THEN that observation is the anchor

#### Scenario: left out
- WHEN the first observation after the start is 181 days later, or there is none up to To
- THEN the series is left out and named in the note

### Requirement: Picker limit
#### Scenario: eight selected
- WHEN 8 series are ticked
- THEN `canSelect` is false for every unticked series and true for the ticked ones

### Requirement: Colours by registry order
#### Scenario: stable colour
- WHEN NASDAQ (registry index 2) is shown with or without S&P 500
- THEN its colour is `#ff725c` both times

### Requirement: End labels
#### Scenario: format
- WHEN the last plotted value is 184.26
- THEN the label is "S&P 500 (184.3)"

#### Scenario: declutter
- WHEN two labels would be 4 px apart
- THEN they end at least 14 px apart, in the same order, inside the plot area

### Requirement: Page
#### Scenario: defaults
- WHEN the page opens
- THEN S&P 500 and NASDAQ are ticked, 10Y is highlighted, and the chart shows both lines from 100 with end labels

#### Scenario: placeholders
- WHEN Deselect All is pressed, or To is set before the effective start
- THEN the matching placeholder text replaces the chart

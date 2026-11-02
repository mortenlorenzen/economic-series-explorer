# Requirements — Tweaks after the roadmap

## Scope
- In: the owner's list of 2026-11-02: actual end label, top bar, date slider, PNG descriptions and footer line, About sentence, site footer.
- Out: everything else. The earlier phase specs stay as they are, except where a decision below replaces one.

## Decisions
- **Actual end label** (replaces Phase 7 "values as stored" for the label only): the end label in actual mode shows the last value with exactly 2 decimals, e.g. "Inflation Rate (3.72)". The tooltip still shows the stored value.
- **Top bar** (owner's choice: all controls; replaces the sidebar from Phases 5–9):
  - Every control sits in one bar above the chart, in this order: Series, Date range, Display, Y-axis scale, Export. The bar wraps on narrow screens.
  - The chart uses the full page width.
  - **Series** (owner's follow-up: checkboxes, not a dropdown): the grouped checkboxes and Deselect All are always visible, as one wrapping row of category groups at the top of the bar; the other controls follow below. The max-8 rule and the registry order are unchanged.
  - **Display** and **Y-axis scale** are inline radio groups, with the same rules and tooltips as before.
- **Date slider** (owner's choice: slider only; replaces the From/To date inputs):
  - One track with two handles, From and To, spanning the earliest `first_date` to the latest `last_date` in the registry, in steps of one day.
  - The handles can't cross: From ≤ To. The chosen dates show as text beside the slider.
  - Dragging updates the text live and redraws the chart when a handle is released.
  - The arrow keys move a focused handle by one day.
  - A preset sets both handles and is highlighted until a handle moves.
  - Because From can no longer be after To, the "window ends before it starts on…" placeholder can't occur from the UI. The code stays as a guard.
- **PNG** (owner's choice: always every description):
  - Under the panels and the left-out note, the PNG lists "Name: description" for every exported series, wrapped to the chart width, whether or not the note is collapsed on screen.
  - Then the source line: "Source: Yahoo Finance, FRED."
  - Then a footer line: `<export date> · mortenlorenzen.github.io/economic-series-explorer · © 2026 Morten Lorenzen`.
  - The export date is the viewer's local date, the same as in the file name.
- **About page**: the Purpose section adds "This is a personal project I built to explore growth scenarios and have quick access to time series I follow."
- **Site footer**: "© 2026 Morten Lorenzen" on the left, and "Data: Yahoo Finance, FRED · MIT licence" on the right.

## Context
- Owner's request after the roadmap finished (Phase 11 merged).
- Specs touched: Phase 5 (sidebar, From/To inputs), Phase 7 (actual end label), Phase 9 (PNG caption), Phase 11 (footer, about).

## Scenarios

### Requirement: Actual end label
#### Scenario: two decimals
- WHEN the last actual value is 3.717251
- THEN the label reads "Inflation Rate (3.72)"

### Requirement: Slider
#### Scenario: day mapping
- WHEN the slider minimum is 1927-12-30
- THEN step 0 is 1927-12-30, step 2 is 1928-01-01, and the date of the step for any date is that date

#### Scenario: no crossing
- WHEN the From handle is dragged past To
- THEN From stops at To

#### Scenario: preset
- WHEN 10Y is clicked
- THEN the handles move to To − 10 years and the data end, and 10Y is highlighted

### Requirement: Top bar
#### Scenario: full width
- WHEN the page opens on a 1400 px screen
- THEN no sidebar is shown and the chart is wider than before (more than 1,100 px)

#### Scenario: checkboxes
- WHEN a series box in the top row is ticked
- THEN the chart updates without opening anything first

### Requirement: PNG
#### Scenario: descriptions and footer
- WHEN three series are exported
- THEN the PNG shows three description lines, the source line, and "<today> · mortenlorenzen.github.io/economic-series-explorer · © 2026 Morten Lorenzen"

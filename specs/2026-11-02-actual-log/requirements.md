# Requirements — Actual values and log scale

## Scope
- In:
  - BRIEF §6.4 Display and Y-axis scale controls.
  - §6.6 actual-values mode.
  - Log scale on the levels panel in indexed mode.
  - The two §6.7 rows that are these controls' own rules: log falls back to Linear when disabled; Display returns to Indexed when a second series is ticked.
- Out: cache and downsampling (phase 8); export (phase 9); the remaining §6.7 rows (phase 10).

## Decisions
- **Display** radio "Indexed" / "Actual values", default Indexed. Enabled only when exactly one series is selected. Otherwise it is disabled, set back to Indexed, and has the tooltip "Actual values need exactly one series". The effective mode is Actual only when the radio says Actual and one series is selected.
- **Y-axis scale** radio "Linear" / "Log", default Linear. When disabled, it is set back to Linear and its tooltip gives the reason.
  - Indexed: disabled when the levels panel isn't shown, with "Log scale applies to level series; rates are always linear". A log option that does nothing would only confuse. Also disabled when any plotted level value is ≤ 0, with "Log scale needs every indexed level above zero".
  - Actual: disabled when any value in the window is ≤ 0, with "Log scale needs every value in the window above zero". This applies to rates too, e.g. the 10-year yield in 2020 stays above zero, while inflation has negative years.
- **Log in indexed mode** applies to the levels panel only; the rates panel stays linear. The reference line at 100 stays.
- **Actual-values window**: the stored values with From ≤ date ≤ To. There is no effective-start clamping and no anchor. The x-domain is [From, To].
  - No values in the window → placeholder "No <name> data between <From> and <To>." This wording is decided here; phase 10 may refine it.
- **Actual y-axis**:
  - The label is the series' `unit`.
  - Linear: levels use the padded extent of the values with no reference line; rates include 0 in the domain ("start the y-axis at zero") and draw a reference line at 0.
  - Log: the domain is padded 5% in log space.
- **Domains and labels on log**: `yDomain` and `declutterValues` take `type: "log"` and work in log10 space, so decluttered end labels still match Plot's scale with `nice: false`.
- **Actual title** = the series name. **Subtitle** = "<unit>, <linear|log> scale", e.g. "Index points, log scale".
- **Actual end label** = "<name> (<last value>)", the value formatted as stored (`String(v)`), e.g. "S&P 500 (7580.07)". **Tooltip**: Series, Date, Value (as stored).
- One panel-drawing function serves both modes; panel settings carry label, reference, scale type and label/tooltip formats.

## Context
- Roadmap Phase 7 (BRIEF §6.4 Display/Y-axis, §6.6 actual values). Decisions log: log scale in indexed mode depends on the levels panel only.

## Scenarios

### Requirement: Display rule
#### Scenario: one series
- WHEN one series is selected and the radio says Actual
- THEN the mode is actual

#### Scenario: second series ticked
- WHEN the radio says Actual and a second series is ticked
- THEN the mode is indexed, and Display is disabled and set back to Indexed

### Requirement: Log rule
#### Scenario: indexed levels above zero
- WHEN indexed mode shows levels, all plotted levels > 0
- THEN log is allowed

#### Scenario: indexed rates only
- WHEN indexed mode shows only rates
- THEN log is not allowed, with the rates reason

#### Scenario: actual with a value ≤ 0
- WHEN actual mode's window contains 0 or a negative value
- THEN log is not allowed, with the window reason, and the scale falls back to Linear

### Requirement: Actual window
#### Scenario: clipped, not anchored
- WHEN From/To cut a series
- THEN the points are exactly the stored values with From ≤ date ≤ To

#### Scenario: empty window
- WHEN no values fall in [From, To]
- THEN the placeholder names the series and the dates

### Requirement: Log domain and labels
#### Scenario: log domain
- WHEN values span 10 to 1000 on log
- THEN the domain is padded 5% of the log10 span on each side, and stays above zero

#### Scenario: declutter on log
- WHEN two labels sit at 100 and 101 on a log scale
- THEN they end at least the gap apart in pixels, using log10 positions

### Requirement: Rate on linear in actual mode
#### Scenario: y starts at zero
- WHEN an all-positive rate series is shown in actual mode on Linear
- THEN the y-domain includes 0

### Requirement: Page
#### Scenario: actual S&P 500 on log
- WHEN only S&P 500 is ticked, Actual and Log are chosen, and Max is pressed
- THEN the title is "S&P 500", the subtitle "Index points, log scale", the y label "Index points", and the line runs from 1927

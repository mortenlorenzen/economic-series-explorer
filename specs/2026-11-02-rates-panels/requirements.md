# Requirements — Rates and stacked panels

## Scope
- In: BRIEF §6.5 rate plotting and the two-panel layout, with §6.6 end labels and tooltip per panel; all eleven series in the picker.
- Out: Display/Y-axis controls and log (phase 7); cache and downsampling (phase 8); export and the single-SVG requirement for PNG (phase 9).

## Decisions
- The picker lists every series in `series.json`, which removes the phase 5 level-only filter. Grouping, order, max 8 and defaults are unchanged.
- `rate` plotted value = `value − anchor` in percentage points (`plottedValue("rate", …)`), so a rate series starts at 0. Anchor, 180-day rule and effective start are as in phase 5 and shared by both kinds.
- **Panels**, in a fixed order: levels on top, rates below. `shownKinds()` and `chartSubtitle()` in `js/series.js` pick the panels and build the subtitle.

  | Panel | y label | Reference line |
  |---|---|---|
  | Levels (`level`) | "Index, start = 100" | 100 |
  | Rates (`rate`) | "Change, percentage points" | 0 |

  - A panel is drawn only if at least one *shown* (not left-out) series has that kind.
- **Heights**: 480 px of SVG height in total (Plot's `height`, margins included). With both panels, levels get 60% (288 px) and rates 40% (192 px); one panel gets all 480.
- **Alignment**: both panels use the same x-domain [effective start, To], the same width, and the same left (56 px) and right (170 px) margins, so dates line up vertically. With two panels, only the bottom panel draws x tick labels; the top panel's bottom margin shrinks to 8 px.
- **End labels per panel**, decluttered within that panel's own plot area:
  - Levels as phase 5: "S&P 500 (184.3)".
  - Rates: "<name> (<sign><value, 1 decimal> pp)", e.g. "Unemployment Rate (+1.2 pp)" and "Inflation Rate (-0.4 pp)". The value is rounded first, so −0.04 shows as "+0.0 pp".
  - Names come from the registry; BRIEF §6.6 shortens "Unemployment" only in an example.
- **Tooltip per panel**: series, date, plotted value and actual value. The plotted channel is "Index" (1 decimal) on levels and "Change" ("+1.2 pp") on rates.
- **Title**: "Indexed performance since <effective start>" (unchanged).
- **Subtitle**: the parts that apply, joined with "; ":
  - "100 = value on <start>" when levels are shown;
  - "rates as change in percentage points" when rates are shown, capitalised when it comes first;
  - when a series moved the start, phase 5's sentence follows as its own sentence (". Window starts <start>, when <name> data begins"), not joined with "; ".
  - Both kinds give BRIEF §6.6's "100 = value on <start>; rates as change in percentage points".
- Colours unchanged: registry index, Observable10 wrapping after ten. debt_gdp (index 10) shares sp500's colour but always sits in the other panel.

## Context
- Roadmap Phase 6 (BRIEF §6.5 rates, two panels). Decisions log: rate series as percentage-point change, not a ratio.

## Scenarios

### Requirement: Rate change
#### Scenario: starts at 0
- WHEN a rate series has 4.0 at the anchor and 5.5 later
- THEN the plotted values are 0 and +1.5

### Requirement: Rate end label
#### Scenario: signs
- WHEN the last change is 1.24, −0.43 or −0.04
- THEN the labels end "(+1.2 pp)", "(-0.4 pp)" and "(+0.0 pp)"

### Requirement: Panel heights
#### Scenario: both kinds
- WHEN levels and rates are both shown
- THEN levels get 288 px and rates 192 px

#### Scenario: one kind
- WHEN only levels, or only rates, are shown
- THEN that panel gets 480 px and the other is not drawn

### Requirement: Page
#### Scenario: mixed selection
- WHEN S&P 500 and Unemployment Rate are ticked
- THEN two panels show, with S&P 500 on top from 100 and Unemployment Rate below from 0, each with its reference line, label and end label, and with matching x positions for the same date

#### Scenario: subtitle
- WHEN both kinds are shown
- THEN the subtitle reads "100 = value on <start>; rates as change in percentage points"

### Requirement: Panels and subtitle from shown series
#### Scenario: left-out kind
- WHEN the only rate series is left out
- THEN `shownKinds` returns only "level" and the subtitle has no rates part

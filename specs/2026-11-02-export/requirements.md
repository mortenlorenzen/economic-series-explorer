# Requirements — PNG and CSV export

## Scope
- In: BRIEF §6.7 PNG export and CSV export, and the "export buttons disabled" part of the first row of the §6.7 table.
- Out: the rest of the §6.7 edge-case table (Phase 10); the description note (Phase 11).

## Decisions
- **Buttons**: an "Export" group at the bottom of the sidebar with two buttons, "PNG" and "CSV". Both are disabled whenever no chart is drawn: no series selected, or a placeholder in place of the chart (window ends before it starts, no data in the window, every series left out).
- **What is exported**: the chart as it is on screen — the same mode, window, scale and series. Left-out series are not in either export.
- **CSV rows**: full resolution (never the weekly averages), one row per series and date, in registry order, then date order. Columns `series,date,value,plotted,mode`.
  - `series` is the id; `value` is the stored value, as stored.
  - Indexed mode: the points from the anchor (the first observation on or after the effective start) to To; `plotted` is the indexed value (levels) or the change in percentage points (rates).
  - Actual mode: the stored points from From to To; `plotted` equals `value`.
  - `plotted` is rounded to 7 significant digits, the precision the data files store, so it never shows float noise (100, not 99.99999999999999).
  - `mode` is `indexed` or `actual`. Lines end with `\n`; no quoting is needed, as ids, dates and numbers hold no commas.
- **File name**: `<ids joined by +>_<mode>_<from>_<to>_<today>.csv`.
  - The ids are those of the series in the export, in registry order.
  - `<from>` is the date the chart is drawn from: the effective start in indexed mode (the date in the title "Indexed performance since …"), From in actual mode. `<to>` is To.
  - `<today>` is the viewer's local date, `YYYY-MM-DD`.
  - The PNG uses the same name with `.png`.
- **PNG**: one SVG, as wide as the chart, built from
  1. the title and subtitle, as SVG text in the page's heading font;
  2. every panel SVG, stacked in screen order at its screen height (so two panels make one image, as on screen);
  3. the left-out note, when there is one;
  4. a source caption.
  - White background, 16 px padding, text in the page's text colour. The hover tooltip is not exported.
  - Rasterised at 2× (canvas width and height twice the SVG's).
- **Source caption**: `Source: <sources>. Economic Series Explorer, mortenlorenzen.github.io/economic-series-explorer` — the sources of the exported series by first appearance, `yahoo` → "Yahoo Finance", `fred` → "FRED". An unknown source code is shown as is.
- **Webfonts**: the page's heading/body font is Source Sans Pro, imported by the cosmo theme from Google Fonts. Before rasterising, the export reads the `@font-face` rules for that family (fetching the stylesheet text when the browser won't expose a cross-origin sheet's rules), keeps the latin subset (the rule whose `unicode-range` covers U+0041 "A", or a rule with no range) for each weight the export uses (the computed weights of the page text and the chart title), fetches those font files and embeds them as `data:` URLs in a `<style>` in the SVG. Plot's own text (ticks, end labels) uses `system-ui`, which needs no inlining.
  - If the font can't be fetched (offline), the PNG is still made with the fallback fonts in the font stack.

## Context
- Roadmap Phase 9 (BRIEF §6.7). Mission: "PNG and CSV export of the current chart"; "indexing and export use raw data". Decisions log: raw data for indexing and export.
- The chart is drawn as one Plot SVG per panel plus an HTML header (Phases 5–8), so the PNG must stack them itself.

## Scenarios

### Requirement: CSV rows
#### Scenario: indexed export
- WHEN S&P 500 and Unemployment are exported in indexed mode
- THEN each has one row per stored observation from its anchor to To, the anchor row has `plotted` 100 (level) or 0 (rate), and `mode` is `indexed`

#### Scenario: actual export
- WHEN one series is exported in actual mode
- THEN `plotted` equals `value` and `mode` is `actual`

#### Scenario: full resolution
- WHEN the window is over 10 years
- THEN the CSV still has every daily observation, not weekly averages

#### Scenario: no float noise
- WHEN the indexed value is 99.99999999999999
- THEN `plotted` is written as `100`

### Requirement: File name
#### Scenario: brief example
- WHEN sp500 and nasdaq are exported in indexed mode from 2016-10-31 to 2026-10-30 on 2026-10-30
- THEN the name is `sp500+nasdaq_indexed_2016-10-31_2026-10-30_2026-10-30.csv`

### Requirement: Buttons
#### Scenario: no series
- WHEN no series is selected
- THEN both export buttons are disabled

#### Scenario: chart drawn
- WHEN a chart is drawn
- THEN both buttons are enabled and each downloads a file named as above

### Requirement: PNG
#### Scenario: two panels
- WHEN S&P 500 and Unemployment are shown in two panels
- THEN the PNG holds the title, subtitle, both panels and the caption, and is twice the SVG's width and height

#### Scenario: caption
- WHEN S&P 500 and Unemployment are exported
- THEN the caption begins "Source: Yahoo Finance, FRED."

#### Scenario: font subset
- WHEN the Google Fonts CSS has cyrillic, latin-ext and latin rules for one weight
- THEN only the latin rule is picked

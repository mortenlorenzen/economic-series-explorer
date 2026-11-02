# Requirements — Description note, about page and site metadata

## Scope
- In: BRIEF §6.6 Description note; §6.9 `about.qmd` (purpose, sources, credit) and `_quarto.yml` (site title, URLs, navbar).
- Out: anything in BRIEF §6.8 Future extensions.

## Decisions
- **Description note**: shown above the chart (above the title), for the selected series in registry order, using the registry's `description` text.
  - One or two series: one line each, "**Name**: description".
  - More than two: a closed `<details>` whose summary reads "About the series: Name, Name, Name"; opening it shows the same lines.
  - No series selected: no note.
  - A series that failed to load still has its description, since the text comes from `series.json`.
  - The note sits outside the chart element, so the PNG export doesn't include it.
- **about.qmd**: short, factual text of our own, with no teaching text and nothing taken from the inspiration repo (mission). Sections:
  - **Purpose**: one paragraph.
  - **How it works**:
    - a daily pipeline at 06:00 UTC writes JSON to the repo;
    - all computation happens in the browser;
    - indexed mode: levels at 100 on the start date, rates as percentage-point change;
    - weekly averages above 10 years, with raw data for indexing and export.
  - **Sources**: Yahoo Finance (adjusted close) and FRED. A table built in the browser from `data/series.json` lists name, source, symbol, unit, first date and last date, so it never needs editing when a series is added.
  - **Credit and licence**: inspired by [jhelvy/potus-econ-scorecard](https://github.com/jhelvy/potus-econ-scorecard), with no code or text copied; MIT licence; link to the repo.
- **_quarto.yml**:
  - navbar: Explorer and About on the left, a GitHub link (icon and text) to `repo-url` on the right;
  - `website.description`, one sentence;
  - `open-graph: true`;
  - a page footer with "Data: Yahoo Finance, FRED · MIT licence".
  - The title and URLs are kept as they are.

## Context
- Roadmap Phase 11 (BRIEF §6.6, §6.9). Decisions log: credit potus-econ-scorecard on the about page as courtesy; no code, text or styling from it.

## Scenarios

### Requirement: Description note
#### Scenario: two series
- WHEN S&P 500 and NASDAQ are selected
- THEN two lines show, each with the name and its description, with no `<details>`

#### Scenario: three series
- WHEN S&P 500, NASDAQ and Unemployment Rate are selected
- THEN a closed `<details>` shows "About the series: S&P 500, NASDAQ, Unemployment Rate" and holds the three lines

#### Scenario: none
- WHEN no series is selected
- THEN no note shows

### Requirement: About page
#### Scenario: sources table
- WHEN /about.html opens
- THEN the table has eleven rows from `data/series.json`, and the page links the inspiration repo and states MIT

### Requirement: Metadata
#### Scenario: navbar and head
- WHEN any page opens
- THEN the navbar shows Explorer and About, and the head has `og:title` and a description

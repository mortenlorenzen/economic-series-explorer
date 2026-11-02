# Requirements — More series

## Scope
- In: nine series requested by the owner on 2026-11-02; the colour rule they make necessary; text naming the number of series.
- Out: new transforms, new sources.

## Decisions
- **Series** (registry order; the categories show in the picker in this order):

  | id | Name | Category | Source | Symbol | Kind | Unit | max_stale_days |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | hsi | Hang Seng Index | Markets | yahoo | ^HSI | level | Index points | 7 |
  | csi300 | CSI 300 China Tracker | Markets | yahoo | 2827.HK | level | HKD | 7 |
  | msci_acwi | MSCI AC World ETF | Markets | yahoo | XMAW.DE | level | EUR | 7 |
  | gold | Gold | Commodities | yahoo | GC=F | level | USD per troy ounce | 7 |
  | oil | Crude Oil (WTI) | Commodities | fred | DCOILWTICO | level | USD per barrel | 14 |
  | copper | Copper | Commodities | fred | PCOPPUSDM | level | USD per metric ton | 100 |
  | bitcoin | Bitcoin | Crypto | fred | CBBTCUSD | level | USD | 7 |
  | cpi_dk | Consumer Prices Denmark | Prices | fred | CP0000DKM086NEST | level | Index (HICP) | 70 |
  | fedfunds | Federal Funds Rate | Rates | fred | FEDFUNDS | rate | Percent | 70 |

  - The three markets follow dxy's neighbours in Markets; Commodities and Crypto come after Markets; cpi_dk joins Prices after inflation; fedfunds joins Rates before the 10-year yield.
  - All use `transform` none.
- **Owner's answers (2026-11-02)**:
  - Copper: "Copper" is not a FRED id, so the series is `PCOPPUSDM` (IMF global copper price, monthly).
  - Danish CPI: `DNKCPIALLMINMEI` stopped updating in April 2025, so the series is the Eurostat HICP for Denmark, `CP0000DKM086NEST` (monthly, current).
- **Known data limits**:
  - Yahoo has 2827.HK only from 2024-04-24, so selecting it moves the effective start there.
  - WTI oil was negative on 2020-04-20, so Log is disabled for windows that include that day (the existing log rule).
- **Colours**: each series keeps its registry colour (`OBSERVABLE10[index % 10]`) when it's free among the selected series. When two selected series would share a colour, the later one in registry order takes the first palette colour not yet used. With at most 8 selected and 10 colours, no two lines ever share a colour.
- **Text**: the mission's "eleven series" becomes twenty, with the decisions log noting why. README lists the series by category. The About page's source line covers futures and ETFs.

## Context
- Owner's request after the roadmap; mission: "Adding a series is one row in `series.csv` and nothing else."

## Scenarios

### Requirement: Registry
#### Scenario: valid
- WHEN the test reads the real `series.csv`
- THEN it validates, and the ids come in the order above

### Requirement: Colours
#### Scenario: no clash
- WHEN sp500 (index 0) and hsi (index 4) are selected
- THEN they keep palette colours 0 and 4

#### Scenario: clash
- WHEN sp500 (index 0) and a series at index 10 are selected
- THEN sp500 keeps colour 0 and the other gets the first unused colour, 1

#### Scenario: eight selected
- WHEN any eight series are selected
- THEN all eight colours differ

### Requirement: Data
#### Scenario: pipeline
- WHEN `Rscript get_data.R` runs
- THEN it writes twenty series files and `series.json` with twenty entries, with no staleness failure

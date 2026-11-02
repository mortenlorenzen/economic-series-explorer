import { test } from "node:test";
import assert from "node:assert/strict";
import {
  plottedValue, toRows, shiftYears, presetRange, effectiveStart,
  anchorAndIndex, colorFor, formatEndLabel, yDomain, declutter, declutterValues,
  canSelect,
} from "../../js/series.js";

test("level is indexed to 100 at the anchor", () => {
  assert.equal(plottedValue("level", 150, 100), 150);
  assert.equal(plottedValue("level", 42, 42), 100);
});

test("rate is the change from the anchor in percentage points", () => {
  assert.equal(plottedValue("rate", 5.5, 4), 1.5);
  assert.equal(plottedValue("rate", 3.2, 3.2), 0);
});

test("unknown kind throws", () => {
  assert.throws(() => plottedValue("ratio", 1, 1), /unknown kind/);
});

test("toRows zips dates and values into rows", () => {
  const rows = toRows({ id: "x", dates: ["2020-01-02", "2020-01-03"], values: [1, 2] });
  assert.deepEqual(rows, [
    { date: new Date(Date.UTC(2020, 0, 2)), value: 1 },
    { date: new Date(Date.UTC(2020, 0, 3)), value: 2 },
  ]);
});

test("toRows throws on a length mismatch", () => {
  assert.throws(() => toRows({ id: "x", dates: ["2020-01-02"], values: [1, 2] }), /x: 1 dates but 2 values/);
});

const registry = [
  { id: "sp500", name: "S&P 500", first_date: "1927-12-30", last_date: "2026-10-30" },
  { id: "djia", name: "Dow Jones", first_date: "1992-01-02", last_date: "2026-10-30" },
  { id: "gdp", name: "Real GDP", first_date: "1947-01-01", last_date: "2026-07-01" },
];

test("shiftYears moves whole years and maps 29 Feb to 28 Feb", () => {
  assert.equal(shiftYears("2026-10-30", -10), "2016-10-30");
  assert.equal(shiftYears("2024-02-29", -1), "2023-02-28");
  assert.equal(shiftYears("2024-02-29", -4), "2020-02-29");
  assert.equal(shiftYears("2000-02-29", -100), "1900-02-28");
});

test("presetRange: To is the registry's data end, From N years earlier", () => {
  assert.deepEqual(presetRange("10Y", registry), { from: "2016-10-30", to: "2026-10-30" });
  assert.deepEqual(presetRange("1Y", registry), { from: "2025-10-30", to: "2026-10-30" });
});

test("presetRange: 1Y from a leap day", () => {
  const leap = [{ first_date: "2000-01-01", last_date: "2024-02-29" }];
  assert.deepEqual(presetRange("1Y", leap), { from: "2023-02-28", to: "2024-02-29" });
});

test("presetRange: Max starts at the earliest first_date", () => {
  assert.deepEqual(presetRange("Max", registry), { from: "1927-12-30", to: "2026-10-30" });
  assert.throws(() => presetRange("3Y", registry), /unknown preset/);
});

test("effectiveStart keeps From when every series starts earlier", () => {
  assert.deepEqual(effectiveStart("2016-10-30", registry), { start: "2016-10-30", mover: null });
});

test("effectiveStart moves to the latest first_date and names that series", () => {
  const { start, mover } = effectiveStart("1980-01-01", registry);
  assert.equal(start, "1992-01-02");
  assert.equal(mover.name, "Dow Jones");
});

test("effectiveStart names the first series in registry order on a tie", () => {
  const tie = [
    { name: "A", first_date: "2000-01-01" },
    { name: "B", first_date: "2000-01-01" },
  ];
  assert.equal(effectiveStart("1990-01-01", tie).mover.name, "A");
});

const daily = {
  kind: "level",
  dates: ["2020-01-02", "2020-01-03", "2020-01-06", "2020-01-07", "2020-01-08"],
  values: [50, 55, 60, 45, 70],
};

test("anchorAndIndex starts levels at 100 on the start date and stops at To", () => {
  const r = anchorAndIndex(daily, "2020-01-02", "2020-01-07");
  assert.equal(r.anchorDate, "2020-01-02");
  assert.equal(r.anchor, 50);
  assert.deepEqual(r.points.map((p) => p.plotted), [100, 110, 120, 90]);
  assert.deepEqual(r.points.map((p) => p.value), [50, 55, 60, 45]);
  assert.equal(r.points.at(-1).date, "2020-01-07");
});

test("anchorAndIndex anchors on the next observation after a weekend", () => {
  const r = anchorAndIndex(daily, "2020-01-04", "2020-01-08");
  assert.equal(r.anchorDate, "2020-01-06");
  assert.equal(r.points[0].plotted, 100);
  assert.equal(r.points[1].plotted, 75);
});

test("anchorAndIndex leaves a series out beyond 180 days or with no data up to To", () => {
  const quarterly = { kind: "level", dates: ["2020-01-01", "2020-06-30", "2020-07-01"], values: [1, 2, 3] };
  assert.equal(anchorAndIndex(quarterly, "2020-01-02", "2021-01-01").anchorDate, "2020-06-30"); // 180 days
  assert.equal(anchorAndIndex(quarterly, "2020-01-01", "2021-01-01").anchorDate, "2020-01-01");
  const gap = { kind: "level", dates: ["2020-01-01", "2020-07-01"], values: [1, 2] };
  assert.equal(anchorAndIndex(gap, "2020-01-02", "2021-01-01"), null); // 181 days
  assert.equal(anchorAndIndex(daily, "2020-01-09", "2020-12-31"), null);
  assert.equal(anchorAndIndex(daily, "2020-01-04", "2020-01-05"), null);
});

test("colorFor uses registry order and wraps after ten", () => {
  assert.equal(colorFor(2), "#ff725c");
  assert.equal(colorFor(0), "#4269d0");
  assert.equal(colorFor(10), "#4269d0");
});

test("formatEndLabel shows the name and one decimal", () => {
  assert.equal(formatEndLabel("S&P 500", 184.26), "S&P 500 (184.3)");
  assert.equal(formatEndLabel("NASDAQ", 100), "NASDAQ (100.0)");
});

test("yDomain covers values and the reference, padded 5%", () => {
  assert.deepEqual(yDomain([120, 150], 100), [97.5, 152.5]);
  assert.deepEqual(yDomain([100], 100), [99, 101]);
});

test("declutter pushes labels at least gap apart, keeping order and bounds", () => {
  const out = declutter([100, 104, 300], { top: 0, bottom: 400, gap: 14 });
  assert.deepEqual(out, [100, 114, 300]);
  const crowded = declutter([395, 398, 10], { top: 0, bottom: 400, gap: 14 });
  assert.deepEqual(crowded, [386, 400, 10]);
  const reversed = declutter([104, 100], { top: 0, bottom: 400, gap: 14 });
  assert.deepEqual(reversed, [114, 100]);
});

test("declutterValues works in data units on a linear scale", () => {
  const [a, b] = declutterValues([150, 149], [100, 200], { top: 0, bottom: 400, gap: 14 });
  assert.equal(a, 150);
  assert.ok(Math.abs((a - b) * 4 - 14) < 1e-9); // 4 px per unit
  assert.ok(b < a);
});

test("canSelect disables unticked boxes once eight are ticked", () => {
  const eight = ["a", "b", "c", "d", "e", "f", "g", "h"];
  assert.equal(canSelect(eight, "i"), false);
  assert.equal(canSelect(eight, "a"), true);
  assert.equal(canSelect(eight.slice(0, 7), "i"), true);
});

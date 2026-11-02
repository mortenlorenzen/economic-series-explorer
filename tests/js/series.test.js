import { test } from "node:test";
import assert from "node:assert/strict";
import {
  plottedValue, toRows, shiftYears, presetRange, effectiveStart,
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

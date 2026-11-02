import { test } from "node:test";
import assert from "node:assert/strict";
import { plottedValue, toRows } from "../../js/series.js";

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

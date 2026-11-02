import { test } from "node:test";
import assert from "node:assert/strict";
import { plottedValue } from "../../js/series.js";

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

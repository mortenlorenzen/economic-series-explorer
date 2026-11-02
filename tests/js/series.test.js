import { test } from "node:test";
import assert from "node:assert/strict";
import {
  plottedValue, toRows, shiftYears, presetRange, effectiveStart,
  anchorAndIndex, colorFor, formatEndLabel, yDomain, declutter, declutterValues,
  canSelect, formatChange, panelHeights, PANELS, shownKinds, chartSubtitle,
  displayMode, logScale, actualPoints, formatActual, actualSubtitle, actualAxis,
  createLoader, isDaily, isoWeekKey, windowOverTenYears, downsampleWeekly,
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

test("rate series start at 0 and change in percentage points", () => {
  const rate = { kind: "rate", dates: ["2020-01-01", "2020-02-01"], values: [4.0, 5.5] };
  assert.deepEqual(anchorAndIndex(rate, "2020-01-01", "2020-12-31").points.map((p) => p.plotted), [0, 1.5]);
});

test("rate end labels carry a sign and pp, without -0.0", () => {
  assert.equal(formatEndLabel("Unemployment Rate", 1.24, "rate"), "Unemployment Rate (+1.2 pp)");
  assert.equal(formatEndLabel("Inflation Rate", -0.43, "rate"), "Inflation Rate (-0.4 pp)");
  assert.equal(formatChange(-0.04), "+0.0 pp");
  assert.equal(formatEndLabel("Inflation Rate", -0.04, "rate"), "Inflation Rate (+0.0 pp)");
  assert.equal(formatEndLabel("S&P 500", 184.26, "level"), "S&P 500 (184.3)");
});

test("panelHeights gives levels 60% when both panels show", () => {
  assert.deepEqual(panelHeights(["level", "rate"]), { level: 288, rate: 192 });
  assert.deepEqual(panelHeights(["rate", "level", "level"]), { level: 288, rate: 192 });
  assert.deepEqual(panelHeights(["level"]), { level: 480 });
  assert.deepEqual(panelHeights(["rate"]), { rate: 480 });
});

test("PANELS puts levels on top with their labels and reference lines", () => {
  assert.deepEqual(PANELS.map((p) => [p.kind, p.label, p.reference]), [
    ["level", "Index, start = 100", 100],
    ["rate", "Change, percentage points", 0],
  ]);
});

test("shownKinds keeps panel order and ignores kinds with no shown series", () => {
  assert.deepEqual(shownKinds([{ kind: "rate" }, { kind: "level" }]), ["level", "rate"]);
  assert.deepEqual(shownKinds([{ kind: "rate" }]), ["rate"]);
  assert.deepEqual(shownKinds([]), []);
});

test("chartSubtitle joins the parts that apply", () => {
  assert.equal(chartSubtitle(["level", "rate"], "2016-10-30", null),
    "100 = value on 2016-10-30; rates as change in percentage points");
  assert.equal(chartSubtitle(["level"], "2016-10-30", null), "100 = value on 2016-10-30");
  assert.equal(chartSubtitle(["rate"], "2016-10-30", null), "Rates as change in percentage points");
  assert.equal(chartSubtitle(["level"], "1992-01-02", { name: "Dow Jones" }),
    "100 = value on 1992-01-02. Window starts 1992-01-02, when Dow Jones data begins");
  assert.equal(chartSubtitle([], "1992-01-02", { name: "Dow Jones" }),
    "Window starts 1992-01-02, when Dow Jones data begins");
});

test("displayMode is actual only with Actual chosen and one series", () => {
  assert.equal(displayMode("actual", 1), "actual");
  assert.equal(displayMode("actual", 2), "indexed");
  assert.equal(displayMode("actual", 0), "indexed");
  assert.equal(displayMode("indexed", 1), "indexed");
});

test("logScale in indexed mode needs a levels panel with values above zero", () => {
  assert.deepEqual(logScale("indexed", [100, 250]), { allowed: true, reason: null });
  const ratesOnly = logScale("indexed", [], { levelsShown: false });
  assert.equal(ratesOnly.allowed, false);
  assert.match(ratesOnly.reason, /rates are always linear/);
  assert.match(logScale("indexed", [100, 0]).reason, /indexed level above zero/);
});

test("logScale in actual mode needs every window value above zero", () => {
  assert.equal(logScale("actual", [4.2, 0.1]).allowed, true);
  const r = logScale("actual", [2.1, -0.4]);
  assert.equal(r.allowed, false);
  assert.match(r.reason, /every value in the window above zero/);
  assert.equal(logScale("actual", [0]).allowed, false);
});

test("actualPoints clips to From/To inclusive, without anchoring", () => {
  const pts = actualPoints(daily, "2020-01-03", "2020-01-07");
  assert.deepEqual(pts.map((p) => [p.date, p.plotted]), [
    ["2020-01-03", 55], ["2020-01-06", 60], ["2020-01-07", 45],
  ]);
  assert.deepEqual(actualPoints(daily, "2021-01-01", "2021-12-31"), []);
});

test("yDomain on log pads 5% of the log10 span and stays above zero", () => {
  const [lo, hi] = yDomain([10, 1000], null, { type: "log" });
  assert.ok(Math.abs(Math.log10(lo) - 0.9) < 1e-12);
  assert.ok(Math.abs(Math.log10(hi) - 3.1) < 1e-12);
  assert.ok(lo > 0);
});

test("an all-positive rate on linear in actual mode starts the y-axis at zero", () => {
  const axis = actualAxis("rate", "linear");
  assert.deepEqual(axis, { reference: 0, zeroFloor: true });
  const [lo, hi] = yDomain([3.5, 5.0], axis.reference, { zeroFloor: axis.zeroFloor });
  assert.equal(lo, 0);
  assert.equal(hi, 5.25);
  assert.ok(yDomain([-0.4, 5.0], axis.reference, { zeroFloor: true })[0] < -0.4); // negatives keep padding
  assert.deepEqual(actualAxis("level", "linear"), { reference: null, zeroFloor: false });
  assert.deepEqual(actualAxis("rate", "log"), { reference: null, zeroFloor: false });
  const [lo2, hi2] = yDomain([20, 30], null);
  assert.deepEqual([lo2, hi2], [19.5, 30.5]);
});

test("declutterValues on log works in log10 pixel positions", () => {
  const domain = [10, 1000]; // 2 decades over 400 px: 200 px per decade
  const [a, b] = declutterValues([100, 101], domain, { top: 0, bottom: 400, gap: 14, type: "log" });
  const px = (v) => ((3 - Math.log10(v)) / 2) * 400;
  assert.ok(Math.abs(Math.abs(px(a) - px(b)) - 14) < 1e-9);
  assert.ok(Math.abs(b - 101) < 1e-9); // the upper label keeps its place
  assert.ok(a < 100); // the lower one moves down
});

test("formatActual and actualSubtitle", () => {
  assert.equal(formatActual(7580.07), "7580.07");
  assert.equal(formatEndLabel("S&P 500", 7580.07, "actual"), "S&P 500 (7580.07)");
  assert.equal(actualSubtitle("Index points", "log"), "Index points, log scale");
});

test("createLoader fetches each id once", async () => {
  const calls = [];
  const load = createLoader(async (id) => {
    calls.push(id);
    return { id };
  });
  const [a, b] = await Promise.all([load("sp500"), load("nasdaq")]);
  assert.deepEqual([a.id, b.id], ["sp500", "nasdaq"]);
  assert.equal(await load("sp500"), a);
  assert.deepEqual(calls, ["sp500", "nasdaq"]);
});

test("createLoader retries an id whose fetch failed", async () => {
  let fail = true;
  let calls = 0;
  const load = createLoader(async (id) => {
    calls++;
    if (fail) throw new Error("404");
    return { id };
  });
  await assert.rejects(load("gdp"), /404/);
  fail = false;
  assert.deepEqual(await load("gdp"), { id: "gdp" });
  assert.equal(calls, 2);
});

test("isDaily: trading days yes, month and quarter starts no", () => {
  assert.equal(isDaily(["2020-01-02", "2020-01-03", "2020-01-06", "2020-01-07", "2020-01-08"]), true);
  assert.equal(isDaily(["2020-01-01", "2020-02-01", "2020-03-01", "2020-04-01"]), false);
  assert.equal(isDaily(["2020-01-01", "2020-04-01", "2020-07-01"]), false);
  assert.equal(isDaily(["2020-01-01"]), false);
});

test("isoWeekKey follows ISO 8601 across the year boundary", () => {
  assert.equal(isoWeekKey("2020-12-31"), "2020-W53");
  assert.equal(isoWeekKey("2021-01-03"), "2020-W53");
  assert.equal(isoWeekKey("2021-01-04"), "2021-W01");
  assert.equal(isoWeekKey("2019-12-30"), "2020-W01");
  assert.equal(isoWeekKey("2026-10-30"), "2026-W44");
});

test("windowOverTenYears is strict", () => {
  assert.equal(windowOverTenYears("2016-10-30", "2026-10-30"), false);
  assert.equal(windowOverTenYears("2016-10-29", "2026-10-30"), true);
});

const pt = (date, plotted, value = plotted) => ({ date, value, plotted });

test("downsampleWeekly averages each week at its last date and keeps the ends exact", () => {
  const points = [
    pt("2020-01-06", 100, 50), pt("2020-01-07", 102, 51), pt("2020-01-08", 104, 52),
    pt("2020-01-13", 110, 55), pt("2020-01-14", 112, 56), pt("2020-01-15", 120, 60),
  ];
  assert.deepEqual(downsampleWeekly(points), [
    pt("2020-01-06", 100, 50),
    { date: "2020-01-08", value: 51.5, plotted: 103, weekly: true },
    { date: "2020-01-14", value: 55.5, plotted: 111, weekly: true },
    pt("2020-01-15", 120, 60),
  ]);
});

test("downsampleWeekly keeps a Wednesday anchor as its own point", () => {
  const points = [
    pt("2020-01-08", 100), pt("2020-01-09", 104), pt("2020-01-10", 106),
    pt("2020-01-13", 90), pt("2020-01-14", 95),
  ];
  const out = downsampleWeekly(points);
  assert.deepEqual(out[0], pt("2020-01-08", 100));
  assert.deepEqual(out[1], { date: "2020-01-10", value: 105, plotted: 105, weekly: true });
  assert.deepEqual(out.at(-1), pt("2020-01-14", 95));
  assert.equal(out.length, 4);
});

test("downsampleWeekly leaves two points or fewer alone", () => {
  assert.deepEqual(downsampleWeekly([pt("2020-01-06", 1), pt("2020-01-07", 2)]), [pt("2020-01-06", 1), pt("2020-01-07", 2)]);
});

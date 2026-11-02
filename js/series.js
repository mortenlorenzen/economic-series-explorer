// Pure functions for indexing series in the browser. Imported by index.qmd
// and tested with `node --test`, so no DOM or Observable globals here.

// Plotted value in indexed mode: levels as 100 × value / anchor, rates as
// the change from the anchor in percentage points.
export function plottedValue(kind, value, anchor) {
  if (kind === "level") return (100 * value) / anchor;
  if (kind === "rate") return value - anchor;
  throw new Error(`unknown kind: ${kind}`);
}

// Turns a series file's parallel `dates`/`values` arrays into rows of
// {date, value}, with dates parsed as UTC midnight.
export function toRows(series) {
  const { dates, values } = series;
  if (dates.length !== values.length) {
    throw new Error(`${series.id}: ${dates.length} dates but ${values.length} values`);
  }
  return dates.map((d, i) => ({ date: new Date(`${d}T00:00:00Z`), value: values[i] }));
}

// Dates are "YYYY-MM-DD" strings throughout, so they compare as text.

// Moves a date by whole years; 29 February becomes 28 February when the
// target year has none.
export function shiftYears(date, years) {
  const [y, m, d] = date.split("-").map(Number);
  const year = y + years;
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const day = m === 2 && d === 29 && !leap ? 28 : d;
  return `${String(year).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export const PRESETS = { "1Y": 1, "5Y": 5, "10Y": 10, "20Y": 20, Max: null };

// From/To for a preset button. To is the data end across the whole
// registry; Max starts at the earliest first_date.
export function presetRange(preset, registry) {
  const to = registry.map((s) => s.last_date).reduce((a, b) => (b > a ? b : a));
  const years = PRESETS[preset];
  if (years === undefined) throw new Error(`unknown preset: ${preset}`);
  const from =
    years === null
      ? registry.map((s) => s.first_date).reduce((a, b) => (b < a ? b : a))
      : shiftYears(to, -years);
  return { from, to };
}

// The later of From and the latest first_date among the selected series.
// `mover` is the series that pushed the start past From (first in registry
// order on a tie), or null.
export function effectiveStart(from, selected) {
  let start = from;
  let mover = null;
  for (const s of selected) {
    if (s.first_date > start) {
      start = s.first_date;
      mover = s;
    }
  }
  return { start, mover };
}

const DAY_MS = 86400000;
const daysBetween = (a, b) => (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS;

export const MAX_ANCHOR_GAP_DAYS = 180;

// First index i with dates[i] >= date (dates sorted ascending).
function firstOnOrAfter(dates, date) {
  let lo = 0;
  let hi = dates.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (dates[mid] < date) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Anchors a series at its first observation on or after `start` and returns
// the indexed points up to `to`, or null when that observation is missing or
// more than MAX_ANCHOR_GAP_DAYS after `start`.
export function anchorAndIndex(series, start, to) {
  const { dates, values, kind } = series;
  const i0 = firstOnOrAfter(dates, start);
  if (i0 >= dates.length || dates[i0] > to) return null;
  if (daysBetween(start, dates[i0]) > MAX_ANCHOR_GAP_DAYS) return null;
  const anchor = values[i0];
  const points = [];
  for (let i = i0; i < dates.length && dates[i] <= to; i++) {
    points.push({ date: dates[i], value: values[i], plotted: plottedValue(kind, values[i], anchor) });
  }
  return { anchorDate: dates[i0], anchor, points };
}

// Observable10, assigned by registry index so a series keeps its colour
// whatever else is selected.
export const OBSERVABLE10 = [
  "#4269d0", "#efb118", "#ff725c", "#6cc5b0", "#3ca951",
  "#ff8ab7", "#a463f2", "#97bbf5", "#9c6b4e", "#9498a0",
];

export function colorFor(registryIndex) {
  return OBSERVABLE10[registryIndex % OBSERVABLE10.length];
}

// Rate changes carry a sign and "pp"; rounding first keeps −0.04 from
// showing as "-0.0".
export function formatChange(plotted) {
  const rounded = Math.round(plotted * 10) / 10 || 0;
  return `${rounded >= 0 ? "+" : ""}${rounded.toFixed(1)} pp`;
}

// kind: "level" or "rate" in indexed mode, "actual" in actual-values mode.
export function formatEndLabel(name, plotted, kind = "level") {
  const text = kind === "rate" ? formatChange(plotted)
    : kind === "actual" ? formatActual(plotted)
    : plotted.toFixed(1);
  return `${name} (${text})`;
}

// Panel settings by kind, in drawing order: levels on top, rates below.
export const PANELS = [
  { kind: "level", label: "Index, start = 100", reference: 100 },
  { kind: "rate", label: "Change, percentage points", reference: 0 },
];

// Kinds that get a panel, in panel order: those with at least one shown
// (not left-out) series.
export function shownKinds(shownSeries) {
  return PANELS.map((p) => p.kind).filter((k) => shownSeries.some((s) => s.kind === k));
}

// "100 = value on <start>; rates as change in percentage points" for the
// kinds shown, then the sentence naming the series that moved the start.
export function chartSubtitle(kinds, start, mover) {
  const parts = [];
  if (kinds.includes("level")) parts.push(`100 = value on ${start}`);
  if (kinds.includes("rate")) parts.push("rates as change in percentage points");
  let text = parts.join("; ");
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (mover) text += `${text ? ". " : ""}Window starts ${start}, when ${mover.name} data begins`;
  return text;
}

export const PLOT_HEIGHT = 480;
export const LEVEL_SHARE = 0.6;

// Plot height per shown kind: levels get 60% when both panels show.
export function panelHeights(kinds, total = PLOT_HEIGHT) {
  const hasLevel = kinds.includes("level");
  const hasRate = kinds.includes("rate");
  if (hasLevel && hasRate) {
    const level = Math.round(total * LEVEL_SHARE);
    return { level, rate: total - level };
  }
  if (hasLevel) return { level: total };
  if (hasRate) return { rate: total };
  return {};
}

// Y domain covering the values and the reference line (null for none),
// padded 5% each side; on "log" the padding is in log10 space. With
// `zeroFloor`, an all-non-negative domain starts exactly at 0.
export function yDomain(values, reference, { type = "linear", zeroFloor = false } = {}) {
  const log = type === "log";
  const f = log ? Math.log10 : (v) => v;
  const g = log ? (v) => 10 ** v : (v) => v;
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of reference === null ? values : [...values, reference]) {
    const t = f(v);
    if (t < lo) lo = t;
    if (t > hi) hi = t;
  }
  const pad = hi > lo ? (hi - lo) * 0.05 : log ? 0.05 : 1;
  if (zeroFloor && !log && lo >= 0) return [0, hi + pad];
  return [g(lo - pad), g(hi + pad)];
}

// Pushes pixel positions apart to at least `gap`, keeping their order and
// staying within [top, bottom] where they fit. Returns positions in the
// input order.
export function declutter(positions, { top, bottom, gap }) {
  const order = positions.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const ys = order.map((o) => Math.min(Math.max(o.y, top), bottom));
  for (let k = 1; k < ys.length; k++) ys[k] = Math.max(ys[k], ys[k - 1] + gap);
  if (ys.length && ys[ys.length - 1] > bottom) {
    ys[ys.length - 1] = bottom;
    for (let k = ys.length - 2; k >= 0; k--) ys[k] = Math.min(ys[k], ys[k + 1] - gap);
  }
  const out = new Array(positions.length);
  order.forEach((o, k) => (out[o.i] = ys[k]));
  return out;
}

// Declutters label values on a linear or log y scale: values to pixels,
// apart, and back to values, so Plot can draw them in data coordinates.
export function declutterValues(values, domain, { top, bottom, gap, type = "linear" }) {
  const log = type === "log";
  const f = log ? Math.log10 : (v) => v;
  const g = log ? (v) => 10 ** v : (v) => v;
  const lo = f(domain[0]);
  const hi = f(domain[1]);
  const toPx = (v) => top + ((hi - f(v)) / (hi - lo)) * (bottom - top);
  const toValue = (px) => g(hi - ((px - top) / (bottom - top)) * (hi - lo));
  return declutter(values.map(toPx), { top, bottom, gap }).map(toValue);
}

export const MAX_SELECTED = 8;

// A box can be ticked while fewer than MAX_SELECTED are, and a ticked box
// can always be cleared.
export function canSelect(selected, id, max = MAX_SELECTED) {
  return selected.includes(id) || selected.length < max;
}

// Actual values need exactly one series; anything else is indexed.
export function displayMode(choice, selectedCount) {
  return choice === "actual" && selectedCount === 1 ? "actual" : "indexed";
}

export const DISPLAY_REASON = "Actual values need exactly one series";

// Whether the log option is allowed, and why not. `values` are the plotted
// level values in indexed mode, or the window's values in actual mode.
export function logScale(mode, values, { levelsShown = true } = {}) {
  if (mode === "indexed" && !levelsShown) {
    return { allowed: false, reason: "Log scale applies to level series; rates are always linear" };
  }
  if (values.some((v) => v <= 0)) {
    return {
      allowed: false,
      reason: mode === "actual"
        ? "Log scale needs every value in the window above zero"
        : "Log scale needs every indexed level above zero",
    };
  }
  return { allowed: true, reason: null };
}

// Stored values with from <= date <= to; no anchor, no start clamping.
export function actualPoints(series, from, to) {
  const { dates, values } = series;
  const points = [];
  for (let i = firstOnOrAfter(dates, from); i < dates.length && dates[i] <= to; i++) {
    points.push({ date: dates[i], value: values[i], plotted: values[i] });
  }
  return points;
}

export function formatActual(value) {
  return String(value);
}

export function actualSubtitle(unit, type) {
  return `${unit}, ${type} scale`;
}

// Actual-values y-axis: rates on linear start at zero (reference line at 0);
// levels, and anything on log, have no reference line.
export function actualAxis(kind, type) {
  const rateLinear = kind === "rate" && type === "linear";
  return { reference: rateLinear ? 0 : null, zeroFloor: rateLinear };
}

// One fetch per series id: load(id) returns the cached promise. A failed
// fetch is dropped from the cache so the next load tries again.
export function createLoader(fetchJson) {
  const cache = new Map();
  return function load(id) {
    if (!cache.has(id)) {
      const promise = fetchJson(id).catch((error) => {
        cache.delete(id);
        throw error;
      });
      cache.set(id, promise);
    }
    return cache.get(id);
  };
}

// Daily when the median gap between observations is at most 7 days.
export function isDaily(dates) {
  if (dates.length < 2) return false;
  const gaps = [];
  for (let i = 1; i < dates.length; i++) gaps.push(daysBetween(dates[i - 1], dates[i]));
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)] <= 7;
}

// ISO 8601 week, e.g. "2020-W53": weeks start on Monday and belong to the
// year of their Thursday.
export function isoWeekKey(date) {
  const t = Date.parse(`${date}T00:00:00Z`);
  const weekday = (new Date(t).getUTCDay() + 6) % 7; // Monday = 0
  const thursday = new Date(t + (3 - weekday) * DAY_MS);
  const year = thursday.getUTCFullYear();
  const week = Math.floor((thursday - Date.UTC(year, 0, 1)) / DAY_MS / 7) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}

// Strictly longer than ten years: start before To − 10 years.
export function windowOverTenYears(start, to) {
  return start < shiftYears(to, -10);
}

// Weekly averages of drawn points, each at its week's last date, rounded to
// the 7 significant digits the data files store. The first and last points
// stay exact; `weekly` marks averaged points.
export function downsampleWeekly(points) {
  if (points.length <= 2) return points.slice();
  const out = [points[0]];
  let group = [];
  const flush = () => {
    if (!group.length) return;
    const mean = (k) => Number((group.reduce((sum, p) => sum + p[k], 0) / group.length).toPrecision(7));
    out.push({ date: group[group.length - 1].date, value: mean("value"), plotted: mean("plotted"), weekly: true });
    group = [];
  };
  for (let i = 1; i < points.length - 1; i++) {
    if (group.length && isoWeekKey(group[0].date) !== isoWeekKey(points[i].date)) flush();
    group.push(points[i]);
  }
  flush();
  out.push(points[points.length - 1]);
  return out;
}

// Export rows: full-resolution points of the exported series, in the order
// given (registry order), as {series, date, value, plotted, mode}.
// `plotted` is rounded to the 7 significant digits the data files store.
export function exportRows(mode, list) {
  return list.flatMap(({ series, points }) =>
    points.map((p) => ({
      series: series.id, date: p.date, value: p.value,
      plotted: Number(p.plotted.toPrecision(7)), mode
    }))
  );
}

export const CSV_COLUMNS = ["series", "date", "value", "plotted", "mode"];

// Long-format CSV; no quoting, since ids, dates and numbers hold no commas.
export function toCsv(rows) {
  const lines = [CSV_COLUMNS.join(",")];
  for (const r of rows) lines.push(CSV_COLUMNS.map((c) => String(r[c])).join(","));
  return lines.join("\n") + "\n";
}

// "<ids joined by +>_<mode>_<from>_<to>_<today>.<ext>"
export function exportFileName(ids, mode, from, to, today, ext = "csv") {
  return `${ids.join("+")}_${mode}_${from}_${to}_${today}.${ext}`;
}

// The viewer's local date as "YYYY-MM-DD".
export function todayLocal(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const SOURCE_NAMES = { yahoo: "Yahoo Finance", fred: "FRED" };
export const SITE_CREDIT = "Economic Series Explorer, mortenlorenzen.github.io/economic-series-explorer";

// PNG caption: the exported series' sources by first appearance.
export function sourceCaption(sources) {
  const names = [...new Set(sources)].map((s) => SOURCE_NAMES[s] ?? s);
  return `Source: ${names.join(", ")}. ${SITE_CREDIT}`;
}

// Vertical layout of the exported SVG: title, subtitle, the panels stacked
// at their screen heights, the optional note and the caption. Text y values
// are baselines.
export const EXPORT_TEXT = {
  pad: 16,
  title: { size: 20, line: 28 },
  subtitle: { size: 14, line: 22 },
  note: { size: 12, line: 18 },
  caption: { size: 12, line: 18 },
};

// `lines` gives each text block's line count after wrapping; note 0 = no note.
// Each text value is the first line's baseline.
export function exportLayout(panelHeights, { title = 1, subtitle = 1, note = 0, caption = 1 } = {}) {
  const { pad } = EXPORT_TEXT;
  let y = pad;
  const block = (t, n) => {
    const b = y + t.line - (t.line - t.size) / 2 - Math.round(t.size * 0.2);
    y += t.line * n;
    return b;
  };
  const out = { title: block(EXPORT_TEXT.title, title), subtitle: block(EXPORT_TEXT.subtitle, subtitle) };
  y += 4;
  out.panels = panelHeights.map((h) => {
    const top = y;
    y += h;
    return top;
  });
  out.note = note ? block(EXPORT_TEXT.note, note) : null;
  y += 4;
  out.caption = block(EXPORT_TEXT.caption, caption);
  out.height = y + pad;
  return out;
}

// Greedy word wrap: lines no wider than maxWidth by `measure(text)`; a single
// word wider than that gets a line of its own.
export function wrapText(text, maxWidth, measure) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

// @font-face rules in a stylesheet's text, as {family, style, weight,
// unicodeRange, url}. Only the first url() of each src is kept.
export function parseFontFaces(cssText) {
  const faces = [];
  for (const [, body] of cssText.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const prop = (name) => body.match(new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`))?.[1].trim() ?? null;
    const url = body.match(/url\(\s*(['"]?)([^'")]+)\1\s*\)/)?.[2];
    if (!url) continue;
    faces.push({
      family: (prop("font-family") ?? "").replace(/^['"]|['"]$/g, ""),
      style: prop("font-style") ?? "normal",
      weight: prop("font-weight") ?? "400",
      unicodeRange: prop("unicode-range"),
      url,
    });
  }
  return faces;
}

// Does a unicode-range list cover a code point? No range covers everything.
function coversCodePoint(range, cp) {
  if (!range) return true;
  return range.split(",").some((part) => {
    const [a, b] = part.trim().replace(/^U\+/i, "").split("-");
    if (a.includes("?")) {
      return cp >= parseInt(a.replace(/\?/g, "0"), 16) && cp <= parseInt(a.replace(/\?/g, "F"), 16);
    }
    return cp >= parseInt(a, 16) && cp <= parseInt(b ?? a, 16);
  });
}

// The faces to inline: normal style, the given family, one latin face (the
// one covering "A") per wanted weight. A weight range "300 700" covers 400.
export function pickFontFaces(faces, family, weights) {
  const picked = [];
  for (const w of weights) {
    const face = faces.find((f) => {
      const [lo, hi = lo] = f.weight.split(/\s+/).map(Number);
      return f.family.toLowerCase() === family.toLowerCase() && f.style === "normal" &&
        lo <= w && w <= hi && coversCodePoint(f.unicodeRange, 0x41);
    });
    if (face && !picked.includes(face)) picked.push(face);
  }
  return picked;
}

// A series file is usable when its dates and values are arrays of one length.
export function checkSeries(id, json) {
  if (!json || !Array.isArray(json.dates) || !Array.isArray(json.values) || json.dates.length !== json.values.length) {
    throw new Error(`${id}: malformed series file`);
  }
  return json;
}

// Fetches data/<id>.json through `fetchFn`; an HTTP error or a malformed
// body rejects, like a network error.
export async function fetchSeries(id, fetchFn) {
  const res = await fetchFn(`data/${id}.json`);
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  return checkSeries(id, await res.json());
}

// Loads every id in parallel and never rejects: the series that loaded, in
// the order given, and the ids that failed.
export async function loadAll(ids, load) {
  const results = await Promise.allSettled(ids.map((id) => load(id)));
  const series = [];
  const failed = [];
  results.forEach((r, i) => (r.status === "fulfilled" ? series.push(r.value) : failed.push(ids[i])));
  return { series, failed };
}

export function failureMessage(names) {
  return `Could not load ${names.join(", ")}. Untick and tick again to retry.`;
}

// Description note above the chart: one or two series as plain lines, more
// collapsed into a <details> whose summary lists the names. null = no note.
export function descriptionNote(selected) {
  if (selected.length === 0) return null;
  const lines = selected.map((s) => ({ name: s.name, description: s.description }));
  if (selected.length <= 2) return { collapsed: false, summary: null, lines };
  return { collapsed: true, summary: `About the series: ${selected.map((s) => s.name).join(", ")}`, lines };
}

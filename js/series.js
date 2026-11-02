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

export function formatEndLabel(name, plotted) {
  return `${name} (${plotted.toFixed(1)})`;
}

// Y domain covering the values and the reference line, padded 5% each side.
export function yDomain(values, reference) {
  let lo = reference;
  let hi = reference;
  for (const v of values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const pad = hi > lo ? (hi - lo) * 0.05 : 1;
  return [lo - pad, hi + pad];
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

// Declutters label values on a linear y scale: values to pixels, apart,
// and back to values, so Plot can draw them in data coordinates.
export function declutterValues(values, domain, { top, bottom, gap }) {
  const [lo, hi] = domain;
  const toPx = (v) => top + ((hi - v) / (hi - lo)) * (bottom - top);
  const toValue = (px) => hi - ((px - top) / (bottom - top)) * (hi - lo);
  return declutter(values.map(toPx), { top, bottom, gap }).map(toValue);
}

export const MAX_SELECTED = 8;

// A box can be ticked while fewer than MAX_SELECTED are, and a ticked box
// can always be cleared.
export function canSelect(selected, id, max = MAX_SELECTED) {
  return selected.includes(id) || selected.length < max;
}

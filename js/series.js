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

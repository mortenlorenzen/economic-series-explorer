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

const DEFAULT_DIMENSION_NAME = "Category";
const DEFAULT_MEASURE_NAME = "Value";

export function tableToSeries(table) {
  if (!table) {
    return createEmptyResult();
  }

  const columns = Array.isArray(table.columns) ? table.columns : [];
  const rows = Array.isArray(table.rows) ? table.rows : [];
  const dimensionColumn = columns[0] || { name: DEFAULT_DIMENSION_NAME };
  const measureColumn = columns[1] || { name: DEFAULT_MEASURE_NAME };

  const buckets = new Map();
  for (const row of rows) {
    if (!Array.isArray(row)) {
      continue;
    }
    const category = sanitizeCategory(row[0]);
    const value = Number(row[1]);
    if (!Number.isFinite(value)) {
      continue;
    }
    buckets.set(category, (buckets.get(category) || 0) + value);
  }

  const series = Array.from(buckets.entries())
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);

  return {
    dimensionName: dimensionColumn.name || DEFAULT_DIMENSION_NAME,
    measureName: measureColumn.name || DEFAULT_MEASURE_NAME,
    rowCount: rows.length,
    series
  };
}

function sanitizeCategory(value) {
  if (value === null || value === undefined || value === "") {
    return "(Blank)";
  }
  return String(value);
}

function createEmptyResult() {
  return {
    dimensionName: DEFAULT_DIMENSION_NAME,
    measureName: DEFAULT_MEASURE_NAME,
    rowCount: 0,
    series: []
  };
}

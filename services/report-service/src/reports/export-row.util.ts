export function serializeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Flatten nested values and drop internal summary marker rows for tabular export. */
export function normalizeRowsForExport(
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  return rows
    .filter((row) => !row._summary)
    .map((row) => {
      const flat: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        flat[key] =
          typeof value === 'object' && value !== null && !(value instanceof Date)
            ? serializeCell(value)
            : value;
      }
      return flat;
    });
}

export function collectColumns(rows: Record<string, unknown>[]): string[] {
  const keys = new Set<string>();
  for (const row of rows) {
    Object.keys(row).forEach((key) => keys.add(key));
  }
  return Array.from(keys);
}

export function frequencyToRows(frequency: Record<string, number>): Record<string, unknown>[] {
  return Object.entries(frequency).map(([label, count]) => ({
    label,
    count,
  }));
}

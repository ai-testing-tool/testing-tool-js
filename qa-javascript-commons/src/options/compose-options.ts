function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Deep-merge sources; later defined keys win; `undefined` is skipped. */
export function composeOptions<T extends Record<string, unknown>>(
  ...sources: Array<Partial<T> | null | undefined>
): T {
  const result: Record<string, unknown> = {};

  for (const source of sources) {
    if (!source) continue;
    for (const [key, value] of Object.entries(source)) {
      if (value === undefined) continue;
      const existing = result[key];
      if (isPlainObject(existing) && isPlainObject(value)) {
        result[key] = composeOptions(existing, value);
      } else {
        result[key] = value;
      }
    }
  }

  return result as T;
}

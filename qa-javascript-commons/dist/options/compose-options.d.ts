/** Deep-merge sources; later defined keys win; `undefined` is skipped. */
export declare function composeOptions<T extends Record<string, unknown>>(...sources: Array<Partial<T> | null | undefined>): T;

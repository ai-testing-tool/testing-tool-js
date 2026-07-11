"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeOptions = composeOptions;
function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/** Deep-merge sources; later defined keys win; `undefined` is skipped. */
function composeOptions(...sources) {
    const result = {};
    for (const source of sources) {
        if (!source)
            continue;
        for (const [key, value] of Object.entries(source)) {
            if (value === undefined)
                continue;
            const existing = result[key];
            if (isPlainObject(existing) && isPlainObject(value)) {
                result[key] = composeOptions(existing, value);
            }
            else {
                result[key] = value;
            }
        }
    }
    return result;
}

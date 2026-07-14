import type { CypressSpecInput } from './report-builder';
/**
 * File bridge across Cypress specs (reporter may run once per spec).
 * Plugin `before:run` clears; reporter appends; `after:run` reads + publishes.
 */
export declare class ResultsManager {
    static resolvePath(explicit?: string): string;
    static clear(path?: string): void;
    static getSpecs(path?: string): CypressSpecInput[];
    static appendSpec(spec: CypressSpecInput, path?: string): void;
}

export type CypressScreenshotRecord = {
    path: string;
    name?: string;
    specName?: string;
    testFailure?: boolean;
    takenAt?: string;
};
export declare class ScreenshotsManager {
    static resolvePath(explicit?: string): string;
    static clear(path?: string): void;
    static getAll(path?: string): CypressScreenshotRecord[];
    static append(record: CypressScreenshotRecord, path?: string): void;
}
/** True for still images; videos are skipped (Phase 3 still-image only). */
export declare function isStillImagePath(filePath: string): boolean;
/**
 * Match a failure screenshot to a failed assertion by title / fullName.
 */
export declare function matchScreenshotToAssertion(shot: CypressScreenshotRecord, assertion: {
    title: string;
    fullName?: string;
    status: string;
}, specName: string): boolean;
/** Next unused failure still-image for this spec (ordered fallback). */
export declare function nextUnusedSpecScreenshot(shots: readonly CypressScreenshotRecord[], used: ReadonlySet<number>, specName: string): number;

export type CiMetadata = {
    ciPlatform?: string;
    buildUrl?: string;
    gitCommitSha?: string;
    gitBranch?: string;
    gitAuthorName?: string;
    gitAuthorEmail?: string;
};
/** Best-effort CI metadata from common provider env vars (+ local git fallback). */
export declare function detectCiEnvironment(): CiMetadata;

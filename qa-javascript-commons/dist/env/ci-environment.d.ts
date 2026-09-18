export type CiMetadata = {
    ciPlatform?: string;
    ciBuildUrl?: string;
    gitCommitSha?: string;
    gitBranch?: string;
    gitAuthorName?: string;
    gitHashCommitUrl?: string;
};
/** Best-effort CI metadata from common provider env vars (+ local git fallback). */
export declare function detectCiEnvironment(): CiMetadata;

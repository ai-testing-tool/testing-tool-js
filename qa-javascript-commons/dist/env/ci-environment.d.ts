export type CiMetadata = {
    ciPlatform?: string;
    buildUrl?: string;
    gitCommitSha?: string;
    gitBranch?: string;
    gitAuthorName?: string;
    gitAuthorEmail?: string;
};
/** Best-effort CI metadata from common provider env vars. */
export declare function detectCiEnvironment(): CiMetadata;

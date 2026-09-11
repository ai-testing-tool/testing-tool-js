export type IngestUploadPhase = 'starting' | 'session' | 'chunk' | 'complete' | 'done';
export type IngestUploadProgress = {
    phase: IngestUploadPhase;
    /** 0–100 inclusive */
    percent: number;
    completedSteps: number;
    totalSteps: number;
    chunkIndex?: number;
    totalChunks?: number;
    message: string;
};
export type IngestUploadProgressHandler = (progress: IngestUploadProgress) => void;
export declare function clampPercent(value: number): number;
/** session + N chunks + complete = N + 2 steps */
export declare function chunkedUploadTotalSteps(chunkCount: number): number;
export declare function progressAtStep(input: {
    phase: IngestUploadPhase;
    completedSteps: number;
    totalSteps: number;
    message: string;
    chunkIndex?: number;
    totalChunks?: number;
}): IngestUploadProgress;

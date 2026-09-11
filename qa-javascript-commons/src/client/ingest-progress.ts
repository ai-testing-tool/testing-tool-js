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

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** session + N chunks + complete = N + 2 steps */
export function chunkedUploadTotalSteps(chunkCount: number): number {
  return Math.max(1, chunkCount) + 2;
}

export function progressAtStep(
  input: {
    phase: IngestUploadPhase;
    completedSteps: number;
    totalSteps: number;
    message: string;
    chunkIndex?: number;
    totalChunks?: number;
  }
): IngestUploadProgress {
  const { completedSteps, totalSteps } = input;
  const percent =
    totalSteps <= 0 ? 100 : clampPercent((completedSteps / totalSteps) * 100);
  return {
    phase: input.phase,
    percent: input.phase === 'done' ? 100 : percent,
    completedSteps,
    totalSteps,
    chunkIndex: input.chunkIndex,
    totalChunks: input.totalChunks,
    message: input.message,
  };
}

import type { LoggerInterface } from '../utils';
import type { ChunkPlan } from './ingest-chunk-plan';
import { postIngestJson, type IngestResponse, type PostIngestJsonResult } from './ingest-http';
import {
  chunkedUploadTotalSteps,
  progressAtStep,
  type IngestUploadProgressHandler,
} from './ingest-progress';
import { withRetry, type RetryPolicy } from './ingest-retry';

export type UploadChunkedIngestInput = {
  url: string;
  token: string;
  plan: ChunkPlan;
  timeoutMs: number;
  completeTimeoutMs: number;
  retryPolicy: RetryPolicy;
  logger?: LoggerInterface;
  onProgress?: IngestUploadProgressHandler;
};

async function postWithRetry(
  input: UploadChunkedIngestInput,
  body: unknown,
  action: 'session' | 'chunk' | 'complete',
  timeoutMs: number,
  label: string,
): Promise<PostIngestJsonResult> {
  return withRetry(
    async () =>
      postIngestJson({
        url: input.url,
        token: input.token,
        body,
        timeoutMs,
        action,
      }),
    {
      policy: input.retryPolicy,
      logger: input.logger,
      label,
    },
  );
}

export async function uploadChunkedIngest(
  input: UploadChunkedIngestInput,
): Promise<IngestResponse> {
  const { plan, logger, onProgress } = input;
  const totalChunks = plan.chunks.length;
  const totalSteps = chunkedUploadTotalSteps(totalChunks);
  let completedSteps = 0;

  const emit = (
    phase: 'starting' | 'session' | 'chunk' | 'complete' | 'done',
    message: string,
    extra?: { chunkIndex?: number },
  ): void => {
    onProgress?.(
      progressAtStep({
        phase,
        completedSteps,
        totalSteps,
        message,
        chunkIndex: extra?.chunkIndex,
        totalChunks,
      }),
    );
  };

  emit('starting', `Starting chunked upload (${totalChunks} chunks)`);
  logger?.log(`Ingest: starting chunked upload sessionId=${plan.sessionId} chunks=${totalChunks}`);

  await postWithRetry(input, plan.sessionBody, 'session', input.timeoutMs, 'Ingest session');
  completedSteps = 1;
  emit('session', 'Session created');

  for (const chunk of plan.chunks) {
    await postWithRetry(
      input,
      chunk,
      'chunk',
      input.timeoutMs,
      `Ingest chunk ${chunk.chunkIndex + 1}/${totalChunks}`,
    );
    completedSteps += 1;
    const label = `Chunk ${chunk.chunkIndex + 1}/${totalChunks} accepted`;
    emit('chunk', label, { chunkIndex: chunk.chunkIndex });
    logger?.log(`Ingest: ${label} for sessionId=${plan.sessionId}`);
  }

  const response = await postWithRetry(
    input,
    plan.completeBody,
    'complete',
    input.completeTimeoutMs,
    'Ingest complete',
  );
  completedSteps = totalSteps;
  emit('complete', `Complete accepted (HTTP ${response.status})`);
  emit('done', 'Upload finished');

  logger?.log(`Ingest: chunked upload complete (HTTP ${response.status})`);
  return response;
}

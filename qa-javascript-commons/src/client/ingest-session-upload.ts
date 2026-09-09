import type { LoggerInterface } from '../utils';
import type { ChunkPlan } from './ingest-chunk-plan';
import { postIngestJson, type IngestResponse, type PostIngestJsonResult } from './ingest-http';
import { withRetry, type RetryPolicy } from './ingest-retry';

export type UploadChunkedIngestInput = {
  url: string;
  token: string;
  plan: ChunkPlan;
  timeoutMs: number;
  completeTimeoutMs: number;
  retryPolicy: RetryPolicy;
  logger?: LoggerInterface;
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
  const { plan, logger } = input;
  const totalChunks = plan.chunks.length;

  logger?.log(`Ingest: starting chunked upload sessionId=${plan.sessionId} chunks=${totalChunks}`);

  await postWithRetry(input, plan.sessionBody, 'session', input.timeoutMs, 'Ingest session');

  for (const chunk of plan.chunks) {
    await postWithRetry(
      input,
      chunk,
      'chunk',
      input.timeoutMs,
      `Ingest chunk ${chunk.chunkIndex + 1}/${totalChunks}`,
    );
    logger?.log(
      `Ingest: chunk ${chunk.chunkIndex + 1}/${totalChunks} accepted for sessionId=${plan.sessionId}`,
    );
  }

  const response = await postWithRetry(
    input,
    plan.completeBody,
    'complete',
    input.completeTimeoutMs,
    'Ingest complete',
  );

  logger?.log(`Ingest: chunked upload complete (HTTP ${response.status})`);
  return response;
}

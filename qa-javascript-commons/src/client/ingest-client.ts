import type { IngestOptionsType } from '../config';
import type { IngestPayload } from '../models';
import { estimatePayloadBytes } from '../models';
import type { LoggerInterface } from '../utils';
import {
  DEFAULT_CHUNK_MAX_BYTES,
  DEFAULT_CHUNK_THRESHOLD_BYTES,
  planChunks,
} from './ingest-chunk-plan';
import { postIngestJson, type IngestResponse } from './ingest-http';
import {
  progressAtStep,
  type IngestUploadProgressHandler,
} from './ingest-progress';
import { DEFAULT_RETRY_POLICY, withRetry, type RetryPolicy } from './ingest-retry';
import { uploadChunkedIngest } from './ingest-session-upload';

export type { IngestResponse } from './ingest-http';
export type {
  IngestUploadPhase,
  IngestUploadProgress,
  IngestUploadProgressHandler,
} from './ingest-progress';

export type IngestClientOptions = IngestOptionsType & {
  logger?: LoggerInterface;
  /** Called as upload steps complete (direct or chunked). */
  onProgress?: IngestUploadProgressHandler;
};

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_COMPLETE_TIMEOUT_MS = 120_000;

export class IngestClient {
  private readonly url?: string;
  private readonly token?: string;
  private readonly timeoutMs: number;
  private readonly completeTimeoutMs: number;
  private readonly maxPayloadBytes: number;
  private readonly chunkThresholdBytes: number;
  private readonly chunkMaxBytes: number;
  private readonly retryPolicy: RetryPolicy;
  private readonly logger?: LoggerInterface;
  private readonly onProgress?: IngestUploadProgressHandler;

  constructor(options: IngestClientOptions = {}) {
    this.url = options.url;
    this.token = options.token;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.completeTimeoutMs = options.completeTimeoutMs ?? DEFAULT_COMPLETE_TIMEOUT_MS;
    this.maxPayloadBytes = options.maxPayloadBytes ?? 4_500_000;
    this.chunkThresholdBytes = options.chunkThresholdBytes ?? DEFAULT_CHUNK_THRESHOLD_BYTES;
    this.chunkMaxBytes = options.chunkMaxBytes ?? DEFAULT_CHUNK_MAX_BYTES;
    this.retryPolicy = {
      maxAttempts: options.maxRetries ?? DEFAULT_RETRY_POLICY.maxAttempts,
      baseDelayMs: options.retryBaseDelayMs ?? DEFAULT_RETRY_POLICY.baseDelayMs,
      maxDelayMs: DEFAULT_RETRY_POLICY.maxDelayMs,
    };
    this.logger = options.logger;
    this.onProgress = options.onProgress;
  }

  async send(payload: IngestPayload): Promise<IngestResponse> {
    if (!this.url) {
      throw new Error('ingest.url (or AI_TESTING_TOOL_INGEST_URL) is required in ingest mode');
    }
    if (!this.token) {
      throw new Error('ingest.token (or AI_TESTING_TOOL_INGEST_TOKEN) is required in ingest mode');
    }

    const bytes = estimatePayloadBytes(payload);
    if (bytes <= this.chunkThresholdBytes && bytes <= this.maxPayloadBytes) {
      return this.sendDirect(payload);
    }

    const plan = planChunks(payload, { maxChunkBytes: this.chunkMaxBytes });
    return uploadChunkedIngest({
      url: this.url,
      token: this.token,
      plan,
      timeoutMs: this.timeoutMs,
      completeTimeoutMs: this.completeTimeoutMs,
      retryPolicy: this.retryPolicy,
      logger: this.logger,
      onProgress: this.onProgress,
    });
  }

  private async sendDirect(payload: IngestPayload): Promise<IngestResponse> {
    const bytes = estimatePayloadBytes(payload);
    if (bytes > this.maxPayloadBytes) {
      throw new Error(
        `Ingest payload is ${bytes} bytes; max allowed is ${this.maxPayloadBytes} bytes`,
      );
    }

    this.onProgress?.(
      progressAtStep({
        phase: 'starting',
        completedSteps: 0,
        totalSteps: 1,
        message: 'Uploading report',
      }),
    );

    const response = await withRetry(
      async () =>
        postIngestJson({
          url: this.url!,
          token: this.token!,
          body: payload,
          timeoutMs: this.timeoutMs,
        }),
      {
        policy: this.retryPolicy,
        logger: this.logger,
        label: 'Ingest',
      },
    );

    this.onProgress?.(
      progressAtStep({
        phase: 'done',
        completedSteps: 1,
        totalSteps: 1,
        message: `Ingest accepted (HTTP ${response.status})`,
      }),
    );
    this.logger?.log(`Ingest accepted (HTTP ${response.status})`);
    return response;
  }
}

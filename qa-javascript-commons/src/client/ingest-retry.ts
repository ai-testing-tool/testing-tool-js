import { isRetryableError } from './ingest-http';
import type { LoggerInterface } from '../utils';

export type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 4,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
};

export type RetryContext = {
  attempt: number;
  maxAttempts: number;
};

function retryDelayMs(policy: RetryPolicy, attempt: number): number {
  const exponential = policy.baseDelayMs * 2 ** Math.max(0, attempt - 1);
  const capped = Math.min(policy.maxDelayMs, exponential);
  const jitter = Math.floor(Math.random() * 250);
  return capped + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withRetry<T>(
  operation: (context: RetryContext) => Promise<T>,
  options: {
    policy?: RetryPolicy;
    logger?: LoggerInterface;
    label?: string;
  } = {},
): Promise<T> {
  const policy = options.policy ?? DEFAULT_RETRY_POLICY;
  const label = options.label ?? 'ingest';

  let lastError: unknown;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
    try {
      return await operation({ attempt, maxAttempts: policy.maxAttempts });
    } catch (error: unknown) {
      lastError = error;
      const canRetry = attempt < policy.maxAttempts && isRetryableError(error);
      if (!canRetry) {
        throw error;
      }
      const delayMs = retryDelayMs(policy, attempt);
      const message = error instanceof Error ? error.message : String(error);
      options.logger?.log(
        `${label} retry ${attempt}/${policy.maxAttempts - 1} in ${delayMs}ms: ${message}`,
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
}

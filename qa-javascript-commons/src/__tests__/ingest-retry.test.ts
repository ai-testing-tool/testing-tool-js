import { vi } from 'vitest';
import { qaDescribe, qaItAuto, expect } from '@qa/test';

import { IngestHttpError } from '../client/ingest-http';
import { withRetry } from '../client/ingest-retry';

qaDescribe('withRetry', () => {
  qaItAuto('retries retryable errors until success', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(
        new IngestHttpError('busy', { status: 503, retryable: true }),
      )
      .mockResolvedValueOnce('ok');

    const result = await withRetry(() => operation(), {
      policy: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 1 },
    });

    expect(result).toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  qaItAuto('does not retry non-retryable errors', async () => {
    const operation = vi
      .fn()
      .mockRejectedValue(new IngestHttpError('denied', { status: 401, retryable: false }));

    await expect(
      withRetry(() => operation(), {
        policy: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 1 },
      }),
    ).rejects.toThrow('denied');

    expect(operation).toHaveBeenCalledTimes(1);
  });
});

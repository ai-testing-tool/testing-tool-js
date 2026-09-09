import { afterEach, beforeEach, vi } from 'vitest';
import { qaDescribe, qaItAuto, expect } from '@qa/test';

import {
  IngestHttpError,
  isRetryableHttpStatus,
  postIngestJson,
  withIngestAction,
} from '../client/ingest-http';

qaDescribe('withIngestAction', () => {
  qaItAuto('appends action query param', () => {
    expect(withIngestAction('https://forge.example/ingest', 'chunk')).toBe(
      'https://forge.example/ingest?action=chunk',
    );
  });

  qaItAuto('preserves existing query string', () => {
    expect(withIngestAction('https://forge.example/ingest?x=1', 'session')).toBe(
      'https://forge.example/ingest?x=1&action=session',
    );
  });
});

qaDescribe('isRetryableHttpStatus', () => {
  qaItAuto('marks transient server errors retryable', () => {
    expect(isRetryableHttpStatus(503)).toBe(true);
    expect(isRetryableHttpStatus(429)).toBe(true);
    expect(isRetryableHttpStatus(401)).toBe(false);
  });
});

qaDescribe('postIngestJson', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  qaItAuto('returns parsed JSON on success', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 201 }),
    );

    const result = await postIngestJson({
      url: 'https://forge.example/ingest',
      token: 'secret',
      body: { projectKey: 'AUTH' },
      timeoutMs: 5000,
    });

    expect(result).toEqual({ status: 201, body: { ok: true } });
    expect(fetch).toHaveBeenCalledWith(
      'https://forge.example/ingest',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer secret',
        }),
      }),
    );
  });

  qaItAuto('throws retryable IngestHttpError on 503', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('busy', { status: 503 }));

    await expect(
      postIngestJson({
        url: 'https://forge.example/ingest',
        token: 'secret',
        body: {},
        timeoutMs: 5000,
      }),
    ).rejects.toMatchObject({
      name: 'IngestHttpError',
      status: 503,
      retryable: true,
    } satisfies Partial<IngestHttpError>);
  });

  qaItAuto('throws non-retryable IngestHttpError on 401', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('denied', { status: 401 }));

    await expect(
      postIngestJson({
        url: 'https://forge.example/ingest',
        token: 'secret',
        body: {},
        timeoutMs: 5000,
      }),
    ).rejects.toMatchObject({
      status: 401,
      retryable: false,
    });
  });
});

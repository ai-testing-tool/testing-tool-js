import { afterEach, beforeEach, vi } from 'vitest';
import { qaDescribe, qaItAuto, expect } from '@qa/test';

import { planChunks } from '../client/ingest-chunk-plan';
import { IngestClient } from '../client/ingest-client';
import type { IngestPayload } from '../models';

function buildLargePayload(): IngestPayload {
  const mediumMessage = 'x'.repeat(500);
  return {
    projectKey: 'AUTH',
    launchName: 'large-run',
    buildUrl: 'https://ci.example/run/99',
    report: {
      numTotalTests: 2,
      testResults: [
        { name: 'a.test.ts', assertionResults: [{ title: 'a', failureMessages: [mediumMessage] }] },
        { name: 'b.test.ts', assertionResults: [{ title: 'b', failureMessages: [mediumMessage] }] },
      ],
    },
  };
}

const smallPayload: IngestPayload = {
  projectKey: 'AUTH',
  report: {
    numTotalTests: 1,
    testResults: [{ name: 'suite.test.ts', assertionResults: [] }],
  },
};

qaDescribe('IngestClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  qaItAuto('chunks payloads above maxPayloadBytes even when below chunk threshold', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 201 })),
    );

    const client = new IngestClient({
      url: 'https://forge.example/ingest',
      token: 'secret',
      maxPayloadBytes: 10,
      chunkThresholdBytes: 10_000_000,
      chunkMaxBytes: 5000,
      retryBaseDelayMs: 1,
    });

    await client.send(smallPayload);

    const urls = vi.mocked(fetch).mock.calls.map(([request]) =>
      typeof request === 'string' ? request : request.url,
    );
    expect(urls.some((url) => url.includes('action=session'))).toBe(true);
  });

  qaItAuto('retries direct ingest on transient HTTP errors', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response('busy', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 201 }));

    const client = new IngestClient({
      url: 'https://forge.example/ingest',
      token: 'secret',
      maxRetries: 2,
      retryBaseDelayMs: 1,
      chunkThresholdBytes: 10_000_000,
    });

    const response = await client.send(smallPayload);
    expect(response.status).toBe(201);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  qaItAuto('uploads large payloads via session/chunk/complete', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 201 })),
    );

    const progress: Array<{ phase: string; percent: number }> = [];
    const client = new IngestClient({
      url: 'https://forge.example/ingest',
      token: 'secret',
      chunkThresholdBytes: 1000,
      chunkMaxBytes: 800,
      retryBaseDelayMs: 1,
      onProgress: (event) => {
        progress.push({ phase: event.phase, percent: event.percent });
      },
    });

    const payload = buildLargePayload();
    const plan = planChunks(payload, { maxChunkBytes: 800, sessionId: 'sess-large' });
    const response = await client.send(payload);

    expect(response.status).toBe(201);
    expect(fetch).toHaveBeenCalledTimes(1 + plan.chunks.length + 1);

    const urls = vi.mocked(fetch).mock.calls.map(([request]) =>
      typeof request === 'string' ? request : request.url,
    );
    expect(urls.some((url) => url.includes('action=session'))).toBe(true);
    expect(urls.some((url) => url.includes('action=chunk'))).toBe(true);
    expect(urls.some((url) => url.includes('action=complete'))).toBe(true);

    expect(progress[0]?.phase).toBe('starting');
    expect(progress[0]?.percent).toBe(0);
    expect(progress.some((event) => event.phase === 'chunk')).toBe(true);
    expect(progress[progress.length - 1]).toEqual({ phase: 'done', percent: 100 });
    const percents = progress.map((event) => event.percent);
    for (let i = 1; i < percents.length; i += 1) {
      expect(percents[i]!).toBeGreaterThanOrEqual(percents[i - 1]!);
    }
  });

  qaItAuto('reports progress for direct ingest', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 201 }),
    );

    const progress: Array<{ phase: string; percent: number }> = [];
    const client = new IngestClient({
      url: 'https://forge.example/ingest',
      token: 'secret',
      chunkThresholdBytes: 10_000_000,
      onProgress: (event) => {
        progress.push({ phase: event.phase, percent: event.percent });
      },
    });

    await client.send(smallPayload);
    expect(progress).toEqual([
      { phase: 'starting', percent: 0 },
      { phase: 'done', percent: 100 },
    ]);
  });
});

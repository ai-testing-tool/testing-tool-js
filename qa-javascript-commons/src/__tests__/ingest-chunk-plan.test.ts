import { qaDescribe, qaItAuto, expect } from '@qa/test';

import type { IngestPayload } from '../models';
import {
  createIngestSessionId,
  planChunks,
} from '../client/ingest-chunk-plan';

function buildPayload(testResults: IngestPayload['report']['testResults']): IngestPayload {
  return {
    projectKey: 'AUTH',
    launchName: 'ci #1',
    buildUrl: 'https://ci.example/run/1',
    format: 'jest-json',
    report: {
      numTotalTests: testResults.length,
      testResults,
    },
  };
}

qaDescribe('createIngestSessionId', () => {
  qaItAuto('is stable for the same launch fingerprint', () => {
    const payload = buildPayload([]);
    const first = createIngestSessionId(payload);
    const second = createIngestSessionId(payload);
    expect(first).toBe(second);
    expect(first).toHaveLength(32);
  });
});

qaDescribe('planChunks', () => {
  qaItAuto('creates one empty chunk for empty testResults', () => {
    const plan = planChunks(buildPayload([]), { maxChunkBytes: 1000, sessionId: 'sess-1' });
    expect(plan.sessionBody.expectedChunks).toBe(1);
    expect(plan.chunks).toHaveLength(1);
    expect(plan.chunks[0]?.testResults).toEqual([]);
    expect(plan.sessionBody.reportMeta).toEqual({ numTotalTests: 0 });
  });

  qaItAuto('splits testResults when chunk bodies exceed maxChunkBytes', () => {
    const mediumMessage = 'x'.repeat(500);
    const plan = planChunks(
      buildPayload([
        { name: 'a.test.ts', assertionResults: [{ title: 'a', failureMessages: [mediumMessage] }] },
        { name: 'b.test.ts', assertionResults: [{ title: 'b', failureMessages: [mediumMessage] }] },
      ]),
      { maxChunkBytes: 800, sessionId: 'sess-2' },
    );

    expect(plan.chunks.length).toBeGreaterThan(1);
    expect(plan.sessionBody.expectedChunks).toBe(plan.chunks.length);
    expect(plan.completeBody.sessionId).toBe('sess-2');
  });

  qaItAuto('throws when a single test file exceeds maxChunkBytes', () => {
    const huge = 'x'.repeat(5000);
    expect(() =>
      planChunks(
        buildPayload([
          { name: 'huge.test.ts', assertionResults: [{ title: 'huge', failureMessages: [huge] }] },
        ]),
        { maxChunkBytes: 1000, sessionId: 'sess-3' },
      ),
    ).toThrow(/Single test file result exceeds max chunk size/);
  });

  qaItAuto('throws when chunk count exceeds server max', () => {
    const message = 'x'.repeat(500);
    const testResults = Array.from({ length: 3 }, (_, index) => ({
      name: `${index}.test.ts`,
      assertionResults: [{ title: `case-${index}`, failureMessages: [message] }],
    }));

    expect(() =>
      planChunks(buildPayload(testResults), {
        maxChunkBytes: 800,
        maxChunks: 2,
        sessionId: 'sess-4',
      }),
    ).toThrow(/maximum allowed is 2/);
  });
});

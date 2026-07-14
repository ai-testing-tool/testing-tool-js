import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { EventStorage } from '../modules/event-storage.js';

describe('EventStorage attachments (FR58)', () => {
  it('captures envelope.attachment and returns them on convertFinished', () => {
    const storage = new EventStorage();

    storage.ingest({
      gherkinDocument: {
        uri: 'features/a.feature',
        feature: {
          name: 'Feature A',
          children: [{ scenario: { id: 'sc1', name: 'S', steps: [] } }],
        },
      },
    } as never);

    storage.ingest({
      pickle: {
        id: 'p1',
        uri: 'features/a.feature',
        name: 'AUTH-101 scenario',
        language: 'en',
        steps: [{ id: 'ps1', text: 'pass', astNodeIds: [] }],
        tags: [{ name: '@AUTH-101', astNodeId: 't1' }],
        astNodeIds: ['sc1'],
      },
    } as never);

    storage.ingest({
      testCase: {
        id: 'tc1',
        pickleId: 'p1',
        testSteps: [{ id: 'ts1', pickleStepId: 'ps1' }],
      },
    } as never);

    storage.ingest({
      testCaseStarted: {
        id: 'started-1',
        testCaseId: 'tc1',
        timestamp: { seconds: 1, nanos: 0 },
      },
    } as never);

    storage.ingest({
      testStepFinished: {
        testStepId: 'ts1',
        testCaseStartedId: 'started-1',
        testStepResult: {
          status: 'PASSED',
          duration: { seconds: 0, nanos: 1e6 },
        },
        timestamp: { seconds: 1, nanos: 1e6 },
      },
    } as never);

    storage.ingest({
      attachment: {
        body: Buffer.from('hello').toString('base64'),
        contentEncoding: 'BASE64',
        mediaType: 'text/plain',
        fileName: 'note.txt',
        testCaseStartedId: 'started-1',
      },
    } as never);

    const converted = storage.convertFinished({
      testCaseStartedId: 'started-1',
      timestamp: { seconds: 2, nanos: 0 },
    } as never);

    assert.ok(converted);
    assert.equal(converted!.attachments.length, 1);
    assert.equal(converted!.attachments[0]!.fileName, 'note.txt');
    assert.equal(converted!.attachments[0]!.mediaType, 'text/plain');
    assert.equal(converted!.attachments[0]!.contentEncoding, 'BASE64');
  });
});

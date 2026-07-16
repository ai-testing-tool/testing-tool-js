import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  ModeEnum,
  QAnalyzerReporter,
  buildIngestPayload,
  type IngestPayload,
} from '@qanalyzer/forge-commons';

import type { ConvertedScenario } from '../modules/event-storage.js';
import {
  scenarioToAssertion,
  scenarioToAssertionAsync,
  toJestJsonReport,
} from '../report-builder.js';

function fixtureScenario(
  overrides: Partial<ConvertedScenario> = {},
): ConvertedScenario {
  return {
    featureName: 'User CRUD Operations',
    uri: 'features/api-crud.feature',
    title: 'Get all users',
    pickle: {
      id: 'p1',
      uri: 'features/api-crud.feature',
      name: 'Get all users',
      language: 'en',
      steps: [
        { id: 's1', text: 'I send a GET request to "/users"', astNodeIds: [] },
        { id: 's2', text: 'the response status should be 200', astNodeIds: [] },
      ],
      tags: [
        { name: '@AUTH-101', astNodeId: 't1' },
        { name: '@QaSuite=API\tUsers\tRead', astNodeId: 't2' },
        { name: '@QaFields={"layer":"api"}', astNodeId: 't3' },
      ] as never,
      astNodeIds: [],
    },
    status: 'passed',
    durationMs: 120,
    failureMessages: [],
    steps: [
      {
        pickleStepId: 's1',
        text: 'I send a GET request to "/users"',
        status: 'PASSED',
        durationMs: 40,
      },
      {
        pickleStepId: 's2',
        text: 'the response status should be 200',
        status: 'PASSED',
        durationMs: 5,
      },
    ],
    attachments: [],
    ...overrides,
  };
}

describe('scenarioToAssertion', () => {
  it('maps scenario to assertion with Gherkin steps in meta.qa (FR49)', () => {
    const assertion = scenarioToAssertion(fixtureScenario());
    assert.ok(assertion);
    assert.equal(assertion!.title, 'Get all users');
    assert.deepEqual(assertion!.ancestorTitles, ['API', 'Users', 'Read']);
    const qa = assertion!.meta?.qa as
      | {
          framework?: string;
          steps?: Array<{ name: string }>;
          issueKeys?: string[];
        }
      | undefined;
    assert.equal(qa?.framework, 'cucumberjs');
    assert.deepEqual(qa?.issueKeys, ['AUTH-101']);
    assert.equal(qa?.steps?.length, 2);
    assert.equal(qa?.steps?.[0]?.name, 'I send a GET request to "/users"');
  });

  it('returns null for @QaIgnore', () => {
    const assertion = scenarioToAssertion(
      fixtureScenario({
        pickle: {
          ...fixtureScenario().pickle,
          tags: [{ name: '@QaIgnore', astNodeId: 'ign' }] as never,
        },
      }),
    );
    assert.equal(assertion, null);
  });

  it('includes this.attach metadata in meta.qa.attachments (FR58)', async () => {
    const assertion = await scenarioToAssertionAsync(
      fixtureScenario({
        attachments: [
          {
            body: Buffer.from('{"ok":true}').toString('base64'),
            contentEncoding: 'BASE64',
            mediaType: 'application/json',
            fileName: 'body.json',
            testCaseStartedId: 'started-1',
          },
        ],
      }),
    );
    assert.ok(assertion);
    const qa = assertion!.meta?.qa as
      | {
          attachments?: Array<{
            file_name?: string;
            mime_type?: string;
            size?: number;
            content_ref?: string;
          }>;
        }
      | undefined;
    assert.equal(qa?.attachments?.length, 1);
    assert.equal(qa?.attachments?.[0]?.file_name, 'body.json');
    assert.equal(qa?.attachments?.[0]?.mime_type, 'application/json');
    assert.ok(typeof qa?.attachments?.[0]?.size === 'number');
    // No attach URL/token in unit test → metadata only (no content_ref)
    assert.equal(qa?.attachments?.[0]?.content_ref, undefined);
  });
});

describe('FR41 jest-json (FR50)', () => {
  it('buildIngestPayload uses format jest-json', () => {
    const assertion = scenarioToAssertion(fixtureScenario());
    assert.ok(assertion);
    const report = toJestJsonReport([
      {
        name: 'features/api-crud.feature',
        assertions: [assertion!],
      },
    ]);
    const payload = buildIngestPayload({
      projectKey: 'AUTH',
      report,
      format: 'jest-json',
      launchName: 'cucumber #1',
    });
    assert.equal(payload.format, 'jest-json');
    assert.equal(payload.report.numTotalTests, 1);
  });

  it('mode=file writes FR41 payload', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-cucumberjs-'));
    const out = join(dir, 'qanalyzer-results.json');
    try {
      QAnalyzerReporter.resetInstance();
      const reporter = QAnalyzerReporter.getInstance({
        mode: ModeEnum.file,
        projectKey: 'AUTH',
        file: { path: out },
      });
      const assertion = scenarioToAssertion(fixtureScenario());
      assert.ok(assertion);
      await reporter.publishReport(
        toJestJsonReport([
          { name: 'features/api-crud.feature', assertions: [assertion!] },
        ]),
        { format: 'jest-json' },
      );
      const written = JSON.parse(readFileSync(out, 'utf8')) as IngestPayload;
      assert.equal(written.format, 'jest-json');
      assert.equal(written.projectKey, 'AUTH');
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { qaDescribe, qaItAuto, expect } from '@qa/test';

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

qaDescribe('scenarioToAssertion', () => {
  qaItAuto('maps scenario to assertion with Gherkin steps in meta.qa (FR49)', () => {
    const assertion = scenarioToAssertion(fixtureScenario());
    expect(assertion).toBeTruthy();
    expect(assertion!.title).toBe('Get all users');
    expect(assertion!.ancestorTitles).toEqual(['API', 'Users', 'Read']);
    const qa = assertion!.meta?.qa as
      | {
          framework?: string;
          steps?: Array<{ name: string }>;
          issueKeys?: string[];
        }
      | undefined;
    expect(qa?.framework).toBe('cucumberjs');
    expect(qa?.issueKeys).toEqual(['AUTH-101']);
    expect(qa?.steps?.length).toBe(2);
    expect(qa?.steps?.[0]?.name).toBe('I send a GET request to "/users"');
  });

  qaItAuto('returns null for @QaIgnore', () => {
    const assertion = scenarioToAssertion(
      fixtureScenario({
        pickle: {
          ...fixtureScenario().pickle,
          tags: [{ name: '@QaIgnore', astNodeId: 'ign' }] as never,
        },
      }),
    );
    expect(assertion).toBe(null);
  });

  qaItAuto('includes this.attach metadata in meta.qa.attachments (FR58)', async () => {
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
    expect(assertion).toBeTruthy();
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
    expect(qa?.attachments?.length).toBe(1);
    expect(qa?.attachments?.[0]?.file_name).toBe('body.json');
    expect(qa?.attachments?.[0]?.mime_type).toBe('application/json');
    expect(typeof qa?.attachments?.[0]?.size === 'number').toBeTruthy();
    // No attach URL/token in unit test → metadata only (no content_ref)
    expect(qa?.attachments?.[0]?.content_ref).toBeUndefined();
  });
});

qaDescribe('FR41 jest-json (FR50)', () => {
  qaItAuto('buildIngestPayload uses format jest-json', () => {
    const assertion = scenarioToAssertion(fixtureScenario());
    expect(assertion).toBeTruthy();
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
    expect(payload.format).toBe('jest-json');
    expect(payload.report.numTotalTests).toBe(1);
  });

  qaItAuto('mode=file writes FR41 payload', async () => {
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
      expect(assertion).toBeTruthy();
      await reporter.publishReport(
        toJestJsonReport([
          { name: 'features/api-crud.feature', assertions: [assertion!] },
        ]),
        { format: 'jest-json' },
      );
      const written = JSON.parse(readFileSync(out, 'utf8')) as IngestPayload;
      expect(written.format).toBe('jest-json');
      expect(written.projectKey).toBe('AUTH');
    } finally {
      QAnalyzerReporter.resetInstance();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

import { join } from 'node:path';
import { qaDescribe, qaItAuto, expect } from '@qa/test';

import { normalizeReportFilePath } from '../utils/report-file-path';
import { buildIngestPayload, normalizeJestReport } from '../models/ingest-payload';

qaDescribe('normalizeReportFilePath', () => {
  qaItAuto('rewrites absolute paths under cwd to project-relative', () => {
    const cwd = '/Users/vuvo/Workspace/bmad-crm/qanalyzer/qanalyzer-app';
    const abs = join(
      cwd,
      'src/services/__tests__/ci-template-service.test.ts',
    );
    expect(normalizeReportFilePath(abs, cwd)).toBe(
      'src/services/__tests__/ci-template-service.test.ts',
    );
  });

  qaItAuto('keeps already-relative paths', () => {
    expect(
      normalizeReportFilePath('src/services/__tests__/ci-template-service.test.ts'),
    ).toBe('src/services/__tests__/ci-template-service.test.ts');
  });

  qaItAuto('keeps absolute paths outside cwd', () => {
    expect(
      normalizeReportFilePath('/tests/a.test.js', '/Users/vuvo/project'),
    ).toBe('/tests/a.test.js');
  });
});

qaDescribe('normalizeJestReport file paths', () => {
  qaItAuto('normalizes testResults[].name via buildIngestPayload', () => {
    const cwd = process.cwd();
    const abs = join(cwd, 'src/services/__tests__/ci-template-service.test.ts');
    const payload = buildIngestPayload({
      projectKey: 'AUTH',
      report: {
        numTotalTests: 0,
        testResults: [{ name: abs, assertionResults: [] }],
      },
    });
    expect(payload.report.testResults[0]?.name).toBe(
      'src/services/__tests__/ci-template-service.test.ts',
    );
  });

  qaItAuto('normalizeJestReport leaves relative names unchanged', () => {
    const report = normalizeJestReport({
      testResults: [{ name: 'suite.test.ts', assertionResults: [] }],
    });
    expect(report.testResults?.[0]?.name).toBe('suite.test.ts');
  });
});

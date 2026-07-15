import type { CiTemplateContext } from '../types';

/**
 * Shared upload invocation — matches ci-upload-helper.md.
 * Callers supply platform-quoted project/launch expressions.
 */
export function uploadCliCommand(ctx: CiTemplateContext): string {
  const reportFile = ctx.reportFile ?? 'qanalyzer-results.json';
  const project = ctx.projectKeyExpr ?? ctx.projectKey;
  const launch = ctx.launchNameExpr ?? 'qanalyzer';

  return [
    'npx qa-forge-api-client \\',
    `  --project "${project}" \\`,
    `  --launch "${launch}" \\`,
    `  --report ${reportFile}`,
  ].join('\n');
}

/** Indent every line of the shared upload CLI (for YAML `|` / Groovy blocks). */
export function indentUploadCli(ctx: CiTemplateContext, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return uploadCliCommand(ctx)
    .split('\n')
    .map((line) => `${pad}${line}`)
    .join('\n');
}

export function frameworkTestCommand(ctx: CiTemplateContext): string {
  const reportFile = ctx.reportFile ?? 'qanalyzer-results.json';
  if (ctx.framework === 'vitest') {
    return `npx vitest run --reporter=json --outputFile=${reportFile}`;
  }
  if (ctx.framework === 'jest') {
    return `npx jest --json --outputFile=${reportFile}`;
  }
  if (ctx.framework === 'playwright') {
    // Native Playwright JSON reporter → stdout (FR109 Path A)
    return `npx playwright test --reporter=json > ${reportFile}`;
  }
  throw new Error(
    'Upload JSON path is not supported for Mocha, CucumberJS, Cypress, or WebdriverIO — use ingestPath: reporter (qa-forge-mocha / qa-forge-cucumberjs / qa-forge-cypress / qa-forge-wdio)',
  );
}

export function frameworkLabel(ctx: CiTemplateContext): string {
  if (ctx.framework === 'vitest') return 'Vitest';
  if (ctx.framework === 'mocha') return 'Mocha';
  if (ctx.framework === 'cucumberjs') return 'CucumberJS';
  if (ctx.framework === 'cypress') return 'Cypress';
  if (ctx.framework === 'playwright') return 'Playwright';
  if (ctx.framework === 'wdio') return 'WebdriverIO';
  return 'Jest';
}

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
  return `npx jest --json --outputFile=${reportFile}`;
}

export function frameworkLabel(ctx: CiTemplateContext): string {
  return ctx.framework === 'vitest' ? 'Vitest' : 'Jest';
}

export function vitestJsonRun(reportFile: string): string {
  return `npx vitest run --reporter=json --outputFile=${reportFile}`;
}

export function vitestReporterEnv(): string {
  return 'AI_TESTING_TOOL_MODE: ingest';
}

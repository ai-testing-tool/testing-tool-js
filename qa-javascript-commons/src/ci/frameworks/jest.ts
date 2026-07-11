export function jestJsonRun(reportFile: string): string {
  return `npx jest --json --outputFile=${reportFile}`;
}

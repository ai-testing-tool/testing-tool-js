/**
 * Unit tests must not inherit local QAnalyzer ingest credentials — screenshot
 * helpers return metadata-only when URL/token are absent.
 */
for (const key of [
  'QANALYZER_INGEST_URL',
  'QANALYZER_INGEST_TOKEN',
  'QANALYZER_ATTACH_URL',
  'QANALYZER_PROJECT_KEY',
  'QANALYZER_MODE',
  'QANALYZER_FILE_PATH',
  'QANALYZER_LAUNCH_NAME',
]) {
  delete process.env[key];
}

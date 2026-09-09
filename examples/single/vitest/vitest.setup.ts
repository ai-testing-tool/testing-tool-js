/**
 * Unit tests must not inherit local AiTestingTool ingest credentials — screenshot
 * helpers return metadata-only when URL/token are absent.
 */
for (const key of [
  'AI_TESTING_TOOL_INGEST_URL',
  'AI_TESTING_TOOL_INGEST_TOKEN',
  'AI_TESTING_TOOL_ATTACH_URL',
  'AI_TESTING_TOOL_PROJECT_KEY',
  'AI_TESTING_TOOL_MODE',
  'AI_TESTING_TOOL_FILE_PATH',
  'AI_TESTING_TOOL_LAUNCH_NAME',
]) {
  delete process.env[key];
}

export enum EnvEnum {
  mode = 'QANALYZER_MODE',
  fallback = 'QANALYZER_FALLBACK',
  debug = 'QANALYZER_DEBUG',
  projectKey = 'QANALYZER_PROJECT_KEY',
  launchName = 'QANALYZER_LAUNCH_NAME',
  planId = 'QANALYZER_PLAN_ID',
  planKey = 'QANALYZER_PLAN_KEY',
  planName = 'QANALYZER_PLAN_NAME',
  fixVersion = 'QANALYZER_FIX_VERSION',
  sprintName = 'QANALYZER_SPRINT',
}

export enum EnvIngestEnum {
  url = 'QANALYZER_INGEST_URL',
  token = 'QANALYZER_INGEST_TOKEN',
  forgeUrl = 'QANALYZER_FORGE_INGEST_URL',
  forgeToken = 'QANALYZER_FORGE_INGEST_TOKEN',
  timeoutMs = 'QANALYZER_INGEST_TIMEOUT_MS',
  maxPayloadBytes = 'QANALYZER_INGEST_MAX_PAYLOAD_BYTES',
}

export enum EnvFileEnum {
  path = 'QANALYZER_FILE_PATH',
}

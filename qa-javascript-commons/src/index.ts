export { QAnalyzerReporter, type PublishReportOptions } from './qanalyzer';
export { ConfigLoader, loadConfig, type ConfigType } from './config';
export { envToConfig, detectCiEnvironment, EnvEnum, EnvIngestEnum, EnvFileEnum } from './env';
export type { CiMetadata } from './env';
export { composeOptions, ModeEnum, type OptionsType } from './options';
export {
  buildIngestPayload,
  estimatePayloadBytes,
  normalizeJestReport,
  TestResultType,
  TestStepType,
  TestExecution,
  TestStatusEnum,
  StepType,
  StepExecution,
  StepStatusEnum,
  type IngestPayload,
  type JestVitestJsonReport,
  type JestAssertionResult,
  type JestTestFileResult,
  type Report,
  type Stats,
  type ShortResult,
  type HostData,
  type Attachment,
  type Relation,
  type Suite,
  type SuiteData,
} from './models';
export { IngestClient, type IngestResponse } from './client';
export { FsWriter } from './writer';
export { FallbackCoordinator, IngestReporter, FileReporter } from './reporters';
export { Logger, sanitizeOptionsForLog } from './utils';
export {
  generateCiTemplate,
  buildCiTemplateContext,
  listCiTemplateVariants,
  UnsupportedVariantError,
  vitestJsonRun,
  jestJsonRun,
  type CiTemplateContext,
  type CiTemplateResult,
  type CiTemplateVariant,
  type CiPlatform,
  type CiFramework,
  type CiIngestPath,
  type CiSecretHint,
  type CiVariableHint,
} from './ci';

export const PACKAGE_NAME = 'qa-javascript-commons';

/** @deprecated Use ConfigType */
export type QAnalyzerConfig = import('./config').ConfigType;

export { AiTestingToolReporter, type PublishReportOptions } from './ai-testing-tool';
export { ConfigLoader, loadConfig, type ConfigType } from './config';
export { envToConfig, detectCiEnvironment, EnvEnum, EnvIngestEnum, EnvFileEnum } from './env';
export type { CiMetadata } from './env';
export { composeOptions, ModeEnum, type OptionsType } from './options';
export {
  buildIngestPayload,
  estimatePayloadBytes,
  normalizeJestReport,
  applyQaAnnotation,
  applyQaAnnotations,
  createQaMetaAccumulator,
  qaMetaFromEntries,
  toQaMetaWire,
  TestResultType,
  TestStepType,
  TestExecution,
  TestStatusEnum,
  StepType,
  StepExecution,
  StepStatusEnum,
  type IngestPayload,
  type IngestFormat,
  type JestVitestJsonReport,
  type JestAssertionResult,
  type JestTestFileResult,
  type QaAnnotationLike,
  type QaMetaAccumulator,
  type QaMetaWire,
  type QaMetaStepWire,
  type QaMetaAttachmentWire,
  type QaMetaCi,
  type QaMetaGit,
  type QaMetaHost,
  type QaMetaFramework,
  resetHostEnvironmentCache,
  type Report,
  type Stats,
  type ShortResult,
  type HostData,
  type Attachment,
  type Relation,
  type Suite,
  type SuiteData,
} from './models';
export {
  IngestClient,
  AttachClient,
  DEFAULT_MAX_ATTACH_BYTES,
  type IngestResponse,
  type IngestUploadPhase,
  type IngestUploadProgress,
  type IngestUploadProgressHandler,
} from './client';
export { FsWriter } from './writer';
export { FallbackCoordinator, IngestReporter, FileReporter } from './reporters';
export {
  Logger,
  sanitizeOptionsForLog,
  extractIssueKeys,
  firstIssueKey,
  projectKeyFromIssueKey,
  uploadAttachmentForQa,
  EnvAttachEnum,
  normalizeReportFilePath,
} from './utils';
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

export const PACKAGE_NAME = '@ai-testing-tool/forge-commons';

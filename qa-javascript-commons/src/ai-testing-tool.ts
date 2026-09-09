import type { ConfigType } from './config';
import { detectCiEnvironment } from './env';
import {
  buildIngestPayload,
  type IngestPayload,
  type JestVitestJsonReport,
} from './models';
import { ModeEnum, type OptionsType } from './options';
import { FallbackCoordinator } from './reporters';
import { DisabledException, Logger, sanitizeOptionsForLog } from './utils';
import { OptionsResolver } from './ai-testing-tool/options-resolver';
import { ReporterFactory } from './ai-testing-tool/reporter-factory';

export type PublishReportOptions = {
  projectKey?: string;
  launchName?: string;
  format?: IngestPayload['format'];
  planId?: string;
  planKey?: string;
  planName?: string;
  fixVersion?: string;
  sprintName?: string;
};

/**
 * Thin orchestrator over OptionsResolver, ReporterFactory, and FallbackCoordinator.
 * Framework adapters call `publishReport` with runner JSON at end of test run.
 */
export class AiTestingToolReporter {
  private static instance: AiTestingToolReporter | null = null;

  private readonly options: ConfigType & OptionsType;
  private readonly logger: Logger;
  private readonly fallback: FallbackCoordinator;

  private constructor(options: OptionsType = {}) {
    const resolved = new OptionsResolver().resolve(options);
    this.options = resolved.composed;
    this.logger = new Logger(Boolean(this.options.debug));
    this.logger.logDebug(`Config: ${JSON.stringify(sanitizeOptionsForLog(resolved.composed))}`);

    const factory = new ReporterFactory(this.logger);
    const { upstream, fallback, disabled } = this.buildReporters(
      factory,
      resolved.effectiveMode,
      resolved.effectiveFallback,
    );

    this.fallback = new FallbackCoordinator(this.logger, upstream, fallback);
    if (disabled) {
      this.fallback.setDisabled(true);
    }
  }

  static getInstance(options: OptionsType = {}): AiTestingToolReporter {
    if (!AiTestingToolReporter.instance) {
      AiTestingToolReporter.instance = new AiTestingToolReporter(options);
    }
    return AiTestingToolReporter.instance;
  }

  static resetInstance(): void {
    AiTestingToolReporter.instance = null;
  }

  getConfig(): ConfigType & OptionsType {
    return this.options;
  }

  async publishReport(
    report: JestVitestJsonReport,
    overrides: PublishReportOptions = {},
  ): Promise<IngestPayload | undefined> {
    const projectKey = overrides.projectKey ?? this.options.projectKey;
    if (!projectKey) {
      throw new Error('projectKey is required to publish a report');
    }

    const payload = buildIngestPayload({
      projectKey,
      report,
      launchName: overrides.launchName ?? this.options.launchName,
      format: overrides.format,
      planId: overrides.planId ?? this.options.planId,
      planKey: overrides.planKey ?? this.options.planKey,
      planName: overrides.planName ?? this.options.planName,
      fixVersion: overrides.fixVersion ?? this.options.fixVersion,
      sprintName: overrides.sprintName ?? this.options.sprintName,
      ci: detectCiEnvironment(),
    });

    if (this.fallback.isDisabled()) {
      return undefined;
    }

    await this.fallback.run(
      (reporter) => reporter.publishPayload(payload),
      'publish report',
    );

    return payload;
  }

  private buildReporters(
    factory: ReporterFactory,
    mode: ModeEnum,
    fallbackMode: ModeEnum,
  ): {
    upstream?: ReturnType<ReporterFactory['create']>;
    fallback?: ReturnType<ReporterFactory['create']>;
    disabled: boolean;
  } {
    let upstream: ReturnType<ReporterFactory['create']> | undefined;
    let fallback: ReturnType<ReporterFactory['create']> | undefined;
    let disabled = false;

    try {
      upstream = factory.create(mode, this.options);
    } catch (error) {
      if (error instanceof DisabledException) {
        disabled = true;
      } else {
        this.logger.logError('Unable to create upstream reporter', error);
      }
    }

    if (fallbackMode !== ModeEnum.off && fallbackMode !== mode) {
      try {
        fallback = factory.create(fallbackMode, this.options);
      } catch (error) {
        this.logger.logError('Unable to create fallback reporter', error);
      }
    }

    if (!upstream && !fallback) {
      disabled = true;
    }

    return { upstream, fallback, disabled };
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiTestingToolReporter = void 0;
const env_1 = require("./env");
const models_1 = require("./models");
const options_1 = require("./options");
const reporters_1 = require("./reporters");
const utils_1 = require("./utils");
const options_resolver_1 = require("./ai-testing-tool/options-resolver");
const reporter_factory_1 = require("./ai-testing-tool/reporter-factory");
/**
 * Thin orchestrator over OptionsResolver, ReporterFactory, and FallbackCoordinator.
 * Framework adapters call `publishReport` with runner JSON at end of test run.
 */
class AiTestingToolReporter {
    static instance = null;
    options;
    logger;
    fallback;
    constructor(options = {}) {
        const resolved = new options_resolver_1.OptionsResolver().resolve(options);
        this.options = resolved.composed;
        this.logger = new utils_1.Logger(Boolean(this.options.debug));
        this.logger.logDebug(`Config: ${JSON.stringify((0, utils_1.sanitizeOptionsForLog)(resolved.composed))}`);
        const factory = new reporter_factory_1.ReporterFactory(this.logger);
        const { upstream, fallback, disabled } = this.buildReporters(factory, resolved.effectiveMode, resolved.effectiveFallback);
        this.fallback = new reporters_1.FallbackCoordinator(this.logger, upstream, fallback);
        if (disabled) {
            this.fallback.setDisabled(true);
        }
    }
    static getInstance(options = {}) {
        if (!AiTestingToolReporter.instance) {
            AiTestingToolReporter.instance = new AiTestingToolReporter(options);
        }
        return AiTestingToolReporter.instance;
    }
    static resetInstance() {
        AiTestingToolReporter.instance = null;
    }
    getConfig() {
        return this.options;
    }
    async publishReport(report, overrides = {}) {
        const projectKey = overrides.projectKey ?? this.options.projectKey;
        if (!projectKey) {
            throw new Error('projectKey is required to publish a report');
        }
        const payload = (0, models_1.buildIngestPayload)({
            projectKey,
            report,
            launchName: overrides.launchName ?? this.options.launchName,
            format: overrides.format,
            planId: overrides.planId ?? this.options.planId,
            planKey: overrides.planKey ?? this.options.planKey,
            planName: overrides.planName ?? this.options.planName,
            fixVersion: overrides.fixVersion ?? this.options.fixVersion,
            sprintName: overrides.sprintName ?? this.options.sprintName,
            ci: (0, env_1.detectCiEnvironment)(),
        });
        if (this.fallback.isDisabled()) {
            return undefined;
        }
        await this.fallback.run((reporter) => reporter.publishPayload(payload), 'publish report');
        return payload;
    }
    buildReporters(factory, mode, fallbackMode) {
        let upstream;
        let fallback;
        let disabled = false;
        try {
            upstream = factory.create(mode, this.options);
        }
        catch (error) {
            if (error instanceof utils_1.DisabledException) {
                disabled = true;
            }
            else {
                this.logger.logError('Unable to create upstream reporter', error);
            }
        }
        if (fallbackMode !== options_1.ModeEnum.off && fallbackMode !== mode) {
            try {
                fallback = factory.create(fallbackMode, this.options);
            }
            catch (error) {
                this.logger.logError('Unable to create fallback reporter', error);
            }
        }
        if (!upstream && !fallback) {
            disabled = true;
        }
        return { upstream, fallback, disabled };
    }
}
exports.AiTestingToolReporter = AiTestingToolReporter;

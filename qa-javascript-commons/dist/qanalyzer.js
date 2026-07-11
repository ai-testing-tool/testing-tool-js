"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QAnalyzerReporter = void 0;
const env_1 = require("./env");
const models_1 = require("./models");
const options_1 = require("./options");
const reporters_1 = require("./reporters");
const utils_1 = require("./utils");
const options_resolver_1 = require("./qanalyzer/options-resolver");
const reporter_factory_1 = require("./qanalyzer/reporter-factory");
/**
 * Thin orchestrator over OptionsResolver, ReporterFactory, and FallbackCoordinator.
 * Framework adapters call `publishReport` with runner JSON at end of test run.
 */
class QAnalyzerReporter {
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
        if (!QAnalyzerReporter.instance) {
            QAnalyzerReporter.instance = new QAnalyzerReporter(options);
        }
        return QAnalyzerReporter.instance;
    }
    static resetInstance() {
        QAnalyzerReporter.instance = null;
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
exports.QAnalyzerReporter = QAnalyzerReporter;

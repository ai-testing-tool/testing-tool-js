"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReporterFactory = void 0;
const client_1 = require("../client");
const env_1 = require("../env");
const options_1 = require("../options");
const reporters_1 = require("../reporters");
const utils_1 = require("../utils");
const writer_1 = require("../writer");
class ReporterFactory {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    create(mode, options) {
        switch (mode) {
            case options_1.ModeEnum.ingest:
                return this.createIngest(options);
            case options_1.ModeEnum.file:
                return this.createFile(options);
            case options_1.ModeEnum.off:
                throw new utils_1.DisabledException('QAnalyzer reporter is disabled (mode=off)');
            default:
                throw new Error(`Unknown mode: ${String(mode)}`);
        }
    }
    createIngest(options) {
        if (!options.ingest?.token) {
            throw new Error(`Either "ingest.token" or "${env_1.EnvIngestEnum.token}" is required in ingest mode`);
        }
        if (!options.ingest?.url) {
            throw new Error(`Either "ingest.url" or "${env_1.EnvIngestEnum.url}" is required in ingest mode`);
        }
        if (!options.projectKey) {
            throw new Error('projectKey is required in ingest mode');
        }
        const client = new client_1.IngestClient({
            ...options.ingest,
            logger: this.logger,
        });
        return new reporters_1.IngestReporter(this.logger, client);
    }
    createFile(options) {
        if (!options.projectKey) {
            throw new Error('projectKey is required in file mode');
        }
        const writer = new writer_1.FsWriter(options.file);
        return new reporters_1.FileReporter(this.logger, writer);
    }
}
exports.ReporterFactory = ReporterFactory;

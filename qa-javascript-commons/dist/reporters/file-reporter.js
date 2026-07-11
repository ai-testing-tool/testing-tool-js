"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileReporter = void 0;
class FileReporter {
    writer;
    logger;
    constructor(logger, writer) {
        this.logger = logger;
        this.writer = writer;
    }
    async publishPayload(payload) {
        const path = this.writer.writePayload(payload);
        this.logger.log(`Wrote ingest payload to ${path}`);
    }
}
exports.FileReporter = FileReporter;

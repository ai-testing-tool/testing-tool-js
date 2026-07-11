"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestReporter = void 0;
class IngestReporter {
    client;
    constructor(logger, client) {
        this.client = client;
        void logger;
    }
    async publishPayload(payload) {
        await this.client.send(payload);
    }
}
exports.IngestReporter = IngestReporter;

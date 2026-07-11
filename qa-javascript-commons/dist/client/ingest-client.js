"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestClient = void 0;
const models_1 = require("../models");
class IngestClient {
    url;
    token;
    timeoutMs;
    maxPayloadBytes;
    logger;
    constructor(options = {}) {
        this.url = options.url;
        this.token = options.token;
        this.timeoutMs = options.timeoutMs ?? 30_000;
        this.maxPayloadBytes = options.maxPayloadBytes ?? 4_500_000;
        this.logger = options.logger;
    }
    async send(payload) {
        if (!this.url) {
            throw new Error('ingest.url (or QANALYZER_INGEST_URL) is required in ingest mode');
        }
        if (!this.token) {
            throw new Error('ingest.token (or QANALYZER_INGEST_TOKEN) is required in ingest mode');
        }
        const bytes = (0, models_1.estimatePayloadBytes)(payload);
        if (bytes > this.maxPayloadBytes) {
            throw new Error(`Ingest payload is ${bytes} bytes; max allowed is ${this.maxPayloadBytes} bytes`);
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await fetch(this.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.token}`,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            const text = await response.text();
            let body = text;
            try {
                body = text ? JSON.parse(text) : null;
            }
            catch {
                // keep raw text
            }
            if (!response.ok) {
                throw new Error(`Forge ingest failed with HTTP ${response.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
            }
            this.logger?.log(`Ingest accepted (HTTP ${response.status})`);
            return { status: response.status, body };
        }
        catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Forge ingest timed out after ${this.timeoutMs}ms`);
            }
            throw error;
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
exports.IngestClient = IngestClient;

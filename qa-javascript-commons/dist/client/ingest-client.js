"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestClient = void 0;
const models_1 = require("../models");
class IngestClient {
    url;
    token;
    forgeIngestUrl;
    forgeIngestToken;
    timeoutMs;
    maxPayloadBytes;
    logger;
    constructor(options = {}) {
        this.url = options.url;
        this.token = options.token;
        this.forgeIngestUrl = options.forgeIngestUrl;
        this.forgeIngestToken = options.forgeIngestToken ?? options.token;
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
        const body = { ...payload };
        if (this.forgeIngestUrl) {
            if (!this.forgeIngestToken) {
                throw new Error('ingest.forgeIngestToken (or QANALYZER_FORGE_INGEST_TOKEN / QANALYZER_INGEST_TOKEN) is required when forgeIngestUrl is set');
            }
            body.forgeIngestUrl = this.forgeIngestUrl;
            body.forgeIngestToken = this.forgeIngestToken;
        }
        const bytes = (0, models_1.estimatePayloadBytes)(body);
        const effectiveMax = this.forgeIngestUrl ? 50_000_000 : this.maxPayloadBytes;
        if (bytes > effectiveMax) {
            throw new Error(`Ingest payload is ${bytes} bytes; max allowed is ${effectiveMax} bytes`);
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
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            const text = await response.text();
            let responseBody = text;
            try {
                responseBody = text ? JSON.parse(text) : null;
            }
            catch {
                // keep raw text
            }
            if (!response.ok) {
                throw new Error(`Forge ingest failed with HTTP ${response.status}: ${typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)}`);
            }
            this.logger?.log(`Ingest accepted (HTTP ${response.status})`);
            return { status: response.status, body: responseBody };
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

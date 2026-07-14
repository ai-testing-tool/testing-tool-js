"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachClient = exports.DEFAULT_MAX_ATTACH_BYTES = void 0;
exports.withAttachAction = withAttachAction;
const env_enum_1 = require("../env/env-enum");
exports.DEFAULT_MAX_ATTACH_BYTES = 3_000_000;
function toBuffer(content) {
    if (typeof content === 'string') {
        return Buffer.from(content, 'utf8');
    }
    if (Buffer.isBuffer(content)) {
        return content;
    }
    return Buffer.from(content);
}
function readEnv(name) {
    const value = process.env[name];
    return value === '' ? undefined : value;
}
/** Append `action=attach` so the shared ingest webtrigger dispatches correctly. */
function withAttachAction(url) {
    if (/[?&]action=/i.test(url)) {
        return url;
    }
    return `${url}${url.includes('?') ? '&' : '?'}action=attach`;
}
/**
 * Client for Phase 3 Forge attach proxy → Jira Attachment API.
 * Uses the shared ingest webtrigger URL; sends JSON + base64 (not FR41).
 */
class AttachClient {
    url;
    token;
    timeoutMs;
    maxBytes;
    logger;
    constructor(options = {}) {
        this.url =
            options.url ??
                readEnv('QANALYZER_ATTACH_URL') ??
                readEnv(env_enum_1.EnvIngestEnum.url);
        this.token = options.token ?? readEnv(env_enum_1.EnvIngestEnum.token);
        this.timeoutMs = options.timeoutMs ?? 30_000;
        this.maxBytes = options.maxBytes ?? exports.DEFAULT_MAX_ATTACH_BYTES;
        this.logger = options.logger;
    }
    async upload(input) {
        if (!this.url) {
            throw new Error('attach.url (or QANALYZER_INGEST_URL) is required to upload attachments');
        }
        if (!this.token) {
            throw new Error('attach.token (or QANALYZER_INGEST_TOKEN) is required to upload attachments');
        }
        const content = toBuffer(input.content);
        if (content.length > this.maxBytes) {
            throw new Error(`Attachment is ${content.length} bytes; max allowed is ${this.maxBytes} bytes`);
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        const endpoint = withAttachAction(this.url);
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.token}`,
                    'X-QAnalyzer-Action': 'attach',
                },
                body: JSON.stringify({
                    projectKey: input.projectKey,
                    issueKey: input.issueKey,
                    fileName: input.fileName,
                    mimeType: input.mimeType,
                    contentBase64: content.toString('base64'),
                }),
                signal: controller.signal,
            });
            const text = await response.text();
            let body = text;
            try {
                body = text ? JSON.parse(text) : null;
            }
            catch {
                // keep raw
            }
            if (!response.ok) {
                const errMsg = typeof body === 'object' &&
                    body &&
                    'error' in body &&
                    typeof body.error === 'string'
                    ? body.error
                    : typeof body === 'string'
                        ? body
                        : JSON.stringify(body);
                throw new Error(`Forge attach failed with HTTP ${response.status}: ${errMsg}`);
            }
            const ok = body;
            // Static Forge webtrigger success body is fixed `{"ok":true}` — no attachment id.
            const id = ok?.id != null && String(ok.id) !== '' ? String(ok.id) : undefined;
            this.logger?.log(id
                ? `Attachment uploaded to ${ok.issueKey ?? input.issueKey} id=${id}`
                : `Attachment uploaded to ${input.issueKey} (static ok)`);
            return {
                issueKey: ok?.issueKey ?? input.issueKey,
                id,
                filename: ok?.filename ?? input.fileName,
                mimeType: ok?.mimeType ?? input.mimeType,
                size: typeof ok?.size === 'number' ? ok.size : content.length,
            };
        }
        catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Forge attach timed out after ${this.timeoutMs}ms`);
            }
            throw error;
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
exports.AttachClient = AttachClient;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestHttpError = void 0;
exports.withIngestAction = withIngestAction;
exports.isRetryableHttpStatus = isRetryableHttpStatus;
exports.isRetryableError = isRetryableError;
exports.postIngestJson = postIngestJson;
const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 413]);
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
class IngestHttpError extends Error {
    status;
    body;
    retryable;
    constructor(message, options) {
        super(message);
        this.name = 'IngestHttpError';
        this.status = options.status;
        this.body = options.body ?? null;
        this.retryable = options.retryable;
    }
}
exports.IngestHttpError = IngestHttpError;
/** Append `action=` query param for session/chunk/complete web-trigger routes. */
function withIngestAction(url, action) {
    if (!action || /[?&]action=/i.test(url)) {
        return url;
    }
    return `${url}${url.includes('?') ? '&' : '?'}action=${action}`;
}
function isRetryableHttpStatus(status) {
    return RETRYABLE_STATUSES.has(status);
}
function isRetryableError(error) {
    if (error instanceof IngestHttpError) {
        return error.retryable;
    }
    if (error instanceof Error) {
        if (error.name === 'AbortError') {
            return true;
        }
        if (error.message.toLowerCase().includes('fetch failed')) {
            return true;
        }
    }
    return false;
}
function parseResponseBody(text) {
    if (!text) {
        return null;
    }
    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
}
function formatHttpError(status, body) {
    const detail = typeof body === 'string' ? body : JSON.stringify(body);
    return `Forge ingest failed with HTTP ${status}: ${detail}`;
}
async function postIngestJson(input) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
    try {
        const response = await fetch(withIngestAction(input.url, input.action), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${input.token}`,
            },
            body: JSON.stringify(input.body),
            signal: controller.signal,
        });
        const text = await response.text();
        const body = parseResponseBody(text);
        if (!response.ok) {
            const retryable = isRetryableHttpStatus(response.status) && !NON_RETRYABLE_STATUSES.has(response.status);
            throw new IngestHttpError(formatHttpError(response.status, body), {
                status: response.status,
                body,
                retryable,
            });
        }
        return { status: response.status, body };
    }
    catch (error) {
        if (error instanceof IngestHttpError) {
            throw error;
        }
        if (error instanceof Error && error.name === 'AbortError') {
            throw new IngestHttpError(`Forge ingest timed out after ${input.timeoutMs}ms`, {
                retryable: true,
            });
        }
        throw new IngestHttpError(error instanceof Error ? error.message : String(error), {
            retryable: true,
        });
    }
    finally {
        clearTimeout(timeout);
    }
}

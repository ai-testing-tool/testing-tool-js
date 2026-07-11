"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskToken = maskToken;
exports.sanitizeOptionsForLog = sanitizeOptionsForLog;
function maskToken(token) {
    if (token.length <= 7) {
        return '*'.repeat(token.length);
    }
    return `${token.slice(0, 3)}****${token.slice(-4)}`;
}
function sanitizeOptionsForLog(options) {
    const sanitized = JSON.parse(JSON.stringify(options));
    if (sanitized.ingest?.token) {
        sanitized.ingest.token = maskToken(sanitized.ingest.token);
    }
    return sanitized;
}

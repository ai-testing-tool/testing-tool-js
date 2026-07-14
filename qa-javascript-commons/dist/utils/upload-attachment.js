"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvAttachEnum = void 0;
exports.uploadAttachmentForQa = uploadAttachmentForQa;
/**
 * Upload `qa.attach` binary via Forge proxy and return wire metadata (no content in FR41).
 */
const attach_client_1 = require("../client/attach-client");
const env_enum_1 = require("../env/env-enum");
const issue_keys_1 = require("./issue-keys");
exports.EnvAttachEnum = {
    /** @deprecated Prefer QANALYZER_INGEST_URL — attach uses the shared ingest webtrigger. */
    url: 'QANALYZER_ATTACH_URL',
    maxBytes: 'QANALYZER_ATTACH_MAX_BYTES',
};
function readEnv(name) {
    const value = process.env[name];
    return value === '' ? undefined : value;
}
async function readPathContent(path) {
    const { readFile } = await Promise.resolve().then(() => __importStar(require('node:fs/promises')));
    return readFile(path);
}
/**
 * Attempt Forge→Jira upload. On missing config/key/content, returns metadata-only (never throws
 * unless you want callers to catch — this helper swallows upload errors into `uploaded: false`).
 */
async function uploadAttachmentForQa(params) {
    const fileName = params.fileName ?? (params.path ? params.path.split(/[/\\]/).pop() : undefined) ?? 'attachment.bin';
    const mimeType = params.mimeType ?? 'application/octet-stream';
    let content = params.content;
    if (content === undefined && params.path) {
        try {
            content = await readPathContent(params.path);
        }
        catch (error) {
            return {
                uploaded: false,
                attachment: { file_name: fileName, mime_type: mimeType },
                reason: error instanceof Error ? error.message : String(error),
            };
        }
    }
    const baseMeta = {
        file_name: fileName,
        mime_type: mimeType,
        size: content === undefined
            ? undefined
            : typeof content === 'string'
                ? Buffer.byteLength(content)
                : content.byteLength,
    };
    if (content === undefined) {
        return {
            uploaded: false,
            attachment: baseMeta,
            reason: 'No content or path provided — metadata only',
        };
    }
    const issueKey = params.issueKey?.trim() ||
        (0, issue_keys_1.firstIssueKey)(...(params.issueKeySources ?? [])) ||
        null;
    if (!issueKey) {
        return {
            uploaded: false,
            attachment: baseMeta,
            reason: 'No issue key on test title/tags — skip upload',
        };
    }
    const projectKey = params.projectKey?.trim() ||
        readEnv(env_enum_1.EnvEnum.projectKey) ||
        (0, issue_keys_1.projectKeyFromIssueKey)(issueKey) ||
        '';
    if (!projectKey) {
        return {
            uploaded: false,
            attachment: baseMeta,
            reason: 'projectKey required for attach upload',
        };
    }
    const url = params.attachUrl ??
        readEnv(exports.EnvAttachEnum.url) ??
        readEnv(env_enum_1.EnvIngestEnum.url);
    const token = params.token ?? readEnv(env_enum_1.EnvIngestEnum.token);
    if (!url || !token) {
        return {
            uploaded: false,
            attachment: baseMeta,
            reason: 'QANALYZER_INGEST_URL and QANALYZER_INGEST_TOKEN required for upload',
        };
    }
    const maxBytesRaw = params.maxBytes ?? Number(readEnv(exports.EnvAttachEnum.maxBytes));
    const maxBytes = Number.isFinite(maxBytesRaw) && maxBytesRaw > 0
        ? maxBytesRaw
        : attach_client_1.DEFAULT_MAX_ATTACH_BYTES;
    try {
        const client = new attach_client_1.AttachClient({ url, token, maxBytes });
        const result = await client.upload({
            projectKey,
            issueKey,
            fileName,
            mimeType,
            content,
        });
        return {
            uploaded: true,
            issueKey: result.issueKey,
            attachment: {
                file_name: result.filename,
                mime_type: result.mimeType,
                size: result.size,
                // Static attach webtrigger returns fixed `{"ok":true}` — no Jira attachment id.
                // Prefer id when present; otherwise correlate via issue + filename on the Jira issue.
                content_ref: result.id ?? `${result.issueKey}/${result.filename}`,
            },
        };
    }
    catch (error) {
        return {
            uploaded: false,
            attachment: baseMeta,
            reason: error instanceof Error ? error.message : String(error),
        };
    }
}

"use strict";
/**
 * Programmatic helpers for Playwright tests (FR111).
 * Prefer Jira issue keys in `test('AUTH-101 ...')` titles (FR43).
 *
 * Steps: use Playwright native `test.step()` — do **not** use `qa.step` (FR112).
 *
 * In a live Playwright run, metadata is attached via `test.info().attach`.
 * Outside Playwright (unit tests), helpers use an in-process buffer.
 *
 * `qa.attach` with binary content/path uploads via Forge when configured (FR119).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QA_METADATA_CONTENT_TYPE = exports.MetadataManager = exports.qa = void 0;
const qa_forge_commons_1 = require("qa-forge-commons");
const metadata_manager_1 = require("./metadata-manager");
Object.defineProperty(exports, "MetadataManager", { enumerable: true, get: function () { return metadata_manager_1.MetadataManager; } });
Object.defineProperty(exports, "QA_METADATA_CONTENT_TYPE", { enumerable: true, get: function () { return metadata_manager_1.QA_METADATA_CONTENT_TYPE; } });
function tryCurrentTitle() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pw = require('@playwright/test');
        return pw.test?.info?.()?.title;
    }
    catch {
        return undefined;
    }
}
function tryAttachMetadata(meta) {
    try {
        // Lazy require so unit tests run without a Playwright test context.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pw = require('@playwright/test');
        const info = pw.test?.info?.();
        if (!info?.attach)
            return false;
        void info
            .attach('qanalyzer-metadata.json', {
            contentType: metadata_manager_1.QA_METADATA_CONTENT_TYPE,
            body: Buffer.from(JSON.stringify(meta), 'utf8'),
        })
            .catch(() => {
            // Never fail the test run
        });
        return true;
    }
    catch {
        return false;
    }
}
function pushMeta(type, body, wire) {
    if (tryAttachMetadata(wire))
        return;
    metadata_manager_1.MetadataManager.push(type, body);
}
exports.qa = {
    title(value) {
        pushMeta('qa-title', value, { title: value });
    },
    comment(value) {
        pushMeta('qa-comment', value, { comment: value });
    },
    suite(value) {
        pushMeta('qa-suite', value, { suite: value });
    },
    fields(values) {
        pushMeta('qa-fields', values, { fields: values });
    },
    parameters(values) {
        pushMeta('qa-parameters', values, { parameters: values });
    },
    ignore() {
        pushMeta('qa-ignore', true, { ignore: true });
    },
    attach(attach) {
        const mime = attach.contentType;
        const hasBinary = attach.content !== undefined || Boolean(attach.path);
        if (!hasBinary) {
            const body = {
                name: attach.name,
                contentType: mime,
            };
            pushMeta('qa-attach', body, { attachments: [body] });
            return;
        }
        return (0, qa_forge_commons_1.uploadAttachmentForQa)({
            fileName: attach.name,
            mimeType: mime,
            content: attach.content,
            path: attach.path,
            issueKey: attach.issueKey,
            issueKeySources: [attach.issueKey, tryCurrentTitle()],
        })
            .then((outcome) => {
            const body = {
                name: outcome.attachment.file_name ?? attach.name,
                contentType: outcome.attachment.mime_type ?? mime,
                size: outcome.attachment.size,
                content_ref: outcome.attachment.content_ref,
            };
            pushMeta('qa-attach', body, { attachments: [body] });
        })
            .catch(() => {
            const body = { name: attach.name, contentType: mime };
            pushMeta('qa-attach', body, { attachments: [body] });
        });
    },
};

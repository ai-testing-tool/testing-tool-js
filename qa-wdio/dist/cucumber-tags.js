"use strict";
/**
 * Map WDIO Cucumber tags → MetadataManager / issue-key sources (FR135 / FR43).
 * Supports `@suite=…`, `@tags=…`, `@title=…` and bare `@PROJ-123` issue keys.
 * Does not handle Qase `@QaseId`.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyCucumberTags = applyCucumberTags;
const metadata_manager_1 = require("./metadata-manager");
const ISSUE_KEY_TAG_RE = /^@?([A-Z][A-Z0-9]+-\d+)$/;
function parseKeyValueTag(tag) {
    const raw = tag.startsWith('@') ? tag : `@${tag}`;
    const eq = raw.indexOf('=');
    if (eq <= 0)
        return null;
    const key = raw.slice(0, eq);
    const value = raw.slice(eq + 1).trim();
    if (!key || !value)
        return null;
    return { key, value };
}
function extractBareIssueKey(tag) {
    const m = tag.match(ISSUE_KEY_TAG_RE);
    return m?.[1] ?? null;
}
/**
 * Apply Cucumber scenario tags onto MetadataManager; return bare issue keys.
 */
function applyCucumberTags(tags) {
    const issueKeys = [];
    for (const tag of tags) {
        const name = typeof tag?.name === 'string' ? tag.name.trim() : '';
        if (!name)
            continue;
        const kv = parseKeyValueTag(name);
        if (kv) {
            switch (kv.key.toLowerCase()) {
                case '@suite':
                    metadata_manager_1.MetadataManager.push('qa-suite', kv.value);
                    break;
                case '@tags':
                    metadata_manager_1.MetadataManager.push('qa-fields', {
                        tags: kv.value,
                    });
                    break;
                case '@title':
                    metadata_manager_1.MetadataManager.push('qa-title', kv.value);
                    break;
                default:
                    break;
            }
            continue;
        }
        const issueKey = extractBareIssueKey(name);
        if (issueKey) {
            issueKeys.push(issueKey);
        }
    }
    return { issueKeys };
}

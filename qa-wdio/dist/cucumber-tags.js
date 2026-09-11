"use strict";
/**
 * Map WDIO Cucumber tags → MetadataManager / issue-key sources (FR135 / FR43).
 * Supports `@QaSuite=…`, `@QaSuiteId=…`, `@QaPlan=…`, `@QaPlanId=…`,
 * `@QaFixVersion=…`, `@QaSprintName=…`, `@QaLabels=…`, `@QaTitle=…`,
 * `@QaFields=…` plus bare `@PROJ-123` issue keys.
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
                case '@qasuite':
                    metadata_manager_1.MetadataManager.push('qa-suite', kv.value);
                    break;
                case '@qasuiteid':
                    metadata_manager_1.MetadataManager.push('qa-suite-id', kv.value);
                    break;
                case '@qaplanid':
                    metadata_manager_1.MetadataManager.push('qa-plan-id', kv.value);
                    break;
                case '@qaplan':
                    metadata_manager_1.MetadataManager.push('qa-plan', kv.value.replace(/_/g, ' '));
                    break;
                case '@qafixversion':
                    metadata_manager_1.MetadataManager.push('qa-fix-version', kv.value);
                    break;
                case '@qasprintname':
                    metadata_manager_1.MetadataManager.push('qa-sprint-name', kv.value.replace(/_/g, ' '));
                    break;
                case '@qalabels':
                    metadata_manager_1.MetadataManager.push('qa-labels', kv.value);
                    break;
                case '@qafields': {
                    try {
                        const parsed = JSON.parse(kv.value.replace(/'/g, '"'));
                        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                            metadata_manager_1.MetadataManager.push('qa-fields', parsed);
                        }
                    }
                    catch {
                        // ignore invalid JSON
                    }
                    break;
                }
                case '@qatitle':
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

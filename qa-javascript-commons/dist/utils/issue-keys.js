"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractIssueKeys = extractIssueKeys;
exports.firstIssueKey = firstIssueKey;
exports.projectKeyFromIssueKey = projectKeyFromIssueKey;
const ISSUE_KEY_RE = /\b([A-Z][A-Z0-9]+-\d+)\b/g;
/**
 * Extract Jira issue keys from titles / tags (FR43) — shared with reporters for attach target.
 */
function extractIssueKeys(...sources) {
    const seen = new Set();
    const keys = [];
    for (const source of sources) {
        if (!source)
            continue;
        for (const match of source.matchAll(ISSUE_KEY_RE)) {
            const key = match[1];
            if (key && !seen.has(key)) {
                seen.add(key);
                keys.push(key);
            }
        }
    }
    return keys;
}
function firstIssueKey(...sources) {
    return extractIssueKeys(...sources)[0] ?? null;
}
/** Project key prefix from AUTH-101 → AUTH. */
function projectKeyFromIssueKey(issueKey) {
    const m = /^([A-Z][A-Z0-9]+)-\d+$/.exec(issueKey.trim().toUpperCase());
    return m?.[1] ?? null;
}

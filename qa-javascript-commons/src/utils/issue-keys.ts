const ISSUE_KEY_RE = /\b([A-Z][A-Z0-9]+-\d+)\b/g;

/**
 * Extract Jira issue keys from titles / tags (FR43) — shared with reporters for attach target.
 */
export function extractIssueKeys(...sources: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const source of sources) {
    if (!source) continue;
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

export function firstIssueKey(...sources: Array<string | null | undefined>): string | null {
  return extractIssueKeys(...sources)[0] ?? null;
}

/** Project key prefix from AUTH-101 → AUTH. */
export function projectKeyFromIssueKey(issueKey: string): string | null {
  const m = /^([A-Z][A-Z0-9]+)-\d+$/.exec(issueKey.trim().toUpperCase());
  return m?.[1] ?? null;
}

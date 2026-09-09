/**
 * Upload `qa.attach` binary via Forge proxy and return wire metadata (no content in FR41).
 */
import { AttachClient, DEFAULT_MAX_ATTACH_BYTES } from '../client/attach-client';
import type { QaMetaAttachmentWire } from '../models/meta-qa';
import { EnvEnum, EnvIngestEnum } from '../env/env-enum';
import { firstIssueKey, projectKeyFromIssueKey } from './issue-keys';

export const EnvAttachEnum = {
  /** @deprecated Prefer AI_TESTING_TOOL_INGEST_URL — attach uses the shared ingest webtrigger. */
  url: 'AI_TESTING_TOOL_ATTACH_URL',
  maxBytes: 'AI_TESTING_TOOL_ATTACH_MAX_BYTES',
} as const;

export type UploadAttachParams = {
  /** Explicit issue key override. */
  issueKey?: string;
  /** Sources used to discover issue key (test title, tags, …). */
  issueKeySources?: Array<string | null | undefined>;
  projectKey?: string;
  fileName?: string;
  mimeType?: string;
  content?: Buffer | Uint8Array | string;
  /** Read file from disk when content omitted. */
  path?: string;
  attachUrl?: string;
  token?: string;
  maxBytes?: number;
};

export type UploadAttachOutcome =
  | { uploaded: true; attachment: QaMetaAttachmentWire; issueKey: string }
  | { uploaded: false; attachment: QaMetaAttachmentWire; reason: string };

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value === '' ? undefined : value;
}

async function readPathContent(path: string): Promise<Buffer> {
  const { readFile } = await import('node:fs/promises');
  return readFile(path);
}

/**
 * Attempt Forge→Jira upload. On missing config/key/content, returns metadata-only (never throws
 * unless you want callers to catch — this helper swallows upload errors into `uploaded: false`).
 */
export async function uploadAttachmentForQa(
  params: UploadAttachParams,
): Promise<UploadAttachOutcome> {
  const fileName = params.fileName ?? (params.path ? params.path.split(/[/\\]/).pop() : undefined) ?? 'attachment.bin';
  const mimeType = params.mimeType ?? 'application/octet-stream';

  let content: Buffer | Uint8Array | string | undefined = params.content;
  if (content === undefined && params.path) {
    try {
      content = await readPathContent(params.path);
    } catch (error) {
      return {
        uploaded: false,
        attachment: { file_name: fileName, mime_type: mimeType },
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const baseMeta: QaMetaAttachmentWire = {
    file_name: fileName,
    mime_type: mimeType,
    size:
      content === undefined
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

  const issueKey =
    params.issueKey?.trim() ||
    firstIssueKey(...(params.issueKeySources ?? [])) ||
    null;
  if (!issueKey) {
    return {
      uploaded: false,
      attachment: baseMeta,
      reason: 'No issue key on test title/tags — skip upload',
    };
  }

  const projectKey =
    params.projectKey?.trim() ||
    readEnv(EnvEnum.projectKey) ||
    projectKeyFromIssueKey(issueKey) ||
    '';
  if (!projectKey) {
    return {
      uploaded: false,
      attachment: baseMeta,
      reason: 'projectKey required for attach upload',
    };
  }

  const url =
    params.attachUrl ??
    readEnv(EnvAttachEnum.url) ??
    readEnv(EnvIngestEnum.url);
  const token = params.token ?? readEnv(EnvIngestEnum.token);
  if (!url || !token) {
    return {
      uploaded: false,
      attachment: baseMeta,
      reason: 'AI_TESTING_TOOL_INGEST_URL and AI_TESTING_TOOL_INGEST_TOKEN required for upload',
    };
  }

  const maxBytesRaw = params.maxBytes ?? Number(readEnv(EnvAttachEnum.maxBytes));
  const maxBytes = Number.isFinite(maxBytesRaw) && maxBytesRaw > 0
    ? maxBytesRaw
    : DEFAULT_MAX_ATTACH_BYTES;

  try {
    const client = new AttachClient({ url, token, maxBytes });
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
  } catch (error) {
    return {
      uploaded: false,
      attachment: baseMeta,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

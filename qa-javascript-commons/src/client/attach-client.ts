import type { LoggerInterface } from '../utils';
import { EnvIngestEnum } from '../env/env-enum';

export type AttachClientOptions = {
  /**
   * Shared Forge CI webtrigger URL (`QANALYZER_INGEST_URL`).
   * Legacy `QANALYZER_ATTACH_URL` is accepted as a fallback alias.
   */
  url?: string;
  /** Same Bearer token as ingest (`QANALYZER_INGEST_TOKEN`). */
  token?: string;
  timeoutMs?: number;
  /** Max decoded file bytes (default 3_000_000). */
  maxBytes?: number;
  logger?: LoggerInterface;
};

export type AttachUploadInput = {
  projectKey: string;
  issueKey: string;
  fileName: string;
  mimeType: string;
  content: Buffer | Uint8Array | string;
};

export type AttachUploadResult = {
  issueKey: string;
  /**
   * Jira attachment id when the proxy returns it. Static Forge webtriggers only echo
   * `{"ok":true}`, so callers should treat this as optional and fall back to issue+filename.
   */
  id?: string;
  filename: string;
  mimeType: string;
  size: number;
};

export const DEFAULT_MAX_ATTACH_BYTES = 3_000_000;

function toBuffer(content: Buffer | Uint8Array | string): Buffer {
  if (typeof content === 'string') {
    return Buffer.from(content, 'utf8');
  }
  if (Buffer.isBuffer(content)) {
    return content;
  }
  return Buffer.from(content);
}

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value === '' ? undefined : value;
}

/** Append `action=attach` so the shared ingest webtrigger dispatches correctly. */
export function withAttachAction(url: string): string {
  if (/[?&]action=/i.test(url)) {
    return url;
  }
  return `${url}${url.includes('?') ? '&' : '?'}action=attach`;
}

/**
 * Client for Phase 3 Forge attach proxy → Jira Attachment API.
 * Uses the shared ingest webtrigger URL; sends JSON + base64 (not FR41).
 */
export class AttachClient {
  private readonly url?: string;
  private readonly token?: string;
  private readonly timeoutMs: number;
  private readonly maxBytes: number;
  private readonly logger?: LoggerInterface;

  constructor(options: AttachClientOptions = {}) {
    this.url =
      options.url ??
      readEnv('QANALYZER_ATTACH_URL') ??
      readEnv(EnvIngestEnum.url);
    this.token = options.token ?? readEnv(EnvIngestEnum.token);
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxBytes = options.maxBytes ?? DEFAULT_MAX_ATTACH_BYTES;
    this.logger = options.logger;
  }

  async upload(input: AttachUploadInput): Promise<AttachUploadResult> {
    if (!this.url) {
      throw new Error(
        'attach.url (or QANALYZER_INGEST_URL) is required to upload attachments',
      );
    }
    if (!this.token) {
      throw new Error(
        'attach.token (or QANALYZER_INGEST_TOKEN) is required to upload attachments',
      );
    }

    const content = toBuffer(input.content);
    if (content.length > this.maxBytes) {
      throw new Error(
        `Attachment is ${content.length} bytes; max allowed is ${this.maxBytes} bytes`,
      );
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
      let body: unknown = text;
      try {
        body = text ? (JSON.parse(text) as unknown) : null;
      } catch {
        // keep raw
      }

      if (!response.ok) {
        const errMsg =
          typeof body === 'object' &&
          body &&
          'error' in body &&
          typeof (body as { error: unknown }).error === 'string'
            ? (body as { error: string }).error
            : typeof body === 'string'
              ? body
              : JSON.stringify(body);
        throw new Error(`Forge attach failed with HTTP ${response.status}: ${errMsg}`);
      }

      const ok = body as {
        ok?: boolean;
        issueKey?: string;
        id?: string;
        filename?: string;
        mimeType?: string;
        size?: number;
      };

      // Static Forge webtrigger success body is fixed `{"ok":true}` — no attachment id.
      const id = ok?.id != null && String(ok.id) !== '' ? String(ok.id) : undefined;
      this.logger?.log(
        id
          ? `Attachment uploaded to ${ok.issueKey ?? input.issueKey} id=${id}`
          : `Attachment uploaded to ${input.issueKey} (static ok)`,
      );
      return {
        issueKey: ok?.issueKey ?? input.issueKey,
        id,
        filename: ok?.filename ?? input.fileName,
        mimeType: ok?.mimeType ?? input.mimeType,
        size: typeof ok?.size === 'number' ? ok.size : content.length,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Forge attach timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

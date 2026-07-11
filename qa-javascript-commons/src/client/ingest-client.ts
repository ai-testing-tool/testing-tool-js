import type { IngestOptionsType } from '../config';
import type { IngestPayload } from '../models';
import { estimatePayloadBytes } from '../models';
import type { LoggerInterface } from '../utils';

export type IngestClientOptions = IngestOptionsType & {
  logger?: LoggerInterface;
};

export type IngestResponse = {
  status: number;
  body: unknown;
};

export class IngestClient {
  private readonly url?: string;
  private readonly token?: string;
  private readonly timeoutMs: number;
  private readonly maxPayloadBytes: number;
  private readonly logger?: LoggerInterface;

  constructor(options: IngestClientOptions = {}) {
    this.url = options.url;
    this.token = options.token;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxPayloadBytes = options.maxPayloadBytes ?? 4_500_000;
    this.logger = options.logger;
  }

  async send(payload: IngestPayload): Promise<IngestResponse> {
    if (!this.url) {
      throw new Error('ingest.url (or QANALYZER_INGEST_URL) is required in ingest mode');
    }
    if (!this.token) {
      throw new Error('ingest.token (or QANALYZER_INGEST_TOKEN) is required in ingest mode');
    }

    const bytes = estimatePayloadBytes(payload);
    if (bytes > this.maxPayloadBytes) {
      throw new Error(
        `Ingest payload is ${bytes} bytes; max allowed is ${this.maxPayloadBytes} bytes`,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const text = await response.text();
      let body: unknown = text;
      try {
        body = text ? (JSON.parse(text) as unknown) : null;
      } catch {
        // keep raw text
      }

      if (!response.ok) {
        throw new Error(
          `Forge ingest failed with HTTP ${response.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`,
        );
      }

      this.logger?.log(`Ingest accepted (HTTP ${response.status})`);
      return { status: response.status, body };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Forge ingest timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

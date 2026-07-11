export interface LoggerInterface {
  log(message: string): void;
  logError(message: string, error?: unknown): void;
  logDebug(message: string): void;
}

export class Logger implements LoggerInterface {
  constructor(private readonly debugEnabled = false) {}

  log(message: string): void {
    console.log(`[INFO] qanalyzer: ${message}`);
  }

  logError(message: string, error?: unknown): void {
    console.error(`[ERROR] qanalyzer: ${message}`, error ?? '');
  }

  logDebug(message: string): void {
    if (!this.debugEnabled) return;
    console.debug(`[DEBUG] qanalyzer: ${message}`);
  }
}

export interface LoggerInterface {
    log(message: string): void;
    logError(message: string, error?: unknown): void;
    logDebug(message: string): void;
}
export declare class Logger implements LoggerInterface {
    private readonly debugEnabled;
    constructor(debugEnabled?: boolean);
    log(message: string): void;
    logError(message: string, error?: unknown): void;
    logDebug(message: string): void;
}

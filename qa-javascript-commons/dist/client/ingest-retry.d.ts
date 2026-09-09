import type { LoggerInterface } from '../utils';
export type RetryPolicy = {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
};
export declare const DEFAULT_RETRY_POLICY: RetryPolicy;
export type RetryContext = {
    attempt: number;
    maxAttempts: number;
};
export declare function withRetry<T>(operation: (context: RetryContext) => Promise<T>, options?: {
    policy?: RetryPolicy;
    logger?: LoggerInterface;
    label?: string;
}): Promise<T>;

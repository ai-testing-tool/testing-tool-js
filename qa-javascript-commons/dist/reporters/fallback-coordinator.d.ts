import type { LoggerInterface } from '../utils';
import type { InternalReporterInterface } from './reporter-interface';
export type FallbackCoordinatorCallbacks = {
    onUpstreamFailure?: () => void;
    onFallbackFailure?: () => void;
    onFallbackActivated?: () => void;
    onDisabled?: () => void;
};
/** Upstream ingest → fallback file cascade. */
export declare class FallbackCoordinator {
    private readonly logger;
    private readonly upstream;
    private readonly fallback;
    private readonly callbacks;
    private useFallback;
    private disabled;
    private onDisabledFired;
    constructor(logger: LoggerInterface, upstream: InternalReporterInterface | undefined, fallback: InternalReporterInterface | undefined, callbacks?: FallbackCoordinatorCallbacks);
    isDisabled(): boolean;
    setDisabled(value: boolean): void;
    run<T>(op: (reporter: InternalReporterInterface) => Promise<T>, opName: string): Promise<T | undefined>;
    private disable;
    private runOnFallback;
}

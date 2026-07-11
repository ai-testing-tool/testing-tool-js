import type { LoggerInterface } from '../utils';
import type { InternalReporterInterface } from './reporter-interface';

export type FallbackCoordinatorCallbacks = {
  onUpstreamFailure?: () => void;
  onFallbackFailure?: () => void;
  onFallbackActivated?: () => void;
  onDisabled?: () => void;
};

/** Upstream ingest → fallback file cascade. */
export class FallbackCoordinator {
  private useFallback = false;
  private disabled = false;
  private onDisabledFired = false;

  constructor(
    private readonly logger: LoggerInterface,
    private readonly upstream: InternalReporterInterface | undefined,
    private readonly fallback: InternalReporterInterface | undefined,
    private readonly callbacks: FallbackCoordinatorCallbacks = {},
  ) {}

  isDisabled(): boolean {
    return this.disabled;
  }

  setDisabled(value: boolean): void {
    this.disabled = value;
  }

  async run<T>(
    op: (reporter: InternalReporterInterface) => Promise<T>,
    opName: string,
  ): Promise<T | undefined> {
    if (this.disabled) return undefined;

    if (this.useFallback) {
      return this.runOnFallback(op, opName);
    }

    if (!this.upstream) {
      if (!this.fallback) return undefined;
      this.useFallback = true;
      return this.runOnFallback(op, opName);
    }

    try {
      return await op(this.upstream);
    } catch (error) {
      this.logger.logError(`Unable to ${opName} in the upstream reporter`, error);
      this.callbacks.onUpstreamFailure?.();

      if (!this.fallback) {
        this.disable();
        return undefined;
      }

      this.useFallback = true;
      this.callbacks.onFallbackActivated?.();
      return this.runOnFallback(op, opName);
    }
  }

  private disable(): void {
    if (this.disabled) return;
    this.disabled = true;
    if (!this.onDisabledFired) {
      this.onDisabledFired = true;
      this.callbacks.onDisabled?.();
    }
  }

  private async runOnFallback<T>(
    op: (reporter: InternalReporterInterface) => Promise<T>,
    opName: string,
  ): Promise<T | undefined> {
    if (!this.fallback) {
      this.disable();
      return undefined;
    }
    try {
      return await op(this.fallback);
    } catch (error) {
      this.logger.logError(`Unable to ${opName} in the fallback reporter`, error);
      this.callbacks.onFallbackFailure?.();
      this.disable();
      return undefined;
    }
  }
}

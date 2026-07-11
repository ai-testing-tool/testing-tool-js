/** Step status and timing. */
export declare enum StepStatusEnum {
    passed = "passed",
    failed = "failed",
    blocked = "blocked",
    skipped = "skipped"
}
export declare class StepExecution {
    start_time: number | null;
    status: StepStatusEnum;
    end_time: number | null;
    duration: number | null;
    constructor();
}

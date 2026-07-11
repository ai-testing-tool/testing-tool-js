/** Test status and timing for a single result. */
export declare enum TestStatusEnum {
    passed = "passed",
    failed = "failed",
    skipped = "skipped",
    disabled = "disabled",
    blocked = "blocked",
    invalid = "invalid"
}
export declare class TestExecution {
    start_time: number | null;
    status: TestStatusEnum;
    end_time: number | null;
    duration: number | null;
    stacktrace: string | null;
    thread: string | null;
    constructor();
}

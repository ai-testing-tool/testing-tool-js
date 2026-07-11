"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestExecution = exports.TestStatusEnum = void 0;
/** Test status and timing for a single result. */
var TestStatusEnum;
(function (TestStatusEnum) {
    TestStatusEnum["passed"] = "passed";
    TestStatusEnum["failed"] = "failed";
    TestStatusEnum["skipped"] = "skipped";
    TestStatusEnum["disabled"] = "disabled";
    TestStatusEnum["blocked"] = "blocked";
    TestStatusEnum["invalid"] = "invalid";
})(TestStatusEnum || (exports.TestStatusEnum = TestStatusEnum = {}));
class TestExecution {
    start_time;
    status;
    end_time;
    duration;
    stacktrace;
    thread;
    constructor() {
        this.status = TestStatusEnum.passed;
        this.start_time = null;
        this.end_time = null;
        this.duration = null;
        this.stacktrace = null;
        this.thread = null;
    }
}
exports.TestExecution = TestExecution;

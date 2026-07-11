"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepExecution = exports.StepStatusEnum = void 0;
/** Step status and timing. */
var StepStatusEnum;
(function (StepStatusEnum) {
    StepStatusEnum["passed"] = "passed";
    StepStatusEnum["failed"] = "failed";
    StepStatusEnum["blocked"] = "blocked";
    StepStatusEnum["skipped"] = "skipped";
})(StepStatusEnum || (exports.StepStatusEnum = StepStatusEnum = {}));
class StepExecution {
    start_time;
    status;
    end_time;
    duration;
    constructor() {
        this.status = StepStatusEnum.passed;
        this.start_time = null;
        this.end_time = null;
        this.duration = null;
    }
}
exports.StepExecution = StepExecution;

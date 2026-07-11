"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestStepType = exports.StepType = void 0;
const step_execution_1 = require("./step-execution");
/** Step type discriminant and step record. */
var StepType;
(function (StepType) {
    StepType["TEXT"] = "text";
    StepType["GHERKIN"] = "gherkin";
    StepType["REQUEST"] = "request";
})(StepType || (exports.StepType = StepType = {}));
class TestStepType {
    id;
    step_type;
    data;
    parent_id;
    execution;
    attachments;
    steps;
    constructor(type = StepType.TEXT) {
        this.id = '';
        this.step_type = type;
        this.parent_id = null;
        this.execution = new step_execution_1.StepExecution();
        this.attachments = [];
        this.steps = [];
        if (type === StepType.TEXT) {
            this.data = { action: '', expected_result: null, data: null };
        }
        else if (type === StepType.GHERKIN) {
            this.data = { keyword: '', name: '', line: 0 };
        }
        else {
            this.data = {
                request_method: '',
                request_url: '',
                request_headers: null,
                request_body: null,
                status_code: null,
                response_body: null,
                response_headers: null,
            };
        }
    }
}
exports.TestStepType = TestStepType;

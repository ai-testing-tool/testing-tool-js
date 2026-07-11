"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestResultType = void 0;
const test_execution_1 = require("./test-execution");
/**
 * Normalized test result for Forge ingest.
 * Jira traceability via title/tags (issue keys).
 */
class TestResultType {
    id;
    title;
    signature;
    execution;
    fields;
    attachments;
    steps;
    params;
    group_params;
    author;
    relations;
    muted;
    message;
    tags;
    preparedAttachments;
    constructor(title) {
        this.id = '';
        this.title = title;
        this.signature = '';
        this.execution = new test_execution_1.TestExecution();
        this.fields = {};
        this.attachments = [];
        this.steps = [];
        this.params = {};
        this.group_params = {};
        this.author = null;
        this.relations = null;
        this.muted = false;
        this.message = null;
        this.tags = [];
        this.preparedAttachments = [];
    }
}
exports.TestResultType = TestResultType;

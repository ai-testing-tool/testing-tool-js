"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const issue_keys_js_1 = require("../utils/issue-keys.js");
(0, node_test_1.describe)('issue-keys', () => {
    (0, node_test_1.it)('extracts keys in order', () => {
        strict_1.default.deepEqual((0, issue_keys_js_1.extractIssueKeys)('AUTH-101 login', 'also PROJ-2'), [
            'AUTH-101',
            'PROJ-2',
        ]);
        strict_1.default.equal((0, issue_keys_js_1.firstIssueKey)('no keys', 'AUTH-55 title'), 'AUTH-55');
        strict_1.default.equal((0, issue_keys_js_1.projectKeyFromIssueKey)('AUTH-101'), 'AUTH');
    });
});

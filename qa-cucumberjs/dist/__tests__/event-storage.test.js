"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const event_storage_js_1 = require("../modules/event-storage.js");
(0, node_test_1.describe)('EventStorage attachments (FR58)', () => {
    (0, node_test_1.it)('captures envelope.attachment and returns them on convertFinished', () => {
        const storage = new event_storage_js_1.EventStorage();
        storage.ingest({
            gherkinDocument: {
                uri: 'features/a.feature',
                feature: {
                    name: 'Feature A',
                    children: [{ scenario: { id: 'sc1', name: 'S', steps: [] } }],
                },
            },
        });
        storage.ingest({
            pickle: {
                id: 'p1',
                uri: 'features/a.feature',
                name: 'AUTH-101 scenario',
                language: 'en',
                steps: [{ id: 'ps1', text: 'pass', astNodeIds: [] }],
                tags: [{ name: '@AUTH-101', astNodeId: 't1' }],
                astNodeIds: ['sc1'],
            },
        });
        storage.ingest({
            testCase: {
                id: 'tc1',
                pickleId: 'p1',
                testSteps: [{ id: 'ts1', pickleStepId: 'ps1' }],
            },
        });
        storage.ingest({
            testCaseStarted: {
                id: 'started-1',
                testCaseId: 'tc1',
                timestamp: { seconds: 1, nanos: 0 },
            },
        });
        storage.ingest({
            testStepFinished: {
                testStepId: 'ts1',
                testCaseStartedId: 'started-1',
                testStepResult: {
                    status: 'PASSED',
                    duration: { seconds: 0, nanos: 1e6 },
                },
                timestamp: { seconds: 1, nanos: 1e6 },
            },
        });
        storage.ingest({
            attachment: {
                body: Buffer.from('hello').toString('base64'),
                contentEncoding: 'BASE64',
                mediaType: 'text/plain',
                fileName: 'note.txt',
                testCaseStartedId: 'started-1',
            },
        });
        const converted = storage.convertFinished({
            testCaseStartedId: 'started-1',
            timestamp: { seconds: 2, nanos: 0 },
        });
        strict_1.default.ok(converted);
        strict_1.default.equal(converted.attachments.length, 1);
        strict_1.default.equal(converted.attachments[0].fileName, 'note.txt');
        strict_1.default.equal(converted.attachments[0].mediaType, 'text/plain');
        strict_1.default.equal(converted.attachments[0].contentEncoding, 'BASE64');
    });
});

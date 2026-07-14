"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const tag_parser_js_1 = require("../modules/tag-parser.js");
(0, node_test_1.describe)('parseQaTags', () => {
    (0, node_test_1.it)('parses @Qa* tags and issue keys (FR51/FR52)', () => {
        const meta = (0, tag_parser_js_1.parseQaTags)([
            { name: '@AUTH-101' },
            { name: '@QaTitle=Get_all_users' },
            { name: '@QaSuite=API\tUsers\tRead' },
            { name: '@QaFields={"layer":"api","severity":"normal"}' },
            { name: '@QaParameters={"userId":"1"}' },
        ]);
        strict_1.default.equal(meta.title, 'Get all users');
        strict_1.default.equal(meta.suite, 'API\tUsers\tRead');
        strict_1.default.equal(meta.fields.layer, 'api');
        strict_1.default.equal(meta.parameters.userId, '1');
        strict_1.default.deepEqual(meta.issueKeys, ['AUTH-101']);
        strict_1.default.equal(meta.ignore, false);
    });
    (0, node_test_1.it)('detects @QaIgnore', () => {
        const meta = (0, tag_parser_js_1.parseQaTags)([{ name: '@QaIgnore' }]);
        strict_1.default.equal(meta.ignore, true);
    });
});
(0, node_test_1.describe)('resolveScenarioTitle', () => {
    (0, node_test_1.it)('uses @QaTitle when present', () => {
        strict_1.default.equal((0, tag_parser_js_1.resolveScenarioTitle)('Get all users', {
            title: 'Custom title',
            ignore: false,
            suite: null,
            fields: {},
            parameters: {},
            issueKeys: ['AUTH-101'],
        }), 'Custom title');
    });
    (0, node_test_1.it)('prefixes issue key when missing from pickle name', () => {
        strict_1.default.equal((0, tag_parser_js_1.resolveScenarioTitle)('Get all users', {
            title: null,
            ignore: false,
            suite: null,
            fields: {},
            parameters: {},
            issueKeys: ['AUTH-101'],
        }), 'AUTH-101 Get all users');
    });
});

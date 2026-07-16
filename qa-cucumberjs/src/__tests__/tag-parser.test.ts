import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  parseQaTags,
  resolveScenarioTitle,
} from '../modules/tag-parser.js';

describe('parseQaTags', () => {
  it('parses @Qa* tags and issue keys (FR51/FR52)', () => {
    const meta = parseQaTags([
      { name: '@AUTH-101' },
      { name: '@QaTitle=Get_all_users' },
      { name: '@QaSuite=API\tUsers\tRead' },
      { name: '@QaFields={"layer":"api","severity":"normal"}' },
      { name: '@QaParameters={"userId":"1"}' },
    ]);

    assert.equal(meta.title, 'Get all users');
    assert.equal(meta.suite, 'API\tUsers\tRead');
    assert.equal(meta.fields.layer, 'api');
    assert.equal(meta.parameters.userId, '1');
    assert.deepEqual(meta.issueKeys, ['AUTH-101']);
    assert.equal(meta.ignore, false);
  });

  it('detects @QaIgnore', () => {
    const meta = parseQaTags([{ name: '@QaIgnore' }]);
    assert.equal(meta.ignore, true);
  });
});

describe('resolveScenarioTitle', () => {
  it('uses @QaTitle when present', () => {
    assert.equal(
      resolveScenarioTitle('Get all users', {
        title: 'Custom title',
        ignore: false,
        suite: null,
        fields: {},
        parameters: {},
        issueKeys: ['AUTH-101'],
      }),
      'Custom title',
    );
  });

  it('keeps pickle name when no @QaTitle (issue keys go to meta.qa.issueKeys)', () => {
    assert.equal(
      resolveScenarioTitle('Get all users', {
        title: null,
        ignore: false,
        suite: null,
        fields: {},
        parameters: {},
        issueKeys: ['AUTH-101'],
      }),
      'Get all users',
    );
  });
});

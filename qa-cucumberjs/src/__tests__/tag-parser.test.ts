import { qaDescribe, qaItAuto, expect } from '@qa/test';

import {
  parseQaTags,
  resolveScenarioTitle,
} from '../modules/tag-parser.js';

qaDescribe('parseQaTags', () => {
  qaItAuto('parses @Qa* tags and issue keys (FR51/FR52)', () => {
    const meta = parseQaTags([
      { name: '@AUTH-101' },
      { name: '@QaTitle=Get_all_users' },
      { name: '@QaSuite=API\tUsers\tRead' },
      { name: '@QaFields={"layer":"api","severity":"normal"}' },
      { name: '@QaParameters={"userId":"1"}' },
    ]);

    expect(meta.title).toBe('Get all users');
    expect(meta.suite).toBe('API\tUsers\tRead');
    expect(meta.fields.layer).toBe('api');
    expect(meta.parameters.userId).toBe('1');
    expect(meta.issueKeys).toEqual(['AUTH-101']);
    expect(meta.ignore).toBe(false);
  });

  qaItAuto('detects @QaIgnore', () => {
    const meta = parseQaTags([{ name: '@QaIgnore' }]);
    expect(meta.ignore).toBe(true);
  });
});

qaDescribe('resolveScenarioTitle', () => {
  qaItAuto('uses @QaTitle when present', () => {
    expect(resolveScenarioTitle('Get all users', {
        title: 'Custom title',
        ignore: false,
        suite: null,
        fields: {},
        parameters: {},
        issueKeys: ['AUTH-101'],
      })).toBe('Custom title',);
  });

  qaItAuto('keeps pickle name when no @QaTitle (issue keys go to meta.qa.issueKeys)', () => {
    expect(resolveScenarioTitle('Get all users', {
        title: null,
        ignore: false,
        suite: null,
        fields: {},
        parameters: {},
        issueKeys: ['AUTH-101'],
      })).toBe('Get all users',);
  });
});

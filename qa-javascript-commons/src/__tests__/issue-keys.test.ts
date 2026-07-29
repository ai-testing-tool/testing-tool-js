import { qaDescribe, qaItAuto, expect } from '@qa/test';

import { extractIssueKeys, firstIssueKey, projectKeyFromIssueKey } from '../utils/issue-keys.js';

qaDescribe('issue-keys', () => {
  qaItAuto('extracts keys in order', () => {
    expect(extractIssueKeys('AUTH-101 login', 'also PROJ-2')).toEqual([
      'AUTH-101',
      'PROJ-2',
    ]);
    expect(firstIssueKey('no keys', 'AUTH-55 title')).toBe('AUTH-55');
    expect(projectKeyFromIssueKey('AUTH-101')).toBe('AUTH');
  });
});

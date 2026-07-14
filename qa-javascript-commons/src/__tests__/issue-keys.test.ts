import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { extractIssueKeys, firstIssueKey, projectKeyFromIssueKey } from '../utils/issue-keys.js';

describe('issue-keys', () => {
  it('extracts keys in order', () => {
    assert.deepEqual(extractIssueKeys('AUTH-101 login', 'also PROJ-2'), [
      'AUTH-101',
      'PROJ-2',
    ]);
    assert.equal(firstIssueKey('no keys', 'AUTH-55 title'), 'AUTH-55');
    assert.equal(projectKeyFromIssueKey('AUTH-101'), 'AUTH');
  });
});

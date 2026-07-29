import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { qaDescribe, qaItAuto, expect } from '@qa/test';

import { enrichSpecsWithFailureScreenshots } from '../enrich-screenshots.js';
import { ScreenshotsManager } from '../screenshots-manager.js';
import type { CypressSpecInput } from '../report-builder.js';

qaDescribe('Cypress failure screenshot enrich (FR71)', () => {
  qaItAuto('attaches metadata for failed assertion when screenshot path exists', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-cy-shot-'));
    const shotPath = join(dir, 'Login -- AUTH-102 logout (failed).png');
    const bridge = join(dir, 'shots.json');
    writeFileSync(shotPath, Buffer.alloc(64, 1));

    try {
      ScreenshotsManager.clear(bridge);
      ScreenshotsManager.append(
        {
          path: shotPath,
          name: 'AUTH-102 logout',
          specName: 'cypress/e2e/login.cy.js',
          testFailure: true,
        },
        bridge,
      );

      const specs: CypressSpecInput[] = [
        {
          name: 'cypress/e2e/login.cy.js',
          assertions: [
            {
              ancestorTitles: ['Login'],
              title: 'AUTH-102 logout',
              fullName: 'Login AUTH-102 logout',
              status: 'failed',
              failureMessages: ['boom'],
            },
          ],
        },
      ];

      await enrichSpecsWithFailureScreenshots(specs, bridge);

      const att = specs[0]!.assertions[0]!.meta?.qa?.attachments?.[0];
      expect(att).toBeTruthy();
      expect(att!.file_name).toBe('Login -- AUTH-102 logout (failed).png');
      expect(att!.mime_type).toBe('image/png');
      expect(att!.size).toBe(64);
      // No attach URL → metadata only
      expect(att!.content_ref).toBeUndefined();
    } finally {
      ScreenshotsManager.clear(bridge);
      rmSync(dir, { recursive: true, force: true });
    }
  });

  qaItAuto('skips video paths', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qa-cy-vid-'));
    const video = join(dir, 'spec.mp4');
    const bridge = join(dir, 'shots.json');
    writeFileSync(video, Buffer.alloc(32, 1));

    try {
      ScreenshotsManager.append(
        {
          path: video,
          specName: 'spec.cy.js',
          testFailure: true,
        },
        bridge,
      );

      const specs: CypressSpecInput[] = [
        {
          name: 'spec.cy.js',
          assertions: [
            {
              ancestorTitles: [],
              title: 'AUTH-1 fail',
              status: 'failed',
            },
          ],
        },
      ];

      await enrichSpecsWithFailureScreenshots(specs, bridge);
      expect(specs[0]!.assertions[0]!.meta?.qa?.attachments?.length ?? 0).toBe(0,);
    } finally {
      ScreenshotsManager.clear(bridge);
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

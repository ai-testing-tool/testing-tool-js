import { qaDescribe, qaTest, expect } from '@qa/test';

const BASE = 'https://jsonplaceholder.typicode.com';

qaDescribe('Advanced API flows', () => {
  qaTest('Complex nested flow - user and post retrieval', async ({ qa }) => {
    await qa.issueKeys(['AUTH-111']);
    await qa.step('fetch user 1', async () => {
      const userResponse = await fetch(`${BASE}/users/1`);
      const user = (await userResponse.json()) as { id: number; name: string; email: string };

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
    });

    await qa.step('fetch posts for user', async () => {
      const userResponse = await fetch(`${BASE}/users/1`);
      const user = (await userResponse.json()) as { id: number };
      const postsResponse = await fetch(`${BASE}/posts?userId=${user.id}`);
      const userPosts = (await postsResponse.json()) as Array<{ userId: number }>;

      expect(userPosts.length).toBeGreaterThan(0);
      for (const post of userPosts) {
        expect(post.userId).toBe(user.id);
      }
      expect(userPosts).toHaveLength(10);
    });
  });

  qaTest('Suite hierarchy - user albums relationship', async ({ qa }) => {
    await qa.issueKeys(['AUTH-112']);
    await qa.step('list albums for user 1', async () => {
      const userResponse = await fetch(`${BASE}/users/1`);
      const user = (await userResponse.json()) as { id: number };

      const albumsResponse = await fetch(`${BASE}/users/${user.id}/albums`);
      const albums = (await albumsResponse.json()) as Array<{ userId: number; id: number; title: string }>;

      expect(albums.length).toBeGreaterThan(0);
      expect(albums[0].userId).toBe(user.id);
    });

    await qa.step('fetch album 1 details', async () => {
      const albumResponse = await fetch(`${BASE}/albums/1`);
      const album = (await albumResponse.json()) as Record<string, unknown>;
      expect(album).toHaveProperty('userId');
      expect(album).toHaveProperty('id');
      expect(album).toHaveProperty('title');
    });
  });

  qaTest('Parameterized users - validate multiple user IDs', async ({ qa }) => {
    await qa.issueKeys(['AUTH-113']);
    await qa.step('validate users 1-3', async () => {
      const userIds = [1, 2, 3];

      for (const userId of userIds) {
        const response = await fetch(`${BASE}/users/${userId}`);
        expect(response.status).toBe(200);

        const user = (await response.json()) as { id: number; name: string };
        expect(user.id).toBe(userId);
        expect(user.name).toBeTruthy();
      }
    });
  });

  qaTest.skip('Authentication endpoint placeholder', async ({ qa }) => {
    await qa.issueKeys(['AUTH-114']);
    await qa.step('placeholder', async () => {
      // Intentionally skipped — placeholder for future OAuth coverage.
    });
  });
});

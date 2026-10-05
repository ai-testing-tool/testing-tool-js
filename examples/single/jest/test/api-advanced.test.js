const { qa } = require('@ai-testing-tool/forge-jest/jest');

const BASE_URL = 'https://jsonplaceholder.typicode.com';

describe('JSONPlaceholder API - Advanced Features', () => {
  test('Complex nested steps - fetch user and their posts', async () => {
    await qa.issueKeys(['AUTH-112']);
    await qa.fields({ layer: 'api', severity: 'normal', priority: 'medium' });
    await qa.suite('API Tests\tAdvanced\tRelationships');

    let userId;
    let userName;

    await qa.step('Fetch user details', async () => {
      const response = await fetch(`${BASE_URL}/users/1`);
      expect(response.status).toBe(200);

      const user = await response.json();
      userId = user.id;
      userName = user.name;
      expect(userName).toBe('Leanne Graham');

      await qa.step('Validate user has company information', async () => {
        expect(user.company).toHaveProperty('name');
        expect(user.company.name).toBeTruthy();
      });
    });

    await qa.step('Fetch all posts by user', async () => {
      const response = await fetch(`${BASE_URL}/posts?userId=${userId}`);
      expect(response.status).toBe(200);

      const posts = await response.json();
      expect(posts.length).toBe(10);

      await qa.step('Verify first post belongs to user', async () => {
        expect(posts[0].userId).toBe(userId);
      });

      await qa.step('Verify post titles are non-empty', async () => {
        posts.forEach((post) => {
          expect(post.title).toBeTruthy();
          expect(post.body).toBeTruthy();
        });
      });
    });
  });

  test('Suite hierarchy demonstration', async () => {
    await qa.issueKeys(['AUTH-113']);
    await qa.suite('API Tests\tAdvanced\tData Validation');
    await qa.fields({ layer: 'api', severity: 'normal' });

    await qa.step('Validate todos endpoint structure', async () => {
      const response = await fetch(`${BASE_URL}/todos/1`);
      expect(response.status).toBe(200);

      const todo = await response.json();
      expect(todo).toHaveProperty('id');
      expect(todo).toHaveProperty('userId');
      expect(todo).toHaveProperty('title');
      expect(todo).toHaveProperty('completed');
      expect(typeof todo.completed).toBe('boolean');
    });
  });

  test('Parameterized test pattern - multiple user IDs', async () => {
    await qa.issueKeys(['AUTH-114']);
    await qa.parameters({
      testScope: 'multiple_users',
      userIds: '1,2,3',
      validationType: 'existence',
    });
    await qa.fields({ layer: 'api', severity: 'normal' });
    await qa.suite('API Tests\tAdvanced\tParameters');

    const userIds = [1, 2, 3];

    for (const userId of userIds) {
      await qa.step(`Verify user ${userId} exists`, async () => {
        const response = await fetch(`${BASE_URL}/users/${userId}`);
        expect(response.status).toBe(200);

        const user = await response.json();
        expect(user.id).toBe(userId);
        expect(user.name).toBeTruthy();
      });
    }
  });

  test('Albums endpoint with nested photos', async () => {
    await qa.issueKeys(['AUTH-115']);
    await qa.fields({ layer: 'api', severity: 'minor', priority: 'low' });
    await qa.suite('API Tests\tAdvanced\tAlbums');

    let albumId;

    await qa.step('Fetch album details', async () => {
      const response = await fetch(`${BASE_URL}/albums/1`);
      expect(response.status).toBe(200);

      const album = await response.json();
      albumId = album.id;
      expect(albumId).toBe(1);
      expect(album.userId).toBe(1);
    });

    await qa.step('Fetch photos in album', async () => {
      const response = await fetch(`${BASE_URL}/albums/${albumId}/photos`);
      expect(response.status).toBe(200);

      const photos = await response.json();
      expect(Array.isArray(photos)).toBe(true);
      expect(photos.length).toBe(50);

      await qa.step('Verify photo structure', async () => {
        const firstPhoto = photos[0];
        expect(firstPhoto).toHaveProperty('albumId');
        expect(firstPhoto).toHaveProperty('id');
        expect(firstPhoto).toHaveProperty('title');
        expect(firstPhoto).toHaveProperty('url');
        expect(firstPhoto).toHaveProperty('thumbnailUrl');
      });
    });
  });

  test.skip('Authentication feature (not yet implemented)', async () => {
    await qa.issueKeys(['AUTH-116']);
    qa.ignore();
    await qa.comment(
      'This test will be implemented when JSONPlaceholder adds authentication support',
    );
    await qa.fields({ layer: 'api', severity: 'major', priority: 'high' });

    expect(true).toBe(true);
  });
});

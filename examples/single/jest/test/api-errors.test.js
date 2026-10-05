const { qa } = require('@ai-testing-tool/forge-jest/jest');

const BASE_URL = 'https://jsonplaceholder.typicode.com';

describe('JSONPlaceholder API - Error Handling', () => {
  test('GET non-existent user returns 404', async () => {
    await qa.issueKeys(['AUTH-108']);
    await qa.fields({ layer: 'api', severity: 'normal', priority: 'medium' });
    await qa.comment(
      'JSONPlaceholder returns 404 with an empty object for non-existent users',
    );
    await qa.suite('API Tests\tErrors\tNot Found');

    await qa.step('Request user with ID 999', async () => {
      const response = await fetch(`${BASE_URL}/users/999`);
      expect(response.status).toBe(404);

      const user = await response.json();
      expect(user).toEqual({});
    });
  });

  test('GET non-existent post returns 404', async () => {
    await qa.issueKeys(['AUTH-109']);
    await qa.fields({ layer: 'api', severity: 'normal' });
    await qa.comment(
      'JSONPlaceholder behavior: non-existent posts return {} with 404 status',
    );
    await qa.suite('API Tests\tErrors\tNot Found');

    await qa.step('Request post with ID 9999', async () => {
      const response = await fetch(`${BASE_URL}/posts/9999`);
      expect(response.status).toBe(404);

      const post = await response.json();
      expect(post).toEqual({});

      await qa.attach({
        name: 'error-response.json',
        content: JSON.stringify(
          {
            requestedId: 9999,
            response: post,
            status: response.status,
          },
          null,
          2,
        ),
        contentType: 'application/json',
      });
    });
  });

  test('Invalid endpoint returns 404', async () => {
    await qa.issueKeys(['AUTH-110']);
    await qa.fields({ layer: 'api', severity: 'minor', priority: 'low' });
    await qa.comment('Invalid endpoints return 404');
    await qa.suite('API Tests\tErrors\tNot Found');

    await qa.step('Request invalid endpoint', async () => {
      const response = await fetch(`${BASE_URL}/invalid-endpoint`);
      expect(response.status).toBe(404);
      expect(response.status).not.toBe(500);
    });
  });

  test('POST with empty JSON is gracefully handled', async () => {
    await qa.issueKeys(['AUTH-111']);
    await qa.fields({ layer: 'api', severity: 'normal' });
    await qa.suite('API Tests\tErrors\tValidation');

    await qa.step('Send POST with minimal data', async () => {
      const response = await fetch(`${BASE_URL}/posts`, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(201);

      const result = await response.json();
      expect(result).toHaveProperty('id');
    });
  });
});

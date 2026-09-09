const { qa } = require('@ai-testing-tool/forge-mocha/mocha');
const assert = require('assert');

describe('JSONPlaceholder Error Handling', function () {
  const BASE_URL = 'https://jsonplaceholder.typicode.com';

  it('AUTH-108 GET non-existent user - verify 404 response', async function () {
    qa.comment(
      'Testing error handling for non-existent resource — expected failure scenario',
    );

    const nonExistentUserId = 9999;
    let response;

    await qa.step(`Send GET request to /users/${nonExistentUserId}`, async () => {
      response = await fetch(`${BASE_URL}/users/${nonExistentUserId}`);
    });

    await qa.step('Verify response status is 404 (Not Found)', async () => {
      assert.strictEqual(
        response.status,
        404,
        'Should return 404 for non-existent user',
      );
    });

    await qa.step('Verify response body is empty object', async () => {
      const body = await response.json();
      assert.strictEqual(typeof body, 'object', 'Response should be an object');
      assert.strictEqual(Object.keys(body).length, 0, 'Response should be empty for 404');
    });
  });

  it('AUTH-109 GET non-existent post - attach error response', async function () {
    const nonExistentPostId = 99999;
    let response;
    let errorBody;

    await qa.step(`Send GET request to /posts/${nonExistentPostId}`, async () => {
      response = await fetch(`${BASE_URL}/posts/${nonExistentPostId}`);
    });

    await qa.step('Verify response status is 404', async () => {
      assert.strictEqual(response.status, 404);
    });

    await qa.step('Parse error response', async () => {
      errorBody = await response.json();
    });

    await qa.step('Attach error response for documentation', async () => {
      qa.attach({
        name: '404-error-response.json',
        content: JSON.stringify(
          {
            status: response.status,
            statusText: response.statusText,
            body: errorBody,
            url: response.url,
          },
          null,
          2,
        ),
        contentType: 'application/json',
      });
    });

    await qa.step('Verify error response structure', async () => {
      assert.strictEqual(typeof errorBody, 'object', 'Error body should be an object');
    });
  });

  it('AUTH-110 Invalid endpoint - verify graceful 404 handling', async function () {
    const invalidEndpoint = '/invalid-endpoint-12345';
    let response;

    await qa.step(`Send GET request to invalid endpoint: ${invalidEndpoint}`, async () => {
      response = await fetch(`${BASE_URL}${invalidEndpoint}`);
    });

    await qa.step('Verify response status is 404', async () => {
      assert.strictEqual(
        response.status,
        404,
        'Invalid endpoint should return 404',
      );
    });

    qa.comment(`Confirmed 404 for ${invalidEndpoint}`);
  });
});

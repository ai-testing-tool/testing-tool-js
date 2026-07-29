import { qaDescribe, qaTest, expect } from '@qa/test';

const BASE = 'https://jsonplaceholder.typicode.com';

qaDescribe('Error Handling', () => {
  qaTest('GET non-existent user (404) - verify error status', async ({ qa }) => {
    await qa.issueKeys(['AUTH-108']);
    await qa.step('GET /users/999', async () => {
      const response = await fetch(`${BASE}/users/999`);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toEqual({});
    });
  });

  qaTest('GET non-existent post (404) - verify empty body', async ({ qa }) => {
    await qa.issueKeys(['AUTH-109']);
    await qa.step('GET /posts/9999', async () => {
      const response = await fetch(`${BASE}/posts/9999`);
      expect(response.status).toBe(404);

      const errorResponse = await response.json();
      expect(errorResponse).toEqual({});
    });
  });

  qaTest('GET invalid endpoint (404) - verify graceful handling', async ({ qa }) => {
    await qa.issueKeys(['AUTH-110']);
    await qa.step('GET /invalid-endpoint', async () => {
      const response = await fetch(`${BASE}/invalid-endpoint`);
      expect(response.status).toBe(404);
      expect(response.status).not.toBe(500);
    });
  });
});

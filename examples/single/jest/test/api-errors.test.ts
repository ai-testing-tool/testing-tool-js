export {};

const BASE = 'https://jsonplaceholder.typicode.com';

describe('Error Handling', () => {
  test('AUTH-108 GET non-existent user (404) - verify error status', async () => {
    const response = await fetch(`${BASE}/users/999`);
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toEqual({});
  });

  test('AUTH-109 GET non-existent post (404) - verify empty body', async () => {
    const response = await fetch(`${BASE}/posts/9999`);
    expect(response.status).toBe(404);

    const errorResponse = await response.json();
    expect(errorResponse).toEqual({});
  });

  test('AUTH-110 GET invalid endpoint (404) - verify graceful handling', async () => {
    const response = await fetch(`${BASE}/invalid-endpoint`);
    expect(response.status).toBe(404);
    expect(response.status).not.toBe(500);
  });
});

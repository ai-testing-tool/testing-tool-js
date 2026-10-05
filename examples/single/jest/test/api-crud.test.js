const { qa } = require('@ai-testing-tool/forge-jest/jest');

const BASE_URL = 'https://jsonplaceholder.typicode.com';

describe('JSONPlaceholder API - User CRUD Operations', () => {
  test('GET all users returns 10 users', async () => {
    await qa.issueKeys(['AUTH-101']);
    await qa.fields({ layer: 'api', severity: 'normal', priority: 'high' });
    await qa.labels(['crud', 'api']);
    await qa.suite('API Tests\tCRUD\tUsers');

    await qa.step('Send GET request to /users endpoint', async () => {
      const response = await fetch(`${BASE_URL}/users`);
      expect(response.status).toBe(200);

      const users = await response.json();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(10);
    });

    await qa.step('Verify response contains valid user structure', async () => {
      const response = await fetch(`${BASE_URL}/users`);
      const users = await response.json();
      const firstUser = users[0];

      expect(firstUser).toHaveProperty('id');
      expect(firstUser).toHaveProperty('name');
      expect(firstUser).toHaveProperty('email');
      expect(firstUser).toHaveProperty('address');
    });
  });

  test('GET single user by ID returns correct user', async () => {
    await qa.issueKeys(['AUTH-102']);
    await qa.parameters({ userId: '1' });
    await qa.fields({ layer: 'api', severity: 'normal' });
    await qa.suite('API Tests\tCRUD\tUsers');

    await qa.step('Send GET request to /users/1', async () => {
      const response = await fetch(`${BASE_URL}/users/1`);
      expect(response.status).toBe(200);

      const user = await response.json();
      expect(user.id).toBe(1);
      expect(user.name).toBe('Leanne Graham');
      expect(user.email).toBe('Sincere@april.biz');
    });

    await qa.step('Verify user address and company information', async () => {
      const response = await fetch(`${BASE_URL}/users/1`);
      const user = await response.json();

      expect(user.address).toHaveProperty('city');
      expect(user.address.city).toBe('Gwenborough');
      expect(user.company).toHaveProperty('name');
    });
  });

  test('POST create new user returns 201 with ID', async () => {
    await qa.issueKeys(['AUTH-103']);
    await qa.fields({ layer: 'api', severity: 'critical', priority: 'high' });
    await qa.labels(['crud', 'smoke']);
    await qa.suite('API Tests\tCRUD\tUsers');

    const newUser = {
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
    };

    await qa.step('Send POST request to create user', async () => {
      const response = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        body: JSON.stringify(newUser),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(201);

      const createdUser = await response.json();
      expect(createdUser).toHaveProperty('id');
      expect(createdUser.id).toBe(11);

      await qa.attach({
        name: 'request-body.json',
        content: JSON.stringify(newUser, null, 2),
        contentType: 'application/json',
      });
    });
  });

  test('DELETE user returns 200 status', async () => {
    await qa.issueKeys(['AUTH-104']);
    await qa.fields({ layer: 'api', severity: 'normal' });
    await qa.comment(
      'Note: JSONPlaceholder fakes DELETE operations - no actual deletion occurs',
    );
    await qa.suite('API Tests\tCRUD\tUsers');

    await qa.step('Send DELETE request to /users/1', async () => {
      const response = await fetch(`${BASE_URL}/users/1`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(200);
    });

    await qa.step('Verify response is empty object', async () => {
      const response = await fetch(`${BASE_URL}/users/1`, {
        method: 'DELETE',
      });

      const result = await response.json();
      expect(result).toEqual({});
    });
  });
});

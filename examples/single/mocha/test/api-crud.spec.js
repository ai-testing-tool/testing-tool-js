const { qa } = require('@ai-testing-tool/forge-mocha/mocha');
const assert = require('assert');

describe('JSONPlaceholder User CRUD Operations', function () {
  const BASE_URL = 'https://jsonplaceholder.typicode.com';

  it('AUTH-101 GET all users - verify 10 users returned', async function () {
    qa.fields({ layer: 'api', severity: 'normal' });

    let response;
    let users;

    await qa.step('Send GET request to /users endpoint', async () => {
      response = await fetch(`${BASE_URL}/users`);
    });

    await qa.step('Verify response status is 200', async () => {
      assert.strictEqual(response.status, 200, 'Expected status code 200');
    });

    await qa.step('Parse JSON response', async () => {
      users = await response.json();
    });

    await qa.step('Verify 10 users are returned', async () => {
      assert.strictEqual(Array.isArray(users), true, 'Response should be an array');
      assert.strictEqual(users.length, 10, 'Should have exactly 10 users');
    });

    await qa.step('Verify user structure has required fields', async () => {
      const firstUser = users[0];
      assert.ok(firstUser.id, 'User should have id');
      assert.ok(firstUser.name, 'User should have name');
      assert.ok(firstUser.email, 'User should have email');
      assert.ok(firstUser.username, 'User should have username');
    });
  });

  it('AUTH-102 GET single user by ID - verify user details', async function () {
    qa.parameters({ userId: '1' });

    let response;
    let user;

    await qa.step('Send GET request to /users/1', async () => {
      response = await fetch(`${BASE_URL}/users/1`);
    });

    await qa.step('Verify response status is 200', async () => {
      assert.strictEqual(response.status, 200);
    });

    await qa.step('Parse user data', async () => {
      user = await response.json();
    });

    await qa.step('Verify user is Leanne Graham', async () => {
      assert.strictEqual(user.id, 1, 'User ID should be 1');
      assert.strictEqual(user.name, 'Leanne Graham', 'User name should be Leanne Graham');
      assert.strictEqual(user.email, 'Sincere@april.biz', 'Email should match expected value');
    });
  });

  it('AUTH-103 POST create user - verify 201 response and returned ID', async function () {
    qa.fields({ layer: 'api', severity: 'critical' });

    const newUser = {
      name: 'Jane Doe',
      username: 'janedoe',
      email: 'jane@example.com',
    };
    let response;
    let created;

    await qa.step('Send POST request to /users', async () => {
      response = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
    });

    await qa.step('Verify response status is 201', async () => {
      assert.strictEqual(response.status, 201);
    });

    await qa.step('Parse created user', async () => {
      created = await response.json();
    });

    await qa.step('Verify returned ID and attach payload', async () => {
      assert.ok(created.id, 'Created user should have an id');
      qa.attach({
        name: 'created-user.json',
        content: JSON.stringify(created, null, 2),
        contentType: 'application/json',
      });
    });

    qa.comment('JSONPlaceholder fakes writes — resource is not persisted');
  });

  it('AUTH-104 DELETE user - verify 200 response', async function () {
    let response;

    await qa.step('Send DELETE request to /users/1', async () => {
      response = await fetch(`${BASE_URL}/users/1`, { method: 'DELETE' });
    });

    await qa.step('Verify response status is 200', async () => {
      assert.strictEqual(response.status, 200);
    });
  });
});

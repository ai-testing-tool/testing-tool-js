export {};

const BASE = 'https://jsonplaceholder.typicode.com';

describe('User CRUD Operations', () => {
  test('AUTH-101 GET all users - verify 10 users returned', async () => {
    const response = await fetch(`${BASE}/users`);
    expect(response.status).toBe(200);

    const users = (await response.json()) as unknown[];
    expect(users).toHaveLength(10);

    const first = users[0] as Record<string, unknown>;
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('email');
    expect(first).toHaveProperty('address');
  });

  test('AUTH-102 GET single user by ID - verify user 1 is Leanne Graham', async () => {
    const response = await fetch(`${BASE}/users/1`);
    expect(response.status).toBe(200);

    const user = (await response.json()) as {
      id: number;
      name: string;
      email: string;
      address: { street: string; city: string; zipcode: string; geo: { lat: string; lng: string } };
    };

    expect(user.id).toBe(1);
    expect(user.name).toBe('Leanne Graham');
    expect(user.email).toBe('Sincere@april.biz');
    expect(user.address).toHaveProperty('street');
    expect(user.address).toHaveProperty('city');
    expect(user.address).toHaveProperty('zipcode');
    expect(user.address.geo).toHaveProperty('lat');
    expect(user.address.geo).toHaveProperty('lng');
  });

  test('AUTH-103 POST create user - verify 201 response and returned ID', async () => {
    const newUser = {
      name: 'John Doe',
      username: 'johndoe',
      email: 'john.doe@example.com',
    };

    const response = await fetch(`${BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });

    expect(response.status).toBe(201);

    const createdUser = (await response.json()) as { id: number };
    expect(createdUser).toHaveProperty('id');
    expect(createdUser.id).toBeGreaterThan(0);
  });

  test('AUTH-104 DELETE user - verify 200 response', async () => {
    const response = await fetch(`${BASE}/users/1`, { method: 'DELETE' });
    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result).toEqual({});
  });
});

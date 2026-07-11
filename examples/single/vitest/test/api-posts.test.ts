import { describe, expect, test } from 'vitest';

const BASE = 'https://jsonplaceholder.typicode.com';

describe('Post Validation', () => {
  test('AUTH-105 GET all posts - verify 100 posts returned', async () => {
    const response = await fetch(`${BASE}/posts`);
    expect(response.status).toBe(200);

    const posts = (await response.json()) as unknown[];
    expect(posts).toHaveLength(100);

    const firstPost = posts[0] as Record<string, unknown>;
    expect(firstPost).toHaveProperty('userId');
    expect(firstPost).toHaveProperty('id');
    expect(firstPost).toHaveProperty('title');
    expect(firstPost).toHaveProperty('body');
  });

  test('AUTH-106 GET posts by user ID - verify filtered results', async () => {
    const response = await fetch(`${BASE}/posts?userId=1`);
    expect(response.status).toBe(200);

    const posts = (await response.json()) as Array<{
      userId: number;
      title: string;
      body: string;
    }>;
    expect(posts).toHaveLength(10);

    for (const post of posts) {
      expect(post.userId).toBe(1);
      expect(post.title.length).toBeGreaterThan(0);
      expect(post.body.length).toBeGreaterThan(0);
    }
  });

  test('AUTH-107 GET post with comments - verify comment structure', async () => {
    const response = await fetch(`${BASE}/posts/1/comments`);
    expect(response.status).toBe(200);

    const comments = (await response.json()) as Array<{
      postId: number;
      id: number;
      name: string;
      email: string;
      body: string;
    }>;
    expect(comments.length).toBeGreaterThan(0);

    const firstComment = comments[0];
    expect(firstComment).toHaveProperty('postId');
    expect(firstComment).toHaveProperty('id');
    expect(firstComment).toHaveProperty('name');
    expect(firstComment).toHaveProperty('email');
    expect(firstComment).toHaveProperty('body');
    expect(firstComment.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});

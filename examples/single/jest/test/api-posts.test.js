const { qa } = require('@ai-testing-tool/forge-jest/jest');

const BASE_URL = 'https://jsonplaceholder.typicode.com';

describe('JSONPlaceholder API - Post Validation', () => {
  test('GET all posts returns 100 posts', async () => {
    await qa.issueKeys(['AUTH-105']);
    await qa.fields({ layer: 'api', severity: 'normal', priority: 'high' });
    await qa.suite('API Tests\tPosts\tList');

    await qa.step('Send GET request to /posts endpoint', async () => {
      const response = await fetch(`${BASE_URL}/posts`);
      expect(response.status).toBe(200);

      const posts = await response.json();
      expect(Array.isArray(posts)).toBe(true);
      expect(posts.length).toBe(100);
    });

    await qa.step('Verify post structure', async () => {
      const response = await fetch(`${BASE_URL}/posts`);
      const posts = await response.json();
      const firstPost = posts[0];

      expect(firstPost).toHaveProperty('id');
      expect(firstPost).toHaveProperty('userId');
      expect(firstPost).toHaveProperty('title');
      expect(firstPost).toHaveProperty('body');
    });
  });

  test('GET posts filtered by user ID returns correct results', async () => {
    await qa.issueKeys(['AUTH-106']);
    await qa.parameters({ userId: '1', filterType: 'query_parameter' });
    await qa.fields({ layer: 'api', severity: 'normal' });
    await qa.suite('API Tests\tPosts\tFilter');

    await qa.step('Send GET request with userId filter', async () => {
      const response = await fetch(`${BASE_URL}/posts?userId=1`);
      expect(response.status).toBe(200);

      const posts = await response.json();
      expect(Array.isArray(posts)).toBe(true);
      expect(posts.length).toBe(10);
    });

    await qa.step('Verify all posts belong to user 1', async () => {
      const response = await fetch(`${BASE_URL}/posts?userId=1`);
      const posts = await response.json();

      posts.forEach((post) => {
        expect(post.userId).toBe(1);
      });
    });
  });

  test('GET post with comments returns nested data', async () => {
    await qa.issueKeys(['AUTH-107']);
    await qa.fields({ layer: 'api', severity: 'normal', priority: 'medium' });
    await qa.suite('API Tests\tPosts\tComments');

    let postData;

    await qa.step('Fetch post by ID', async () => {
      const response = await fetch(`${BASE_URL}/posts/1`);
      expect(response.status).toBe(200);

      postData = await response.json();
      expect(postData.id).toBe(1);
      expect(postData.title).toBeTruthy();
    });

    await qa.step('Fetch comments for the post', async () => {
      const response = await fetch(`${BASE_URL}/posts/1/comments`);
      expect(response.status).toBe(200);

      const comments = await response.json();
      expect(Array.isArray(comments)).toBe(true);
      expect(comments.length).toBe(5);

      await qa.attach({
        name: 'post-with-comments.json',
        content: JSON.stringify({ post: postData, comments }, null, 2),
        contentType: 'application/json',
      });
    });

    await qa.step('Verify comment structure', async () => {
      const response = await fetch(`${BASE_URL}/posts/1/comments`);
      const comments = await response.json();
      const firstComment = comments[0];

      expect(firstComment).toHaveProperty('postId');
      expect(firstComment).toHaveProperty('id');
      expect(firstComment).toHaveProperty('name');
      expect(firstComment).toHaveProperty('email');
      expect(firstComment).toHaveProperty('body');
      expect(firstComment.postId).toBe(1);
    });
  });
});

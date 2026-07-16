const { qa } = require('@qanalyzer/forge-mocha/mocha');
const assert = require('assert');

describe('JSONPlaceholder Post Validation', function () {
  const BASE_URL = 'https://jsonplaceholder.typicode.com';

  it('AUTH-105 GET all posts - verify 100 posts returned', async function () {
    qa.fields({ priority: 'high' });

    let response;
    let posts;

    await qa.step('Send GET request to /posts endpoint', async () => {
      response = await fetch(`${BASE_URL}/posts`);
    });

    await qa.step('Verify response status is 200', async () => {
      assert.strictEqual(response.status, 200);
    });

    await qa.step('Parse posts data', async () => {
      posts = await response.json();
    });

    await qa.step('Verify 100 posts are returned', async () => {
      assert.strictEqual(Array.isArray(posts), true, 'Response should be an array');
      assert.strictEqual(posts.length, 100, 'Should have exactly 100 posts');
    });

    await qa.step('Verify post structure', async () => {
      const firstPost = posts[0];
      assert.ok(firstPost.id, 'Post should have id');
      assert.ok(firstPost.userId, 'Post should have userId');
      assert.ok(firstPost.title, 'Post should have title');
      assert.ok(firstPost.body, 'Post should have body');
    });
  });

  it('AUTH-106 GET posts by user ID - verify filtered results', async function () {
    const testUserId = 1;
    qa.parameters({ userId: String(testUserId) });

    let response;
    let posts;

    await qa.step(`Send GET /posts?userId=${testUserId}`, async () => {
      response = await fetch(`${BASE_URL}/posts?userId=${testUserId}`);
    });

    await qa.step('Verify response status is 200', async () => {
      assert.strictEqual(response.status, 200);
    });

    await qa.step('Parse and verify all posts belong to user', async () => {
      posts = await response.json();
      assert.ok(posts.length > 0, 'Should return posts for user');
      posts.forEach((post) => {
        assert.strictEqual(post.userId, testUserId);
      });
    });
  });

  it('AUTH-107 GET post with comments - verify comment structure', async function () {
    let post;
    let comments;

    await qa.step('Fetch post 1', async () => {
      const response = await fetch(`${BASE_URL}/posts/1`);
      assert.strictEqual(response.status, 200);
      post = await response.json();
    });

    await qa.step('Fetch comments for post 1', async () => {
      const response = await fetch(`${BASE_URL}/posts/1/comments`);
      assert.strictEqual(response.status, 200);
      comments = await response.json();
    });

    await qa.step('Verify comments belong to post', async () => {
      assert.ok(comments.length > 0, 'Post should have comments');
      comments.forEach((comment) => {
        assert.strictEqual(comment.postId, post.id);
        assert.ok(comment.email, 'Comment should have email');
        assert.ok(comment.body, 'Comment should have body');
      });
      qa.attach({
        name: 'post-comments-sample.json',
        content: JSON.stringify(
          { postId: post.id, commentCount: comments.length, sample: comments.slice(0, 2) },
          null,
          2,
        ),
        contentType: 'application/json',
      });
    });
  });
});

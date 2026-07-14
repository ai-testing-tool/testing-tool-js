const { qa } = require('qa-mocha/mocha');
const assert = require('assert');

describe('JSONPlaceholder Advanced Features', function () {
  const BASE_URL = 'https://jsonplaceholder.typicode.com';

  it('AUTH-111 Complex nested steps - multi-resource retrieval', async function () {
    qa.fields({ layer: 'api', severity: 'normal', priority: 'medium' });

    let user;
    let userPosts;
    let firstPostComments;

    await qa.step('Retrieve user and their content', async () => {
      await qa.step('Fetch user data', async () => {
        const response = await fetch(`${BASE_URL}/users/1`);
        assert.strictEqual(response.status, 200);
        user = await response.json();
        assert.strictEqual(user.name, 'Leanne Graham');
      });

      await qa.step('Fetch user posts', async () => {
        const response = await fetch(`${BASE_URL}/posts?userId=${user.id}`);
        assert.strictEqual(response.status, 200);
        userPosts = await response.json();
        assert.ok(userPosts.length > 0, 'User should have posts');
      });

      await qa.step('Fetch comments for first post', async () => {
        const firstPost = userPosts[0];
        const response = await fetch(`${BASE_URL}/posts/${firstPost.id}/comments`);
        assert.strictEqual(response.status, 200);
        firstPostComments = await response.json();
        assert.ok(firstPostComments.length > 0, 'Post should have comments');
      });
    });

    await qa.step('Verify data relationships', async () => {
      await qa.step('Verify all posts belong to user', async () => {
        userPosts.forEach((post) => {
          assert.strictEqual(post.userId, user.id, 'All posts should belong to the user');
        });
      });

      await qa.step('Verify all comments belong to the post', async () => {
        const firstPostId = userPosts[0].id;
        firstPostComments.forEach((comment) => {
          assert.strictEqual(
            comment.postId,
            firstPostId,
            'All comments should belong to the post',
          );
        });
      });
    });

    qa.comment(
      `Retrieved data for user "${user.name}" with ${userPosts.length} posts and ${firstPostComments.length} comments on first post`,
    );
  });

  it('AUTH-112 Suite hierarchy demonstration', async function () {
    qa.suite('API Tests\tAdvanced\tRelationships');
    qa.fields({ layer: 'api', severity: 'low' });

    let albums;
    let photos;

    await qa.step('Test album and photo relationships', async () => {
      const albumResponse = await fetch(`${BASE_URL}/albums/1`);
      const album = await albumResponse.json();
      assert.strictEqual(album.id, 1);

      const photosResponse = await fetch(`${BASE_URL}/albums/1/photos`);
      photos = await photosResponse.json();
      assert.ok(photos.length > 0, 'Album should have photos');

      albums = [album];
    });

    await qa.step('Verify photo structure', async () => {
      const firstPhoto = photos[0];
      assert.ok(firstPhoto.id, 'Photo should have id');
      assert.ok(firstPhoto.albumId, 'Photo should have albumId');
      assert.ok(firstPhoto.title, 'Photo should have title');
      assert.ok(firstPhoto.url, 'Photo should have url');
      assert.ok(firstPhoto.thumbnailUrl, 'Photo should have thumbnailUrl');
    });

    // Sync step (NFR26)
    qa.step('Confirm album was captured', () => {
      assert.ok(albums && albums.length === 1);
    });

    qa.attach({
      name: 'album-photos-sample.json',
      content: JSON.stringify(
        {
          album: albums[0],
          photoCount: photos.length,
          samplePhotos: photos.slice(0, 3),
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });
  });

  it('AUTH-113 Parameterized test pattern - multiple user IDs', async function () {
    const userIds = [1, 2, 3];
    qa.parameters({ userIds: userIds.join(', ') });

    const allUsers = [];

    await qa.step('Fetch multiple users', async () => {
      for (const id of userIds) {
        const response = await fetch(`${BASE_URL}/users/${id}`);
        assert.strictEqual(response.status, 200);
        allUsers.push(await response.json());
      }
    });

    await qa.step('Verify each user has expected shape', async () => {
      assert.strictEqual(allUsers.length, userIds.length);
      allUsers.forEach((user, index) => {
        assert.strictEqual(user.id, userIds[index]);
        assert.ok(user.name);
        assert.ok(user.email);
      });
    });
  });

  it.skip('AUTH-114 Future feature - API authentication', function () {
    qa.ignore();
    qa.comment('Placeholder for future auth coverage');
  });
});

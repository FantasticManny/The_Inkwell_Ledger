const pool = require('./pool');

// ═══════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════

async function findUserById(id) {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, avatar_url, provider, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

async function findUserByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

async function findOrCreateOAuthUser({ provider, providerId, name, email, avatarUrl }) {
  // Try to find by provider + provider_id
  const { rows: existing } = await pool.query(
    'SELECT * FROM users WHERE provider = $1 AND provider_id = $2',
    [provider, providerId]
  );
  if (existing[0]) return existing[0];

  // Try to find by email (link accounts)
  if (email) {
    const { rows: byEmail } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (byEmail[0]) {
      // Link OAuth to existing account
      const { rows: updated } = await pool.query(
        'UPDATE users SET provider = $1, provider_id = $2, avatar_url = COALESCE(avatar_url, $3) WHERE id = $4 RETURNING *',
        [provider, providerId, avatarUrl, byEmail[0].id]
      );
      return updated[0];
    }
  }

  // Create new user — first user with ADMIN_EMAIL gets admin role
  const role = email && email === process.env.ADMIN_EMAIL ? 'admin' : 'user';
  const { rows: created } = await pool.query(
    `INSERT INTO users (name, email, provider, provider_id, avatar_url, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name || 'Anonymous', email, provider, providerId, avatarUrl, role]
  );
  return created[0];
}

// ═══════════════════════════════════════════════════════════
// POSTS — PUBLIC
// ═══════════════════════════════════════════════════════════

async function getPublishedPosts({ page = 1, limit = 10, tagSlug = null } = {}) {
  const offset = (page - 1) * limit;
  const params = [limit, offset];
  let tagJoin = '';
  let tagWhere = '';

  if (tagSlug) {
    tagJoin = `JOIN post_tags pt2 ON p.id = pt2.post_id JOIN tags tf ON pt2.tag_id = tf.id`;
    tagWhere = `AND tf.slug = $3`;
    params.push(tagSlug);
  }

  const { rows } = await pool.query(`
    SELECT
      p.id, p.title, p.slug, p.excerpt, p.cover_image,
      p.published_at, p.views, p.created_at,
      u.name AS author_name, u.avatar_url AS author_avatar,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT('name', t.name, 'slug', t.slug)
          ORDER BY t.name
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'
      ) AS tags
    FROM posts p
    JOIN users u ON p.author_id = u.id
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    ${tagJoin}
    WHERE p.status = 'published' ${tagWhere}
    GROUP BY p.id, u.name, u.avatar_url
    ORDER BY p.published_at DESC
    LIMIT $1 OFFSET $2
  `, params);
  return rows;
}

async function countPublishedPosts(tagSlug = null) {
  if (tagSlug) {
    const { rows } = await pool.query(`
      SELECT COUNT(DISTINCT p.id) AS total
      FROM posts p
      JOIN post_tags pt ON p.id = pt.post_id
      JOIN tags t ON pt.tag_id = t.id
      WHERE p.status = 'published' AND t.slug = $1
    `, [tagSlug]);
    return parseInt(rows[0].total);
  }
  const { rows } = await pool.query(
    "SELECT COUNT(*) AS total FROM posts WHERE status = 'published'"
  );
  return parseInt(rows[0].total);
}

async function getPostBySlug(slug) {
  const { rows } = await pool.query(`
    SELECT
      p.*,
      u.name AS author_name, u.avatar_url AS author_avatar,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT('name', t.name, 'slug', t.slug)
          ORDER BY t.name
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'
      ) AS tags
    FROM posts p
    JOIN users u ON p.author_id = u.id
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    WHERE p.slug = $1 AND p.status = 'published'
    GROUP BY p.id, u.name, u.avatar_url
  `, [slug]);
  return rows[0] || null;
}

async function incrementPostViews(id) {
  await pool.query('UPDATE posts SET views = views + 1 WHERE id = $1', [id]);
}

// ═══════════════════════════════════════════════════════════
// POSTS — ADMIN
// ═══════════════════════════════════════════════════════════

async function getAllPosts({ page = 1, limit = 20, status = null, search = null } = {}) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [limit, offset];

  if (status) { conditions.push(`p.status = $${params.length + 1}`); params.push(status); }
  if (search) { conditions.push(`(p.title ILIKE $${params.length + 1} OR p.excerpt ILIKE $${params.length + 1})`); params.push(`%${search}%`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(`
    SELECT
      p.id, p.title, p.slug, p.status, p.views,
      p.published_at, p.created_at, p.updated_at,
      u.name AS author_name,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT('id', t.id, 'name', t.name, 'slug', t.slug)
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'
      ) AS tags
    FROM posts p
    JOIN users u ON p.author_id = u.id
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    ${where}
    GROUP BY p.id, u.name
    ORDER BY p.updated_at DESC
    LIMIT $1 OFFSET $2
  `, params);
  return rows;
}

async function getPostById(id) {
  const { rows } = await pool.query(`
    SELECT
      p.*,
      u.name AS author_name,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT('id', t.id, 'name', t.name, 'slug', t.slug)
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'
      ) AS tags
    FROM posts p
    JOIN users u ON p.author_id = u.id
    LEFT JOIN post_tags pt ON p.id = pt.post_id
    LEFT JOIN tags t ON pt.tag_id = t.id
    WHERE p.id = $1
    GROUP BY p.id, u.name
  `, [id]);
  return rows[0] || null;
}

async function createPost({ title, slug, content, contentHtml, excerpt, coverImage, status, authorId, tagIds = [] }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`
      INSERT INTO posts (title, slug, content, content_html, excerpt, cover_image, status, author_id, published_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [title, slug, JSON.stringify(content), contentHtml, excerpt, coverImage, status, authorId,
        status === 'published' ? new Date() : null]);
    const post = rows[0];

    if (tagIds.length) {
      const tagValues = tagIds.map((tid, i) => `($1, $${i + 2})`).join(', ');
      await client.query(
        `INSERT INTO post_tags (post_id, tag_id) VALUES ${tagValues}`,
        [post.id, ...tagIds]
      );
    }
    await client.query('COMMIT');
    return post;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updatePost(id, { title, slug, content, contentHtml, excerpt, coverImage, status, tagIds = [] }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current status to set published_at correctly
    const { rows: current } = await client.query('SELECT status, published_at FROM posts WHERE id = $1', [id]);
    const wasPublished = current[0]?.status === 'published';
    const publishedAt = status === 'published' && !wasPublished ? new Date() : current[0]?.published_at;

    const { rows } = await client.query(`
      UPDATE posts SET
        title = $1, slug = $2, content = $3, content_html = $4,
        excerpt = $5, cover_image = $6, status = $7,
        published_at = $8, updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [title, slug, JSON.stringify(content), contentHtml, excerpt, coverImage, status, publishedAt, id]);

    // Replace tag associations
    await client.query('DELETE FROM post_tags WHERE post_id = $1', [id]);
    if (tagIds.length) {
      const tagValues = tagIds.map((tid, i) => `($1, $${i + 2})`).join(', ');
      await client.query(
        `INSERT INTO post_tags (post_id, tag_id) VALUES ${tagValues}`,
        [id, ...tagIds]
      );
    }
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deletePost(id) {
  await pool.query('DELETE FROM posts WHERE id = $1', [id]);
}

// ═══════════════════════════════════════════════════════════
// TAGS
// ═══════════════════════════════════════════════════════════

async function getAllTags() {
  const { rows } = await pool.query(`
    SELECT t.*, COUNT(pt.post_id)::int AS post_count
    FROM tags t
    LEFT JOIN post_tags pt ON t.id = pt.tag_id
    LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 'published'
    GROUP BY t.id
    ORDER BY t.name ASC
  `);
  return rows;
}

async function getTagBySlug(slug) {
  const { rows } = await pool.query('SELECT * FROM tags WHERE slug = $1', [slug]);
  return rows[0] || null;
}

async function createTag({ name, slug }) {
  const { rows } = await pool.query(
    'INSERT INTO tags (name, slug) VALUES ($1, $2) RETURNING *',
    [name, slug]
  );
  return rows[0];
}

async function updateTag(id, { name, slug }) {
  const { rows } = await pool.query(
    'UPDATE tags SET name = $1, slug = $2 WHERE id = $3 RETURNING *',
    [name, slug, id]
  );
  return rows[0];
}

async function deleteTag(id) {
  await pool.query('DELETE FROM tags WHERE id = $1', [id]);
}

// ═══════════════════════════════════════════════════════════
// COMMENTS
// ═══════════════════════════════════════════════════════════

async function getApprovedComments(postId) {
  const { rows } = await pool.query(`
    SELECT c.*, u.name AS author_name, u.avatar_url AS author_avatar
    FROM comments c
    JOIN users u ON c.author_id = u.id
    WHERE c.post_id = $1 AND c.approved = true
    ORDER BY c.created_at ASC
  `, [postId]);
  return rows;
}

async function getAllComments({ approved = null } = {}) {
  const where = approved !== null ? `WHERE c.approved = ${approved}` : '';
  const { rows } = await pool.query(`
    SELECT c.*, u.name AS author_name, p.title AS post_title, p.slug AS post_slug
    FROM comments c
    JOIN users u ON c.author_id = u.id
    JOIN posts p ON c.post_id = p.id
    ${where}
    ORDER BY c.created_at DESC
  `);
  return rows;
}

async function createComment({ postId, authorId, body }) {
  const { rows } = await pool.query(
    'INSERT INTO comments (post_id, author_id, body) VALUES ($1, $2, $3) RETURNING *',
    [postId, authorId, body]
  );
  return rows[0];
}

async function updateCommentApproval(id, approved) {
  const { rows } = await pool.query(
    'UPDATE comments SET approved = $1 WHERE id = $2 RETURNING *',
    [approved, id]
  );
  return rows[0];
}

async function deleteComment(id) {
  await pool.query('DELETE FROM comments WHERE id = $1', [id]);
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════

async function getDashboardStats() {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM posts WHERE status = 'published')::int AS published_count,
      (SELECT COUNT(*) FROM posts WHERE status = 'draft')::int AS draft_count,
      (SELECT COUNT(*) FROM posts WHERE status = 'archived')::int AS archived_count,
      (SELECT COALESCE(SUM(views), 0) FROM posts)::int AS total_views,
      (SELECT COUNT(*) FROM comments WHERE approved = false)::int AS pending_comments,
      (SELECT COUNT(*) FROM comments)::int AS total_comments,
      (SELECT COUNT(*) FROM users)::int AS total_users
  `);

  const { rows: topPosts } = await pool.query(`
    SELECT id, title, slug, views, status
    FROM posts
    ORDER BY views DESC
    LIMIT 5
  `);

  return { ...rows[0], top_posts: topPosts };
}

module.exports = {
  findUserById, findUserByEmail, findOrCreateOAuthUser,
  getPublishedPosts, countPublishedPosts, getPostBySlug, incrementPostViews,
  getAllPosts, getPostById, createPost, updatePost, deletePost,
  getAllTags, getTagBySlug, createTag, updateTag, deleteTag,
  getApprovedComments, getAllComments, createComment, updateCommentApproval, deleteComment,
  getDashboardStats,
};

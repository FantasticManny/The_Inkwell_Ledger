import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

const STATUS_FILTERS = ['all', 'published', 'draft', 'archived'];

export default function PostList() {
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('all');
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = {};
    if (search) params.search = search;
    if (status !== 'all') params.status = status;
    api.getPosts(params)
      .then(setPosts)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function handleDelete(id, title) {
    if (!confirm(`Delete "${title}"?\n\nThis cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.deletePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-label">Content</p>
          <h1 className="page-title">Posts</h1>
        </div>
        <Link to="/posts/new" className="btn btn--primary">+ New Post</Link>
      </header>

      {/* FILTERS */}
      <div className="list-controls">
        <input
          type="search"
          placeholder="Search posts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="list-search"
        />
        <div className="status-filters">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={`filter-btn ${status === f ? 'filter-btn--active' : ''}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* STATE */}
      {loading && <div className="page-loading">Loading posts…</div>}
      {error   && <div className="page-error">Error: {error}</div>}

      {!loading && !error && posts.length === 0 && (
        <div className="empty-state">
          <p>No posts found.</p>
          <Link to="/posts/new" className="btn btn--primary" style={{ marginTop: 16 }}>
            Create your first post →
          </Link>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="posts-table">
          <div className="posts-table-head">
            <span>Title</span>
            <span>Tags</span>
            <span>Status</span>
            <span>Views</span>
            <span>Updated</span>
            <span></span>
          </div>
          {posts.map(post => (
            <div key={post.id} className="posts-table-row">
              <div className="posts-table-title">
                <span>{post.title}</span>
                <span className="posts-table-slug">{post.slug}</span>
              </div>
              <div className="posts-table-tags">
                {post.tags?.slice(0, 3).map(t => (
                  <span key={t.id} className="admin-tag">#{t.name}</span>
                ))}
              </div>
              <span className={`status-badge status-badge--${post.status}`}>{post.status}</span>
              <span className="posts-table-views">{post.views.toLocaleString()}</span>
              <span className="posts-table-date">
                {new Date(post.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <div className="posts-table-actions">
                {post.status === 'published' && (
                  <a href={`/blog/${post.slug}`} target="_blank" rel="noopener" className="action-btn" title="View">↗</a>
                )}
                <button onClick={() => navigate(`/posts/${post.id}/edit`)} className="action-btn" title="Edit">✎</button>
                <button
                  onClick={() => handleDelete(post.id, post.title)}
                  className="action-btn action-btn--danger"
                  disabled={deleting === post.id}
                  title="Delete"
                >
                  {deleting === post.id ? '…' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

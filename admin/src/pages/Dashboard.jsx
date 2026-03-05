import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`stat-card ${accent ? 'stat-card--accent' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value ?? '—'}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getDashboard()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard…</div>;
  if (error)   return <div className="page-error">Error: {error}</div>;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-label">Overview</p>
          <h1 className="page-title">Dashboard</h1>
        </div>
        <Link to="/posts/new" className="btn btn--primary">+ New Post</Link>
      </header>

      <div className="stats-grid">
        <StatCard label="Published" value={stats.published_count} sub="posts live" accent />
        <StatCard label="Drafts"    value={stats.draft_count}     sub="in progress" />
        <StatCard label="Archived"  value={stats.archived_count}  sub="posts" />
        <StatCard label="Total Views" value={stats.total_views?.toLocaleString()} sub="across all posts" />
        <StatCard label="Pending"   value={stats.pending_comments} sub="comments to review" />
        <StatCard label="Users"     value={stats.total_users}     sub="registered" />
      </div>

      {stats.top_posts?.length > 0 && (
        <section className="dash-section">
          <h2 className="dash-section-title">Top Posts by Views</h2>
          <div className="dash-table">
            <div className="dash-table-head">
              <span>Title</span>
              <span>Status</span>
              <span>Views</span>
              <span></span>
            </div>
            {stats.top_posts.map(post => (
              <div key={post.id} className="dash-table-row">
                <span className="dash-post-title">{post.title}</span>
                <span className={`status-badge status-badge--${post.status}`}>{post.status}</span>
                <span className="dash-views">{post.views.toLocaleString()}</span>
                <Link to={`/posts/${post.id}/edit`} className="dash-edit-link">Edit →</Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {stats.pending_comments > 0 && (
        <div className="dash-alert">
          <span>⚠ {stats.pending_comments} comment{stats.pending_comments !== 1 ? 's' : ''} awaiting moderation</span>
          <Link to="/comments?filter=pending" className="dash-alert-link">Review →</Link>
        </div>
      )}
    </div>
  );
}

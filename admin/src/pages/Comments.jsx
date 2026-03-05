import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';

const FILTERS = [
  { value: '',      label: 'All' },
  { value: 'false', label: 'Pending' },
  { value: 'true',  label: 'Approved' },
];

export default function Comments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('filter') === 'pending' ? 'false' : (searchParams.get('approved') || '');

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filter !== '') params.approved = filter;
    api.getComments(params)
      .then(setComments)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id, approved) {
    try {
      const updated = await api.updateComment(id, { approved });
      setComments(prev => prev.map(c => c.id === id ? { ...c, approved } : c));
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this comment?')) return;
    try {
      await api.deleteComment(id);
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  }

  const pending  = comments.filter(c => !c.approved).length;
  const approved = comments.filter(c =>  c.approved).length;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-label">Moderation</p>
          <h1 className="page-title">Comments</h1>
        </div>
        <div className="comments-counts">
          <span className="status-badge status-badge--draft">{pending} pending</span>
          <span className="status-badge status-badge--published">{approved} approved</span>
        </div>
      </header>

      {/* FILTER TABS */}
      <div className="list-controls">
        <div className="status-filters">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => {
                const p = new URLSearchParams();
                if (f.value) p.set('approved', f.value);
                setSearchParams(p);
              }}
              className={`filter-btn ${filter === f.value ? 'filter-btn--active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="page-loading">Loading comments…</div>}
      {error   && <div className="page-error">{error}</div>}

      {!loading && !error && comments.length === 0 && (
        <div className="empty-state"><p>No comments found.</p></div>
      )}

      {!loading && !error && comments.length > 0 && (
        <div className="comments-mod-list">
          {comments.map(comment => (
            <div key={comment.id} className={`comment-mod-card ${comment.approved ? 'comment-mod-card--approved' : 'comment-mod-card--pending'}`}>
              <div className="comment-mod-header">
                <div className="comment-mod-meta">
                  <strong className="comment-mod-author">{comment.author_name}</strong>
                  <span className="comment-mod-post">
                    on <a href={`/blog/${comment.post_slug}`} target="_blank" rel="noopener">
                      {comment.post_title}
                    </a>
                  </span>
                  <time className="comment-mod-time">
                    {new Date(comment.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </time>
                </div>
                <span className={`status-badge status-badge--${comment.approved ? 'published' : 'draft'}`}>
                  {comment.approved ? 'Approved' : 'Pending'}
                </span>
              </div>
              <p className="comment-mod-body">{comment.body}</p>
              <div className="comment-mod-actions">
                {!comment.approved ? (
                  <button
                    onClick={() => handleApprove(comment.id, true)}
                    className="btn btn--primary"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    ✓ Approve
                  </button>
                ) : (
                  <button
                    onClick={() => handleApprove(comment.id, false)}
                    className="btn btn--ghost"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    Unapprove
                  </button>
                )}
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="btn btn--ghost"
                  style={{ padding: '6px 14px', fontSize: '12px', borderColor: '#f76f6f', color: '#f76f6f' }}
                >
                  ✕ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

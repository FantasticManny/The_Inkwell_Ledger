import { useState, useEffect } from 'react';
import { api } from '../api/client.js';

export default function Tags() {
  const [tags, setTags]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editId, setEditId]   = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    api.getTags()
      .then(setTags)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const tag = await api.createTag({ name: newName.trim() });
      setTags(prev => [...prev, tag]);
      setNewName('');
    } catch (err) {
      alert('Create failed: ' + err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return;
    try {
      const tag = await api.updateTag(id, { name: editName.trim() });
      setTags(prev => prev.map(t => t.id === id ? tag : t));
      setEditId(null);
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete tag "#${name}"?\nThis will remove it from all posts.`)) return;
    try {
      await api.deleteTag(id);
      setTags(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  }

  if (loading) return <div className="page-loading">Loading tags…</div>;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-label">Taxonomy</p>
          <h1 className="page-title">Tags</h1>
        </div>
      </header>

      {error && <div className="page-error">{error}</div>}

      {/* CREATE FORM */}
      <form onSubmit={handleCreate} className="create-form">
        <input
          type="text"
          className="editor-input"
          placeholder="New tag name…"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          maxLength={50}
        />
        <button type="submit" disabled={creating || !newName.trim()} className="btn btn--primary">
          {creating ? 'Creating…' : '+ Add Tag'}
        </button>
      </form>

      {/* TAGS LIST */}
      {tags.length === 0 ? (
        <div className="empty-state"><p>No tags yet.</p></div>
      ) : (
        <div className="tags-list">
          {tags.map(tag => (
            <div key={tag.id} className="tag-row">
              {editId === tag.id ? (
                <div className="tag-edit">
                  <input
                    type="text"
                    className="editor-input"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                    maxLength={50}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleUpdate(tag.id);
                      if (e.key === 'Escape') setEditId(null);
                    }}
                  />
                  <button onClick={() => handleUpdate(tag.id)} className="btn btn--primary" style={{ padding: '6px 12px' }}>Save</button>
                  <button onClick={() => setEditId(null)} className="btn btn--ghost" style={{ padding: '6px 12px' }}>Cancel</button>
                </div>
              ) : (
                <>
                  <div className="tag-info">
                    <span className="tag-name">#{tag.name}</span>
                    <span className="tag-count-badge">{tag.post_count} post{tag.post_count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="tag-actions">
                    <button
                      onClick={() => { setEditId(tag.id); setEditName(tag.name); }}
                      className="action-btn"
                      title="Edit"
                    >✎</button>
                    <a href={`/tag/${tag.slug}`} target="_blank" rel="noopener" className="action-btn" title="View">↗</a>
                    <button
                      onClick={() => handleDelete(tag.id, tag.name)}
                      className="action-btn action-btn--danger"
                      title="Delete"
                    >✕</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

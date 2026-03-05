import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import Editor from '../components/Editor.jsx';

const EMPTY = { title: '', excerpt: '', coverImage: '', status: 'draft', tagIds: [], content: null, contentHtml: '' };

export default function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm]         = useState(EMPTY);
  const [tags, setTags]         = useState([]);
  const [loading, setLoading]   = useState(isEdit);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [saved, setSaved]       = useState(false);
  const coverInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.getTags().then(setTags).catch(console.error);
    if (isEdit) {
      api.getPost(id)
        .then(post => {
          setForm({
            title:       post.title || '',
            excerpt:     post.excerpt || '',
            coverImage:  post.cover_image || '',
            status:      post.status || 'draft',
            tagIds:      post.tags?.map(t => t.id) || [],
            content:     post.content || null,
            contentHtml: post.content_html || '',
          });
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  function set(field) {
    return (e) => setForm(prev => ({ ...prev, [field]: e.target?.value ?? e }));
  }

  function toggleTag(tagId) {
    setForm(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(t => t !== tagId)
        : [...prev.tagIds, tagId],
    }));
  }

  function handleEditorChange({ json, html }) {
    setForm(prev => ({ ...prev, content: json, contentHtml: html }));
  }

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      setForm(prev => ({ ...prev, coverImage: url }));
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(statusOverride) {
    const payload = { ...form, status: statusOverride || form.status };
    if (!payload.title.trim()) { setError('Title is required.'); return; }

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      if (isEdit) {
        await api.updatePost(id, payload);
      } else {
        const post = await api.createPost(payload);
        navigate(`/posts/${post.id}/edit`, { replace: true });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page-loading">Loading post…</div>;

  return (
    <div className="editor-page">
      {/* TOP BAR */}
      <div className="editor-topbar">
        <Link to="/posts" className="editor-back">← Posts</Link>
        <h1 className="editor-topbar-title">{isEdit ? 'Edit Post' : 'New Post'}</h1>
        <div className="editor-topbar-actions">
          {error  && <span className="editor-error">{error}</span>}
          {saved  && <span className="editor-saved">✓ Saved</span>}
          <button onClick={() => handleSave('draft')} disabled={saving} className="btn btn--ghost">
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button onClick={() => handleSave('published')} disabled={saving} className="btn btn--primary">
            {form.status === 'published' ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="editor-body">
        {/* MAIN EDITOR */}
        <div className="editor-main">
          <input
            type="text"
            className="editor-title-input"
            placeholder="Post title…"
            value={form.title}
            onChange={set('title')}
          />
          <textarea
            className="editor-excerpt-input"
            placeholder="Short excerpt / teaser (optional)…"
            value={form.excerpt}
            onChange={set('excerpt')}
            rows={2}
          />
          <Editor
            content={form.content || form.contentHtml}
            onChange={handleEditorChange}
          />
        </div>

        {/* SIDEBAR */}
        <aside className="editor-sidebar">

          {/* Status */}
          <div className="editor-panel">
            <h3 className="editor-panel-title">Status</h3>
            <select
              value={form.status}
              onChange={set('status')}
              className="editor-select"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Cover Image */}
          <div className="editor-panel">
            <h3 className="editor-panel-title">Cover Image</h3>
            {form.coverImage ? (
              <div className="cover-preview">
                <img src={form.coverImage} alt="Cover" />
                <button
                  onClick={() => setForm(prev => ({ ...prev, coverImage: '' }))}
                  className="cover-remove"
                >✕ Remove</button>
              </div>
            ) : (
              <button
                onClick={() => coverInputRef.current?.click()}
                className="cover-upload-btn"
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : '+ Upload cover image'}
              </button>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              style={{ display: 'none' }}
            />
            <input
              type="url"
              className="editor-input"
              placeholder="Or paste an image URL…"
              value={form.coverImage}
              onChange={set('coverImage')}
              style={{ marginTop: 8 }}
            />
          </div>

          {/* Tags */}
          <div className="editor-panel">
            <h3 className="editor-panel-title">Tags</h3>
            {tags.length === 0 && (
              <p className="editor-hint">
                No tags yet. <Link to="/tags">Create some →</Link>
              </p>
            )}
            <div className="tag-checkboxes">
              {tags.map(tag => (
                <label key={tag.id} className="tag-checkbox">
                  <input
                    type="checkbox"
                    checked={form.tagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                  />
                  <span>#{tag.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          {isEdit && (
            <div className="editor-panel editor-panel--danger">
              <h3 className="editor-panel-title">Danger Zone</h3>
              <button
                onClick={() => handleSave('archived')}
                disabled={saving}
                className="btn btn--ghost"
                style={{ width: '100%', borderColor: '#f76f6f', color: '#f76f6f' }}
              >
                Archive Post
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

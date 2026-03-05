const BASE = '';

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });

  if (res.status === 401) {
    window.location.href = '/login?redirect=/admin';
    return;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.error || data.errors?.[0]?.msg || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

export const api = {
  // Dashboard
  getDashboard: () => apiFetch('/dashboard'),

  // Posts
  getPosts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/posts${q ? `?${q}` : ''}`);
  },
  getPost:    (id)  => apiFetch(`/posts/${id}`),
  createPost: (data) => apiFetch('/posts', { method: 'POST', body: JSON.stringify(data) }),
  updatePost: (id, data) => apiFetch(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePost: (id)  => apiFetch(`/posts/${id}`, { method: 'DELETE' }),

  // Tags
  getTags:    ()    => apiFetch('/tags'),
  createTag:  (data) => apiFetch('/tags', { method: 'POST', body: JSON.stringify(data) }),
  updateTag:  (id, data) => apiFetch(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTag:  (id)  => apiFetch(`/tags/${id}`, { method: 'DELETE' }),

  // Comments
  getComments: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/comments${q ? `?${q}` : ''}`);
  },
  updateComment: (id, data) => apiFetch(`/comments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteComment: (id) => apiFetch(`/comments/${id}`, { method: 'DELETE' }),

  // Upload
  uploadImage: async (file) => {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  // Me
  getMe: () => apiFetch('/me'),
};

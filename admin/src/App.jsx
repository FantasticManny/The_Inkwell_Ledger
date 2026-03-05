import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './api/client.js';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PostList from './pages/PostList.jsx';
import PostEditor from './pages/PostEditor.jsx';
import Tags from './pages/Tags.jsx';
import Comments from './pages/Comments.jsx';

//   Auth Context              ──
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe()
      .then(setUser)
      .catch(() => { window.location.href = '/login?redirect=/admin'; })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>Loading CMS…</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    window.location.href = '/login?redirect=/admin';
    return null;
  }

  return (
    <AuthContext.Provider value={{ user }}>
      <BrowserRouter basename="/admin">
        <AdminLayout>
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/posts"         element={<PostList />} />
            <Route path="/posts/new"     element={<PostEditor />} />
            <Route path="/posts/:id/edit" element={<PostEditor />} />
            <Route path="/tags"          element={<Tags />} />
            <Route path="/comments"      element={<Comments />} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </AdminLayout>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

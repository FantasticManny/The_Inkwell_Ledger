import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../App.jsx';

const NAV = [
  { to: '/',         label: 'Dashboard', icon: '◈' },
  { to: '/posts',    label: 'Posts',     icon: '✦' },
  { to: '/tags',     label: 'Tags',      icon: '#' },
  { to: '/comments', label: 'Comments',  icon: '◇' },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <a href="/" className="sidebar-logo" target="_blank" rel="noopener">
          The Inkwell Ledger
        </a>
        <span className="sidebar-cms-tag">CMS</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
          >
            <span className="sidebar-icon" aria-hidden="true">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user.avatar_url && (
          <img src={user.avatar_url} alt="" className="sidebar-avatar" aria-hidden="true" />
        )}
        <div className="sidebar-user">
          <span className="sidebar-user-name">{user.name}</span>
          <span className="sidebar-user-role">Admin</span>
        </div>
        <a href="/auth/logout" className="sidebar-logout" title="Sign out">⏻</a>
      </div>
    </aside>
  );
}

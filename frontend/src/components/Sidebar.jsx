import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  IconChat,
  IconCart,
  IconInfo,
  IconUpload,
  IconChart,
  IconSun,
  IconMoon,
  IconUser,
  IconLogOut,
  IconLogIn,
  IconChevronRight,
  IconChevronLeft,
  IconMail,
} from './Icons';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 900;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const onResize = () => {
      const wide = mq.matches;
      setExpanded(wide);
      if (wide) setMobileOpen(false);
    };
    mq.addEventListener('change', onResize);
    onResize();
    return () => mq.removeEventListener('change', onResize);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const showLabels = expanded || mobileOpen;

  const nav = (
    <nav className="sidebar-nav">
      <NavLink to="/chat" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
        <span className="sidebar-icon"><IconChat /></span>
        <span className="sidebar-label">Chat</span>
      </NavLink>
      <NavLink to="/market" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
        <span className="sidebar-icon"><IconCart /></span>
        <span className="sidebar-label">Market</span>
      </NavLink>
      <NavLink to="/about" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
        <span className="sidebar-icon"><IconInfo /></span>
        <span className="sidebar-label">About</span>
      </NavLink>
      <NavLink to="/explore" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
        <span className="sidebar-icon"><IconUser /></span>
        <span className="sidebar-label">Explore</span>
      </NavLink>
      {user && (
        <>
          <NavLink to="/messages" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
            <span className="sidebar-icon"><IconMail /></span>
            <span className="sidebar-label">Messages</span>
          </NavLink>
          <NavLink to="/upload" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
            <span className="sidebar-icon"><IconUpload /></span>
            <span className="sidebar-label">Upload</span>
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>
            <span className="sidebar-icon"><IconChart /></span>
            <span className="sidebar-label">Dashboard</span>
          </NavLink>
        </>
      )}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Open menu"
      >
        <span className="sidebar-hamburger" data-open={mobileOpen} />
        <span className="sidebar-hamburger" data-open={mobileOpen} />
        <span className="sidebar-hamburger" data-open={mobileOpen} />
      </button>

      <div className={`sidebar-backdrop ${mobileOpen ? 'open' : ''}`} onClick={closeMobile} aria-hidden="true" />

      <aside className={`sidebar ${expanded ? 'expanded' : 'collapsed'} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-inner">
          <div className="sidebar-header">
            {showLabels ? (
              <span className="sidebar-brand">
                <img src="/logo.png" alt="" className="sidebar-brand-icon" />
                <span className="sidebar-brand-text">ADA AI</span>
              </span>
            ) : (
              <button type="button" className="sidebar-expand-btn" onClick={() => setExpanded(true)} aria-label="Expand sidebar">
                <img src="/logo.png" alt="ADA AI" className="sidebar-brand-icon" />
              </button>
            )}
            {expanded && !mobileOpen && (
              <button type="button" className="sidebar-collapse-btn" onClick={() => setExpanded(false)} aria-label="Collapse sidebar">
                <IconChevronLeft />
              </button>
            )}
          </div>
          {nav}
          <div className="sidebar-footer">
            <button type="button" className="sidebar-link theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              <span className="sidebar-icon">{theme === 'dark' ? <IconSun /> : <IconMoon />}</span>
              <span className="sidebar-label">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
            {user ? (
              <>
                <div className="sidebar-user">
                  <span className="sidebar-icon"><IconUser /></span>
                  <span className="sidebar-user-email">{user.email}</span>
                </div>
                <button
                  type="button"
                  className="sidebar-link"
                  onClick={() => { logout(); closeMobile(); navigate('/'); }}
                >
                  <span className="sidebar-icon"><IconLogOut /></span>
                  <span className="sidebar-label">Log out</span>
                </button>
              </>
            ) : (
              <NavLink to="/login" className="sidebar-link" onClick={closeMobile}>
                <span className="sidebar-icon"><IconLogIn /></span>
                <span className="sidebar-label">Log in</span>
              </NavLink>
            )}
          </div>
        </div>
        <style>{`
          .sidebar-mobile-toggle { display: none; position: fixed; top: 0.75rem; left: 0.75rem; z-index: 100; width: 44px; height: 44px; border-radius: var(--radius-sm); background: var(--surface); border: 1px solid var(--border); flex-direction: column; align-items: center; justify-content: center; gap: 5px; }
          .sidebar-hamburger { width: 20px; height: 2px; background: var(--text); border-radius: 1px; transition: transform 0.2s, opacity 0.2s; }
          .sidebar-mobile-toggle [data-open="true"]:nth-child(1) { transform: translateY(7px) rotate(45deg); }
          .sidebar-mobile-toggle [data-open="true"]:nth-child(2) { opacity: 0; }
          .sidebar-mobile-toggle [data-open="true"]:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
          .sidebar-backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 98; opacity: 0; transition: opacity 0.2s; }
          .sidebar-backdrop.open { display: block; opacity: 1; }
          .sidebar { position: fixed; left: 0; top: 0; bottom: 0; z-index: 99; width: 260px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; transition: width 0.2s, transform 0.2s; }
          .sidebar.collapsed { width: 56px; }
          .sidebar.collapsed .sidebar-label { display: none; }
          .sidebar.mobile-open .sidebar-label { display: block; }
          .sidebar-inner { display: flex; flex-direction: column; flex: 1; min-height: 0; padding: 0.75rem 0; }
          .sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 0 0.75rem 1rem; min-height: 40px; }
          .sidebar-brand { display: flex; align-items: center; gap: 0.5rem; color: var(--text); font-weight: 700; letter-spacing: 0.01em; }
          .sidebar-brand-text { white-space: nowrap; }
          .sidebar-brand-icon { width: 26px; height: 26px; object-fit: contain; }
          .sidebar-expand-btn, .sidebar-collapse-btn { padding: 0.35rem 0.5rem; background: transparent; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-muted); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
          .sidebar-expand-btn:hover, .sidebar-collapse-btn:hover { color: var(--text); }
          .sidebar-nav { display: flex; flex-direction: column; gap: 0.25rem; padding: 0 0.5rem; flex: 1; overflow-y: auto; }
          .sidebar-link { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem; border-radius: var(--radius-sm); color: var(--text-muted); text-decoration: none; font-weight: 500; font-size: 0.95rem; border: none; background: none; width: 100%; text-align: left; cursor: pointer; transition: background 0.15s, color 0.15s; min-height: 44px; }
          .sidebar-link:hover { background: var(--surface-hover); color: var(--text); }
          .sidebar-link.active { background: var(--surface-hover); color: var(--accent); }
          .sidebar-link .sidebar-icon { flex-shrink: 0; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; }
          .sidebar-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: inherit; }
          .sidebar-footer { padding: 0.5rem 0.5rem 0; border-top: 1px solid var(--border); margin-top: auto; display: flex; flex-direction: column; gap: 0.25rem; }
          .sidebar-user { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; font-size: 0.9rem; color: var(--text-muted); overflow: hidden; min-height: 44px; }
          .sidebar-user .sidebar-icon { flex-shrink: 0; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; }
          .sidebar-user-email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
          .theme-toggle { margin-bottom: 0.25rem; }
          @media (max-width: 899px) {
            .sidebar-mobile-toggle { display: flex; }
            .sidebar-mobile-toggle { left: auto; right: 0.75rem; }
            .sidebar { width: 280px; transform: translateX(-100%); }
            .sidebar.mobile-open { transform: translateX(0); }
            .sidebar.collapsed { width: 280px; }
            .sidebar.expanded .sidebar-collapse-btn { display: none; }
            .sidebar .sidebar-label { display: block !important; }
            .sidebar-link, .sidebar-user { font-size: 1rem; }
            .sidebar-brand-icon { width: 24px; height: 24px; }
          }
          @media (min-width: 900px) {
            .sidebar-mobile-toggle { display: none; }
          }
        `}</style>
      </aside>
    </>
  );
}

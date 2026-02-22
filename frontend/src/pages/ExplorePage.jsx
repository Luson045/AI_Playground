import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersList } from '../api/client';

export default function ExplorePage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await usersList();
        if (!cancelled) setUsers(list);
      } catch (_) {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="explore-loading">Loading…</div>;

  return (
    <div className="explore-page">
      <header className="explore-header">
        <h1>Explore</h1>
        <p className="explore-sub">Discover sellers and connect.</p>
      </header>
      <div className="explore-grid">
        {users.map((u) => (
          <Link key={u._id} to={'/explore/' + u._id} className="explore-card">
            <div className="explore-card-avatar">
              {u.avatar ? (
                <img src={u.avatar} alt="" />
              ) : (
                <span className="explore-card-initial">{(u.name || u.email || '?').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="explore-card-body">
              <h3 className="explore-card-name">{u.name || u.email}</h3>
              <p className="explore-card-meta">{u.productCount} product{u.productCount !== 1 ? 's' : ''}</p>
              {u.bio && <p className="explore-card-bio">{(u.bio || '').slice(0, 80)}{u.bio.length > 80 ? '…' : ''}</p>}
            </div>
          </Link>
        ))}
      </div>
      {users.length === 0 && (
        <div className="explore-empty">
          <p>No users to show yet.</p>
        </div>
      )}
      <style>{`.explore-page{padding:0 0 2rem;max-width:900px;margin:0 auto}.explore-header{margin-bottom:1.5rem}.explore-header h1{font-size:1.75rem;font-weight:700;margin:0 0 .25rem}.explore-sub{color:var(--text-muted);margin:0;font-size:.95rem}.explore-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem}.explore-card{display:flex;gap:1rem;padding:1rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);text-decoration:none;color:inherit;transition:border-color .2s}.explore-card:hover{border-color:var(--accent)}.explore-card-avatar{width:56px;height:56px;border-radius:50%;background:var(--surface-hover);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center}.explore-card-avatar img{width:100%;height:100%;object-fit:cover}.explore-card-initial{font-size:1.5rem;font-weight:600;color:var(--accent)}.explore-card-body{min-width:0}.explore-card-name{font-size:1rem;font-weight:600;margin:0 0 .25rem}.explore-card-meta{font-size:.85rem;color:var(--text-muted);margin:0 0 .35rem}.explore-card-bio{font-size:.85rem;color:var(--text-muted);margin:0;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.explore-empty{text-align:center;padding:3rem;color:var(--text-muted)}.explore-loading{padding:2rem;text-align:center;color:var(--text-muted)}`}</style>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userProfile, userFollow, userUnfollow, messageSend } from '../api/client';

export default function UserProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [form, setForm] = useState({ subject: '', body: '' });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await userProfile(id);
        if (!cancelled) setProfile(p);
      } catch (_) {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleFollow = async () => {
    if (!profile || !currentUser) return;
    try {
      if (profile.isFollowing) {
        await userUnfollow(profile._id);
        setProfile((prev) => (prev ? { ...prev, isFollowing: false } : null));
      } else {
        await userFollow(profile._id);
        setProfile((prev) => (prev ? { ...prev, isFollowing: true } : null));
      }
    } catch (_) {}
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!profile || !currentUser || !form.body.trim() || sending) return;
    setSending(true);
    try {
      await messageSend(profile._id, form.body.trim(), form.subject.trim());
      setForm({ subject: '', body: '' });
      setMessageSent(true);
    } catch (_) {}
    setSending(false);
  };

  if (loading) return <div className="profile-loading">Loading…</div>;
  if (!profile) return <div className="profile-error">User not found. <Link to="/explore">Back to Explore</Link></div>;

  const isOwnProfile = currentUser && String(currentUser._id) === String(profile._id);

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">
          {profile.avatar ? (
            <img src={profile.avatar} alt="" />
          ) : (
            <span className="profile-initial">{(profile.name || profile.email || '?').charAt(0).toUpperCase()}</span>
          )}
        </div>
        <h1 className="profile-name">{profile.name || profile.email}</h1>
        <p className="profile-email">{profile.email}</p>
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        <p className="profile-meta">{profile.productCount} product{profile.productCount !== 1 ? 's' : ''} listed</p>
        <div className="profile-actions">
          <Link to={`/market?seller=${profile._id}`} className="btn btn-ghost">View their products in Market</Link>
          {!isOwnProfile && currentUser && (
            <>
              <button type="button" className={`btn ${profile.isFollowing ? 'btn-ghost' : 'btn-primary'}`} onClick={handleFollow}>
                {profile.isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            </>
          )}
        </div>
      </div>

      {!isOwnProfile && currentUser && (
        <section className="profile-message-section">
          <h2>Send a message</h2>
          {messageSent && <p className="profile-message-success">Message sent.</p>}
          <form onSubmit={handleSendMessage} className="profile-message-form">
            <input
              type="text"
              placeholder="Subject (optional)"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="profile-input"
            />
            <textarea
              placeholder="Message…"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className="profile-textarea"
              rows={4}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={sending || !form.body.trim()}>
              {sending ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </section>
      )}

      <p className="profile-back"><Link to="/explore">← Back to Explore</Link></p>

      <style>{`
        .profile-page { padding: 0 0 2rem; max-width: 560px; margin: 0 auto; }
        .profile-card { text-align: center; padding: 2rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 1.5rem; }
        .profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: var(--surface-hover); margin: 0 auto 1rem; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .profile-initial { font-size: 2rem; font-weight: 600; color: var(--accent); }
        .profile-name { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.25rem; }
        .profile-email { font-size: 0.9rem; color: var(--text-muted); margin: 0 0 0.75rem; }
        .profile-bio { font-size: 0.95rem; color: var(--text); margin: 0 0 0.75rem; line-height: 1.5; }
        .profile-meta { font-size: 0.9rem; color: var(--text-muted); margin: 0 0 1rem; }
        .profile-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }
        .profile-message-section { padding: 1.5rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 1rem; }
        .profile-message-section h2 { font-size: 1.1rem; margin: 0 0 1rem; }
        .profile-message-success { color: var(--success); font-size: 0.9rem; margin: 0 0 0.75rem; }
        .profile-message-form { display: flex; flex-direction: column; gap: 0.75rem; }
        .profile-input, .profile-textarea { padding: 0.65rem; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 0.95rem; }
        .profile-textarea { resize: vertical; min-height: 100px; }
        .profile-back { font-size: 0.9rem; margin-top: 1rem; }
        .profile-loading, .profile-error { padding: 2rem; text-align: center; }
        .profile-error { color: var(--text-muted); }
      `}</style>
    </div>
  );
}

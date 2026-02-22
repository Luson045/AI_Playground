import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messagesGet, messageMarkRead } from '../api/client';

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ inbox: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('inbox');

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const d = await messagesGet();
        if (!cancelled) setData(d);
      } catch (_) {}
      finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, navigate]);

  const markRead = async (msg) => {
    if (msg.readAt) return;
    try {
      await messageMarkRead(msg._id);
      setData((prev) => ({
        ...prev,
        inbox: prev.inbox.map((m) => (m._id === msg._id ? { ...m, readAt: new Date() } : m)),
      }));
    } catch (_) {}
  };

  if (!user) return null;
  if (loading) return <div className="messages-loading">Loading…</div>;

  const list = tab === 'inbox' ? data.inbox : data.sent;

  return (
    <div className="messages-page">
      <header className="messages-header">
        <h1>Messages</h1>
        <p className="messages-sub">Your inbox and sent messages.</p>
        <div className="messages-tabs">
          <button type="button" className={tab === 'inbox' ? 'active' : ''} onClick={() => setTab('inbox')}>Inbox ({data.inbox.length})</button>
          <button type="button" className={tab === 'sent' ? 'active' : ''} onClick={() => setTab('sent')}>Sent ({data.sent.length})</button>
        </div>
      </header>
      <div className="messages-list">
        {list.length === 0 ? (
          <p className="messages-empty">{tab === 'inbox' ? 'No messages yet.' : 'No sent messages.'}</p>
        ) : (
          list.map((m) => {
            const other = tab === 'inbox' ? m.from : m.to;
            const name = other?.name || other?.email || 'Unknown';
            return (
              <div
                key={m._id}
                className={'messages-item' + (tab === 'inbox' && !m.readAt ? ' unread' : '')}
                onClick={() => tab === 'inbox' && markRead(m)}
              >
                <div className="messages-item-head">
                  <Link to={'/explore/' + (other?._id)} className="messages-item-from" onClick={(e) => e.stopPropagation()}>
                    {name}
                  </Link>
                  <span className="messages-item-date">{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
                {m.subject && <div className="messages-item-subject">{m.subject}</div>}
                <p className="messages-item-body">{(m.body || '').slice(0, 200)}{(m.body || '').length > 200 ? '…' : ''}</p>
              </div>
            );
          })
        )}
      </div>
      <style>{`
        .messages-page { padding: 0 0 2rem; max-width: 640px; margin: 0 auto; }
        .messages-header { margin-bottom: 1.5rem; }
        .messages-header h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.25rem; }
        .messages-sub { color: var(--text-muted); margin: 0 0 1rem; font-size: 0.95rem; }
        .messages-tabs { display: flex; gap: 0.5rem; }
        .messages-tabs button { padding: 0.5rem 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-muted); cursor: pointer; font-size: 0.9rem; }
        .messages-tabs button.active { background: var(--surface-hover); color: var(--accent); border-color: var(--accent); }
        .messages-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .messages-item { padding: 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); cursor: pointer; }
        .messages-item.unread { border-left: 3px solid var(--accent); }
        .messages-item-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; }
        .messages-item-from { font-weight: 600; color: var(--accent); }
        .messages-item-date { font-size: 0.8rem; color: var(--text-muted); }
        .messages-item-subject { font-size: 0.9rem; font-weight: 500; margin-bottom: 0.25rem; }
        .messages-item-body { font-size: 0.9rem; color: var(--text-muted); margin: 0; line-height: 1.4; }
        .messages-empty { color: var(--text-muted); padding: 2rem; text-align: center; }
        .messages-loading { padding: 2rem; text-align: center; color: var(--text-muted); }
      `}</style>
    </div>
  );
}

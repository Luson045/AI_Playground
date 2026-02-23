import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ratingCreate } from '../api/client';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'rating_popup_state_v1';
const SHOW_DELAY_MS = 8000;
const DISMISS_DAYS = 30;

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeState(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

function shouldShow() {
  const state = readState();
  if (!state) return true;
  const now = Date.now();
  const hold = DISMISS_DAYS * 24 * 60 * 60 * 1000;
  if (state.submittedAt && now - state.submittedAt < hold) return false;
  if (state.dismissedAt && now - state.dismissedAt < hold) return false;
  return true;
}

export default function RatingPopup({ enabled = true }) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [star, setStar] = useState(0);
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const timerRef = useRef(null);

  const greeting = useMemo(() => {
    if (user?.name) return `Hey ${user.name}, mind sharing a quick rating?`;
    return 'Mind sharing a quick rating?';
  }, [user]);

  useEffect(() => {
    if (!enabled || !shouldShow()) return;
    timerRef.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled]);

  const dismiss = () => {
    setVisible(false);
    writeState({ dismissedAt: Date.now() });
  };

  const submit = async () => {
    if (!star || sending) return;
    setSending(true);
    setSent(true);
    writeState({ submittedAt: Date.now() });
    try {
      await ratingCreate({ star, comment: comment.trim(), source: 'popup' });
    } catch {}
  };

  if (!visible) return null;

  return (
    <div className="rating-pop">
      <button type="button" className="rating-pop-close" onClick={dismiss} aria-label="Close">
        ×
      </button>
      {!sent ? (
        <>
          <div className="rating-pop-title">{greeting}</div>
          <div className="rating-pop-sub">Your feedback helps us keep things smooth and useful.</div>
          <div className="rating-pop-stars" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`rating-pop-star ${star >= n ? 'is-on' : ''}`}
                onClick={() => setStar(n)}
                aria-pressed={star >= n}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="rating-pop-input"
            placeholder="Anything we could improve? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <div className="rating-pop-actions">
            <button type="button" className="btn btn-ghost" onClick={dismiss}>
              Not now
            </button>
            <button type="button" className="btn btn-primary" onClick={submit} disabled={!star || sending}>
              Send
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="rating-pop-title">Thanks for the feedback!</div>
          <div className="rating-pop-sub">We appreciate you taking a moment to rate the experience.</div>
          <div className="rating-pop-actions">
            <button type="button" className="btn btn-primary" onClick={dismiss}>
              Close
            </button>
          </div>
        </>
      )}

      <style>{`
        .rating-pop {
          position: fixed;
          right: 22px;
          bottom: 22px;
          width: min(360px, calc(100vw - 32px));
          background: linear-gradient(135deg, rgba(17,24,39,0.98), rgba(15,23,42,0.98));
          border: 1px solid rgba(148,163,184,0.2);
          border-radius: 16px;
          padding: 1rem 1rem 0.9rem;
          color: #f8fafc;
          box-shadow: 0 14px 40px rgba(0,0,0,0.28);
          z-index: 40;
          animation: popIn 240ms ease-out;
        }
        .rating-pop-title { font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem; }
        .rating-pop-sub { font-size: 0.85rem; color: rgba(226,232,240,0.8); margin-bottom: 0.75rem; }
        .rating-pop-stars { display: flex; gap: 0.25rem; margin-bottom: 0.65rem; }
        .rating-pop-star {
          font-size: 1.4rem;
          line-height: 1;
          background: transparent;
          border: none;
          color: rgba(148,163,184,0.7);
          cursor: pointer;
          transition: transform 0.1s, color 0.1s;
        }
        .rating-pop-star.is-on { color: #fbbf24; }
        .rating-pop-star:hover { transform: translateY(-1px); color: #fbbf24; }
        .rating-pop-input {
          width: 100%;
          background: rgba(15,23,42,0.7);
          border: 1px solid rgba(148,163,184,0.3);
          color: #e2e8f0;
          border-radius: 10px;
          padding: 0.55rem 0.65rem;
          font-size: 0.85rem;
          resize: none;
        }
        .rating-pop-input:focus { outline: none; border-color: #38bdf8; }
        .rating-pop-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.65rem; }
        .rating-pop-close {
          position: absolute;
          top: 8px;
          right: 10px;
          border: none;
          background: transparent;
          color: rgba(226,232,240,0.7);
          font-size: 1.2rem;
          cursor: pointer;
        }
        @keyframes popIn { from { transform: translateY(6px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @media (max-width: 640px) {
          .rating-pop { right: 16px; left: 16px; width: auto; }
        }
      `}</style>
    </div>
  );
}

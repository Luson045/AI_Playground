import React, { useState, useRef, useEffect } from 'react';
import { chatSend, chatClick, ratingCreate } from '../api/client';

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatChatText(text) {
  const safe = escapeHtml(String(text || ''));
  const withBold = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return withBold.replace(/\n{2,}/g, '<br><br>').replace(/\n/g, '<br>');
}

function getSessionId() {
  let s = sessionStorage.getItem('chatSessionId');
  if (!s) {
    s = crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('chatSessionId', s);
  }
  return s;
}

function ThinkingBox({ steps }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div className="chat-thinking">
      {steps.map((step, i) => (
        <div key={i} className="chat-thinking-step">
          {step.type === 'variations' && (
            <>
              <span className="chat-thinking-label">Query variations</span>
              <ul>
                {step.queries?.map((q, j) => (
                  <li key={j}>{q}</li>
                ))}
              </ul>
            </>
          )}
          {step.type === 'search' && (
            <span className="chat-thinking-search">
              Searching &ldquo;{step.query}&rdquo; → {step.count} result{step.count !== 1 ? 's' : ''}
            </span>
          )}
          {step.type === 'fallback' && (
            <span className="chat-thinking-fallback">{step.message}</span>
          )}
          {step.type === 'done' && (
            <span className="chat-thinking-done">Found {step.totalFound} product{step.totalFound !== 1 ? 's' : ''}</span>
          )}
        </div>
      ))}
    </div>
  );
}

const HISTORY_KEY = 'chatHistory';

export default function ChatPage() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(HISTORY_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [productVisibleCounts, setProductVisibleCounts] = useState({});
  const bottomRef = useRef(null);
  const sessionId = useRef(getSessionId()).current;
  const thinkingTimerRef = useRef(null);
  const INITIAL_PRODUCT_COUNT = 5;
  const PRODUCT_STEP = 5;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    return () => {
      if (window.location.pathname !== '/chat') {
        sessionStorage.removeItem(HISTORY_KEY);
        sessionStorage.removeItem('chatSessionId');
      }
    };
  }, []);

  useEffect(() => {
    setProductVisibleCounts((prev) => {
      let changed = false;
      const next = { ...prev };
      messages.forEach((m, idx) => {
        if (m.role === 'assistant' && m.products?.length && next[idx] == null) {
          next[idx] = Math.min(INITIAL_PRODUCT_COUNT, m.products.length);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [messages]);

  const dismissThinkingForLastAssistant = () => {
    setMessages((prev) => {
      let lastIdx = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].role === 'assistant') {
          lastIdx = i;
          break;
        }
      }
      if (lastIdx < 0) return prev;
      return prev.map((m, i) =>
        i === lastIdx && m.thinking ? { ...m, thinkingDismissed: true } : m
      );
    });
  };

  useEffect(() => {
    const last = messages.length > 0 ? messages[messages.length - 1] : null;
    if (last?.role === 'assistant' && last.thinking?.length && !last.thinkingDismissed) {
      thinkingTimerRef.current = setTimeout(dismissThinkingForLastAssistant, 2500);
      return () => {
        if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
      };
    }
  }, [messages]);

  const isFollowUpFilter = (text) => /cheapest|cheaper|lowest|budget|under|below|within|less than|more than|above|between/i.test(text);

  const lastAssistantProducts = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === 'assistant' && Array.isArray(m.products) && m.products.length) return m.products;
    }
    return [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const contextProducts = isFollowUpFilter(text) ? lastAssistantProducts() : [];
      const { reply, products, thinking } = await chatSend(text, history, sessionId, contextProducts);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: reply,
          products: products || [],
          thinking: thinking || [],
          thinkingDismissed: false,
          feedback: null,
        },
      ]);
    } catch (err) {
      setError(null);
      setMessages((prev) => [...prev, { role: 'assistant', text: "Can't reach the server right now. Please try again in a moment.", products: [] }]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = async (product) => {
    try {
      await chatClick(product._id, sessionId);
    } catch (_) {}
    if (product.link) window.open(product.link, '_blank');
  };

  const handleProductsScroll = (idx, e, force = false) => {
    const el = e.currentTarget;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    const needsMore = remaining <= 80;
    const canForceLoad = force && el.scrollHeight <= el.clientHeight;
    if (!needsMore && !canForceLoad) return;
    setProductVisibleCounts((prev) => {
      const current = prev[idx] ?? INITIAL_PRODUCT_COUNT;
      const total = messages[idx]?.products?.length || 0;
      const nextCount = Math.min(current + PRODUCT_STEP, total);
      if (nextCount === current) return prev;
      return { ...prev, [idx]: nextCount };
    });
  };

  const buildFeedbackComment = (idx) => {
    const userMsg = [...messages]
      .slice(0, idx)
      .reverse()
      .find((m) => m.role === 'user');
    const userText = userMsg?.text || '';
    const assistantText = messages[idx]?.text || '';
    return `"""\n<user>: ${userText},\n<chat>: ${assistantText},\n"""`;
  };

  const handleFeedback = (idx, type) => {
    setMessages((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, feedback: type } : m))
    );
    const star = type === 'up' ? 5 : 0;
    const comment = buildFeedbackComment(idx);
    ratingCreate({ star, comment, source: 'chat-feedback', sessionId }).catch(() => {});
  };

  return (
    <div className="chat-page">
      <div className="chat-hero">
        <h1>What are you looking for?</h1>
        <p>Describe your need and get product recommendations.</p>
      </div>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-placeholder">
              <p>Try: &ldquo;I need a wireless mouse for work&rdquo; or &ldquo;Best budget headphones&rdquo;</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role}`}>
              {msg.role === 'assistant' && msg.thinking?.length > 0 && !msg.thinkingDismissed && (
                <ThinkingBox steps={msg.thinking} />
              )}
              {(msg.role !== 'assistant' || !msg.thinking?.length || msg.thinkingDismissed) && (
                <>
                  {msg.role === 'assistant' ? (
                    <div
                      className="chat-bubble-text"
                      dangerouslySetInnerHTML={{ __html: formatChatText(msg.text) }}
                    />
                  ) : (
                    <div className="chat-bubble-text">{msg.text}</div>
                  )}
                  {msg.role === 'assistant' && (
                    <div className="chat-feedback">
                      <button
                        type="button"
                        className={`chat-feedback-btn ${msg.feedback === 'up' ? 'is-on' : ''}`}
                        onClick={() => handleFeedback(i, 'up')}
                        disabled={!!msg.feedback}
                        aria-label="Thumbs up"
                      >
                        👍
                      </button>
                      <button
                        type="button"
                        className={`chat-feedback-btn ${msg.feedback === 'down' ? 'is-on' : ''}`}
                        onClick={() => handleFeedback(i, 'down')}
                        disabled={!!msg.feedback}
                        aria-label="Thumbs down"
                      >
                        👎
                      </button>
                    </div>
                  )}
                  {msg.products?.length > 0 && (
                    <div
                      className="chat-products"
                      onScroll={(e) => handleProductsScroll(i, e)}
                      onWheel={(e) => handleProductsScroll(i, e, true)}
                    >
                      {msg.products.slice(0, productVisibleCounts[i] ?? INITIAL_PRODUCT_COUNT).map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          className="chat-product-card"
                          onClick={() => handleProductClick(p)}
                        >
                          {p.imageUrl && (
                            <img src={p.imageUrl} alt="" className="chat-product-img" />
                          )}
                          <div className="chat-product-info">
                            <strong>{p.name}</strong>
                            {p.sellerName && <span className="chat-product-seller">by {p.sellerName}</span>}
                            <span className="chat-product-desc">{(p.description || '').slice(0, 80)}{(p.description || '').length > 80 ? '…' : ''}</span>
                            <span className="chat-product-price">₹{Number(p.price).toFixed(2)}</span>
                          </div>
                        </button>
                      ))}
                      {msg.products.length > (productVisibleCounts[i] ?? INITIAL_PRODUCT_COUNT) && (
                        <div className="chat-products-more">Scroll for more</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {loading && (
            <div className="chat-bubble assistant">
              <div className="chat-bubble-text typing">Searching & matching products…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="chat-input"
            placeholder="Ask for a product recommendation…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary chat-send" disabled={loading} aria-label="Send message">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V6" />
              <path d="M7 11l5-5 5 5" />
            </svg>
          </button>
        </form>
      </div>
      <style>{`
        .chat-page { padding: 0.75rem 0 1rem; display: flex; flex-direction: column; min-height: 100vh; flex: 1; }
        .chat-hero { text-align: center; margin-bottom: 1.25rem; }
        .chat-hero h1 { font-size: clamp(1.5rem, 2.6vw, 2rem); font-weight: 700; margin: 0 0 0.35rem; letter-spacing: -0.02em; }
        .chat-hero p { color: var(--text-muted); margin: 0; font-size: 0.95rem; }
        .chat-container { display: flex; flex-direction: column; flex: 1; min-height: 0; position: relative; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 1.25rem 1.25rem 6.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .chat-placeholder { color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 1.5rem; }
        .chat-bubble { max-width: min(88%, 640px); align-self: flex-start; }
        .chat-bubble.user { align-self: flex-end; }
        .chat-bubble-text { padding: 0.85rem 1.1rem; border-radius: 14px; background: var(--surface-hover); white-space: pre-wrap; line-height: 1.6; font-size: 0.98rem; letter-spacing: 0.01em; word-break: break-word; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04); }
        .chat-bubble.user .chat-bubble-text { background: linear-gradient(135deg, var(--accent), #4f46e5); color: white; }
        .chat-bubble-text strong { font-weight: 700; }
        .chat-bubble .typing { opacity: 0.8; }
        .chat-thinking { padding: 0.75rem 1rem; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-muted); }
        .chat-thinking-step { margin-bottom: 0.35rem; }
        .chat-thinking-step:last-child { margin-bottom: 0; }
        .chat-thinking-label { font-weight: 600; color: var(--text); }
        .chat-thinking ul { margin: 0.25rem 0 0 1rem; padding: 0; }
        .chat-thinking-search, .chat-thinking-fallback, .chat-thinking-done { display: block; margin-top: 0.25rem; }
        .chat-products { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; margin-top: 0.75rem; height: 220px; overflow-y: auto; padding-right: 0.35rem; overscroll-behavior: contain; scrollbar-gutter: stable; }
        .chat-product-card { display: flex; gap: 0.75rem; align-items: center; padding: 0.65rem; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); text-align: left; color: var(--text); cursor: pointer; transition: border-color 0.15s, background 0.15s; width: 100%; }
        .chat-product-card:hover { border-color: var(--accent); background: var(--surface-hover); }
        .chat-product-img { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; }
        .chat-product-info { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
        .chat-product-info strong { font-size: 0.9rem; }
        .chat-product-seller { font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 0.1rem; }
        .chat-product-desc { font-size: 0.8rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .chat-product-price { font-size: 0.85rem; font-weight: 600; color: var(--accent); }
        .chat-products-more { grid-column: 1 / -1; text-align: center; font-size: 0.8rem; color: var(--text-muted); padding: 0.25rem 0 0.5rem; }
        .chat-feedback { display: flex; gap: 0.35rem; margin-top: 0.35rem; }
        .chat-feedback-btn {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 0.9rem;
          padding: 0.25rem 0.45rem;
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, transform 0.1s;
        }
        .chat-feedback-btn:hover { border-color: var(--accent); transform: translateY(-1px); }
        .chat-feedback-btn.is-on { border-color: var(--accent); background: var(--surface-hover); }
        .chat-feedback-btn:disabled { opacity: 0.55; cursor: default; }
        .chat-error { padding: 0.5rem 1rem; color: #ef4444; font-size: 0.85rem; }
        .chat-form {
          display: flex;
          gap: 0.6rem;
          padding: 0.45rem;
          margin: 0 1rem max(0.75rem, env(safe-area-inset-bottom));
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--surface);
          box-shadow: 0 12px 28px rgba(0,0,0,0.22);
          position: sticky;
          bottom: max(0.75rem, env(safe-area-inset-bottom));
          z-index: 2;
        }
        .chat-input { flex: 1; padding: 0.75rem 1rem; background: transparent; border: none; border-radius: 999px; color: var(--text); font-size: 0.98rem; }
        .chat-input:focus { outline: none; border-color: var(--accent); }
        .chat-send { flex-shrink: 0; width: 44px; height: 44px; border-radius: 999px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
        @media (max-width: 600px) {
          .chat-page { padding: 0; min-height: calc(100vh - 3.5rem); display: flex; flex-direction: column; }
          .chat-hero { margin: 0; padding: 0.75rem 0.9rem 0.5rem; }
          .chat-container {
            flex: 1;
            min-height: 0;
            max-height: none;
            border-radius: 0;
            box-shadow: none;
          }
          .chat-messages { padding: 0.75rem 0.9rem 6.5rem; gap: 0.85rem; }
          .chat-bubble { max-width: 96%; }
          .chat-bubble-text { font-size: 0.98rem; padding: 0.75rem 0.95rem; }
          .chat-form { margin: 0 0.75rem max(0.75rem, env(safe-area-inset-bottom)); }
          .chat-input { font-size: 1rem; }
          .chat-products { height: 200px; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
        }
      `}</style>
    </div>
  );
}

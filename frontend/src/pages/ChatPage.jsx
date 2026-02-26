import React, { useState, useRef, useEffect } from 'react';
import { chatSend, chatClick, ratingCreate } from '../api/client';

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

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [productVisibleCounts, setProductVisibleCounts] = useState({});
  const bottomRef = useRef(null);
  const sessionId = useRef(getSessionId()).current;
  const thinkingTimerRef = useRef(null);
  const INITIAL_PRODUCT_COUNT = 6;
  const PRODUCT_STEP = 6;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current);
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
      const { reply, products, thinking } = await chatSend(text, history, sessionId);
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

  const handleProductsScroll = (idx, e) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight > 80) return;
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
      <div className="chat-container card">
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
                  <div className="chat-bubble-text">{msg.text}</div>
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
                    <div className="chat-products" onScroll={(e) => handleProductsScroll(i, e)}>
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
                            <span className="chat-product-price">${Number(p.price).toFixed(2)}</span>
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
          <button type="submit" className="btn btn-primary chat-send" disabled={loading}>
            Send
          </button>
        </form>
      </div>
      <style>{`
        .chat-page { padding: 0.5rem 0; }
        .chat-hero { text-align: center; margin-bottom: 1.5rem; }
        .chat-hero h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.35rem; letter-spacing: -0.02em; }
        .chat-hero p { color: var(--text-muted); margin: 0; font-size: 0.95rem; }
        .chat-container { display: flex; flex-direction: column; max-height: calc(100vh - 220px); min-height: 420px; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
        .chat-placeholder { color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 1.5rem; }
        .chat-bubble { max-width: 88%; align-self: flex-start; }
        .chat-bubble.user { align-self: flex-end; }
        .chat-bubble-text { padding: 0.85rem 1.1rem; border-radius: var(--radius); background: var(--surface-hover); white-space: pre-line; }
        .chat-bubble.user .chat-bubble-text { background: var(--accent); color: white; }
        .chat-bubble .typing { opacity: 0.8; }
        .chat-thinking { padding: 0.75rem 1rem; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-muted); }
        .chat-thinking-step { margin-bottom: 0.35rem; }
        .chat-thinking-step:last-child { margin-bottom: 0; }
        .chat-thinking-label { font-weight: 600; color: var(--text); }
        .chat-thinking ul { margin: 0.25rem 0 0 1rem; padding: 0; }
        .chat-thinking-search, .chat-thinking-fallback, .chat-thinking-done { display: block; margin-top: 0.25rem; }
        .chat-products { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; margin-top: 0.75rem; max-height: 360px; overflow-y: auto; padding-right: 0.35rem; }
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
        .chat-form { display: flex; gap: 0.5rem; padding: 1rem; border-top: 1px solid var(--border); }
        .chat-input { flex: 1; padding: 0.7rem 1rem; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 0.95rem; }
        .chat-input:focus { outline: none; border-color: var(--accent); }
        .chat-send { flex-shrink: 0; }
      `}</style>
    </div>
  );
}

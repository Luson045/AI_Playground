import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate('/chat', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box card">
        <h1>{mode === 'login' ? 'Log in' : 'Sign up'}</h1>
        <p className="login-hint">
          {mode === 'login'
            ? 'Log in to upload products and view analytics.'
            : 'Create an account to add products and track clicks.'}
        </p>
        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          {mode === 'register' && (
            <div className="input-group">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
          )}
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>
        <p className="login-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
      <p className="login-back">
        <NavLink to="/">← Back</NavLink>
      </p>
      <style>{`
        .login-page { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; padding: 2rem 0; }
        .login-box { width: 100%; max-width: 400px; padding: 1.75rem; }
        .login-box h1 { font-size: 1.5rem; margin: 0 0 0.35rem; }
        .login-hint { color: var(--text-muted); font-size: 0.9rem; margin: 0 0 1.25rem; }
        .login-box form { display: flex; flex-direction: column; gap: 1rem; }
        .login-btn { width: 100%; padding: 0.75rem; margin-top: 0.25rem; }
        .login-switch { text-align: center; margin: 1rem 0 0; font-size: 0.9rem; color: var(--text-muted); }
        .link-btn { background: none; border: none; color: var(--accent); font-size: inherit; padding: 0; }
        .link-btn:hover { text-decoration: underline; }
        .login-back { margin-top: 1rem; font-size: 0.9rem; }
      `}</style>
    </div>
  );
}

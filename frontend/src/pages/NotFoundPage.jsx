import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>This page doesn't exist or has been moved.</p>
      <Link to="/" className="btn btn-primary">Go home</Link>
      <style>{`
        .not-found { min-height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; }
        .not-found h1 { font-size: 4rem; font-weight: 800; margin: 0 0 0.5rem; color: var(--text-muted); }
        .not-found p { margin: 0 0 1.5rem; color: var(--text-muted); }
      `}</style>
    </div>
  );
}

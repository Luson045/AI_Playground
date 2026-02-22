import React from 'react';
import { Link } from 'react-router-dom';

const contact = {
  email: 'hello@adaai.example',
  support: 'support@adaai.example',
};

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-links">
          <Link to="/chat">Chat</Link>
          <Link to="/market">Market</Link>
          <Link to="/explore">Explore</Link>
          <Link to="/about">About</Link>
          <a href={`mailto:${contact.email}`}>Contact</a>
        </div>
        <div className="app-footer-contact">
          <span>Contact: </span>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <span className="app-footer-sep"> · </span>
          <a href={`mailto:${contact.support}`}>Support</a>
        </div>
        <p className="app-footer-copy">© {new Date().getFullYear()} ADA AI. All rights reserved.</p>
      </div>
      <style>{`
        .app-footer { margin-top: auto; padding: 1.5rem 1.5rem 2rem; border-top: 1px solid var(--border); background: var(--surface); }
        .app-footer-inner { max-width: 1200px; margin: 0 auto; text-align: center; }
        .app-footer-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem 1.5rem; margin-bottom: 0.75rem; }
        .app-footer-links a { color: var(--text-muted); font-size: 0.9rem; font-weight: 500; }
        .app-footer-links a:hover { color: var(--accent); }
        .app-footer-contact { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem; }
        .app-footer-contact a { color: var(--accent); }
        .app-footer-sep { color: var(--border); }
        .app-footer-copy { margin: 0; font-size: 0.8rem; color: var(--text-muted); }
      `}</style>
    </footer>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { IconInstagram } from './Icons';

const contact = {
  support: 'support@adaai.co.in',
  instagram: 'https://instagram.com/theadaai',
};

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="app-footer-brand">
          <img src="/icon.png" alt="ADA AI" className="app-footer-logo" />
          <span>ADA AI</span>
        </div>
        <div className="app-footer-links">
          <Link to="/chat">Chat</Link>
          <Link to="/market">Market</Link>
          <Link to="/explore">Explore</Link>
          <Link to="/about">About</Link>
          <a href={`mailto:${contact.email}`}>Contact</a>
        </div>
        <div className="app-footer-contact">
          <a href={`mailto:${contact.support}`}>support@adaai.co.in</a>
        </div>
        <div className="app-footer-social">
          <a href={contact.instagram} target="_blank" rel="noreferrer" aria-label="Follow ADA AI on Instagram">
            <IconInstagram />
            <span>Follow us on Instagram</span>
          </a>
        </div>
        <p className="app-footer-copy">(c) {new Date().getFullYear()} ADA AI. All rights reserved.</p>
      </div>
      <style>{`
        .app-footer { margin-top: auto; padding: 1.5rem 1.5rem 2rem; border-top: 1px solid var(--border); background: var(--surface); }
        .app-footer-inner { max-width: 1200px; margin: 0 auto; text-align: center; }
        .app-footer-brand { display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text); }
        .app-footer-logo { width: 28px; height: 28px; object-fit: contain; }
        .app-footer-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem 1.5rem; margin-bottom: 0.75rem; }
        .app-footer-links a { color: var(--text-muted); font-size: 0.9rem; font-weight: 500; }
        .app-footer-links a:hover { color: var(--accent); }
        .app-footer-contact { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem; }
        .app-footer-contact a { color: var(--accent); }
        .app-footer-sep { color: var(--border); }
        .app-footer-social { display: flex; justify-content: center; margin-bottom: 0.75rem; }
        .app-footer-social a { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.9rem; font-weight: 500; }
        .app-footer-social a:hover { color: var(--accent); }
        .app-footer-copy { margin: 0; font-size: 0.8rem; color: var(--text-muted); }
      `}</style>
    </footer>
  );
}

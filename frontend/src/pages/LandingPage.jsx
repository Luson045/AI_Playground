import React from 'react';
import { Link } from 'react-router-dom';
import { IconChat, IconCart } from '../components/Icons';

function IconSearch() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-logo-wrap">
          <img src="/icon.png" alt="ADA AI" className="landing-logo" />
        </div>
        <p className="landing-tagline">Advertisement Agent AI</p>
        <h1 className="landing-title">
          Find what you need, <span className="landing-accent">faster</span>
        </h1>
        <p className="landing-lead">
          Describe what you want in plain words. Get tailored product recommendations from real sellers—no endless scrolling.
        </p>
        <div className="landing-cta">
          <Link to="/chat" className="btn btn-primary landing-btn landing-btn-primary">
            <IconChat />
            Start exploring
          </Link>
          <Link to="/market" className="btn btn-ghost landing-btn">
            <IconCart />
            Browse marketplace
          </Link>
        </div>
      </section>
      <section className="landing-features">
        <div className="landing-feature">
          <span className="landing-feature-icon"><IconChat /></span>
          <h3>Chat to discover</h3>
          <p>Tell us in plain words. We match you with the right products and sellers.</p>
        </div>
        <div className="landing-feature">
          <span className="landing-feature-icon"><IconCart /></span>
          <h3>Real sellers</h3>
          <p>Every product is listed by a real seller. See who you're buying from.</p>
        </div>
        <div className="landing-feature">
          <span className="landing-feature-icon"><IconSearch /></span>
          <h3>Smart search</h3>
          <p>Search by product name, category, or seller. Filter and sort your way.</p>
        </div>
      </section>
      <section className="landing-cta-block">
        <p>Ready to find your next favorite?</p>
        <Link to="/login" className="btn btn-primary">Log in or sign up</Link>
      </section>
      <style>{`
        .landing { padding: 2rem 1.25rem 4rem; max-width: 1080px; margin: 0 auto; }
        .landing-hero { text-align: center; padding: 2rem 0 3.5rem; }
        .landing-logo-wrap { margin-bottom: 0.75rem; display: flex; justify-content: center; }
        .landing-logo { width: min(200px, 70vw); height: auto; object-fit: contain; }
        .landing-tagline { font-size: 0.85rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); margin: 0 0 0.75rem; }
        .landing-title { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; margin: 0 0 1rem; letter-spacing: -0.03em; line-height: 1.15; color: var(--text); }
        .landing-accent { background: linear-gradient(135deg, var(--accent), #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .landing-lead { font-size: 1.15rem; color: var(--text-muted); margin: 0 0 2rem; max-width: 520px; margin-left: auto; margin-right: auto; line-height: 1.6; }
        .landing-cta { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; }
        .landing-btn { padding: 0.85rem 1.75rem; font-size: 1rem; font-weight: 600; }
        .landing-btn-primary { box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35); }
        .landing-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; margin: 2.5rem 0; }
        .landing-feature { text-align: center; padding: 2rem 1.5rem; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border); transition: border-color 0.2s, box-shadow 0.2s; }
        .landing-feature:hover { border-color: var(--accent); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
        .landing-feature-icon { width: 48px; height: 48px; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; color: var(--accent); }
        .landing-feature h3 { font-size: 1.15rem; margin: 0 0 0.5rem; font-weight: 600; color: var(--text); }
        .landing-feature p { font-size: 0.95rem; color: var(--text-muted); margin: 0; line-height: 1.55; }
        .landing-cta-block { text-align: center; padding: 2.5rem 2rem; background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); }
        .landing-cta-block p { margin: 0 0 1rem; font-size: 1.05rem; color: var(--text-muted); }
        @media (max-width: 720px) {
          .landing { padding: 1.5rem 1rem 3rem; }
          .landing-hero { padding: 1.5rem 0 2.5rem; }
        }
        @media (max-width: 480px) {
          .landing-title { font-size: clamp(1.7rem, 7vw, 2.2rem); }
          .landing-lead { font-size: 1rem; }
          .landing-btn { padding: 0.75rem 1.25rem; font-size: 0.95rem; }
          .landing-feature { padding: 1.5rem 1.1rem; }
          .landing-feature h3 { font-size: 1.05rem; }
          .landing-feature p { font-size: 0.9rem; }
          .landing-cta-block { padding: 2rem 1.25rem; }
        }
      `}</style>
    </div>
  );
}

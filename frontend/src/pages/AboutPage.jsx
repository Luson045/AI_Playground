import React from 'react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="about">
      <header className="about-header">
        <h1>About</h1>
        <p className="about-tagline">AI-powered marketplace for discoverable, seller-first shopping.</p>
      </header>
      <section className="about-content">
        <h2>What we do</h2>
        <p>
          We connect buyers with products through natural language. Describe what you're looking for—food, gadgets, fashion, or anything else—and get personalized recommendations from real sellers. No endless scrolling: just ask and discover.
        </p>
        <h2>For buyers</h2>
        <p>
          Use the chat to describe your need in plain words. Browse the marketplace to search by product or seller and filter by category. Every listing shows who's selling, so you know exactly who you're buying from.
        </p>
        <h2>For sellers</h2>
        <p>
          List your products once. They become discoverable through AI search and chat. Buyers find you when their intent matches what you offer—no extra ads required.
        </p>
        <h2>Contact</h2>
        <p>
          Questions or feedback? Use the contact details in the footer. We’d love to hear from you.
        </p>
      </section>
      <div className="about-back">
        <Link to="/" className="btn btn-ghost">← Back</Link>
      </div>
      <style>{`
        .about { padding: 2rem 0 4rem; max-width: 680px; margin: 0 auto; }
        .about-header { margin-bottom: 2.5rem; }
        .about-header h1 { font-size: 2rem; font-weight: 800; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
        .about-tagline { font-size: 1.1rem; color: var(--text-muted); margin: 0; line-height: 1.5; }
        .about-content h2 { font-size: 1.25rem; font-weight: 700; margin: 2rem 0 0.75rem; }
        .about-content h2:first-of-type { margin-top: 0; }
        .about-content p { margin: 0 0 1rem; color: var(--text-muted); line-height: 1.65; }
        .about-back { margin-top: 2.5rem; }
      `}</style>
    </div>
  );
}

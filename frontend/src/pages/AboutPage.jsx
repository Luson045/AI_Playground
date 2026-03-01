import React from 'react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="about">
      <header className="about-hero">
        <div className="about-hero-text">
          <p className="about-kicker">About ADA AI</p>
          <h1>Discover products with the speed of a conversation.</h1>
          <p className="about-tagline">
            We build a seller-first marketplace where intent meets inventory. Ask in
            plain words, and ADA AI matches you with real sellers that fit.
          </p>
          <div className="about-hero-cta">
            <Link to="/chat" className="btn btn-primary">Try the chat</Link>
            <Link to="/market" className="btn btn-ghost">Browse the market</Link>
          </div>
        </div>
        <div className="about-hero-visual" aria-hidden="true">
          <div className="about-orbit about-orbit-one" />
          <div className="about-orbit about-orbit-two" />
          <div className="about-icon about-icon-chat">Chat</div>
          <div className="about-icon about-icon-shop">Sellers</div>
          <div className="about-icon about-icon-ai">AI</div>
          <div className="about-icon about-icon-match">Match</div>
        </div>
      </header>

      <section className="about-section">
        <h2>What we do</h2>
        <p>
          ADA AI connects buyers with products through natural language. Describe what
          you are looking for - food, gadgets, fashion, or anything else - and get
          personalized recommendations from real sellers. No endless scrolling: just
          ask and discover.
        </p>
      </section>

      <section className="about-section about-process">
        <h2>How it works</h2>
        <div className="about-steps">
          <div className="about-step">
            <p className="about-step-label">1. Intent</p>
            <p>Tell us what you want in plain language.</p>
          </div>
          <div className="about-step">
            <p className="about-step-label">2. Match</p>
            <p>ADA AI maps intent to verified seller listings.</p>
          </div>
          <div className="about-step">
            <p className="about-step-label">3. Compare</p>
            <p>Review options, pricing, and seller details.</p>
          </div>
          <div className="about-step">
            <p className="about-step-label">4. Connect</p>
            <p>Reach the seller directly and move fast.</p>
          </div>
        </div>
      </section>

      <section className="about-section about-split">
        <div className="about-panel">
          <h3>For buyers</h3>
          <p>
            Use chat to describe your need in plain words. Browse the marketplace
            to search by product or seller and filter by category. Every listing
            shows who is selling, so you know exactly who you are buying from.
          </p>
        </div>
        <div className="about-panel">
          <h3>For sellers</h3>
          <p>
            List your products once. They become discoverable through AI search and
            chat. Buyers find you when their intent matches what you offer - no extra
            ads required.
          </p>
        </div>
      </section>

      <section className="about-section">
        <h2>Inside the engine</h2>
        <div className="about-code">
          <div className="about-code-header">Intent pipeline</div>
          <pre>
            <code>{`intent = "compact wireless earbuds under 50"
signals = extract(intent)
matches = rank(listings, signals)
recommendations = explain(matches, criteria=signals)`}</code>
          </pre>
          <p className="about-code-foot">
            We use structured signals and transparent ranking to keep results relevant
            and seller-first.
          </p>
        </div>
      </section>

      <section className="about-section">
        <h2>Contact</h2>
        <p>
          Questions or feedback? Use the contact details in the footer. We would love
          to hear from you.
        </p>
      </section>

      <div className="about-back">
        <Link to="/" className="btn btn-ghost">Back to home</Link>
      </div>

      <style>{`
        .about { padding: 2rem 1.25rem 4rem; max-width: 1100px; margin: 0 auto; }
        .about-hero { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2.5rem; align-items: center; margin-bottom: 3rem; }
        .about-hero-text h1 { font-size: clamp(2.2rem, 5vw, 3.2rem); margin: 0 0 1rem; letter-spacing: -0.03em; }
        .about-kicker { text-transform: uppercase; letter-spacing: 0.22em; font-size: 0.75rem; color: var(--accent); margin: 0 0 0.75rem; font-weight: 700; }
        .about-tagline { font-size: 1.1rem; color: var(--text-muted); margin: 0 0 1.5rem; line-height: 1.6; }
        .about-hero-cta { display: flex; flex-wrap: wrap; gap: 0.85rem; }
        .about-hero-visual { position: relative; min-height: 260px; border-radius: 24px; background: radial-gradient(circle at top, rgba(99,102,241,0.18), transparent 70%); border: 1px solid var(--border); overflow: hidden; }
        .about-orbit { position: absolute; border-radius: 999px; border: 1px dashed rgba(99,102,241,0.35); animation: orbit 18s linear infinite; }
        .about-orbit-one { width: 240px; height: 240px; top: 10px; left: calc(50% - 120px); }
        .about-orbit-two { width: 180px; height: 180px; top: 40px; left: calc(50% - 90px); animation-duration: 12s; }
        .about-icon { position: absolute; padding: 0.4rem 0.85rem; border-radius: 999px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(99,102,241,0.45); color: #e2e8f0; font-size: 0.85rem; font-weight: 600; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25); }
        .about-icon-chat { top: 24px; left: 20px; animation: float 5s ease-in-out infinite; }
        .about-icon-shop { bottom: 28px; left: 40px; animation: float 6s ease-in-out infinite; }
        .about-icon-ai { top: 50px; right: 30px; animation: float 4.5s ease-in-out infinite; }
        .about-icon-match { bottom: 34px; right: 36px; animation: float 5.5s ease-in-out infinite; }
        .about-section { margin-bottom: 2.75rem; }
        .about-section h2 { font-size: 1.6rem; margin: 0 0 0.75rem; }
        .about-section p { margin: 0 0 0.9rem; color: var(--text-muted); line-height: 1.7; }
        .about-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; }
        .about-step { padding: 1.25rem 1.35rem; border-radius: 16px; border: 1px solid var(--border); background: var(--surface); }
        .about-step-label { font-weight: 700; color: var(--text); margin: 0 0 0.35rem; }
        .about-split { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }
        .about-panel { padding: 1.5rem; border-radius: 18px; border: 1px solid var(--border); background: var(--surface); }
        .about-panel h3 { margin: 0 0 0.6rem; font-size: 1.2rem; }
        .about-code { border-radius: 20px; border: 1px solid rgba(99,102,241,0.35); background: linear-gradient(135deg, rgba(15,23,42,0.92), rgba(15,23,42,0.75)); color: #e2e8f0; padding: 1.5rem; }
        .about-code-header { font-weight: 700; font-size: 0.95rem; color: #c7d2fe; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 0.85rem; }
        .about-code pre { margin: 0; font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 0.92rem; line-height: 1.6; white-space: pre-wrap; }
        .about-code-foot { margin: 1rem 0 0; color: rgba(226, 232, 240, 0.7); font-size: 0.95rem; }
        .about-back { margin-top: 1.5rem; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 700px) {
          .about-hero { gap: 2rem; }
          .about-hero-visual { min-height: 220px; }
        }
      `}</style>
    </div>
  );
}

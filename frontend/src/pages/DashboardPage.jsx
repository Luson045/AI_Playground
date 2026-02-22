import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsGet } from '../api/client';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await analyticsGet();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading, navigate]);

  if (authLoading || !user) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="page-error">{error}</div>;
  if (!data) return <div className="page-loading">Loading analytics…</div>;

  const { totalProducts, totalClicks, byProduct } = data;

  return (
    <div className="dashboard-page">
      <h1>Analytics</h1>
      <p className="dashboard-sub">Clicks on your products from chat and market.</p>
      <div className="dashboard-cards">
        <div className="dashboard-card card">
          <span className="dashboard-card-label">Total products</span>
          <span className="dashboard-card-value">{totalProducts}</span>
        </div>
        <div className="dashboard-card card">
          <span className="dashboard-card-label">Total clicks</span>
          <span className="dashboard-card-value">{totalClicks}</span>
        </div>
      </div>
      <h2>By product</h2>
      <div className="dashboard-table-wrap card">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Total</th>
              <th>From chat</th>
              <th>From market</th>
            </tr>
          </thead>
          <tbody>
            {byProduct.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">No products or clicks yet.</td>
              </tr>
            ) : (
              byProduct.map((p) => (
                <tr key={p._id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.totalClicks}</td>
                  <td>{p.fromChat}</td>
                  <td>{p.fromMarket}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <style>{`
        .dashboard-page { padding: 0.5rem 0; }
        .dashboard-page h1 { font-size: 1.5rem; margin: 0 0 0.25rem; }
        .dashboard-sub { color: var(--text-muted); margin: 0 0 1.5rem; font-size: 0.95rem; }
        .dashboard-cards { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
        .dashboard-card { padding: 1.25rem; min-width: 160px; }
        .dashboard-card-label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem; }
        .dashboard-card-value { font-size: 1.5rem; font-weight: 700; }
        .dashboard-page h2 { font-size: 1.1rem; margin: 0 0 0.75rem; }
        .dashboard-table-wrap { overflow-x: auto; padding: 0; }
        .dashboard-table { width: 100%; border-collapse: collapse; }
        .dashboard-table th, .dashboard-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--border); }
        .dashboard-table th { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
        .dashboard-table tbody tr:last-child td { border-bottom: none; }
        .muted { color: var(--text-muted); }
      `}</style>
    </div>
  );
}

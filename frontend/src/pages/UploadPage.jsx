import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productsMy, productCreate, productDelete } from '../api/client';

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    imageUrl: '',
    link: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await productsMy();
        if (!cancelled) setProducts(list);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || form.price === '') {
      setError('Name, description, and price are required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const created = await productCreate({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        imageUrl: form.imageUrl.trim(),
        link: form.link.trim(),
      });
      setProducts((prev) => [created, ...prev]);
      setForm({ name: '', description: '', category: '', price: '', imageUrl: '', link: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productDelete(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (authLoading || !user) return <div className="page-loading">Loading…</div>;

  return (
    <div className="upload-page">
      <h1>Upload product</h1>
      <p className="upload-sub">Add products so the chatbot can recommend them.</p>
      <div className="upload-layout">
        <form className="upload-form card" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          <div className="input-group">
            <label>Product name *</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Category</label>
            <input name="category" value={form.category} onChange={handleChange} placeholder="e.g. Electronics" />
          </div>
          <div className="input-group">
            <label>Price *</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" required />
          </div>
          <div className="input-group">
            <label>Image URL</label>
            <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://…" />
          </div>
          <div className="input-group">
            <label>Product link</label>
            <input name="link" value={form.link} onChange={handleChange} placeholder="https://…" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Uploading…' : 'Add product'}
          </button>
        </form>
        <div className="upload-list">
          <h2>Your products</h2>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : (
            <ul className="upload-products">
              {products.map((p) => (
                <li key={p._id} className="upload-item card">
                  <div className="upload-item-main">
                    {p.imageUrl && <img src={p.imageUrl} alt="" className="upload-item-img" />}
                    <div>
                      <strong>{p.name}</strong>
                      <span className="upload-item-price">${Number(p.price).toFixed(2)}</span>
                    </div>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={() => handleDelete(p._id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!loading && products.length === 0 && (
            <p className="muted">No products yet. Add one with the form.</p>
          )}
        </div>
      </div>
      <style>{`
        .upload-page { padding: 0.5rem 0; }
        .upload-page h1 { font-size: 1.5rem; margin: 0 0 0.25rem; }
        .upload-sub { color: var(--text-muted); margin: 0 0 1.5rem; font-size: 0.95rem; }
        .upload-layout { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; }
        @media (max-width: 900px) { .upload-layout { grid-template-columns: 1fr; } }
        .upload-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; max-width: 480px; }
        .upload-list h2 { font-size: 1.1rem; margin: 0 0 0.75rem; }
        .upload-products { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
        .upload-item { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; }
        .upload-item-main { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
        .upload-item-img { width: 48px; height: 48px; object-fit: cover; border-radius: 8px; }
        .upload-item-main strong { display: block; font-size: 0.95rem; }
        .upload-item-price { font-size: 0.85rem; color: var(--accent); }
        .muted { color: var(--text-muted); font-size: 0.9rem; margin: 0; }
      `}</style>
    </div>
  );
}

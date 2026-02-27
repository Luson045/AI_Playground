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
  const [imageUploading, setImageUploading] = useState(false);
  const [imageCompressing, setImageCompressing] = useState(false);
  const [compressionNote, setCompressionNote] = useState('');
  const [error, setError] = useState(null);
  const [imageMode, setImageMode] = useState('url');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
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

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const compressImage = async (file) => {
    const maxDimension = 1600;
    const quality = 0.82;
    const outputType =
      file.type === 'image/jpeg' || file.type === 'image/webp'
        ? file.type
        : 'image/webp';

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image compression failed.');
    ctx.drawImage(bitmap, 0, 0, width, height);
    if (typeof bitmap.close === 'function') bitmap.close();

    let blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, quality));
    if (!blob && outputType !== 'image/jpeg') {
      blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    }
    if (!blob) throw new Error('Image compression failed.');

    const finalType = blob.type || outputType;
    const nameBase = file.name.replace(/\.[^.]+$/, '');
    const ext = finalType === 'image/jpeg' ? 'jpg' : finalType === 'image/webp' ? 'webp' : 'png';
    const compressedFile = new File([blob], `${nameBase}.${ext}`, { type: finalType });

    return blob.size < file.size ? compressedFile : file;
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) {
      throw new Error('Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
    }
    const body = new FormData();
    body.append('file', file);
    body.append('upload_preset', preset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Image upload failed.');
    }
    return data.secure_url || data.url || '';
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
      let finalImageUrl = form.imageUrl.trim();
      if (imageMode === 'upload') {
        if (!imageFile) {
          setError('Please choose an image to upload.');
          setSubmitting(false);
          return;
        }
        setImageCompressing(true);
        const beforeSize = imageFile.size;
        const optimizedFile = await compressImage(imageFile);
        setImageCompressing(false);
        setImageUploading(true);
        finalImageUrl = await uploadToCloudinary(optimizedFile);
        const afterSize = optimizedFile.size;
        if (afterSize < beforeSize) {
          const savedPct = Math.round(((beforeSize - afterSize) / beforeSize) * 100);
          setCompressionNote(`Compressed ${Math.round(beforeSize / 1024)}KB → ${Math.round(afterSize / 1024)}KB (${savedPct}% smaller).`);
        } else {
          setCompressionNote('Compression skipped (original was already optimal).');
        }
        setImageUploading(false);
      }
      const created = await productCreate({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        imageUrl: finalImageUrl,
        link: form.link.trim(),
      });
      setProducts((prev) => [created, ...prev]);
      setForm({ name: '', description: '', category: '', price: '', imageUrl: '', link: '' });
      setImageFile(null);
      setImagePreview('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      setImageUploading(false);
      setImageCompressing(false);
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
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Add keywords: brand, model, materials, size, condition, use-cases, included items, and standout features."
              required
            />
            <p className="muted">Tip: Detailed, keyword-rich descriptions rank higher in search.</p>
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
            <label>Image</label>
            <div className="upload-toggle">
              <button
                type="button"
                className={`upload-toggle-btn ${imageMode === 'upload' ? 'is-on' : ''}`}
                onClick={() => setImageMode('upload')}
              >
                Upload
              </button>
              <button
                type="button"
                className={`upload-toggle-btn ${imageMode === 'url' ? 'is-on' : ''}`}
                onClick={() => setImageMode('url')}
              >
                Use URL
              </button>
            </div>
            {imageMode === 'url' && (
              <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://…" />
            )}
            {imageMode === 'upload' && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImageFile(file);
                    setImagePreview(file ? URL.createObjectURL(file) : '');
                    setCompressionNote('');
                  }}
                />
                {imagePreview && (
                  <img src={imagePreview} alt="" className="upload-preview" />
                )}
                {imageCompressing && <span className="muted">Compressing image…</span>}
                {imageUploading && <span className="muted">Uploading image…</span>}
                {!imageCompressing && !imageUploading && compressionNote && (
                  <span className="muted">{compressionNote}</span>
                )}
              </>
            )}
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
                      <span className="upload-item-price">₹{Number(p.price).toFixed(2)}</span>
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
        .upload-toggle { display: inline-flex; gap: 0.5rem; margin-bottom: 0.5rem; }
        .upload-toggle-btn { background: var(--bg); border: 1px solid var(--border); color: var(--text); padding: 0.35rem 0.75rem; border-radius: 999px; font-size: 0.85rem; cursor: pointer; }
        .upload-toggle-btn.is-on { border-color: var(--accent); color: var(--accent); background: var(--surface-hover); }
        .upload-preview { margin-top: 0.5rem; width: 100%; max-width: 220px; border-radius: 10px; border: 1px solid var(--border); object-fit: cover; }
        .muted { color: var(--text-muted); font-size: 0.9rem; margin: 0; }
      `}</style>
    </div>
  );
}

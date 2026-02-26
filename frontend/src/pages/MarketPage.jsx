import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productsList, productClick } from '../api/client';

const PAGE_SIZE = 10;

export default function MarketPage() {
  const [searchParams] = useSearchParams();
  const sellerFromUrl = searchParams.get('seller') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sellerFilter, setSellerFilter] = useState(sellerFromUrl);
  const [sortBy, setSortBy] = useState('newest');
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    setSellerFilter(sellerFromUrl);
  }, [sellerFromUrl]);

  const [allCategories, setAllCategories] = useState([]);
  const categories = useMemo(() => ['', ...allCategories], [allCategories]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef(null);
  const sortedProducts = useMemo(() => {
    const list = [...products];
    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
      return 0;
    });
    return list;
  }, [products, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const list = await productsList({ q: searchQuery || undefined, category: categoryFilter || undefined, seller: sellerFilter || undefined });
        if (!cancelled) {
          setProducts(list);
          if (searchQuery && list.length === 0) {
            const recs = await productsList();
            if (!cancelled) setRecommendations(recs.slice(0, 6));
          } else {
            setRecommendations([]);
          }
          if (!searchQuery && !categoryFilter && !sellerFilter) {
            const set = new Set();
            list.forEach((p) => p.category && set.add(p.category.trim()));
            setAllCategories([...set].sort());
          }
        }
      } catch (_) {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [searchQuery, categoryFilter, sellerFilter]);

  useEffect(() => {
    setVisibleCount(Math.min(PAGE_SIZE, sortedProducts.length));
  }, [sortedProducts.length, sortBy, searchQuery, categoryFilter, sellerFilter]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, sortedProducts.length));
      },
      { rootMargin: '240px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [sortedProducts.length]);

  const handleClick = async (p) => {
    try {
      await productClick(p._id);
    } catch (_) {}
    if (p.link) window.open(p.link, '_blank');
  };

  if (loading) return <div className="market-loading">Loading products…</div>;

  const visibleProducts = sortedProducts.slice(0, visibleCount);

  return (
    <div className="market-page">
      <header className="market-header">
        <h1>Marketplace</h1>
        <p className="market-sub">Browse and discover products. Search by product or seller.</p>
        <form className="market-toolbar" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            className="market-search"
            placeholder="Search products or sellers…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search"
          />
          <button type="submit" className="btn btn-primary market-search-btn">
            Search
          </button>
          <select
            className="market-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Category"
          >
            <option value="">All categories</option>
            {categories.filter(Boolean).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="market-count">{sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}</span>
          <select
            className="market-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort by"
          >
            <option value="newest">Newest first</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </form>
      </header>

      <div className="market-grid">
        {visibleProducts.map((p) => {
          const sellerId = p.userId?._id || p.userId;
          const sellerName = p.userId?.name || p.userId?.email || 'Seller';
          return (
            <article key={p._id} className="market-card">
              <a
                href={p.link || '#'}
                target={p.link ? '_blank' : undefined}
                rel={p.link ? 'noopener noreferrer' : undefined}
                className="market-card-link"
                onClick={(e) => {
                  if (p.link) handleClick(p);
                  else e.preventDefault();
                }}
              >
                <div className="market-card-image">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} loading="lazy" />
                  ) : (
                    <div className="market-card-placeholder">No image</div>
                  )}
                </div>
                <div className="market-card-content">
                  <h3 className="market-card-title">{p.name}</h3>
                  {p.category && <span className="market-card-category">{p.category}</span>}
                  <p className="market-card-desc">{(p.description || '').slice(0, 100)}{(p.description || '').length > 100 ? '…' : ''}</p>
                  <div className="market-card-footer">
                    <span className="market-card-price">${Number(p.price).toFixed(2)}</span>
                    <span className="market-card-cta">View product</span>
                  </div>
                </div>
              </a>
              {sellerId && (
                <Link to={`/explore/${sellerId}`} className="market-card-seller">
                  by {sellerName}
                </Link>
              )}
              {!sellerId && <span className="market-card-seller">by {sellerName}</span>}
            </article>
          );
        })}
      </div>

      <div ref={loadMoreRef} className="market-loadmore">
        {sortedProducts.length > visibleCount ? 'Loading more…' : ''}
      </div>

      {sellerFilter && (
        <p className="market-seller-filter">
          Showing products from this seller. <Link to="/market">Show all</Link>
        </p>
      )}
      {sortedProducts.length === 0 && (
        <div className="market-empty">
          <p>
            {searchQuery
              ? 'No such items, perhaps let your fellow sellers know about us :)'
              : categoryFilter || sellerFilter
                ? 'No products match your filters.'
                : 'No products yet.'}
          </p>
          <p className="market-empty-hint">
            {searchQuery
              ? 'Try a different search or category.'
              : categoryFilter || sellerFilter
                ? 'Try a different search or category.'
                : 'Add products from the Upload page (log in first).'}
          </p>
        </div>
      )}

      {sortedProducts.length === 0 && recommendations.length > 0 && (
        <div className="market-recs">
          <h2>Recommended listings</h2>
          <div className="market-grid">
            {recommendations.map((p) => {
              const sellerId = p.userId?._id || p.userId;
              const sellerName = p.userId?.name || p.userId?.email || 'Seller';
              return (
                <article key={p._id} className="market-card">
                  <a
                    href={p.link || '#'}
                    target={p.link ? '_blank' : undefined}
                    rel={p.link ? 'noopener noreferrer' : undefined}
                    className="market-card-link"
                    onClick={(e) => {
                      if (p.link) handleClick(p);
                      else e.preventDefault();
                    }}
                  >
                    <div className="market-card-image">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} loading="lazy" />
                      ) : (
                        <div className="market-card-placeholder">No image</div>
                      )}
                    </div>
                    <div className="market-card-content">
                      <h3 className="market-card-title">{p.name}</h3>
                      {p.category && <span className="market-card-category">{p.category}</span>}
                      <p className="market-card-desc">{(p.description || '').slice(0, 100)}{(p.description || '').length > 100 ? '…' : ''}</p>
                      <div className="market-card-footer">
                        <span className="market-card-price">${Number(p.price).toFixed(2)}</span>
                        <span className="market-card-cta">View product</span>
                      </div>
                    </div>
                  </a>
                  {sellerId && (
                    <Link to={`/explore/${sellerId}`} className="market-card-seller">
                      by {sellerName}
                    </Link>
                  )}
                  {!sellerId && <span className="market-card-seller">by {sellerName}</span>}
                </article>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .market-page { padding: 0 0 2rem; max-width: 1400px; margin: 0 auto; }
        .market-header { margin-bottom: 1.5rem; }
        .market-page .market-header h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.25rem; letter-spacing: -0.02em; }
        .market-sub { color: var(--text-muted); margin: 0 0 1rem; font-size: 0.95rem; }
        .market-toolbar { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .market-search { flex: 1; min-width: 180px; padding: 0.5rem 0.75rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 0.9rem; }
        .market-search:focus { outline: none; border-color: var(--accent); }
        .market-search-btn { padding: 0.5rem 0.85rem; }
        .market-category, .market-sort { padding: 0.5rem 0.75rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 0.9rem; cursor: pointer; }
        .market-count { font-size: 0.9rem; color: var(--text-muted); }
        .market-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem; }
        .market-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s; }
        .market-card:hover { border-color: var(--accent); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .market-card-link { display: flex; flex-direction: column; height: 100%; text-decoration: none; color: inherit; }
        .market-card-image { aspect-ratio: 1; background: var(--bg); overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .market-card-image img { width: 100%; height: 100%; object-fit: cover; }
        .market-card-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.85rem; }
        .market-card-content { padding: 1rem; display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .market-card-title { font-size: 1rem; font-weight: 600; margin: 0 0 0.35rem; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .market-card-category { font-size: 0.75rem; color: var(--accent); text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 0.35rem; }
        .market-card-desc { font-size: 0.85rem; color: var(--text-muted); margin: 0 0 0.5rem; line-height: 1.4; flex: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .market-card-seller { font-size: 0.8rem; color: var(--accent); margin-top: 0.5rem; display: block; padding: 0 1rem 1rem; text-decoration: none; }
        .market-card-seller:hover { text-decoration: underline; }
        .market-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 0.5rem; border-top: 1px solid var(--border); }
        .market-card-price { font-weight: 700; font-size: 1.1rem; color: var(--accent); }
        .market-card-cta { font-size: 0.85rem; font-weight: 500; color: var(--accent); }
        .market-empty { text-align: center; padding: 3rem 1rem; color: var(--text-muted); }
        .market-empty-hint { margin-top: 0.5rem; font-size: 0.9rem; }
        .market-loadmore { text-align: center; padding: 1rem 0; color: var(--text-muted); font-size: 0.85rem; }
        .market-seller-filter { font-size: 0.9rem; color: var(--text-muted); margin: 0 0 1rem; }
.market-seller-filter a { color: var(--accent); }
        .market-loading, .market-error { padding: 2rem; text-align: center; }
        .market-loading { color: var(--text-muted); }
        .market-error { color: #ef4444; }
        .market-recs { margin-top: 2rem; }
        .market-recs h2 { font-size: 1.2rem; margin: 0 0 0.75rem; }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  X,
  Search,
  ChevronRight,
  RotateCcw,
  Star,
  Sparkles,
} from 'lucide-react';
import api from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { SkeletonCard } from '../components/SkeletonCard';

export const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filters State from URL query parameters
  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Load Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/products/categories');
        if (res.data?.categories) setCategories(res.data.categories);
      } catch (err) {
        console.warn('Error loading categories:', err.message);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Products whenever filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 12,
          sort: sortBy,
        };

        if (searchQuery) params.q = searchQuery;
        if (selectedCategory) params.category = selectedCategory;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (minRating) params.minRating = minRating;

        const res = await api.get('/products', { params });
        if (res.data) {
          const raw = res.data.products || [];
          // Deduplicate products by _id
          const seen = new Set();
          const deduped = raw.filter((p) => {
            const id = p._id || p.id;
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
          });

          setProducts(deduped);
          setTotalProducts(res.data.totalProducts || 0);
          setTotalPages(res.data.totalPages || 1);
        }
      } catch (err) {
        console.warn('Error fetching products:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams]);

  const updateFilters = (newParams) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    });
    // Reset to page 1 on filter changes unless page itself is changing
    if (!newParams.page) next.set('page', '1');
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchParams({});
    setIsMobileFilterOpen(false);
  };

  const hasActiveFilters = Boolean(
    searchQuery || selectedCategory || minPrice || maxPrice || minRating || (sortBy && sortBy !== 'newest')
  );

  const getPageHeader = () => {
    if (searchQuery) {
      return {
        eyebrow: 'SEARCH RESULTS',
        title: (
          <>
            Search <span style={{ color: 'var(--accent)' }}>Results</span>
          </>
        ),
        subtitle: `Showing ${totalProducts} curated products matching "${searchQuery}"`,
      };
    }
    if (selectedCategory) {
      return {
        eyebrow: 'CURATED DEPARTMENT',
        title: (
          <>
            {selectedCategory.replace('-', ' ')} <span style={{ color: 'var(--accent)' }}>Collection</span>
          </>
        ),
        subtitle: `Showing ${totalProducts} curated products in ${selectedCategory.replace('-', ' ')}`,
      };
    }
    if (sortBy === 'popular') {
      return {
        eyebrow: 'MOST SOUGHT-AFTER',
        title: (
          <>
            Best <span style={{ color: 'var(--accent)' }}>Sellers</span>
          </>
        ),
        subtitle: `Showing ${totalProducts} of our most loved and highest rated products`,
      };
    }
    if (sortBy === 'newest') {
      return {
        eyebrow: 'FRESH DROPS',
        title: (
          <>
            New <span style={{ color: 'var(--accent)' }}>Arrivals</span>
          </>
        ),
        subtitle: `Showing ${totalProducts} of our latest releases and newly added catalog items`,
      };
    }
    if (sortBy === 'discount') {
      return {
        eyebrow: 'PROMOTIONAL OFFERS',
        title: (
          <>
            Biggest <span style={{ color: 'var(--accent)' }}>Savings</span>
          </>
        ),
        subtitle: `Showing ${totalProducts} products with top promotional discounts`,
      };
    }
    return {
      eyebrow: 'VERIFIED CATALOG',
      title: (
        <>
          All <span style={{ color: 'var(--accent)' }}>Collections</span>
        </>
      ),
      subtitle: `Showing ${totalProducts} curated products across all departments`,
    };
  };

  const headerInfo = getPageHeader();

  return (
    <div className="container products-page-container">
      {/* Breadcrumbs */}
      <div className="products-page-breadcrumbs">
        <Link to="/" style={{ color: 'var(--text-secondary)' }}>Home</Link>
        <ChevronRight size={13} />
        <span style={{ color: selectedCategory ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: 650 }}>
          Shop Collections
        </span>
        {selectedCategory && (
          <>
            <ChevronRight size={13} />
            <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)', fontWeight: 700 }}>
              {selectedCategory.replace('-', ' ')}
            </span>
          </>
        )}
      </div>

      {/* Header Bar */}
      <div className="products-page-header">
        <div className="products-page-title-wrap">
          <div className="section-eyebrow">
            <Sparkles size={13} color="var(--accent)" /> {headerInfo.eyebrow}
          </div>
          <h1 className="products-page-heading">
            {headerInfo.title}
          </h1>
          <p className="products-page-subtitle">
            {headerInfo.subtitle}
          </p>
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="products-page-controls">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="btn btn-secondary btn-sm mobile-filter-btn"
          >
            <SlidersHorizontal size={14} /> Filters
          </button>

          <div className="products-page-sort-wrap">
            <span className="sort-label">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="select-field products-sort-select"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="popular">Best Sellers</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="discount">Biggest Savings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout (Sidebar + Products Grid) */}
      <div className="shop-layout">
        {/* Left Sidebar Filter */}
        <aside className="desktop-filters" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Active Filters Clear Button */}
          {hasActiveFilters && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-secondary)',
                padding: '0.85rem 1.15rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: '0.825rem', fontWeight: 700 }}>Active Filters</span>
              <button
                onClick={handleResetFilters}
                style={{ fontSize: '0.785rem', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}
              >
                <RotateCcw size={12} /> Reset All
              </button>
            </div>
          )}

          {/* Categories Filter */}
          <div>
            <h3
              style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-primary)',
                marginBottom: '1rem',
              }}
            >
              Categories
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <button
                onClick={() => updateFilters({ category: '' })}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                  fontSize: '0.885rem',
                  fontWeight: selectedCategory === '' ? 750 : 500,
                  color: selectedCategory === '' ? '#FFFFFF' : 'var(--text-secondary)',
                  background: selectedCategory === '' ? '#111111' : 'transparent',
                  transition: 'var(--transition-fast)',
                }}
              >
                All Categories ({totalProducts})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => updateFilters({ category: cat.slug })}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    fontSize: '0.885rem',
                    fontWeight: selectedCategory === cat.slug ? 750 : 500,
                    color: selectedCategory === cat.slug ? '#FFFFFF' : 'var(--text-secondary)',
                    background: selectedCategory === cat.slug ? '#111111' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  <span style={{ textTransform: 'capitalize' }}>{cat.name}</span>
                  <span style={{ fontSize: '0.75rem', color: selectedCategory === cat.slug ? '#EAEAEA' : 'var(--text-muted)' }}>{cat.productCount}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
            <h3
              style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-primary)',
                marginBottom: '1rem',
              }}
            >
              Price Range ($)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <input
                type="number"
                placeholder="Min ($)"
                value={minPrice}
                onChange={(e) => updateFilters({ minPrice: e.target.value })}
                className="input-field"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.835rem' }}
              />
              <input
                type="number"
                placeholder="Max ($)"
                value={maxPrice}
                onChange={(e) => updateFilters({ maxPrice: e.target.value })}
                className="input-field"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.835rem' }}
              />
            </div>
          </div>

          {/* Rating Filter */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
            <h3
              style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-primary)',
                marginBottom: '1rem',
              }}
            >
              Customer Rating
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[
                { label: '4.5★ and above', val: '4.5' },
                { label: '4.0★ and above', val: '4.0' },
                { label: '3.5★ and above', val: '3.5' },
              ].map((r) => (
                <button
                  key={r.val}
                  onClick={() => updateFilters({ minRating: minRating === r.val ? '' : r.val })}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    fontSize: '0.865rem',
                    fontWeight: minRating === r.val ? 750 : 500,
                    color: minRating === r.val ? '#FFFFFF' : 'var(--text-secondary)',
                    background: minRating === r.val ? '#111111' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  <Star size={13} fill={minRating === r.val ? '#FFFFFF' : '#111111'} color={minRating === r.val ? '#FFFFFF' : '#111111'} />
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Main Content Grid */}
        <main>
          {loading ? (
            <div className="grid-products">
              {Array.from({ length: 8 }).map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div
              style={{
                padding: '5rem 2rem',
                textAlign: 'center',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <Search size={44} color="var(--text-muted)" style={{ margin: '0 auto 1.25rem' }} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>No matching products</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.75rem', fontSize: '0.925rem' }}>
                We couldn't find any items matching your criteria. Try loosening your price or category filters.
              </p>
              <button onClick={handleResetFilters} className="btn btn-primary btn-sm">
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid-products">
                {products.map((prod) => (
                  <ProductCard key={prod._id} product={prod} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '4rem' }}>
                  <button
                    disabled={page <= 1}
                    onClick={() => updateFilters({ page: page - 1 })}
                    className="btn btn-secondary btn-sm"
                  >
                    Previous
                  </button>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const p = idx + 1;
                      return (
                        <button
                          key={p}
                          onClick={() => updateFilters({ page: p })}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid',
                            borderColor: page === p ? '#111111' : 'var(--border)',
                            background: page === p ? '#111111' : '#FFFFFF',
                            color: page === p ? '#FFFFFF' : 'var(--text-primary)',
                            fontWeight: 750,
                            fontSize: '0.875rem',
                            transition: 'var(--transition-fast)',
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={page >= totalPages}
                    onClick={() => updateFilters({ page: page + 1 })}
                    className="btn btn-secondary btn-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer Modal */}
      {isMobileFilterOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              width: '85%',
              maxWidth: '360px',
              height: '100%',
              padding: '1.75rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.75rem',
              boxShadow: 'var(--shadow-modal)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Filter Catalog</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="btn-icon"
                style={{ border: 'none' }}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Categories
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <button
                  onClick={() => {
                    updateFilters({ category: '' });
                    setIsMobileFilterOpen(false);
                  }}
                  style={{
                    padding: '0.5rem',
                    textAlign: 'left',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: selectedCategory === '' ? 750 : 500,
                    background: selectedCategory === '' ? '#111111' : 'transparent',
                    color: selectedCategory === '' ? '#FFFFFF' : 'var(--text-primary)',
                  }}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => {
                      updateFilters({ category: cat.slug });
                      setIsMobileFilterOpen(false);
                    }}
                    style={{
                      padding: '0.5rem',
                      textAlign: 'left',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: selectedCategory === cat.slug ? 750 : 500,
                      background: selectedCategory === cat.slug ? '#111111' : 'transparent',
                      color: selectedCategory === cat.slug ? '#FFFFFF' : 'var(--text-primary)',
                    }}
                  >
                    {cat.name} ({cat.productCount})
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Price Range
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="number"
                  placeholder="Min ($)"
                  value={minPrice}
                  onChange={(e) => updateFilters({ minPrice: e.target.value })}
                  className="input-field"
                />
                <input
                  type="number"
                  placeholder="Max ($)"
                  value={maxPrice}
                  onChange={(e) => updateFilters({ maxPrice: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleResetFilters} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                Reset
              </button>
              <button onClick={() => setIsMobileFilterOpen(false)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .products-page-container {
          padding: 3rem 2rem 5rem;
        }
        .products-page-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.825rem;
          color: var(--text-muted);
          margin-bottom: 1.5rem;
        }
        .products-page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 1.25rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 1.5rem;
          margin-bottom: 2.5rem;
        }
        .products-page-heading {
          font-size: clamp(2.2rem, 3.8vw, 2.9rem);
          font-weight: 850;
          letter-spacing: -0.035em;
          line-height: 1.15;
          text-transform: uppercase;
        }
        .products-page-subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-top: 0.45rem;
        }
        .products-page-controls {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }
        .mobile-filter-btn {
          display: none;
        }
        .products-page-sort-wrap {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .sort-label {
          font-size: 0.865rem;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .products-sort-select {
          width: auto;
          padding: 0.45rem 0.85rem;
          font-size: 0.865rem;
          border-radius: var(--radius-sm);
          background-color: #FFFFFF;
          font-weight: 650;
        }
        .shop-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 3rem;
        }
        @media (max-width: 960px) {
          .shop-layout {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .desktop-filters {
            display: none !important;
          }
          .mobile-filter-btn {
            display: inline-flex !important;
            align-items: center;
            gap: 0.35rem;
          }
        }
        @media (max-width: 640px) {
          .products-page-container {
            padding: 1.5rem 1rem 3.5rem !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .products-page-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.85rem !important;
            margin-bottom: 1.25rem !important;
            padding-bottom: 1rem !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .products-page-heading {
            font-size: 1.5rem !important;
          }
          .products-page-subtitle {
            font-size: 0.85rem !important;
          }
          .products-page-controls {
            width: 100% !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            gap: 0.5rem !important;
            box-sizing: border-box !important;
          }
          .mobile-filter-btn {
            flex: 1 1 auto !important;
            justify-content: center !important;
            padding: 0.45rem 0.75rem !important;
            font-size: 0.825rem !important;
          }
          .products-page-sort-wrap {
            flex: 1.4 1 auto !important;
            gap: 0.35rem !important;
          }
          .products-sort-select {
            width: 100% !important;
            padding: 0.45rem 0.5rem !important;
            font-size: 0.8rem !important;
          }
          .shop-layout {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 1.25rem !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .shop-layout > main {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .grid-products {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 1.25rem !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .grid-products .product-card {
            border-radius: 14px !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .grid-products .product-card-image-wrap {
            aspect-ratio: 1 / 1 !important;
            max-height: none !important;
            height: auto !important;
            padding: 1.5rem !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .grid-products .product-card-image {
            max-height: 220px !important;
            max-width: 80% !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
          }
          .grid-products .product-card-body {
            padding: 1.15rem 1.25rem 1.25rem !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .grid-products .product-card-brand {
            font-size: 0.7rem !important;
            margin-bottom: 0.25rem !important;
            letter-spacing: 0.06em !important;
          }
          .grid-products .product-card-title {
            font-size: 0.935rem !important;
            line-height: 1.38 !important;
            min-height: 2.6rem !important;
            max-height: none !important;
            margin-bottom: 0.45rem !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
          }
          .grid-products .product-card-rating-wrap {
            margin-bottom: 0.75rem !important;
            gap: 0.35rem !important;
            font-size: 0.825rem !important;
          }
          .grid-products .product-card-footer {
            padding-top: 0.75rem !important;
            gap: 0.5rem !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .grid-products .product-card-price-wrap {
            min-height: 2.4rem !important;
          }
          .grid-products .price-current,
          .grid-products .product-card-price-current {
            font-size: 1.15rem !important;
          }
          .grid-products .product-card-price-original {
            font-size: 0.75rem !important;
          }
          .grid-products .btn-add-cart,
          .grid-products .btn-added-cart {
            padding: 0.45rem 0.95rem !important;
            font-size: 0.825rem !important;
            height: 36px !important;
            gap: 0.35rem !important;
            flex-shrink: 0 !important;
          }
          .grid-products .product-card-wishlist-btn {
            top: 0.75rem !important;
            right: 0.75rem !important;
            width: 32px !important;
            height: 32px !important;
          }
          .grid-products .badge-discount {
            top: 0.75rem !important;
            left: 0.75rem !important;
            font-size: 0.72rem !important;
            padding: 0.15rem 0.5rem !important;
          }
        }
        @media (max-width: 480px) {
          .products-page-container {
            padding: 1rem 0.75rem 3rem !important;
          }
          .products-page-breadcrumbs {
            margin-bottom: 0.85rem !important;
            font-size: 0.75rem !important;
          }
          .products-page-heading {
            font-size: 1.35rem !important;
          }
          .grid-products {
            gap: 1rem !important;
          }
          .grid-products .product-card-image-wrap {
            padding: 1.25rem !important;
          }
          .grid-products .product-card-image {
            max-height: 180px !important;
          }
          .grid-products .product-card-body {
            padding: 1rem 1.1rem 1.1rem !important;
          }
          .grid-products .product-card-title {
            font-size: 0.9rem !important;
          }
        }
        @media (max-width: 380px) {
          .grid-products {
            gap: 0.85rem !important;
          }
          .grid-products .product-card-image-wrap {
            padding: 1rem !important;
          }
          .grid-products .product-card-image {
            max-height: 160px !important;
          }
          .grid-products .product-card-body {
            padding: 0.85rem 0.95rem 0.95rem !important;
          }
          .grid-products .product-card-title {
            font-size: 0.85rem !important;
          }
          .grid-products .price-current,
          .grid-products .product-card-price-current {
            font-size: 1.05rem !important;
          }
          .grid-products .btn-add-cart,
          .grid-products .btn-added-cart {
            padding: 0.35rem 0.75rem !important;
            font-size: 0.78rem !important;
            height: 32px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductsPage;

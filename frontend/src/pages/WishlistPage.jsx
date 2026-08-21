import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight, ChevronRight, Star } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const WishlistPage = () => {
  const { wishlist, removeFromWishlist, totalWishlistItems } = useWishlist();
  const { addToCart, setIsDrawerOpen } = useCart();
  const toast = useToast();

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success(`Added ${product.name} to bag ✓`);
    setIsDrawerOpen(true);
  };

  if (wishlist.length === 0) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <div className="card-panel" style={{ maxWidth: '480px', margin: '0 auto', padding: '4rem 2rem', boxShadow: 'var(--shadow-card)' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#FFF1F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.35rem',
            }}
          >
            <Heart size={30} color="#E11D48" />
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.5rem' }}>Your wishlist is empty</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '2rem' }}>
            Save items you love by tapping the heart icon on any product in our catalog.
          </p>
          <Link to="/products" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Explore Catalog <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container wishlist-container">
      {/* Breadcrumbs */}
      <div
        className="wishlist-breadcrumbs"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.825rem',
          color: 'var(--text-muted)',
          marginBottom: '1.5rem',
        }}
      >
        <Link to="/" style={{ color: 'var(--text-secondary)' }}>Home</Link>
        <ChevronRight size={13} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 650 }}>Wishlist</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
        <div>
          <h1 className="wishlist-heading" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 850, letterSpacing: '-0.035em', lineHeight: 1.15, textTransform: 'uppercase' }}>
            Saved Items
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.35rem' }}>
            {totalWishlistItems} {totalWishlistItems === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>
      </div>

      {/* Grid of Wishlisted Products */}
      <div className="grid-products wishlist-grid">
        {wishlist.map((product) => {
          const pId = product._id || product.id || product;
          const isOutOfStock = product.stock !== undefined && product.stock <= 0;

          return (
            <div
              key={pId}
              className="card-panel wishlist-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                padding: 0,
                boxShadow: 'var(--shadow-card)',
                transition: 'var(--transition)',
              }}
            >
              {/* Remove button */}
              <button
                onClick={() => removeFromWishlist(pId)}
                style={{
                  position: 'absolute',
                  top: '0.85rem',
                  right: '0.85rem',
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  cursor: 'pointer',
                  color: '#E11D48',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'var(--transition-fast)',
                }}
                className="wishlist-remove-btn"
                title="Remove from wishlist"
                aria-label="Remove from wishlist"
              >
                <Heart size={16} fill="#E11D48" color="#E11D48" />
              </button>

              {/* Image Frame */}
              <Link
                to={`/products/${pId}`}
                className="wishlist-card-image-wrap"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.75rem',
                  background: '#F9F9F8',
                  borderBottom: '1px solid var(--border-light)',
                  textAlign: 'center',
                }}
              >
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                  alt={product.name}
                  style={{ width: '100%', height: '170px', objectFit: 'contain' }}
                  className="wishlist-img"
                />
              </Link>

              {/* Product Info */}
              <div className="wishlist-card-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                  {product.brand || product.category || 'Velora'}
                </span>

                <Link
                  to={`/products/${pId}`}
                  className="wishlist-card-title"
                  style={{
                    fontSize: '0.975rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginTop: '0.25rem',
                    lineHeight: 1.35,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '2.7rem',
                  }}
                >
                  {product.name}
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', margin: '0.5rem 0' }}>
                  <Star size={13} fill="#171717" color="#171717" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {product.rating?.toFixed(1) || '4.8'}
                  </span>
                  <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                    ({product.ratingCount || 120})
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.85rem', borderTop: '1px solid var(--border-light)' }}>
                  <span className="wishlist-price" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    ${product.price?.toFixed(2)}
                  </span>
                  <span
                    className={`badge ${isOutOfStock ? 'badge-danger' : 'badge-neutral'}`}
                    style={{ fontSize: '0.725rem' }}
                  >
                    {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                  </span>
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={isOutOfStock}
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', marginTop: '1.15rem' }}
                >
                  <ShoppingBag size={14} /> Add to Bag
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .wishlist-container {
          padding: 2.5rem 1.5rem 5rem;
        }
        @media (max-width: 640px) {
          .wishlist-container {
            padding: 1.5rem 1rem 3.5rem !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .wishlist-grid {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 1.25rem !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .wishlist-card {
            border-radius: 14px !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .wishlist-card-image-wrap {
            padding: 1.5rem !important;
            aspect-ratio: 1 / 1 !important;
            height: auto !important;
            max-height: none !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .wishlist-img {
            max-height: 220px !important;
            max-width: 80% !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
          }
          .wishlist-card-body {
            padding: 1.15rem 1.25rem 1.25rem !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .wishlist-card-title {
            font-size: 0.935rem !important;
            line-height: 1.38 !important;
            min-height: 2.6rem !important;
            max-height: none !important;
            margin-top: 0.25rem !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
          }
          .wishlist-price {
            font-size: 1.15rem !important;
          }
          .wishlist-remove-btn {
            width: 32px !important;
            height: 32px !important;
            top: 0.75rem !important;
            right: 0.75rem !important;
          }
        }
        @media (max-width: 480px) {
          .wishlist-grid {
            gap: 1rem !important;
          }
          .wishlist-card-image-wrap {
            padding: 1.25rem !important;
          }
          .wishlist-img {
            max-height: 180px !important;
          }
          .wishlist-card-body {
            padding: 1rem 1.1rem 1.1rem !important;
          }
          .wishlist-card-title {
            font-size: 0.9rem !important;
          }
        }
        @media (max-width: 380px) {
          .wishlist-grid {
            gap: 0.85rem !important;
          }
          .wishlist-card-image-wrap {
            padding: 1rem !important;
          }
          .wishlist-img {
            max-height: 160px !important;
          }
          .wishlist-card-body {
            padding: 0.85rem 0.95rem 0.95rem !important;
          }
          .wishlist-card-title {
            font-size: 0.85rem !important;
          }
          .wishlist-price {
            font-size: 1.05rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default WishlistPage;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Check, HelpCircle, EyeOff, X, Sparkles, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useTracker } from '../hooks/useTracker';
import { useToast } from '../context/ToastContext';
import api from '../api/client';

const categoryFallbacks = {
  electronics: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&auto=format&fit=crop&q=80',
  audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80',
  fashion: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&auto=format&fit=crop&q=80',
  'home-living': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=700&auto=format&fit=crop&q=80',
  home: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=700&auto=format&fit=crop&q=80',
  'sports-fitness': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&auto=format&fit=crop&q=80',
  fitness: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&auto=format&fit=crop&q=80',
  beauty: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=700&auto=format&fit=crop&q=80',
  accessories: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&auto=format&fit=crop&q=80',
  gaming: 'https://images.unsplash.com/photo-1612287233207-6f77ff75c8ea?w=700&auto=format&fit=crop&q=80',
  'books-learning': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=700&auto=format&fit=crop&q=80',
  travel: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&auto=format&fit=crop&q=80',
  'office-workspace': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=700&auto=format&fit=crop&q=80',
};

// Subtle category-inspired editorial ambient backgrounds
const CATEGORY_BACKGROUNDS = {
  electronics: 'radial-gradient(circle at 50% 45%, #F1F5F9 0%, #E6EDF3 100%)', // Cool Slate / Tech
  audio: 'radial-gradient(circle at 50% 45%, #F4F2F9 0%, #ECE8F5 100%)', // Soft Lavender / Acoustic
  fashion: 'radial-gradient(circle at 50% 45%, #FCF4F1 0%, #F6ECE8 100%)', // Warm Blush / Atelier
  'home-living': 'radial-gradient(circle at 50% 45%, #F7F5EF 0%, #EDE9E1 100%)', // Warm Linen / Organic
  home: 'radial-gradient(circle at 50% 45%, #F7F5EF 0%, #EDE9E1 100%)',
  'sports-fitness': 'radial-gradient(circle at 50% 45%, #F0F8F5 0%, #E5F1ED 100%)', // Soft Sage / Vitality
  fitness: 'radial-gradient(circle at 50% 45%, #F0F8F5 0%, #E5F1ED 100%)',
  beauty: 'radial-gradient(circle at 50% 45%, #FBF3F6 0%, #F5E8EE 100%)', // Soft Rose / Glow
  accessories: 'radial-gradient(circle at 50% 45%, #F8F6F1 0%, #EFECE5 100%)', // Warm Sand / Leather
  gaming: 'radial-gradient(circle at 50% 45%, #EFF3F8 0%, #E4EAF3 100%)', // Sleek Graphite Ice
  'books-learning': 'radial-gradient(circle at 50% 45%, #F9F6EF 0%, #F0ECE1 100%)', // Warm Ivory / Parchment
  travel: 'radial-gradient(circle at 50% 45%, #EFF6F7 0%, #E2EDEF 100%)', // Soft Sky / Wander
  'office-workspace': 'radial-gradient(circle at 50% 45%, #F3F5F6 0%, #E8ECEF 100%)', // Minimal Studio
};

// Fallback palette of 5 very soft editorial tones for any custom or missing category
const EDITORIAL_PALETTE = [
  'radial-gradient(circle at 50% 45%, #F9F6EF 0%, #F0ECE1 100%)', // Soft Warm Ivory
  'radial-gradient(circle at 50% 45%, #FCF4F1 0%, #F6ECE8 100%)', // Subtle Muted Blush
  'radial-gradient(circle at 50% 45%, #F1F5F9 0%, #E6EDF3 100%)', // Soft Cool Blue/Grey
  'radial-gradient(circle at 50% 45%, #F8F6F1 0%, #EFECE5 100%)', // Subtle Warm Beige
  'radial-gradient(circle at 50% 45%, #F0F8F5 0%, #E5F1ED 100%)', // Soft Sage
];

const getProductBackground = (category, id = '') => {
  const key = (category || '').toLowerCase().replace(/\s+/g, '-');
  if (CATEGORY_BACKGROUNDS[key]) {
    return CATEGORY_BACKGROUNDS[key];
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i)) % EDITORIAL_PALETTE.length;
  }
  return EDITORIAL_PALETTE[hash] || EDITORIAL_PALETTE[0];
};

const ProductCardComponent = ({
  product,
  showRecommendationBadge = false,
  onDismiss = null,
}) => {
  const { addToCart, isInCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { trackClick } = useTracker();
  const toast = useToast();

  const [showExplanation, setShowExplanation] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);

  if (!product || isDismissed) return null;

  const pId = (product._id || product.id || '').toString();
  const wishlisted = isInWishlist(product);
  const isAdded = isInCart(product);

  const handleCardClick = () => {
    trackClick(pId);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdded) {
      // Product is already in cart, avoid duplicate trigger
      return;
    }

    await addToCart(product, 1);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHeartAnimating(true);
    setTimeout(() => setHeartAnimating(false), 300);
    toggleWishlist(product);
  };

  const handleNotInterested = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
    toast.info("We'll tune your feed to show fewer items like this.");

    try {
      await api.post('/recommendations/feedback', {
        productId: pId,
        type: 'not_interested',
      });
    } catch {
      // Non-critical background feedback
    }

    if (onDismiss) onDismiss(pId);
  };

  // Resolve image URL with robust fallback
  const rawImage = product.images?.[0];
  const categoryKey = (product.category || '').toLowerCase().replace(/\s+/g, '-');
  const fallbackSrc = categoryFallbacks[categoryKey] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700';
  const displayImage = imgError || !rawImage ? fallbackSrc : rawImage;

  const scorePercentage = product.recommendationScore
    ? Math.round(product.recommendationScore * 100)
    : null;

  const explainReason = product.recommendationReason || 'Curated based on your shopping preferences';
  const cardBgGradient = getProductBackground(product.category, pId);

  return (
    <div
      className="card-panel product-card"
      onClick={handleCardClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        background: '#FFFFFF',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Top Image Container with Category-Inspired Ambient Editorial Background */}
      <Link
        to={`/products/${pId}`}
        className="product-card-image-wrap"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          aspectRatio: '1 / 1',
          background: cardBgGradient,
          borderBottom: '1px solid var(--border-light)',
          overflow: 'hidden',
          padding: '1.65rem',
        }}
        aria-label={`View ${product.name}`}
      >
        <img
          src={displayImage}
          alt={product.name}
          onError={() => setImgError(true)}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.05))',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitUserDrag: 'none',
          }}
          className="product-card-image"
          loading="lazy"
        />

        {/* Floating Heart Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: wishlisted ? '#E11D48' : 'var(--text-secondary)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            zIndex: 3,
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            animation: heartAnimating ? 'heartPulse 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          }}
          className="product-card-wishlist-btn wishlist-btn-hover"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart size={15} fill={wishlisted ? '#E11D48' : 'none'} color={wishlisted ? '#E11D48' : 'currentColor'} />
        </button>

        {/* Discount Ribbon Badge */}
        {product.discountPercentage > 0 && (
          <span
            className="badge-discount"
            style={{
              position: 'absolute',
              top: '0.75rem',
              left: '0.75rem',
              zIndex: 2,
              maxWidth: 'calc(100% - 3.5rem)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            -{product.discountPercentage}%
          </span>
        )}

        {/* Refined Recommendation Score Match Pill */}
        {(showRecommendationBadge || product.recommendationScore) && (
          <span
            className="product-card-match-pill"
            style={{
              position: 'absolute',
              bottom: '0.65rem',
              left: '0.75rem',
              zIndex: 2,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.72rem',
              fontWeight: 650,
              letterSpacing: '0.01em',
              background: '#E8F5F2',
              border: '1px solid #C4E5DE',
              color: '#1D6157',
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              maxWidth: 'calc(100% - 1.5rem)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <Sparkles size={10} color="#1D6157" style={{ opacity: 0.9, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {scorePercentage ? `${scorePercentage}% Match` : 'Curated Pick'}
            </span>
          </span>
        )}
      </Link>

      {/* Product Content Details */}
      <div
        className="product-card-body"
        style={{
          padding: '1.15rem 1.25rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        }}
      >
        {/* Brand / Category Subtitle */}
        <span
          className="product-card-brand"
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            fontWeight: 600,
            letterSpacing: '0.06em',
            marginBottom: '0.25rem',
            display: 'block',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {product.brand || product.category || 'Velora Collection'}
        </span>

        {/* Product Title */}
        <Link
          to={`/products/${pId}`}
          style={{
            fontSize: '0.935rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.38,
            marginBottom: '0.45rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.6rem',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
          className="product-card-title title-link-hover"
        >
          {product.name}
        </Link>

        {/* Star Rating */}
        <div
          className="product-card-rating-wrap"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginBottom: '0.75rem',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
          }}
        >
          <Star size={12} fill="#111111" color="#111111" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.825rem', fontWeight: 650, color: 'var(--text-primary)' }}>
            {product.rating?.toFixed(1) || '4.8'}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            ({product.ratingCount || 120})
          </span>
        </div>

        {/* Recommendation Explainability Popover Row */}
        {(showRecommendationBadge || product.recommendationReason) && (
          <div
            className="product-card-explain-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              padding: '0.3rem 0.6rem',
              background: '#F9F9F7',
              borderRadius: '6px',
              border: '1px solid var(--border-light)',
              fontSize: '0.725rem',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowExplanation(!showExplanation);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: '#1D6157',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              <HelpCircle size={11} color="#1D6157" /> Why this?
            </button>

            <button
              type="button"
              onClick={handleNotInterested}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
              title="Not interested in this item"
            >
              <EyeOff size={11} /> Hide
            </button>
          </div>
        )}

        {/* Popover Bubble */}
        {showExplanation && (
          <div
            style={{
              marginBottom: '0.75rem',
              padding: '0.65rem 0.85rem',
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              position: 'relative',
              zIndex: 4,
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              wordBreak: 'break-word',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Personalization Reason</strong>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowExplanation(false);
                }}
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={12} />
              </button>
            </div>
            {explainReason}
          </div>
        )}

        {/* Price & Action Row with Elegant Hairline Divider */}
        <div
          className="product-card-footer"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-light)',
            gap: '0.5rem',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          {/* Price Display: Original strikethrough price directly above actual price */}
          <div
            className="product-card-price-wrap"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              minHeight: '2.4rem',
              minWidth: 0,
              flex: '1 1 auto',
            }}
          >
            {product.originalPrice && product.originalPrice > product.price && (
              <span
                className="product-card-price-original"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  textDecoration: 'line-through',
                  lineHeight: 1.2,
                  fontWeight: 500,
                  marginBottom: '2px',
                  whiteSpace: 'nowrap',
                }}
              >
                {product.currency === 'INR' ? '₹' : '$'}{product.originalPrice?.toLocaleString('en-IN') || product.originalPrice?.toFixed(2)}
              </span>
            )}
            <span
              className="price-current product-card-price-current"
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
              }}
            >
              {product.currency === 'INR' ? '₹' : '$'}{product.price?.toLocaleString('en-IN') || product.price?.toFixed(2)}
            </span>
          </div>

          {/* Add / Added Button derived from live Cart State */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={isAdded ? 'btn-added-cart' : 'btn-add-cart'}
            style={{ flexShrink: 0 }}
            aria-label={isAdded ? `${product.name} is in bag` : `Add ${product.name} to bag`}
          >
            {isAdded ? (
              <>
                <Check size={14} color="#15803D" style={{ flexShrink: 0 }} />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag size={14} style={{ flexShrink: 0 }} />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @media (hover: hover) and (pointer: fine) {
          .product-card:hover {
            border-color: #D0D0CA !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06) !important;
            transform: translateY(-2px);
          }
          .product-card:hover .product-card-image {
            transform: scale(1.02);
          }
          .wishlist-btn-hover:hover {
            transform: scale(1.08);
            background: #FFFFFF !important;
          }
          .title-link-hover:hover {
            color: var(--accent) !important;
          }
        }
        .wishlist-btn-hover:active {
          transform: scale(0.92);
        }
      `}</style>
    </div>
  );
};

export const ProductCard = React.memo(ProductCardComponent);
export default ProductCard;

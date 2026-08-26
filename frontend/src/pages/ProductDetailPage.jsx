import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Plus,
  Minus,
  Check,
  MessageSquare,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTracker } from '../hooks/useTracker';
import { ProductCarousel } from '../components/ProductCarousel';

const categoryFallbacks = {
  electronics: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
  audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  fashion: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
  'home-living': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80',
  home: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80',
  'sports-fitness': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
  fitness: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
  beauty: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
  accessories: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
  gaming: 'https://images.unsplash.com/photo-1612287233207-6f77ff75c8ea?w=800&auto=format&fit=crop&q=80',
  'books-learning': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
  travel: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
  'office-workspace': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
};

export const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [loading, setLoading] = useState(true);
  const [mainImgError, setMainImgError] = useState(false);
  const [pdpHeartAnimating, setPdpHeartAnimating] = useState(false);

  // Review System State
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    count: 0,
    averageRating: 4.5,
    distributionPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const { addToCart, setIsDrawerOpen, isInCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated, user } = useAuth();
  const { trackView, trackCart } = useTracker();
  const toast = useToast();
  const navigate = useNavigate();

  const isWishlisted = product ? isInWishlist(product._id) : false;
  const isAdded = product ? isInCart(product._id) : false;

  const fetchProductAndReviews = async () => {
    try {
      // 1. Fetch main product details first
      const prodRes = await api.get(`/products/${id}`);

      if (prodRes.data?.product) {
        const prodData = prodRes.data.product;
        setProduct(prodData);
        trackView(prodData._id || prodData.id || id);
      }

      // 2. Fetch recommendations & reviews independently in background without blocking PDP render
      Promise.all([
        api.get(`/recommendations/similar/${id}`, { params: { limit: 8 } }).catch(() => null),
        api.get(`/products/${id}/reviews`).catch(() => null),
      ]).then(([simRes, revRes]) => {
        if (simRes?.data?.recommendations || simRes?.data?.similar) {
          setSimilarProducts(simRes.data.recommendations || simRes.data.similar);
        }

        if (revRes?.data?.reviews) {
          setReviewsData({
            reviews: revRes.data.reviews,
            count: revRes.data.count || revRes.data.reviews.length,
            averageRating: revRes.data.averageRating || 4.5,
            distributionPercentages: revRes.data.distributionPercentages || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          });
        }
      });
    } catch (err) {
      console.warn('Error loading product details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setMainImgError(false);
    setSelectedImage(0);
    fetchProductAndReviews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3.5rem' }} className="product-detail-layout">
          <div className="skeleton" style={{ aspectRatio: '1 / 1', borderRadius: 'var(--radius-card)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="skeleton" style={{ height: '24px', width: '30%' }} />
            <div className="skeleton" style={{ height: '36px', width: '80%' }} />
            <div className="skeleton" style={{ height: '20px', width: '40%' }} />
            <div className="skeleton" style={{ height: '32px', width: '25%' }} />
            <div className="skeleton" style={{ height: '120px', width: '100%', borderRadius: 'var(--radius-md)' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>Product Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          The requested product could not be located in our catalog.
        </p>
        <Link to="/products" className="btn btn-primary">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const handleAddToCart = async (openDrawer = true) => {
    if (!product) return;
    const result = await addToCart(product, quantity);
    if (result?.success !== false) {
      trackCart(product._id);
      if (openDrawer) setIsDrawerOpen(true);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    const destUrl = product.affiliateUrl || product.amazonUrl;
    if (product.source === 'amazon' || destUrl) {
      if (destUrl) {
        window.open(destUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    }
    if (!isAdded) {
      const result = await addToCart(product, quantity);
      if (result?.success === false) return;
      trackCart(product._id);
    }
    navigate('/checkout');
  };

  const handleWishlistToggle = () => {
    setPdpHeartAnimating(true);
    setTimeout(() => setPdpHeartAnimating(false), 300);
    toggleWishlist(product);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to submit a verified review.');
      navigate(`/login?redirect=/products/${id}`);
      return;
    }

    if (!reviewComment.trim()) {
      toast.error('Please provide review comments.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.post(`/products/${id}/reviews`, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });

      if (res.data?.success) {
        toast.success('Review submitted successfully');
        setShowReviewForm(false);
        setReviewTitle('');
        setReviewComment('');
        fetchProductAndReviews();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.info('Review removed');
      fetchProductAndReviews();
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  // Image fallback resolver
  const categoryKey = (product.category || '').toLowerCase().replace(/\s+/g, '-');
  const fallbackImg = categoryFallbacks[categoryKey] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';
  const currentImg = mainImgError || !product.images?.[selectedImage]
    ? fallbackImg
    : product.images[selectedImage];

  return (
    <div className="container product-detail-container" style={{ padding: '3rem 2rem 5rem' }}>
      {/* Breadcrumbs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.825rem',
          color: 'var(--text-muted)',
          marginBottom: '2rem',
        }}
      >
        <Link to="/" style={{ color: 'var(--text-secondary)' }}>Home</Link>
        <ChevronRight size={13} />
        <Link to="/products" style={{ color: 'var(--text-secondary)' }}>Shop</Link>
        <ChevronRight size={13} />
        <Link to={`/products?category=${product.category}`} style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
          {product.category?.replace('-', ' ')}
        </Link>
        <ChevronRight size={13} />
        <span
          style={{
            color: 'var(--text-primary)',
            fontWeight: 650,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '260px',
          }}
        >
          {product.name}
        </span>
      </div>

      {/* Main Two-Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: '4rem',
          marginBottom: '5rem',
        }}
        className="product-detail-layout"
      >
        {/* Left: Product Image Gallery */}
        <div>
          {/* Main Showcase Image */}
          <div
            className="pdp-main-image-wrap"
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              background: 'var(--bg-card-soft)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2.75rem',
              overflow: 'hidden',
              marginBottom: '1.25rem',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <img
              src={currentImg}
              alt={product.name}
              onError={() => setMainImgError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transition: 'transform 0.3s ease',
              }}
            />
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto' }}>
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImage(idx);
                    setMainImgError(false);
                  }}
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid',
                    borderColor: selectedImage === idx ? '#111111' : 'var(--border)',
                    padding: '0.4rem',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    outline: 'none',
                    opacity: selectedImage === idx ? 1 : 0.65,
                    transition: 'var(--transition-fast)',
                  }}
                  aria-label={`Select product image ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Meta & Purchase Form */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Brand & Wishlist Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.785rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              {product.brand || product.category || 'Velora Collection'}
            </span>
            <button
              onClick={handleWishlistToggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.835rem',
                color: isWishlisted ? '#E11D48' : 'var(--text-secondary)',
                fontWeight: 650,
                transition: 'var(--transition-fast)',
                animation: pdpHeartAnimating ? 'heartPulse 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
              }}
            >
              <Heart size={16} fill={isWishlisted ? '#E11D48' : 'none'} color={isWishlisted ? '#E11D48' : 'currentColor'} />
              <span>{isWishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}</span>
            </button>
          </div>

          {/* Product Title */}
          <h1
            style={{
              fontSize: '2.15rem',
              fontWeight: 850,
              letterSpacing: '-0.025em',
              lineHeight: 1.25,
              color: 'var(--text-primary)',
              marginBottom: '1rem',
            }}
          >
            {product.name}
          </h1>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.885rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Star size={15} fill="#111111" color="#111111" />
              <strong style={{ color: 'var(--text-primary)', fontWeight: 750 }}>
                {reviewsData.averageRating?.toFixed(1) || product.rating?.toFixed(1) || '4.8'}
              </strong>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <button
              onClick={() => setActiveTab('reviews')}
              style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.885rem', fontWeight: 600 }}
            >
              {reviewsData.count || product.ratingCount || 0} reviews
            </button>
          </div>

          {/* Price & Savings */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.85rem',
              marginBottom: '1.5rem',
              paddingBottom: '1.5rem',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: '2.1rem', fontWeight: 850, color: 'var(--text-primary)' }}>
              {product.currency === 'INR' ? '₹' : '$'}{product.price?.toLocaleString('en-IN') || product.price?.toFixed(2)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span style={{ fontSize: '1.15rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  {product.currency === 'INR' ? '₹' : '$'}{product.originalPrice?.toLocaleString('en-IN') || product.originalPrice?.toFixed(2)}
                </span>
                <span className="badge badge-discount">
                  Save {product.discountPercentage}%
                </span>
              </>
            )}
          </div>

          {/* In-Stock Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem', fontSize: '0.885rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: product.stock > 5 ? '#15803D' : '#E11D48' }} />
            <span style={{ fontWeight: 700, color: product.stock > 5 ? 'var(--text-primary)' : '#E11D48' }}>
              {product.stock > 0 ? `In Stock (${product.stock} units available)` : 'Out of Stock'}
            </span>
          </div>

          {/* Quantity & CTA Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {/* Stepper */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.95rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-btn)',
                  padding: '0.45rem 0.95rem',
                  background: 'var(--bg-secondary)',
                }}
              >
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ display: 'flex', color: 'var(--text-secondary)' }}
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span style={{ fontSize: '0.95rem', fontWeight: 750, minWidth: '22px', textAlign: 'center' }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                  style={{ display: 'flex', color: 'var(--text-secondary)' }}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add to Bag CTA */}
              <button
                onClick={() => handleAddToCart(true)}
                disabled={product.stock <= 0}
                className={`btn btn-lg ${isAdded ? 'btn-cart-added' : 'btn-primary'}`}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  fontWeight: 750,
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  ...(isAdded
                    ? {
                        background: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        color: '#15803D',
                        boxShadow: '0 1px 4px rgba(21, 128, 61, 0.12)',
                        cursor: 'default',
                      }
                    : {}),
                }}
              >
                {isAdded ? (
                  <>
                    <Check size={18} color="#15803D" /> Added ✓
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Add to Bag
                  </>
                )}
              </button>
            </div>

            {/* Instant Checkout CTA / Amazon Buy Now */}
            <button
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
              className="btn btn-secondary btn-lg"
              style={{ width: '100%', borderColor: 'var(--border-hover)', fontWeight: 750, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
            >
              {product.source === 'amazon' || product.affiliateUrl ? (
                <>
                  Buy Now on Amazon <ExternalLink size={16} />
                </>
              ) : (
                'Instant Checkout'
              )}
            </button>
          </div>

          {/* Guarantee Badges */}
          <div
            className="pdp-guarantee-badges"
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '1.75rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.15rem',
              fontSize: '0.835rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Truck size={16} color="var(--accent)" />
              <span>Complimentary shipping over $50</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <RotateCcw size={16} color="var(--accent)" />
              <span>30-day effortless returns</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={16} color="var(--accent)" />
              <span>2-year limited warranty</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles size={16} color="var(--accent)" />
              <span>Personalized recommendations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Product Details */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '3.5rem', marginBottom: '5rem' }}>
        <div className="pdp-tabs-header" style={{ display: 'flex', gap: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem', marginBottom: '2.25rem' }}>
          {[
            { id: 'description', label: 'Description' },
            { id: 'specifications', label: 'Specifications' },
            { id: 'reviews', label: `Reviews (${reviewsData.count})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="pdp-tab-btn"
              style={{
                fontSize: '1rem',
                fontWeight: 750,
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid #111111' : '2px solid transparent',
                paddingBottom: '0.85rem',
                marginBottom: '-0.95rem',
                transition: 'var(--transition-fast)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Description */}
        {activeTab === 'description' && (
          <div style={{ maxWidth: '820px', color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: '1rem' }}>{product.description}</p>
            <p>
              Engineered with premium materials for maximum durability and unmatched aesthetic elegance. Designed for high performance and seamless daily utility.
            </p>
          </div>
        )}

        {/* Tab 2: Technical Specifications */}
        {activeTab === 'specifications' && (
          <div style={{ maxWidth: '720px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '0.75rem 0', fontWeight: 650, color: 'var(--text-primary)', width: '35%' }}>Brand</td>
                  <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>{product.brand || 'Velora'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '0.75rem 0', fontWeight: 650, color: 'var(--text-primary)' }}>Category</td>
                  <td style={{ padding: '0.75rem 0', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{product.category}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '0.75rem 0', fontWeight: 650, color: 'var(--text-primary)' }}>Inventory SKU</td>
                  <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>VL-{product._id?.slice(-8).toUpperCase()}</td>
                </tr>
                {product.specs &&
                  Object.entries(product.specs).map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.75rem 0', fontWeight: 650, color: 'var(--text-primary)' }}>{k}</td>
                      <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>{v}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Reviews & Ratings */}
        {activeTab === 'reviews' && (
          <div style={{ maxWidth: '840px', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Reviews Summary Header */}
            <div
              className="card-panel reviews-summary-layout"
              style={{
                padding: '2.25rem',
                display: 'grid',
                gridTemplateColumns: '220px 1fr auto',
                gap: '2.5rem',
                alignItems: 'center',
              }}
            >
              {/* Score Box */}
              <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-light)', paddingRight: '1.5rem' }}>
                <div style={{ fontSize: '3.2rem', fontWeight: 850, lineHeight: 1, color: 'var(--text-primary)' }}>
                  {reviewsData.averageRating?.toFixed(1) || '4.5'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', margin: '0.65rem 0 0.35rem' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={15}
                      fill={s <= Math.round(reviewsData.averageRating) ? '#111111' : '#E8E8E8'}
                      color={s <= Math.round(reviewsData.averageRating) ? '#111111' : '#E8E8E8'}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Based on {reviewsData.count} reviews
                </span>
              </div>

              {/* Star Distribution Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {[5, 4, 3, 2, 1].map((stars) => {
                  const pct = reviewsData.distributionPercentages?.[stars] || 0;
                  return (
                    <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.825rem' }}>
                      <span style={{ minWidth: '40px', color: 'var(--text-secondary)', fontWeight: 600 }}>{stars} ★</span>
                      <div style={{ flex: 1, height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#111111', transition: 'width 0.3s ease' }} />
                      </div>
                      <span style={{ minWidth: '35px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Write Review CTA */}
              <div>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="btn btn-primary btn-sm"
                >
                  <MessageSquare size={14} />
                  {showReviewForm ? 'Close Form' : 'Write a Review'}
                </button>
              </div>
            </div>

            {/* Write a Review Form */}
            {showReviewForm && (
              <form onSubmit={handleSubmitReview} className="card-panel" style={{ padding: '2rem', background: 'var(--bg-secondary)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.35rem' }}>
                  Write a Customer Review
                </h3>

                {/* Rating Selector */}
                <div className="input-group">
                  <label className="input-label">Overall Rating *</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                      >
                        <Star
                          size={24}
                          fill={star <= reviewRating ? '#111111' : 'none'}
                          color={star <= reviewRating ? '#111111' : 'var(--text-muted)'}
                        />
                      </button>
                    ))}
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, marginLeft: '0.5rem' }}>
                      {reviewRating} of 5 Stars
                    </span>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Review Headline</label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Exceptional build quality and audio performance"
                    className="input-field"
                    maxLength={120}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Your Review *</label>
                  <textarea
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share what you liked, disliked, and why you would recommend this item..."
                    className="input-field"
                    style={{ minHeight: '110px', resize: 'vertical' }}
                    maxLength={2000}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="btn btn-primary btn-sm"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}

            {/* Reviews List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {reviewsData.reviews.length === 0 ? (
                <div className="card-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No customer reviews yet. Be the first to leave a review for this product!
                </div>
              ) : (
                reviewsData.reviews.map((rev) => {
                  const isOwner = user && (rev.userId?._id === user.id || rev.userId === user.id);

                  return (
                    <div key={rev._id} className="card-panel" style={{ padding: '1.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                            <strong style={{ fontSize: '0.95rem' }}>{rev.userId?.name || 'Verified Shopper'}</strong>
                            {rev.verifiedPurchase && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  color: '#15803D',
                                  fontSize: '0.725rem',
                                  fontWeight: 650,
                                }}
                              >
                                <CheckCircle2 size={12} /> Verified Purchase
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                size={12}
                                fill={i <= rev.rating ? '#111111' : '#E8E8E8'}
                                color={i <= rev.rating ? '#111111' : '#E8E8E8'}
                              />
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                            {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          {isOwner && (
                            <button
                              onClick={() => handleDeleteReview(rev._id)}
                              style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', padding: '2px' }}
                              title="Delete review"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {rev.title && (
                        <h4 style={{ fontSize: '0.975rem', fontWeight: 750, color: 'var(--text-primary)', marginBottom: '0.45rem' }}>
                          {rev.title}
                        </h4>
                      )}

                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                        {rev.comment}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Item-to-Item Similar Recommendations Carousel */}
      {similarProducts.length > 0 && (
        <section style={{ borderTop: '1px solid var(--border)', paddingTop: '4rem' }}>
          <ProductCarousel
            badge="Related Picks"
            badgeIcon={Sparkles}
            title="Similar Items You Might Like"
            subtitle="Calculated via item-item content & collaborative similarity"
            products={similarProducts}
            showRecommendationBadge={true}
          />
        </section>
      )}

      <style>{`
        @media (max-width: 868px) {
          .product-detail-layout {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .reviews-summary-layout {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
        @media (max-width: 640px) {
          .product-detail-container {
            padding: 1.5rem 1rem 3.5rem !important;
          }
          .pdp-main-image-wrap {
            padding: 1.25rem !important;
          }
          .product-detail-layout {
            gap: 1.75rem !important;
            margin-bottom: 2.5rem !important;
          }
          .product-detail-layout h1 {
            font-size: 1.55rem !important;
            line-height: 1.25 !important;
            margin-bottom: 0.75rem !important;
          }
          .pdp-guarantee-badges {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
            padding-top: 1.25rem !important;
          }
          .pdp-tabs-header {
            gap: 1.25rem !important;
            overflow-x: auto !important;
            white-space: nowrap !important;
            padding-bottom: 0.5rem !important;
          }
          .pdp-tab-btn {
            font-size: 0.885rem !important;
            padding-bottom: 0.5rem !important;
          }
        }
        @media (max-width: 480px) {
          .product-detail-container {
            padding: 1rem 0.75rem 3rem !important;
          }
          .pdp-main-image-wrap {
            padding: 0.85rem !important;
          }
          .product-detail-layout h1 {
            font-size: 1.4rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDetailPage;

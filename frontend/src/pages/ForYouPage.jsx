import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight,
  TrendingUp,
  Compass,
} from 'lucide-react';
import api from '../api/client';
import { ProductCarousel } from '../components/ProductCarousel';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ForYouPage = () => {
  const { user, isAuthenticated, loginAsDemoUser } = useAuth();
  const toast = useToast();

  const [recommendations, setRecommendations] = useState([]);
  const [strategy, setStrategy] = useState('collaborative_filtering');
  const [reason, setReason] = useState('');
  const [interactions, setInteractions] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [becauseYouViewed, setBecauseYouViewed] = useState(null);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadForYouData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch Main Personalized Recommendations
      let recs = [];
      let recSource = 'collaborative_filtering';
      let recReason = '';

      try {
        const recRes = await api.get('/recommendations', { params: { limit: 12 } });
        if (recRes.data?.recommendations && Array.isArray(recRes.data.recommendations) && recRes.data.recommendations.length > 0) {
          recs = recRes.data.recommendations;
          recSource = recRes.data.source || 'collaborative_filtering';
          recReason = recRes.data.reason || '';
        }
      } catch (e) {}

      // Secondary failsafe: if recommendations returned 0 items, fetch catalog products
      if (!recs || recs.length === 0) {
        try {
          const catRes = await api.get('/products', { params: { limit: 12, sort: 'popular' } });
          if (catRes.data?.products && Array.isArray(catRes.data.products)) {
            recs = catRes.data.products.map((p) => ({
              ...p,
              recommendationScore: p.recommendationScore || 0.88,
              recommendationReason: p.recommendationReason || 'Popular bestseller across Velora',
            }));
            recSource = 'cold_start_popular';
            recReason = 'Top trending bestseller across all shoppers';
          }
        } catch (e) {}
      }

      setRecommendations(recs);
      setStrategy(recSource);
      setReason(recReason);

      // 2. Fetch Trending / Popular Bestsellers
      try {
        const trendRes = await api.get('/products', { params: { sort: 'popular', limit: 8 } });
        if (trendRes.data?.products) {
          setTrendingProducts(trendRes.data.products);
        }
      } catch (e) {}

      // 3. Fetch User Interaction History & Stats if authenticated
      if (isAuthenticated) {
        try {
          const [historyRes, summaryRes] = await Promise.all([
            api.get('/interactions/my-history', { params: { limit: 8 } }),
            api.get('/interactions/summary'),
          ]);

          if (historyRes.data?.history) {
            setInteractions(historyRes.data.history);

            // If user has viewed an item, get similar items for "Because You Viewed"
            const lastViewed = historyRes.data.history.find((h) => h.productId);
            if (lastViewed && lastViewed.productId) {
              try {
                const targetPId = typeof lastViewed.productId === 'object'
                  ? (lastViewed.productId._id || lastViewed.productId.id || lastViewed.productId.sku)
                  : lastViewed.productId;

                if (targetPId) {
                  const simRes = await api.get(`/recommendations/similar/${targetPId}`, { params: { limit: 8 } });
                  if (simRes.data?.recommendations && simRes.data.recommendations.length > 0) {
                    setBecauseYouViewed({
                      baseProduct: lastViewed.productId,
                      products: simRes.data.recommendations,
                    });
                  }
                }
              } catch (simErr) {
                console.debug('Similar items load error:', simErr.message);
              }
            }
          }

          if (summaryRes.data?.stats) {
            setSummaryStats(summaryRes.data.stats);
          }
        } catch (intErr) {
          console.debug('Error loading interaction stats:', intErr.message);
        }
      }
    } catch (err) {
      console.warn('Failed to load For You hub data:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadForYouData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isAuthenticated]);

  const handleDismissProduct = (productId) => {
    setRecommendations((prev) => prev.filter((p) => (p._id || p.id) !== productId));
  };

  const isColdStart = !isAuthenticated || (summaryStats && summaryStats.totalInteractions === 0);

  return (
    <div className="container for-you-container" style={{ padding: '3.5rem 2rem 5rem' }}>
      {/* Header Editorial Box */}
      <div
        style={{
          background: 'var(--hero-teal)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '3rem 2.5rem',
          marginBottom: '4rem',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '3rem',
          alignItems: 'center',
          boxShadow: 'var(--shadow-card)',
        }}
        className="for-you-header"
      >
        <div>
          <div className="section-eyebrow" style={{ marginBottom: '0.85rem' }}>
            <Sparkles size={13} color="var(--accent)" /> Real-Time Personalization Hub
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 850,
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              marginBottom: '0.85rem',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
            }}
          >
            {isColdStart ? (
              <>
                Welcome to <span style={{ color: 'var(--accent)' }}>Velora</span>
              </>
            ) : (
              <>
                Tailored For <span style={{ color: 'var(--accent)' }}>You, {user?.name ? user.name.split(' ')[0] : 'Shopper'}</span>
              </>
            )}
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '2rem' }}>
            {isColdStart
              ? 'Explore products, save items to your wishlist, and our Collaborative Filtering algorithm will continuously tune your personalized feed in real-time.'
              : 'Ranked using continuous User-Based Collaborative Filtering over your explicit and implicit actions (views, clicks, wishlists, carts, and orders).'}
          </p>

          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => loadForYouData(true)}
              className="btn btn-primary btn-sm"
              disabled={refreshing}
            >
              <RefreshCw
                size={13}
                style={{ animation: refreshing ? 'spin 0.8s infinite linear' : 'none' }}
              />
              {refreshing ? 'Recalculating...' : 'Refresh Preferences'}
            </button>

            {!isAuthenticated && (
              <button onClick={() => loginAsDemoUser()} className="btn btn-secondary btn-sm">
                ⚡ 1-Click Demo Shopper Login
              </button>
            )}
          </div>
        </div>

        {/* Algorithm Summary Card */}
        <div
          className="card-panel"
          style={{
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            fontSize: '0.835rem',
            boxShadow: 'var(--shadow-xs)',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: '0.885rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '0.65rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Recommendation Pipeline</span>
            <span style={{ color: '#15803D', fontWeight: 700, fontSize: '0.785rem' }}>● Active</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Interaction Weights:</span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.785rem' }}>View (1) • Click (2) • Wishlist (3) • Cart (4) • Buy (5)</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Distance Metric:</span>
            <strong style={{ color: 'var(--text-primary)' }}>Cosine Similarity ($L_2$ Normalized)</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Active Strategy:</span>
            <strong style={{ color: 'var(--accent)' }}>
              {isColdStart ? 'Bayesian Popularity Fallback' : 'User Collaborative Filtering (UBCF)'}
            </strong>
          </div>

          {summaryStats && (
            <div
              style={{
                borderTop: '1px solid var(--border-light)',
                paddingTop: '0.65rem',
                display: 'flex',
                justifyContent: 'space-between',
                color: 'var(--text-secondary)',
              }}
            >
              <span>Your Logged Signals:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{summaryStats.totalInteractions} interactions</strong>
            </div>
          )}
        </div>
      </div>

      {/* 1. Main Recommended For You Section Carousel */}
      <section style={{ marginBottom: '4.5rem' }}>
        <ProductCarousel
          badge={isColdStart ? 'Cold-Start Discovery' : 'Personalized Picks'}
          badgeIcon={Sparkles}
          title={isColdStart ? 'Popular Products to Get Started' : 'Recommended for You'}
          subtitle={reason || (isColdStart ? 'Popular bestsellers across Velora' : 'Predicted based on items you viewed and added to bag')}
          products={recommendations}
          loading={loading}
          showRecommendationBadge={true}
          onDismiss={handleDismissProduct}
        />
      </section>

      {/* 2. Because You Viewed (Item-to-Item Similarity) Carousel */}
      {becauseYouViewed && becauseYouViewed.products?.length > 0 && (
        <section style={{ marginBottom: '4.5rem', borderTop: '1px solid var(--border)', paddingTop: '4rem' }}>
          <ProductCarousel
            badge="Contextual Similarity"
            badgeIcon={Compass}
            title={`Because You Viewed "${becauseYouViewed.baseProduct?.name || 'Recent Item'}"`}
            subtitle="Similar products in the same category cluster"
            products={becauseYouViewed.products}
            showRecommendationBadge={true}
          />
        </section>
      )}

      {/* 3. Trending Bestsellers Carousel */}
      <section style={{ borderTop: '1px solid var(--border)', paddingTop: '4rem' }}>
        <ProductCarousel
          badge="Global Trends"
          badgeIcon={TrendingUp}
          title="Trending Across Velora"
          subtitle="Items capturing attention across all shoppers"
          viewAllLink="/products?sort=popular"
          viewAllText="Explore All Trending"
          products={trendingProducts}
        />
      </section>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 868px) {
          .for-you-header {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
            padding: 2rem 1.5rem !important;
          }
        }
        @media (max-width: 640px) {
          .for-you-container {
            padding: 1.5rem 1rem 3.5rem !important;
          }
          .for-you-header {
            padding: 1.5rem 1.15rem !important;
            gap: 1.25rem !important;
            margin-bottom: 2.25rem !important;
          }
        }
        @media (max-width: 480px) {
          .for-you-container {
            padding: 1rem 0.75rem 3rem !important;
          }
          .for-you-header {
            padding: 1.25rem 1rem !important;
            margin-bottom: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ForYouPage;

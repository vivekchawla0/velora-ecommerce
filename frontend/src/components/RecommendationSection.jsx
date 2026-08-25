import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ProductCarousel } from './ProductCarousel';
import { SectionPromoBanner } from './SectionPromoBanner';

export const RecommendationSection = ({ limit = 8 }) => {
  const { isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    let recs = [];
    let recReason = '';

    try {
      const res = await api.get('/recommendations', {
        params: { limit, refresh: isManualRefresh ? 'true' : undefined },
      });

      if (res.data?.recommendations && Array.isArray(res.data.recommendations) && res.data.recommendations.length > 0) {
        recs = res.data.recommendations;
        recReason = res.data.reason || '';
      }
    } catch (err) {
      console.warn('Error fetching recommendations:', err.message);
    }

    // Secondary frontend failsafe: if recommendations endpoint returns 0 items, fetch catalog products
    if (!recs || recs.length === 0) {
      try {
        const prodRes = await api.get('/products', {
          params: { limit, sort: 'popular' },
        });

        if (prodRes.data?.products && Array.isArray(prodRes.data.products) && prodRes.data.products.length > 0) {
          recs = prodRes.data.products.map((p) => ({
            ...p,
            recommendationScore: p.recommendationScore || 0.88,
            recommendationReason: p.recommendationReason || 'Top rated bestseller across all shoppers',
          }));
          recReason = 'Top trending bestseller across all shoppers';
        }
      } catch (prodErr) {
        console.warn('Error fetching catalog fallback for recommendations:', prodErr.message);
      }
    }

    setRecommendations(recs);
    setReason(recReason || 'Curated algorithmic selections based on your browsing and shopping preferences');
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRecommendations();
  }, [isAuthenticated, limit]);

  return (
    <section
      className="section-padding"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="container">
        {/* Section Header with Rebalanced 2-Column Layout */}
        <div className="section-header-rebalanced">
          {/* Left Column: Heading, Subtitle & Action Links */}
          <div className="section-header-left">
            <div>
              <div className="section-eyebrow">
                <Sparkles size={13} color="var(--accent)" /> TAILORED DISCOVERY
              </div>
              <h2 className="section-title">
                Recommended <span style={{ color: 'var(--accent)' }}>for You</span>
              </h2>
              <p className="section-subtitle">
                {reason || 'Curated algorithmic selections based on your browsing and shopping preferences'}
              </p>
            </div>

            <div className="section-header-actions">
              <button
                onClick={() => fetchRecommendations(true)}
                disabled={refreshing || loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.835rem',
                  fontWeight: 650,
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  padding: '0.45rem 0.95rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
                className="refresh-btn-hover"
                aria-label="Refresh recommendations"
              >
                <RefreshCw
                  size={13}
                  style={{ animation: refreshing ? 'spin 0.8s infinite linear' : 'none' }}
                />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              <Link to="/for-you" className="view-all-link">
                <span>View All Recommendations</span> <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Right Column: Large Red Promotional Creative Banner */}
          <div className="section-promo-column">
            <SectionPromoBanner
              badge="LIMITED-TIME OFFER"
              badgeIcon={Sparkles}
              title="UP TO 30% OFF"
              subtitle="Curated picks made for you."
              link="/for-you"
              ctaText="Explore Deals"
              image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80"
              theme="red"
            />
          </div>
        </div>

        {/* Live Recommendation Horizontal Product Carousel */}
        <ProductCarousel
          products={recommendations}
          loading={loading}
          showRecommendationBadge={true}
          emptyMessage="Start exploring to get personalized recommendations."
        />
      </div>

      <style>{`
        .refresh-btn-hover:hover {
          background-color: #FFFFFF !important;
          border-color: var(--border-hover) !important;
          color: var(--text-primary) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

export default RecommendationSection;

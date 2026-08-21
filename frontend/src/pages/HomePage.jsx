import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, Compass, Sparkles, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { HeroSlider } from '../components/HeroSlider';
import { RecommendationSection } from '../components/RecommendationSection';
import { CategorySection } from '../components/CategorySection';
import { FeaturedBanner } from '../components/FeaturedBanner';
import { ProductCarousel } from '../components/ProductCarousel';
import { TrustSection } from '../components/TrustSection';
import { useAuth } from '../context/AuthContext';

export const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [bestRes, newRes, trendRes] = await Promise.all([
          api.get('/products', { params: { sort: 'popular', limit: 8 } }),
          api.get('/products', { params: { sort: 'newest', limit: 8 } }),
          api.get('/products/featured', { params: { limit: 8 } }).catch(() => ({ data: { products: [] } })),
        ]);

        if (bestRes.data?.products) setBestSellers(bestRes.data.products);
        if (newRes.data?.products) setNewArrivals(newRes.data.products);
        if (trendRes.data?.products && trendRes.data.products.length > 0) {
          setTrendingProducts(trendRes.data.products);
        } else if (bestRes.data?.products) {
          setTrendingProducts(bestRes.data.products.slice(4));
        }
      } catch (err) {
        console.warn('Error loading homepage catalog data:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, [isAuthenticated]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* 1. Hero / Promotional Slider */}
      <HeroSlider />

      {/* 2. Recommended for You (LIVE API - Placed directly below Hero and directly above Shop by Category) */}
      <RecommendationSection limit={8} />

      {/* 3. Shop by Category Section */}
      <CategorySection />

      {/* 4. Editorial Split Featured Collection Banner */}
      <FeaturedBanner />

      {/* 5. New Arrivals Horizontal Product Carousel */}
      <section className="section-padding" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="container">
          <ProductCarousel
            badge="Fresh Drops"
            badgeIcon={Clock}
            title="New Arrivals"
            subtitle="Explore the latest additions to our curated catalog"
            viewAllLink="/products?sort=newest"
            viewAllText="View All New Arrivals"
            products={newArrivals}
            loading={loading}
            promoBanner={{
              badge: 'JUST DROPPED',
              badgeIcon: Sparkles,
              title: 'NEW SEASON PICKS',
              subtitle: 'Discover the latest releases.',
              link: '/products?sort=newest',
              ctaText: 'Shop New Arrivals',
              image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&auto=format&fit=crop&q=80',
              theme: 'indigo',
            }}
          />
        </div>
      </section>

      {/* 6. Best Sellers Horizontal Product Carousel */}
      <section
        className="section-padding"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="container">
          <ProductCarousel
            badge="Top Rated"
            badgeIcon={TrendingUp}
            title="Best Sellers"
            subtitle="The most sought-after products across all collections"
            viewAllLink="/products?sort=popular"
            viewAllText="View All Best Sellers"
            products={bestSellers}
            loading={loading}
            promoBanner={{
              badge: 'TOP PICKS',
              badgeIcon: Sparkles,
              title: 'BEST SELLERS',
              subtitle: 'Loved by shoppers worldwide.',
              link: '/products?sort=popular',
              ctaText: 'Shop Best Sellers',
              image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&auto=format&fit=crop&q=80',
              theme: 'amber',
            }}
          />
        </div>
      </section>

      {/* 7. Trending Now with Promotional Campaign Offer Panel */}
      {trendingProducts.length > 0 && (
        <section
          className="section-padding"
          style={{
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid var(--border)',
            position: 'relative',
          }}
        >
          <div className="container">
            <div className="trending-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2.5rem', alignItems: 'stretch' }}>
              {/* Left Column: Dynamic Trending Offer Campaign Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0F172A 0%, #0284C7 55%, #0369A1 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '16px',
                  padding: '2.25rem 1.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(2, 132, 199, 0.22), 0 2px 6px rgba(0, 0, 0, 0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="trending-promo-banner"
              >
                {/* Subtle Radial Glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 70%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Top Offer Content */}
                <div style={{ zIndex: 1 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#BAE6FD',
                      background: 'rgba(0, 0, 0, 0.22)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                    }}
                  >
                    <Sparkles size={11} color="#BAE6FD" /> Limited-Time Event
                  </span>

                  <h3
                    style={{
                      fontSize: '1.65rem',
                      fontWeight: 850,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.2,
                      color: '#FFFFFF',
                      marginBottom: '0.65rem',
                    }}
                  >
                    Up to 25% Off Trending Selections
                  </h3>

                  <p
                    style={{
                      fontSize: '0.865rem',
                      color: 'rgba(255, 255, 255, 0.92)',
                      lineHeight: 1.5,
                      marginBottom: '1.5rem',
                    }}
                  >
                    Signature curated essentials capturing shopper attention across all departments this week.
                  </p>
                </div>

                {/* Featured Product Mini Highlight */}
                {trendingProducts[0] && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      borderRadius: '12px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      marginBottom: '1.5rem',
                      zIndex: 1,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <img
                      src={trendingProducts[0].images?.[0]}
                      alt={trendingProducts[0].name}
                      style={{
                        width: '48px',
                        height: '48px',
                        objectFit: 'contain',
                        background: '#FFFFFF',
                        borderRadius: '8px',
                        padding: '4px',
                        border: '1px solid var(--border-light)',
                      }}
                    />
                    <div style={{ overflow: 'hidden' }}>
                      <span style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Top Pick
                      </span>
                      <strong style={{ display: 'block', fontSize: '0.835rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {trendingProducts[0].name}
                      </strong>
                      <span style={{ fontSize: '0.825rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                        ${trendingProducts[0].price?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action CTA */}
                <Link
                  to="/products?sort=popular"
                  className="btn btn-primary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontWeight: 800,
                    border: 'none',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    zIndex: 1,
                  }}
                >
                  <span>Explore Trending Offers</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {/* Right Column: Carousel */}
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <ProductCarousel
                  badge="Editor's Selection"
                  badgeIcon={Compass}
                  title="Trending Now"
                  subtitle="Signature items capturing global attention this season"
                  viewAllLink="/products?sort=popular"
                  viewAllText="Explore Trending"
                  products={trendingProducts}
                  loading={loading}
                />
              </div>
            </div>
          </div>

          <style>{`
            @media (max-width: 992px) {
              .trending-layout {
                grid-template-columns: 1fr !important;
                gap: 2rem !important;
              }
            }
          `}</style>
        </section>
      )}

      {/* 8. Trust & Benefits Strip */}
      <TrustSection />
    </div>
  );
};

export default HomePage;

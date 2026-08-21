import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { SkeletonCard } from './SkeletonCard';
import { SectionPromoBanner } from './SectionPromoBanner';

export const ProductCarousel = ({
  title,
  subtitle,
  badge,
  badgeIcon: BadgeIcon,
  viewAllLink,
  viewAllText = 'View All',
  products = [],
  loading = false,
  showRecommendationBadge = false,
  onDismiss = null,
  emptyMessage = 'No products found.',
  promoBanner = null,
}) => {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Deduplicate products by _id before displaying
  const uniqueProducts = React.useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    const seen = new Set();
    return products.filter((p) => {
      const id = p._id || p.id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [products]);

  const checkScroll = () => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [uniqueProducts, loading]);

  const scroll = (direction) => {
    if (!trackRef.current) return;
    const scrollAmount = trackRef.current.clientWidth * 0.75;
    trackRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(checkScroll, 350);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Header Row */}
      {(title || subtitle) && (
        <div className="section-header-rebalanced">
          {/* Left Column: Eyebrow, Title, Subtitle, and View All Link */}
          <div className="section-header-left">
            <div>
              {badge && (
                <div className="section-eyebrow">
                  {BadgeIcon && <BadgeIcon size={13} color="var(--accent)" />}
                  <span>{badge}</span>
                </div>
              )}
              {title && (
                <h2 className="section-title">
                  {typeof title === 'string' && title.includes(' ') ? (
                    <>
                      {title.substring(0, title.lastIndexOf(' '))}{' '}
                      <span style={{ color: 'var(--accent)' }}>
                        {title.substring(title.lastIndexOf(' ') + 1)}
                      </span>
                    </>
                  ) : (
                    title
                  )}
                </h2>
              )}
              {subtitle && <p className="section-subtitle">{subtitle}</p>}
            </div>

            {viewAllLink && (
              <div className="section-header-actions">
                <Link to={viewAllLink} className="view-all-link">
                  <span>{viewAllText}</span> <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Large, Wide Promotional Campaign Banner */}
          {promoBanner && (
            <div className="section-promo-column">
              <SectionPromoBanner {...promoBanner} />
            </div>
          )}
        </div>
      )}

      {/* Carousel Track & Arrow Controls */}
      <div className="carousel-container">
        {/* Left Arrow Button */}
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className="carousel-nav-btn carousel-nav-prev"
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Scrolling Items */}
        <div
          ref={trackRef}
          onScroll={checkScroll}
          className="carousel-track"
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="carousel-item">
                <SkeletonCard />
              </div>
            ))
          ) : uniqueProducts.length === 0 ? (
            <div
              style={{
                width: '100%',
                padding: '3rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--border)',
              }}
            >
              {emptyMessage}
            </div>
          ) : (
            uniqueProducts.map((prod) => (
              <div key={prod._id || prod.id} className="carousel-item">
                <ProductCard
                  product={prod}
                  showRecommendationBadge={showRecommendationBadge}
                  onDismiss={onDismiss}
                />
              </div>
            ))
          )}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className="carousel-nav-btn carousel-nav-next"
          aria-label="Scroll right"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ProductCarousel;

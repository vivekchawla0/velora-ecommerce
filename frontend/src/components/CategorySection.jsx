import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { SectionPromoBanner } from './SectionPromoBanner';

const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    tagline: 'Precision Gadgets & Gear',
    departmentCode: '01 / TECH',
    tint: '#F3F6FA',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Audio & Acoustics',
    slug: 'audio',
    tagline: 'Studio Headphones & Hi-Fi',
    departmentCode: '02 / AUDIO',
    tint: '#F5F3F9',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Fashion & Apparel',
    slug: 'fashion',
    tagline: 'Minimalist Wardrobe Essentials',
    departmentCode: '03 / APPAREL',
    tint: '#FAF4F0',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Home & Living',
    slug: 'home-living',
    tagline: 'Furniture & Ambient Decor',
    departmentCode: '04 / LIVING',
    tint: '#F6F5F0',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Fitness & Sports',
    slug: 'sports-fitness',
    tagline: 'Active Gear & Training Essentials',
    departmentCode: '05 / ACTIVE',
    tint: '#F1F7F4',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Beauty & Wellness',
    slug: 'beauty',
    tagline: 'Organic Skincare & Grooming',
    departmentCode: '06 / BEAUTY',
    tint: '#FAF2F5',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80',
  },
];

export const CategorySection = () => {
  return (
    <section
      className="section-padding"
      style={{
        backgroundColor: '#FAF9F6',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="container">
        {/* Section Header with Rebalanced 2-Column Layout */}
        <div className="section-header-rebalanced">
          {/* Left Column: Heading, Subtitle & View All */}
          <div className="section-header-left">
            <div>
              <div className="section-eyebrow">
                <Sparkles size={13} color="var(--accent)" /> CURATED DEPARTMENTS
              </div>
              <h2 className="section-title">
                Shop by <span style={{ color: 'var(--accent)' }}>Category</span>
              </h2>
              <p className="section-subtitle">
                Explore expertly curated collections crafted for discerning lifestyles
              </p>
            </div>

            <div className="section-header-actions">
              <Link to="/products" className="view-all-link">
                <span>All Categories</span> <ArrowRight size={14} className="view-all-arrow" />
              </Link>
            </div>
          </div>

          {/* Right Column: Large Deep Emerald Promotional Creative Banner */}
          <div className="section-promo-column">
            <SectionPromoBanner
              badge="EXPLORE DEPARTMENTS"
              badgeIcon={Sparkles}
              title="UP TO 30% OFF"
              subtitle="6 curated lifestyle collections."
              link="/products"
              ctaText="Browse All"
              image="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&auto=format&fit=crop&q=80"
              theme="emerald"
            />
          </div>
        </div>

        {/* Category Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.75rem',
          }}
          className="category-grid-container"
        >
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/products?category=${cat.slug}`}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                textDecoration: 'none',
              }}
              className="category-card-editorial"
            >
              {/* Image Frame with Subtle Department Tint & Index Pill */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16 / 11',
                  overflow: 'hidden',
                  backgroundColor: cat.tint,
                  position: 'relative',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className="cat-editorial-img"
                  loading="lazy"
                />

                {/* Department Index Badge */}
                <span
                  style={{
                    position: 'absolute',
                    top: '0.85rem',
                    left: '0.85rem',
                    background: 'rgba(255, 255, 255, 0.94)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    color: 'var(--text-primary)',
                    fontSize: '0.685rem',
                    fontWeight: 750,
                    letterSpacing: '0.08em',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  {cat.departmentCode}
                </span>
              </div>

              {/* Title & Exploration Link */}
              <div style={{ padding: '1.35rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginBottom: '0.35rem',
                    letterSpacing: '-0.02em',
                  }}
                  className="cat-title-text"
                >
                  {cat.name}
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1.25rem' }}>
                  {cat.tagline}
                </p>

                <div
                  style={{
                    fontSize: '0.835rem',
                    fontWeight: 750,
                    color: 'var(--text-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginTop: 'auto',
                    transition: 'var(--transition-fast)',
                  }}
                  className="cat-link-cta"
                >
                  <span>Explore collection</span>
                  <ArrowRight size={14} className="cat-arrow-icon" style={{ transition: 'transform 0.2s ease' }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @media (hover: hover) and (pointer: fine) {
          .category-card-editorial:hover {
            border-color: #D0D0CA !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06) !important;
            transform: translateY(-2px);
          }
          .category-card-editorial:hover .cat-editorial-img {
            transform: scale(1.03);
          }
          .category-card-editorial:hover .cat-title-text {
            color: var(--accent) !important;
          }
          .category-card-editorial:hover .cat-link-cta {
            color: var(--accent) !important;
          }
          .category-card-editorial:hover .cat-arrow-icon {
            transform: translateX(3px);
          }
          .view-all-link:hover .view-all-arrow {
            transform: translateX(3px);
          }
        }
        .category-card-editorial:active {
          transform: scale(0.98);
        }
        @media (max-width: 640px) {
          .category-grid-container {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 0.65rem !important;
          }
          .category-card-editorial {
            border-radius: 12px !important;
          }
          .cat-title-text {
            font-size: 0.95rem !important;
            margin-bottom: 0.2rem !important;
          }
          .category-card-editorial p {
            font-size: 0.725rem !important;
            line-height: 1.35 !important;
            margin-bottom: 0.65rem !important;
          }
          .category-card-editorial > div:last-child {
            padding: 0.75rem 0.85rem !important;
          }
          .cat-link-cta {
            font-size: 0.725rem !important;
          }
        }
        @media (max-width: 380px) {
          .category-grid-container {
            gap: 0.45rem !important;
          }
          .category-card-editorial > div:last-child {
            padding: 0.65rem 0.75rem !important;
          }
          .cat-title-text {
            font-size: 0.875rem !important;
          }
        }
      `}</style>
    </section>
  );
};

export default CategorySection;

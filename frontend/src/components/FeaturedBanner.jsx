import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export const FeaturedBanner = () => {
  return (
    <section className="featured-banner-section" style={{ margin: '5rem 0 3rem' }}>
      <div className="container">
        <div
          style={{
            backgroundColor: '#111111',
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            boxShadow: 'var(--shadow-hover)',
          }}
          className="featured-split-banner"
        >
          {/* Left Column: Atmospheric Moody Lifestyle Interior (Reference Style) */}
          <div
            className="featured-banner-image-wrap"
            style={{
              position: 'relative',
              minHeight: '380px',
              overflow: 'hidden',
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&auto=format&fit=crop&q=80"
              alt="Curated Minimalist Studio Workspace and Ambient Lighting"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Subtle Gradient Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, rgba(0,0,0,0.1), rgba(17,17,17,0.75))',
              }}
            />
          </div>

          {/* Right Column: Editorial Text & Discovery CTA */}
          <div
            className="featured-banner-content"
            style={{
              padding: '4rem 3.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontWeight: 750,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--accent-soft)',
                marginBottom: '1rem',
              }}
            >
              <Sparkles size={13} color="var(--accent-soft)" /> Editorial Spotlight
            </div>

            <h2
              style={{
                fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)',
                fontWeight: 850,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                color: '#FFFFFF',
                marginBottom: '1rem',
                textTransform: 'uppercase',
              }}
            >
              Designed for Modern Sanctuary
            </h2>

            <p
              style={{
                fontSize: '0.975rem',
                color: '#B0B0AF',
                lineHeight: 1.65,
                marginBottom: '2.25rem',
                maxWidth: '460px',
              }}
            >
              Elevate your daily environment with precision-crafted essentials. Every interaction fine-tunes your personal taste profile in real-time.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link
                to="/products"
                className="btn btn-lg"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#111111',
                  borderRadius: '4px',
                  fontWeight: 750,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Explore Collection <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 868px) {
          .featured-banner-section {
            margin: 2.5rem 0 2rem !important;
          }
          .featured-split-banner {
            grid-template-columns: 1fr !important;
          }
          .featured-banner-image-wrap {
            min-height: 200px !important;
            max-height: 240px !important;
          }
          .featured-banner-content {
            padding: 2.25rem 1.75rem !important;
          }
          .featured-banner-content p {
            margin-bottom: 1.5rem !important;
          }
        }
        @media (max-width: 480px) {
          .featured-banner-section {
            margin: 1.5rem 0 1rem !important;
          }
          .featured-banner-image-wrap {
            min-height: 160px !important;
            max-height: 180px !important;
          }
          .featured-banner-content {
            padding: 1.5rem 1.15rem !important;
          }
          .featured-banner-content h2 {
            font-size: 1.35rem !important;
            margin-bottom: 0.5rem !important;
          }
          .featured-banner-content p {
            font-size: 0.835rem !important;
            margin-bottom: 1.25rem !important;
          }
        }
      `}</style>
    </section>
  );
};

export default FeaturedBanner;

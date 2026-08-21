import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

const colorThemes = {
  emerald: {
    gradient: 'linear-gradient(135deg, #064E3B 0%, #047857 55%, #065F46 100%)',
    shadow: '0 8px 24px rgba(4, 120, 87, 0.22), 0 2px 6px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    glow: 'radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 70%)',
    badgeBg: 'rgba(0, 0, 0, 0.22)',
    badgeText: '#A7F3D0',
    className: 'promo-theme-emerald',
  },
  red: {
    gradient: 'linear-gradient(135deg, #991B1B 0%, #DC2626 55%, #B91C1C 100%)',
    shadow: '0 8px 24px rgba(185, 28, 28, 0.22), 0 2px 6px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    glow: 'radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 70%)',
    badgeBg: 'rgba(0, 0, 0, 0.22)',
    badgeText: '#FECACA',
    className: 'promo-theme-red',
  },
  indigo: {
    gradient: 'linear-gradient(135deg, #1E1B4B 0%, #3730A3 55%, #1E293B 100%)',
    shadow: '0 8px 24px rgba(55, 48, 163, 0.22), 0 2px 6px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    glow: 'radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 70%)',
    badgeBg: 'rgba(0, 0, 0, 0.22)',
    badgeText: '#BFDBFE',
    className: 'promo-theme-indigo',
  },
  amber: {
    gradient: 'linear-gradient(135deg, #78350F 0%, #B45309 55%, #92400E 100%)',
    shadow: '0 8px 24px rgba(180, 83, 9, 0.22), 0 2px 6px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    glow: 'radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 70%)',
    badgeBg: 'rgba(0, 0, 0, 0.22)',
    badgeText: '#FDE68A',
    className: 'promo-theme-amber',
  },
  purple: {
    gradient: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 55%, #5B21B6 100%)',
    shadow: '0 8px 24px rgba(109, 40, 217, 0.22), 0 2px 6px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    glow: 'radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 70%)',
    badgeBg: 'rgba(0, 0, 0, 0.22)',
    badgeText: '#DDD6FE',
    className: 'promo-theme-purple',
  },
  cyan: {
    gradient: 'linear-gradient(135deg, #0F172A 0%, #0284C7 55%, #0369A1 100%)',
    shadow: '0 8px 24px rgba(2, 132, 199, 0.22), 0 2px 6px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    glow: 'radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 70%)',
    badgeBg: 'rgba(0, 0, 0, 0.22)',
    badgeText: '#BAE6FD',
    className: 'promo-theme-cyan',
  },
};

export const SectionPromoBanner = ({
  badge = 'LIMITED-TIME OFFER',
  badgeIcon: BadgeIcon = Sparkles,
  title = 'UP TO 30% OFF',
  subtitle = 'Curated picks made for you.',
  image = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80',
  link = '/products',
  ctaText = 'Explore Deals',
  theme = 'emerald',
}) => {
  const currentTheme = colorThemes[theme] || colorThemes.emerald;

  return (
    <Link
      to={link}
      className={`section-promo-creative ${currentTheme.className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.75rem',
        padding: '1.35rem 1.85rem',
        borderRadius: '16px',
        background: currentTheme.gradient,
        boxShadow: currentTheme.shadow,
        border: currentTheme.border,
        textDecoration: 'none',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      aria-label={`${badge} - ${title}: ${ctaText}`}
    >
      {/* Subtle Abstract Radial Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: currentTheme.glow,
          pointerEvents: 'none',
        }}
      />

      {/* Left: Copy & Action CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', zIndex: 1, flex: 1, minWidth: 0 }}>
        {badge && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: currentTheme.badgeText,
              background: currentTheme.badgeBg,
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              marginBottom: '0.45rem',
              alignSelf: 'flex-start',
            }}
          >
            {BadgeIcon && <BadgeIcon size={11} color={currentTheme.badgeText} />}
            <span>{badge}</span>
          </span>
        )}

        <strong
          style={{
            fontSize: '1.45rem',
            fontWeight: 900,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            marginBottom: '0.3rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          className="promo-creative-title"
        >
          {title}
        </strong>

        {subtitle && (
          <p
            style={{
              fontSize: '0.835rem',
              color: 'rgba(255, 255, 255, 0.92)',
              lineHeight: 1.35,
              marginBottom: '0.85rem',
              fontWeight: 500,
            }}
          >
            {subtitle}
          </p>
        )}

        <div style={{ alignSelf: 'flex-start' }}>
          <span
            style={{
              fontSize: '0.785rem',
              fontWeight: 800,
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              background: 'rgba(255, 255, 255, 0.16)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.28)',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
            }}
            className="promo-creative-cta"
          >
            <span>{ctaText}</span>
            <ArrowRight size={13} className="promo-creative-arrow" style={{ transition: 'transform 0.2s ease' }} />
          </span>
        </div>
      </div>

      {/* Right: Large Framed Product / Lifestyle Image */}
      {image && (
        <div
          className="promo-creative-image-box"
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#FFFFFF',
            border: '2px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.18)',
            flexShrink: 0,
            zIndex: 1,
          }}
        >
          <img
            src={image}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
            }}
            className="promo-creative-img"
            loading="lazy"
          />
        </div>
      )}
    </Link>
  );
};

export default SectionPromoBanner;

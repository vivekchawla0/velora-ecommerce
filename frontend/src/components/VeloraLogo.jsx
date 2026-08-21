import React from 'react';

/**
 * Premium Velora Logo & Geometric Discovery V Symbol
 * Represents discovery, direction, refinement, and personalized intelligence.
 */
export const VeloraSymbol = ({ size = 24, color = '#111111', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
  >
    {/* Left angular wing stroke */}
    <path
      d="M5 6L16 26L21 17L11.5 6H5Z"
      fill={color}
    />
    {/* Right upward discovery facet */}
    <path
      d="M27 6L17.5 23L21.5 26L27 6Z"
      fill={color}
      opacity="0.85"
    />
    {/* Subtle central upward chevron apex */}
    <path
      d="M16 8L20 14L16 19L12 14L16 8Z"
      fill={color}
      opacity="0.2"
    />
  </svg>
);

export const VeloraLogo = ({
  variant = 'full', // 'full', 'symbol', 'wordmark'
  size = 'md', // 'sm', 'md', 'lg'
  color = '#111111',
  tagline = false,
}) => {
  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 32,
  };

  const textSizes = {
    sm: '1.05rem',
    md: '1.25rem',
    lg: '1.65rem',
  };

  const iconSize = iconSizes[size] || 24;
  const textSize = textSizes[size] || '1.25rem';

  if (variant === 'symbol') {
    return <VeloraSymbol size={iconSize} color={color} />;
  }

  if (variant === 'wordmark') {
    return (
      <span
        style={{
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: textSize,
          fontWeight: 800,
          letterSpacing: '0.08em',
          color,
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        VELORA
      </span>
    );
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
      <VeloraSymbol size={iconSize} color={color} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: textSize,
            fontWeight: 800,
            letterSpacing: '0.08em',
            color,
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          VELORA
        </span>
        {tagline && (
          <span
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              fontWeight: 500,
              marginTop: '3px',
            }}
          >
            Personalized Shopping, Reimagined.
          </span>
        )}
      </div>
    </div>
  );
};

export default VeloraLogo;

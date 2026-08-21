import React from 'react';

export const UserAvatar = ({ name = '', email = '', avatar = '', size = 'md' }) => {
  const getInitials = () => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ').filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const sizeStyles = {
    sm: { width: '28px', height: '28px', fontSize: '0.75rem' },
    md: { width: '38px', height: '38px', fontSize: '0.85rem' },
    lg: { width: '54px', height: '54px', fontSize: '1.15rem' },
    xl: { width: '72px', height: '72px', fontSize: '1.5rem' },
  }[size] || { width: '38px', height: '38px', fontSize: '0.85rem' };

  // If valid avatar URL that is not default unsplash fallback or broken
  const hasCustomAvatar = avatar && avatar.startsWith('http') && !avatar.includes('photo-1534528741775-53994a69daeb');

  if (hasCustomAvatar) {
    return (
      <img
        src={avatar}
        alt={name || 'User Avatar'}
        style={{
          ...sizeStyles,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1px solid var(--border)',
          flexShrink: 0,
        }}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      style={{
        ...sizeStyles,
        borderRadius: '50%',
        background: 'var(--accent)',
        color: 'var(--text-inverse)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        letterSpacing: '0.04em',
        flexShrink: 0,
        border: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      {getInitials()}
    </div>
  );
};

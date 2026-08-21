import React from 'react';

export const SkeletonCard = () => {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="skeleton" style={{ width: '100%', aspectRatio: '1 / 1' }} />
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div className="skeleton" style={{ height: '12px', width: '35%' }} />
        <div className="skeleton" style={{ height: '18px', width: '90%' }} />
        <div className="skeleton" style={{ height: '14px', width: '50%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem' }}>
          <div className="skeleton" style={{ height: '24px', width: '30%' }} />
          <div className="skeleton" style={{ height: '34px', width: '40%', borderRadius: 'var(--radius-btn)' }} />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;

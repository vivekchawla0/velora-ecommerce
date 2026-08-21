import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export const PromoBanner = () => {
  return (
    <section style={{ margin: '4rem 0' }}>
      <div className="container">
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '3.5rem 3rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '2.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: '580px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginBottom: '0.75rem',
              }}
            >
              <Sparkles size={13} color="var(--accent)" /> Intelligently Curated
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
              A more refined way to discover.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Every item you view, save, or purchase tunes your personalized catalog in real time. Experience collaborative filtering without intrusive noise.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/for-you" className="btn btn-primary btn-lg">
              Explore Your Recommendations <ArrowRight size={16} />
            </Link>
            <Link to="/products" className="btn btn-secondary btn-lg">
              Browse Full Catalog
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

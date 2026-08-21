import React from 'react';
import { ShieldCheck, Truck, RefreshCw, Sparkles } from 'lucide-react';

export const TrustSection = () => {
  const benefits = [
    {
      icon: ShieldCheck,
      title: 'Secure Checkout',
      description: 'Encrypted simulated checkout and privacy protection on every order.',
    },
    {
      icon: Truck,
      title: 'Fast & Free Shipping',
      description: 'Complimentary standard shipping on all qualified orders over $50.',
    },
    {
      icon: RefreshCw,
      title: 'Hassle-Free Returns',
      description: '30-day transparent return and exchange policy with no questions asked.',
    },
    {
      icon: Sparkles,
      title: 'Intelligent Personalization',
      description: 'Continuous real-time collaborative filtering tailored to your taste.',
    },
  ];

  return (
    <section className="trust-section" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', padding: '3.5rem 0' }}>
      <div className="container">
        <div className="trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'var(--accent)',
                  }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {b.title}
                  </h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {b.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

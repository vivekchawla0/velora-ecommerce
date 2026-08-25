import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { VeloraLogo } from './VeloraLogo';

export const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: '#111111',
        color: '#FFFFFF',
        borderTop: '1px solid #222222',
        marginTop: 'auto',
      }}
    >
      <div className="container footer-container" style={{ padding: '5rem 2rem 3rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr repeat(4, 1fr)',
            gap: '3rem',
            marginBottom: '4rem',
          }}
          className="footer-grid"
        >
          {/* Brand & Mission Column */}
          <div>
            <Link to="/" style={{ display: 'inline-block', marginBottom: '1.25rem' }}>
              <VeloraLogo variant="full" size="md" color="#FFFFFF" />
            </Link>
            <p
              style={{
                color: '#999999',
                fontSize: '0.885rem',
                lineHeight: 1.65,
                maxWidth: '320px',
                marginBottom: '1.5rem',
              }}
            >
              Intelligent Personalized E-Commerce. Real-time collaborative filtering and curated essentials tailored to your individual lifestyle.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.785rem', color: '#777777' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#15803D' }} />
              FastAPI ML Recommender & Engine Active
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4
              style={{
                fontSize: '0.85rem',
                fontWeight: 750,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#FFFFFF',
                marginBottom: '1.25rem',
              }}
            >
              Shop
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#A0A0A0' }}>
              <Link to="/products" className="footer-link-dark">All Collections</Link>
              <Link to="/products?category=electronics" className="footer-link-dark">Electronics</Link>
              <Link to="/products?category=audio" className="footer-link-dark">Audio & Acoustics</Link>
              <Link to="/products?category=fashion" className="footer-link-dark">Fashion & Apparel</Link>
              <Link to="/products?sort=popular" className="footer-link-dark">Best Sellers</Link>
              <Link to="/products?sort=newest" className="footer-link-dark">New Arrivals</Link>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h4
              style={{
                fontSize: '0.85rem',
                fontWeight: 750,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#FFFFFF',
                marginBottom: '1.25rem',
              }}
            >
              Customer Service
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#A0A0A0' }}>
              <Link to="/orders" className="footer-link-dark">Track Shipments</Link>
              <Link to="/cart" className="footer-link-dark">Shopping Bag</Link>
              <Link to="/profile" className="footer-link-dark">Account Profile</Link>
              <span className="footer-link-dark" style={{ cursor: 'pointer' }}>Complimentary Shipping Policy</span>
              <span className="footer-link-dark" style={{ cursor: 'pointer' }}>30-Day Effortless Returns</span>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4
              style={{
                fontSize: '0.85rem',
                fontWeight: 750,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#FFFFFF',
                marginBottom: '1.25rem',
              }}
            >
              Company
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#A0A0A0' }}>
              <span className="footer-link-dark" style={{ cursor: 'pointer' }}>About Velora</span>
              <span className="footer-link-dark" style={{ cursor: 'pointer' }}>Sustainability & Craft</span>
              <span className="footer-link-dark" style={{ cursor: 'pointer' }}>Privacy Policy</span>
              <span className="footer-link-dark" style={{ cursor: 'pointer' }}>Terms of Service</span>
            </div>
          </div>

          {/* Website By / Contact */}
          <div>
            <h4
              style={{
                fontSize: '0.85rem',
                fontWeight: 750,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#FFFFFF',
                marginBottom: '1.25rem',
              }}
            >
              Contact / Created By
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#A0A0A0' }}>
              <span style={{ color: '#FFFFFF', fontWeight: 650 }}>Vivek Chawla</span>
              <a
                href="tel:8958694403"
                className="footer-link-dark"
                style={{ color: '#A0A0A0', textDecoration: 'none' }}
              >
                8958694403
              </a>
              <a
                href="mailto:Vivekkumar004@gmail.com"
                className="footer-link-dark"
                style={{ color: '#A0A0A0', textDecoration: 'none', wordBreak: 'break-all' }}
              >
                Vivekkumar004@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div
          style={{
            borderTop: '1px solid #222222',
            paddingTop: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            fontSize: '0.825rem',
            color: '#777777',
          }}
        >
          <div>
            © {new Date().getFullYear()} Velora Inc. All rights reserved.
          </div>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#999999' }}>
              <ShieldCheck size={14} color="#15803D" /> 256-Bit SSL Encrypted Simulated Checkout
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#999999' }}>
              <Sparkles size={14} color="var(--accent-soft)" /> Continuous Collaborative Filtering
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .footer-link-dark:hover {
          color: #FFFFFF !important;
          text-decoration: underline;
        }
        @media (max-width: 960px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 2.5rem !important;
          }
        }
        @media (max-width: 540px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;

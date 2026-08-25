import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VeloraLogo } from '../components/VeloraLogo';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { login, loginAsDemoUser, loginAsAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = new URLSearchParams(location.search).get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) {
      navigate(redirectPath);
    }
  };

  const handleDemoCustomerLogin = async () => {
    setSubmitting(true);
    const result = await loginAsDemoUser();
    setSubmitting(false);
    if (result.success) {
      navigate(redirectPath);
    }
  };

  const handleDemoAdminLogin = async () => {
    setSubmitting(true);
    const result = await loginAsAdmin();
    setSubmitting(false);
    if (result.success) {
      navigate('/admin');
    }
  };

  return (
    <div className="container" style={{ padding: '5rem 1.5rem', maxWidth: '440px' }}>
      <div className="card-panel" style={{ padding: '2.5rem', boxShadow: 'var(--shadow-card)' }}>
        {/* Header with Velora Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: '1.25rem' }}>
            <VeloraLogo variant="full" size="lg" />
          </Link>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.885rem', marginTop: '0.25rem' }}>
            Sign in to access your curated recommendations
          </p>
        </div>

        {/* 1-Click Demo Shortcut Panel */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-btn)',
            padding: '1rem',
            marginBottom: '1.75rem',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.65rem' }}>
            ⚡ Instant 1-Click Demo Credentials
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={handleDemoCustomerLogin}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.825rem', background: '#FFFFFF', fontWeight: 650 }}
            >
              Demo Shopper
            </button>
            <button
              type="button"
              onClick={handleDemoAdminLogin}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.825rem', background: '#FFFFFF', fontWeight: 650 }}
            >
              Demo Admin
            </button>
          </div>
        </div>

        {/* Standard Form */}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="input-label" style={{ marginBottom: 0 }}>Password</label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>demo: Demo123! | admin: Admin123!</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.75rem' }}
          >
            {submitting ? 'Signing in...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

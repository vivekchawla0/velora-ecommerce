import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User as UserIcon, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { VeloraLogo } from '../components/VeloraLogo';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const result = await register(name, email, password);
    setSubmitting(false);

    if (result.success) {
      navigate('/for-you');
    }
  };

  return (
    <div className="container" style={{ padding: '4.5rem 1.5rem', maxWidth: '460px' }}>
      <div className="card-panel" style={{ padding: '2.5rem', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: '1.25rem' }}>
            <VeloraLogo variant="full" size="lg" />
          </Link>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Create an account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.885rem', marginTop: '0.25rem' }}>
            Discover products personalized to your exact taste
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Full Name *</label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="Alex Morgan"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Email Address *</label>
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
            <label className="input-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                placeholder="Min 6 characters"
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

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '0.25rem' }}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      style={{
                        flex: 1,
                        borderRadius: '2px',
                        background:
                          level <= strengthScore
                            ? strengthScore <= 2
                              ? '#E11D48'
                              : strengthScore <= 3
                              ? '#D97706'
                              : '#15803D'
                            : 'var(--border)',
                        transition: 'background 0.2s ease',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">Confirm Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="Re-enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {submitting ? 'Creating Account...' : 'Create Account'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

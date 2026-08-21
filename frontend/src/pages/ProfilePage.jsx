import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  ShoppingBag,
  Activity,
  Sparkles,
  Eye,
  ShoppingCart,
  CheckCircle2,
  Save,
  LogOut,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';

export const ProfilePage = () => {
  const { user, setUser, isAuthenticated, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!isAuthenticated) return;

      try {
        const [summaryRes, historyRes] = await Promise.all([
          api.get('/interactions/summary'),
          api.get('/interactions/my-history', { params: { limit: 8 } }),
        ]);
        if (summaryRes.data?.stats) setStats(summaryRes.data.stats);
        if (historyRes.data?.history) setHistory(historyRes.data.history);
      } catch (err) {
        console.debug('Error loading profile activity:', err.message);
      }
    };
    loadProfileData();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <div className="card-panel" style={{ maxWidth: '480px', margin: '0 auto', padding: '4rem 2rem', boxShadow: 'var(--shadow-card)' }}>
          <UserIcon size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.25rem' }} />
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.5rem' }}>Account Profile</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '2rem' }}>
            Please sign in to view your profile and shopping preferences.
          </p>
          <Link to="/login?redirect=/profile" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', { name });
      if (res.data?.user) {
        setUser((prev) => ({ ...prev, name: res.data.user.name }));
        toast.success('Profile name updated successfully');
      }
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container profile-page-container" style={{ padding: '3rem 1.5rem 5rem' }}>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Account Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.35rem' }}>
          Manage your personal details and view your interaction analytics
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '3rem' }} className="profile-layout">
        {/* Left Column: User Card & Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card-panel" style={{ padding: '2.25rem', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '1.85rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{user.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.865rem', marginBottom: '0.85rem' }}>{user.email}</p>

            <span className={`badge ${user.role === 'admin' ? 'badge-success' : 'badge-neutral'}`}>
              {user.role === 'admin' ? 'Administrator' : 'Verified Member'}
            </span>

            <form onSubmit={handleUpdateProfile} style={{ marginTop: '2rem', textAlign: 'left' }}>
              <div className="input-group">
                <label className="input-label">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                />
              </div>
              <button type="submit" disabled={saving} className="btn btn-secondary btn-sm" style={{ width: '100%', padding: '0.6rem' }}>
                <Save size={13} /> {saving ? 'Saving...' : 'Update Name'}
              </button>
            </form>
          </div>

          {/* Quick Links */}
          <div className="card-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', boxShadow: 'var(--shadow-card)' }}>
            <Link to="/orders" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
              <Package size={15} /> Order History
            </Link>
            <Link to="/for-you" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
              <Sparkles size={15} color="var(--accent)" /> Recommendations Hub
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', color: '#B91C1C' }}
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>

        {/* Right Column: Interaction Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Interaction Summary KPIs */}
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              Your Implicit Interaction Footprint
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1.25rem' }}>
              <div className="card-panel" style={{ padding: '1.5rem', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
                <Eye size={20} color="var(--text-muted)" style={{ margin: '0 auto 0.4rem' }} />
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats?.views || 0}</div>
                <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', fontWeight: 600 }}>Views (1 pt)</div>
              </div>

              <div className="card-panel" style={{ padding: '1.5rem', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
                <Activity size={20} color="var(--text-muted)" style={{ margin: '0 auto 0.4rem' }} />
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats?.clicks || 0}</div>
                <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', fontWeight: 600 }}>Clicks (2 pts)</div>
              </div>

              <div className="card-panel" style={{ padding: '1.5rem', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
                <ShoppingCart size={20} color="var(--text-muted)" style={{ margin: '0 auto 0.4rem' }} />
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats?.carts || 0}</div>
                <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', fontWeight: 600 }}>Carts (4 pts)</div>
              </div>

              <div className="card-panel" style={{ padding: '1.5rem', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
                <CheckCircle2 size={20} color="#15803D" style={{ margin: '0 auto 0.4rem' }} />
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats?.purchases || 0}</div>
                <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', fontWeight: 600 }}>Orders (5 pts)</div>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              Recent Shopping Signals
            </h3>

            {history.length === 0 ? (
              <div className="card-panel-subtle" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No events recorded yet. Browse the catalog to start building your profile.
              </div>
            ) : (
              <div className="card-panel" style={{ padding: '0.75rem', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                {history.map((h, i) => (
                  <div
                    key={h._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.15rem',
                      borderBottom: i < history.length - 1 ? '1px solid var(--border-light)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <span
                        className="badge badge-neutral"
                        style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                      >
                        {h.type.toUpperCase()}
                      </span>
                      <Link to={`/products/${h.productId?._id}`} style={{ fontWeight: 650, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {h.productId?.name || 'Product'}
                      </Link>
                    </div>

                    <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Weight: +{h.weight}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 868px) {
          .profile-layout {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
        @media (max-width: 640px) {
          .profile-page-container {
            padding: 1.5rem 1rem 3.5rem !important;
          }
          .profile-page-container h1 {
            font-size: 1.6rem !important;
          }
          .profile-layout .card-panel {
            padding: 1.25rem 1rem !important;
          }
        }
        @media (max-width: 480px) {
          .profile-page-container {
            padding: 1rem 0.75rem 3rem !important;
          }
          .profile-page-container h1 {
            font-size: 1.4rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;

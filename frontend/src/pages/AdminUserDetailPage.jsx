import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ArrowLeft,
  Shield,
  User,
  ShoppingBag,
  Heart,
  ShoppingCart,
  Star,
  Activity,
  Sparkles,
  Lock,
  Unlock,
  Trash2,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  EyeOff,
  Tag,
  ExternalLink,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserAvatar } from '../components/UserAvatar';

export const AdminUserDetailPage = () => {
  const { id } = useParams();
  const { isAdmin, user: currentUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [recommendationData, setRecommendationData] = useState(null);
  const [activeTab, setActiveTab] = useState('interests');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const [userRes, ordersRes, wlRes, cartRes, actRes, recRes] = await Promise.all([
        api.get(`/admin/users/${id}`),
        api.get(`/admin/users/${id}/orders`),
        api.get(`/admin/users/${id}/wishlist`),
        api.get(`/admin/users/${id}/cart`),
        api.get(`/admin/users/${id}/activity`),
        api.get(`/admin/users/${id}/recommendations`),
      ]);

      if (userRes.data?.user) {
        setUserData(userRes.data.user);
        setStats(userRes.data.stats);
      }
      if (ordersRes.data?.orders) setOrders(ordersRes.data.orders);
      if (wlRes.data?.wishlist) setWishlist(wlRes.data.wishlist);
      if (cartRes.data?.cart) setCart(cartRes.data.cart);
      if (actRes.data) setActivityData(actRes.data);
      if (recRes.data) setRecommendationData(recRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load user profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUserDetails();
    }
  }, [id, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <h2>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Administrator permissions required.</p>
      </div>
    );
  }

  const handleToggleStatus = async () => {
    if (!userData) return;
    const newStatus = userData.status === 'blocked' ? 'active' : 'blocked';
    const actionLabel = newStatus === 'blocked' ? 'Block' : 'Unblock';

    if (!window.confirm(`Are you sure you want to ${actionLabel} ${userData.name}?`)) return;

    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/users/${id}/status`, { status: newStatus });
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchUserDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${actionLabel.toLowerCase()} user.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRole = async () => {
    if (!userData) return;
    const newRole = userData.role === 'admin' ? 'user' : 'admin';

    if (!window.confirm(`Change role of ${userData.name} to "${newRole.toUpperCase()}"?`)) return;

    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/users/${id}/role`, { role: newRole });
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchUserDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userData) return;
    if (!window.confirm(`Are you sure you want to delete ${userData.name}'s account? Historical orders will be preserved.`)) return;

    setActionLoading(true);
    try {
      const res = await api.delete(`/admin/users/${id}`);
      if (res.data?.success) {
        toast.success(res.data.message);
        navigate('/admin');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem' }}>
        <div className="skeleton" style={{ height: '32px', width: '200px', marginBottom: '2rem' }} />
        <div className="skeleton" style={{ height: '180px', width: '100%', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }} />
        <div className="skeleton" style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <h2>User Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>The requested user account could not be found.</p>
        <Link to="/admin" className="btn btn-primary">Return to Admin Dashboard</Link>
      </div>
    );
  }

  const isSelf = currentUser && (currentUser.id === userData.id || currentUser._id === userData.id);

  return (
    <div className="container admin-user-detail-container" style={{ padding: '2.5rem 1.5rem 5rem' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        <Link to="/admin" style={{ color: 'var(--text-secondary)' }}>Admin Portal</Link>
        <ChevronRight size={14} />
        <Link to="/admin" style={{ color: 'var(--text-secondary)' }}>Users</Link>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{userData.name}</span>
      </div>

      {/* Back Button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to User Directory
        </Link>
      </div>

      {/* Main Profile Header Banner */}
      <div
        className="card-panel"
        style={{
          padding: '2rem',
          marginBottom: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <UserAvatar name={userData.name} email={userData.email} avatar={userData.avatar} size="xl" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {userData.name}
              </h1>
              <span className={`badge ${userData.role === 'admin' ? 'badge-curated' : 'badge-neutral'}`}>
                {userData.role.toUpperCase()}
              </span>
              <span className={`badge ${userData.status === 'blocked' ? 'badge-danger' : userData.status === 'deleted' ? 'badge-neutral' : 'badge-success'}`}>
                {userData.status === 'blocked' ? 'Blocked' : userData.status === 'deleted' ? 'Soft Deleted' : 'Active'}
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
              {userData.email} • ID: <code style={{ fontSize: '0.8rem' }}>{userData.id}</code>
            </p>

            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Joined: {new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span>•</span>
              <span>Last Active: {new Date(userData.lastActivityAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading || isSelf}
            className={`btn ${userData.status === 'blocked' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            title={isSelf ? 'You cannot block your own account' : ''}
          >
            {userData.status === 'blocked' ? (
              <>
                <Unlock size={14} /> Unblock User
              </>
            ) : (
              <>
                <Lock size={14} /> Block User
              </>
            )}
          </button>

          <button
            onClick={handleToggleRole}
            disabled={actionLoading || isSelf}
            className="btn btn-secondary btn-sm"
            title={isSelf ? 'You cannot remove your own admin privileges' : ''}
          >
            <Shield size={14} /> Change to {userData.role === 'admin' ? 'User' : 'Admin'}
          </button>

          <button
            onClick={handleDeleteUser}
            disabled={actionLoading || isSelf || userData.status === 'deleted'}
            className="btn btn-secondary btn-sm"
            style={{ color: '#B91C1C', borderColor: '#FCA5A5' }}
            title={isSelf ? 'You cannot delete your own account' : ''}
          >
            <Trash2 size={14} /> Soft Delete
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}
      >
        <div className="card-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Orders
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>
            {stats?.ordersCount || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            ${stats?.totalSpent?.toFixed(2) || '0.00'} lifetime spent
          </div>
        </div>

        <div className="card-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Wishlist Items
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>
            {stats?.wishlistCount || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Curated saved products
          </div>
        </div>

        <div className="card-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Current Cart Items
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>
            {stats?.cartCount || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            ${cart?.subtotal?.toFixed(2) || '0.00'} subtotal
          </div>
        </div>

        <div className="card-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Reviews Given
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>
            {stats?.reviewsCount || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Verified ratings
          </div>
        </div>

        <div className="card-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Products Viewed
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>
            {stats?.viewsCount || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Implicit browsing signals
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem', overflowX: 'auto' }}>
        {[
          { id: 'interests', label: 'Top Interests & Profile' },
          { id: 'orders', label: `Orders (${orders.length})` },
          { id: 'wishlist', label: `Wishlist (${wishlist.length})` },
          { id: 'cart', label: `Current Cart (${cart?.totalItems || 0})` },
          { id: 'activity', label: `Activity Stream (${activityData?.count || 0})` },
          { id: 'recommendations', label: `ML Recommendations (${recommendationData?.count || 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 0.25rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. TOP INTERESTS & PROFILE */}
      {activeTab === 'interests' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem' }} className="user-detail-grid">
          {/* Category Interests Chart */}
          <div className="card-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Sparkles size={18} color="var(--accent)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Calculated Category Interests</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Computed in real-time by weighting interaction logs (View: 1, Click: 2, Wishlist: 3, Cart: 4, Purchase: 5).
            </p>

            {activityData?.topInterests?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No interaction activity logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activityData?.topInterests?.map((item, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <strong style={{ textTransform: 'capitalize' }}>{item.category}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>{item.score} pts ({item.percentage}%)</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.percentage}%`, height: '100%', background: 'var(--accent)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Feedback & Account Metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Feedback Box */}
            <div className="card-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <EyeOff size={18} color="#B91C1C" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Recommendation Feedback</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Products this user explicitly dismissed with "Not Interested".
              </p>

              {recommendationData?.feedback?.dismissedCount === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  No negative feedback submitted.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {recommendationData?.feedback?.dismissedItems?.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <span className="badge badge-danger">Not Interested</span>
                      <span>{f.productId?.name || 'Product'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Data Box */}
            <div className="card-panel" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Account Metadata</h3>
              <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)', width: '40%' }}>User ID</td>
                    <td style={{ padding: '0.5rem 0' }}><code>{userData.id}</code></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>Created At</td>
                    <td style={{ padding: '0.5rem 0' }}>{new Date(userData.createdAt).toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>Last Activity</td>
                    <td style={{ padding: '0.5rem 0' }}>{new Date(userData.lastActivityAt).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>Password Hash</td>
                    <td style={{ padding: '0.5rem 0', color: '#16A34A', fontWeight: 600 }}>Protected (bcrypt salted)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="card-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No orders placed by this user yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Order ID</th>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}>Items</th>
                  <th style={{ padding: '0.75rem' }}>Total Amount</th>
                  <th style={{ padding: '0.75rem' }}>Payment</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>View</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => (
                  <tr key={ord._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>#{ord._id.slice(-6).toUpperCase()}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{ord.items?.length || 0} items</td>
                    <td style={{ padding: '0.75rem', fontWeight: 800 }}>${ord.totalAmount?.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge badge-success">{ord.paymentStatus || 'completed'}</span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge badge-neutral">{ord.status}</span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <Link to={`/orders/${ord._id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem' }}>
                        Details <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 3. WISHLIST TAB */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlist.length === 0 ? (
            <div className="card-panel" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
              This user's wishlist is currently empty.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
              {wishlist.map((prod) => (
                <div key={prod._id} className="card-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                  <img
                    src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                    alt={prod.name}
                    style={{ width: '100%', height: '140px', objectFit: 'contain', background: '#FBFBFA', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {prod.brand || prod.category}
                  </span>
                  <Link to={`/products/${prod._id}`} style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0.25rem 0' }}>
                    {prod.name}
                  </Link>
                  <div style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800 }}>${prod.price?.toFixed(2)}</span>
                    <span className="badge badge-neutral">{prod.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. CURRENT CART TAB (Read-Only) */}
      {activeTab === 'cart' && (
        <div className="card-panel" style={{ padding: '1.75rem', maxWidth: '720px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Current Active Cart (Read-Only)</h3>
            <span className="badge badge-neutral">{cart?.totalItems || 0} Total Items</span>
          </div>

          {cart?.items?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>User's cart is empty.</p>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {cart?.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80'}
                        alt={item.product?.name}
                        style={{ width: '42px', height: '42px', objectFit: 'contain', background: '#FBFBFA', borderRadius: 'var(--radius-sm)' }}
                      />
                      <div>
                        <strong style={{ fontSize: '0.875rem' }}>{item.product?.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Qty: {item.quantity} × ${item.price?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontWeight: 700 }}>${item.itemTotal?.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <span>Subtotal</span>
                <span>${cart?.subtotal?.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. ACTIVITY STREAM TAB */}
      {activeTab === 'activity' && (
        <div className="card-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem' }}>Interaction Timeline</h3>

          {activityData?.activity?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No activity logged.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {activityData?.activity?.map((evt) => (
                <div
                  key={evt._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      className={`badge ${
                        evt.type === 'purchase'
                          ? 'badge-success'
                          : evt.type === 'cart'
                          ? 'badge-discount'
                          : evt.type === 'wishlist'
                          ? 'badge-curated'
                          : 'badge-neutral'
                      }`}
                      style={{ minWidth: '75px', textAlign: 'center' }}
                    >
                      {evt.type.toUpperCase()} (+{evt.weight})
                    </span>
                    <div>
                      <Link to={`/products/${evt.productId?._id}`} style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {evt.productId?.name || 'Product Interaction'}
                      </Link>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                        Category: {evt.productId?.category || 'General'}
                      </span>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(evt.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. ML RECOMMENDATIONS TAB */}
      {activeTab === 'recommendations' && (
        <div>
          <div className="card-panel" style={{ padding: '1.25rem 1.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '0.95rem' }}>Generated by: Velora Recommendation Service</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Active Strategy: <code style={{ color: 'var(--accent)' }}>{recommendationData?.strategy || 'collaborative_filtering'}</code>
              </div>
            </div>
            <span className="badge badge-curated">{recommendationData?.count || 0} Candidates</span>
          </div>

          {recommendationData?.recommendations?.length === 0 ? (
            <div className="card-panel" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
              No recommendations currently available for this user.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {recommendationData?.recommendations?.map((rec) => (
                <div key={rec._id} className="card-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                  <img
                    src={rec.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                    alt={rec.name}
                    style={{ width: '100%', height: '140px', objectFit: 'contain', background: '#FBFBFA', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{rec.brand}</span>
                    <span className="badge badge-curated" style={{ fontSize: '0.7rem' }}>
                      {Math.round((rec.recommendationScore || 0.85) * 100)}% Match
                    </span>
                  </div>
                  <Link to={`/products/${rec._id}`} style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0.25rem 0' }}>
                    {rec.name}
                  </Link>

                  {/* Explainability Callout */}
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.6rem', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.4 }}>
                    <strong>Why this product?</strong>
                    <div>{rec.recommendationReason || 'Popular in similar shopper journeys.'}</div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800 }}>${rec.price?.toFixed(2)}</span>
                    <span className="badge badge-neutral">{rec.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 868px) {
          .user-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .admin-user-detail-container {
            padding: 1.5rem 1rem 3.5rem !important;
          }
        }
        @media (max-width: 480px) {
          .admin-user-detail-container {
            padding: 1rem 0.75rem 3rem !important;
          }
        }
      `}</style>
    </div>
  );
};

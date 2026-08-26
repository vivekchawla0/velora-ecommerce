import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Eye,
  RefreshCw,
  Shield,
  AlertCircle,
  Sparkles,
  MousePointer,
  EyeOff,
  Percent,
  Search,
  Lock,
  Unlock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AdminProductModal } from '../components/AdminProductModal';
import { UserAvatar } from '../components/UserAvatar';

export const AdminDashboardPage = () => {
  const { isAdmin, user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // User Management State
  const [userStats, setUserStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [userPagination, setUserPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [usersLoading, setUsersLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Amazon Affiliate Product State
  const [amazonUrl, setAmazonUrl] = useState('');
  const [amazonDept, setAmazonDept] = useState('electronics');
  const [amazonColl, setAmazonColl] = useState('best-sellers');
  const [fetchingAmazon, setFetchingAmazon] = useState(false);
  const [amazonPreview, setAmazonPreview] = useState(null);
  const [savingAmazon, setSavingAmazon] = useState(false);
  const [amazonError, setAmazonError] = useState(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  const toast = useToast();

  // Manual Photo Management Handlers
  const handleAddPhotoUrl = () => {
    if (!newPhotoUrl.trim() || !amazonPreview) return;
    const currentImgs = amazonPreview.images || [];
    setAmazonPreview({
      ...amazonPreview,
      images: [...currentImgs, newPhotoUrl.trim()],
    });
    setNewPhotoUrl('');
    toast.success('Photo URL added to product gallery');
  };

  const handleRemovePhoto = (indexToRemove) => {
    if (!amazonPreview) return;
    const updatedImgs = (amazonPreview.images || []).filter((_, idx) => idx !== indexToRemove);
    if (updatedImgs.length === 0) {
      toast.warning('Product should have at least one image.');
    }
    setAmazonPreview({
      ...amazonPreview,
      images: updatedImgs,
    });
    toast.info('Photo removed');
  };

  const handleImageFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !amazonPreview) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target.result;
        setAmazonPreview((prev) => ({
          ...prev,
          images: [...(prev?.images || []), base64Url],
        }));
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${files.length} photo(s) uploaded successfully!`);
  };

  const handleFetchAmazonProduct = async (e) => {
    if (e) e.preventDefault();
    if (!amazonUrl.trim()) {
      toast.error('Please paste an Amazon product URL or ASIN.');
      return;
    }
    setFetchingAmazon(true);
    setAmazonError(null);
    setAmazonPreview(null);
    try {
      const res = await api.post('/admin/amazon/fetch', { url: amazonUrl.trim() });
      if (res.data?.success) {
        if (res.data.isDuplicate) {
          toast.warning(res.data.message);
          setAmazonPreview({ ...res.data.existingProduct, isDuplicate: true });
        } else {
          toast.success('Amazon product metadata retrieved successfully!');
          setAmazonPreview({ ...res.data.product, category: amazonDept, collections: [amazonColl] });
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to retrieve Amazon product metadata.';
      setAmazonError(msg);
      toast.error(msg);
    } finally {
      setFetchingAmazon(false);
    }
  };

  const handleAddAmazonProduct = async () => {
    if (!amazonPreview) return;
    setSavingAmazon(true);
    try {
      const payload = {
        ...amazonPreview,
        category: amazonDept,
        collections: [amazonColl, 'shop-all'],
      };
      const res = await api.post('/admin/amazon/add', payload);
      if (res.data?.success) {
        toast.success('Amazon product added to Velora catalog!');
        setAmazonPreview(null);
        setAmazonUrl('');
        loadAdminData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save Amazon product.');
    } finally {
      setSavingAmazon(false);
    }
  };

  const handleSyncAmazonProduct = async (prod) => {
    try {
      toast.info(`Syncing ${prod.name} with Amazon India...`);
      const res = await api.post('/admin/amazon/sync', { productId: prod._id });
      if (res.data?.success) {
        toast.success(res.data.message || 'Amazon product refreshed!');
        loadAdminData();
      }
    } catch (err) {
      toast.error('Failed to sync product with Amazon.');
    }
  };

  const handleToggleProductStatus = async (prod) => {
    const nextStatus = prod.isActive === false ? true : false;
    try {
      const res = await api.patch(`/admin/products/${prod._id}/status`, { isActive: nextStatus });
      if (res.data?.success) {
        toast.success(`Product status set to ${nextStatus ? 'Active' : 'Inactive'}`);
        loadAdminData();
      }
    } catch (err) {
      toast.error('Failed to toggle product status.');
    }
  };

  const loadAdminData = async () => {
    setLoading(true);

    try {
      const statsRes = await api.get('/admin/stats').catch(() => null);
      if (statsRes?.data?.stats) {
        setStats(statsRes.data.stats);
      }
    } catch (e) {}

    try {
      const prodsRes = await api.get('/products', { params: { limit: 300 } }).catch(() => null);
      if (prodsRes?.data?.products) {
        setProducts(prodsRes.data.products);
      }
    } catch (e) {}

    try {
      const ordersRes = await api.get('/admin/orders', { params: { limit: 100 } }).catch(() => null);
      if (ordersRes?.data?.orders) {
        setOrders(ordersRes.data.orders);
      }
    } catch (e) {}

    setLoading(false);
  };

  const loadUsersData = async (page = 1) => {
    setUsersLoading(true);

    try {
      const uStatsRes = await api.get('/admin/users/stats').catch(() => null);
      if (uStatsRes?.data?.stats) {
        setUserStats(uStatsRes.data.stats);
      }
    } catch (e) {}

    try {
      const usersRes = await api.get('/admin/users', {
        params: {
          page,
          limit: userPagination.limit,
          q: userSearch.trim(),
          role: roleFilter,
          status: statusFilter,
          dateRange: dateFilter,
          sortBy,
        },
      }).catch(() => null);

      if (usersRes?.data?.users) {
        setUsersList(usersRes.data.users);
        if (usersRes.data.pagination) {
          setUserPagination(usersRes.data.pagination);
        }
      }
    } catch (e) {}

    setUsersLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
      loadUsersData(1);
    }
  }, [isAdmin]);

  // Refetch users when filters change
  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      loadUsersData(1);
    }
  }, [roleFilter, statusFilter, dateFilter, sortBy]);

  const handleUserSearchSubmit = (e) => {
    e.preventDefault();
    loadUsersData(1);
  };

  const handleToggleUserStatus = async (user) => {
    const isBlocking = user.status !== 'blocked';
    const actionLabel = isBlocking ? 'Block' : 'Unblock';

    if (!window.confirm(`Are you sure you want to ${actionLabel} ${user.name}?`)) return;

    try {
      const res = await api.patch(`/admin/users/${user._id}/status`, {
        status: isBlocking ? 'blocked' : 'active',
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        loadUsersData(userPagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${actionLabel.toLowerCase()} user.`);
    }
  };

  const handleToggleUserRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change role of ${user.name} to "${newRole.toUpperCase()}"?`)) return;

    try {
      const res = await api.patch(`/admin/users/${user._id}/role`, { role: newRole });
      if (res.data?.success) {
        toast.success(res.data.message);
        loadUsersData(userPagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}? Historical records will be preserved.`)) return;

    try {
      const res = await api.delete(`/admin/users/${user._id}`);
      if (res.data?.success) {
        toast.success(res.data.message);
        loadUsersData(userPagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the store?`)) return;

    try {
      await api.delete(`/admin/products/${id}`);
      toast.success(`Deleted "${name}"`);
      loadAdminData();
    } catch (err) {
      toast.error('Failed to delete product.');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order status updated to "${newStatus}"`);
      loadAdminData();
    } catch (err) {
      toast.error('Failed to update order status.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <div className="card-panel" style={{ maxWidth: '460px', margin: '0 auto', padding: '3.5rem 2rem' }}>
          <AlertCircle size={48} color="#B91C1C" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
            Administrator credentials are required to view the administrative portal.
          </p>
          <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Sign In with Admin Account
          </Link>
        </div>
      </div>
    );
  }

  const recAnalytics = stats?.recommendationAnalytics || {
    impressions: 0,
    clicks: 0,
    ctr: 0.0,
    totalDismissals: 0,
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem 5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            <Shield size={13} color="var(--accent)" /> Store Operations
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Platform Management</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => {
              loadAdminData();
              loadUsersData(userPagination.page);
            }}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={13} /> Refresh Data
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setModalOpen(true);
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Overview & Metrics' },
          { id: 'amazon', label: 'Add Amazon Product 🛍' },
          { id: 'products', label: `Products (${products.length})` },
          { id: 'users', label: `Users (${userStats?.totalUsers || stats?.totalUsers || 0})` },
          { id: 'analytics', label: 'ML & Recommendations' },
          { id: 'orders', label: `Orders (${orders.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'users') loadUsersData(1);
            }}
            style={{
              padding: '0.75rem 0.5rem',
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

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="card-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Revenue
                </span>
                <DollarSign size={18} color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ${stats?.totalRevenue?.toFixed(2) || '0.00'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '0.25rem' }}>
                +18.4% this month
              </div>
            </div>

            <div className="card-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Orders
                </span>
                <ShoppingBag size={18} color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats?.totalOrders || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {stats?.statusCounts?.Delivered || 0} completed
              </div>
            </div>

            <div className="card-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Users Registered
                </span>
                <Users size={18} color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{userStats?.totalUsers || stats?.totalUsers || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {userStats?.activeUsers || 0} active • {userStats?.blockedUsers || 0} blocked
              </div>
            </div>

            <div className="card-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Products In Catalog
                </span>
                <Package size={18} color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats?.totalProducts || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Across 6 categories
              </div>
            </div>
          </div>

          {/* Leaderboards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Most Viewed */}
            <div className="card-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Eye size={18} color="var(--text-primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Most Viewed Products</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {stats?.mostViewedProducts?.map(({ product, views }, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                      <img
                        src={product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt={product?.name}
                        style={{ width: '40px', height: '40px', objectFit: 'contain', background: '#FBFBFA', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                      />
                      <div style={{ overflow: 'hidden' }}>
                        <Link to={`/products/${product?._id}`} style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product?.name}
                        </Link>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>${product?.price}</span>
                      </div>
                    </div>
                    <span className="badge badge-neutral">{views} views</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Purchased */}
            <div className="card-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <TrendingUp size={18} color="#16A34A" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Top Purchased Best Sellers</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {stats?.mostPurchasedProducts?.map(({ product, purchases }, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                      <img
                        src={product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt={product?.name}
                        style={{ width: '40px', height: '40px', objectFit: 'contain', background: '#FBFBFA', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                      />
                      <div style={{ overflow: 'hidden' }}>
                        <Link to={`/products/${product?._id}`} style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product?.name}
                        </Link>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>${product?.price}</span>
                      </div>
                    </div>
                    <span className="badge badge-success">{purchases} orders</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. AMAZON PRODUCTS TAB */}
      {activeTab === 'amazon' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div className="card-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ExternalLink size={20} color="var(--accent)" /> Add Amazon Affiliate Product
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Paste any Amazon product URL or 10-character ASIN. The system will retrieve product metadata and append your Associate tracking tag automatically.
            </p>

            <form onSubmit={handleFetchAmazonProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }} className="amazon-form-grid">
                <div>
                  <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Amazon Affiliate URL or ASIN
                  </label>
                  <input
                    type="text"
                    required
                    value={amazonUrl}
                    onChange={(e) => setAmazonUrl(e.target.value)}
                    placeholder="https://www.amazon.in/dp/B0CX55N69G or B0CX55N69G"
                    className="input-field"
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Department (Category)
                  </label>
                  <select
                    value={amazonDept}
                    onChange={(e) => setAmazonDept(e.target.value)}
                    className="select-field"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="electronics">Electronics</option>
                    <option value="audio">Audio & Acoustics</option>
                    <option value="fashion">Fashion & Apparel</option>
                    <option value="home-living">Home & Living</option>
                    <option value="gaming">Gaming</option>
                    <option value="beauty">Beauty & Personal Care</option>
                    <option value="books-learning">Books & Learning</option>
                    <option value="sports-fitness">Sports & Fitness</option>
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Collection
                  </label>
                  <select
                    value={amazonColl}
                    onChange={(e) => setAmazonColl(e.target.value)}
                    className="select-field"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="best-sellers">Best Sellers</option>
                    <option value="new-arrivals">New Arrivals</option>
                    <option value="featured">Featured</option>
                    <option value="trending">Trending</option>
                    <option value="shop-all">Shop All</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={fetchingAmazon}
                  className="btn btn-primary"
                  style={{ height: '42px', padding: '0 1.5rem', fontWeight: 750 }}
                >
                  {fetchingAmazon ? 'Fetching...' : 'Fetch Product'}
                </button>
              </div>
            </form>
          </div>

          {/* Amazon Product Preview Card */}
          {amazonPreview && (
            <div className="card-panel" style={{ padding: '2rem', border: '2px solid var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span className="badge badge-curated" style={{ fontSize: '0.8rem' }}>
                  Product Preview & Importer Configuration
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ASIN: <strong>{amazonPreview.asin}</strong>
                </span>
              </div>

              {amazonPreview.isDuplicate && (
                <div style={{ padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', color: '#991B1B', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  ⚠️ <strong>This Amazon product already exists in Velora catalog.</strong> Duplicates are prevented automatically.
                </div>
              )}

              {/* Complete Title Display */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Complete Official Product Title
                </label>
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    background: '#FFFFFF',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.95rem',
                    fontWeight: 750,
                    lineHeight: 1.4,
                    color: 'var(--text-primary)',
                  }}
                >
                  {amazonPreview.name}
                </div>
              </div>

              {/* Manual Product Photos Upload & Gallery Manager */}
              <div style={{ marginBottom: '2rem', padding: '1.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                      Product Photos ({amazonPreview.images?.length || 0})
                    </h4>
                    <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                      Manage product gallery photos. The first photo is automatically used as the primary display image.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Plus size={14} /> Upload File
                      <input type="file" accept="image/*" multiple hidden onChange={handleImageFileUpload} />
                    </label>
                  </div>
                </div>

                {/* Add Photo URL Input Bar */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="Paste image URL (e.g. https://...)"
                    className="input-field"
                    style={{ fontSize: '0.835rem', height: '36px' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddPhotoUrl}
                    className="btn btn-secondary btn-sm"
                    style={{ height: '36px', whiteSpace: 'nowrap' }}
                  >
                    Add URL
                  </button>
                </div>

                {/* Photo Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                  {(amazonPreview.images || []).map((imgUrl, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        background: '#FFFFFF',
                        border: idx === 0 ? '2px solid var(--accent)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      {idx === 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '4px',
                            left: '4px',
                            background: 'var(--accent)',
                            color: '#FFFFFF',
                            fontSize: '0.625rem',
                            fontWeight: 800,
                            padding: '2px 5px',
                            borderRadius: '3px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Primary
                        </span>
                      )}
                      <img
                        src={imgUrl}
                        alt={`Product photo ${idx + 1}`}
                        style={{ width: '100%', height: '90px', objectFit: 'contain', marginBottom: '0.4rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          cursor: 'pointer',
                          padding: '2px',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          fontWeight: 650,
                        }}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Read-Only Amazon Scraped Price Banner & Brand */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                <div style={{ padding: '1rem 1.25rem', background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                      Scraped Amazon Link Price (Read-Only)
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 700 }}>
                      ✓ Fetched directly from link
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem' }}>
                    <span style={{ fontSize: '1.65rem', fontWeight: 850, color: 'var(--text-primary)' }}>
                      ₹{amazonPreview.price?.toLocaleString('en-IN')}
                    </span>
                    {amazonPreview.originalPrice > amazonPreview.price && (
                      <span style={{ fontSize: '1.05rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        ₹{amazonPreview.originalPrice?.toLocaleString('en-IN')}
                      </span>
                    )}
                    {amazonPreview.discountPercentage > 0 && (
                      <span className="badge badge-success">
                        Save {amazonPreview.discountPercentage}%
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.785rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Brand</span>
                  <div style={{ padding: '0.75rem 1rem', background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 750 }}>
                    {amazonPreview.brand || 'Amazon'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setAmazonPreview(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>

                {!amazonPreview.isDuplicate && (
                  <button
                    type="button"
                    onClick={handleAddAmazonProduct}
                    disabled={savingAmazon}
                    className="btn btn-primary"
                    style={{ fontWeight: 750, padding: '0.6rem 1.75rem' }}
                  >
                    {savingAmazon ? 'Saving Product...' : 'Add to Velora Catalog'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. USERS MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* User Management Real Statistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div className="card-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Users
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem' }}>
                {userStats?.totalUsers || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Registered shopper accounts
              </div>
            </div>

            <div className="card-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Active Accounts
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16A34A', marginTop: '0.25rem' }}>
                {userStats?.activeUsers || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                In good standing
              </div>
            </div>

            <div className="card-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Blocked Accounts
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#B91C1C', marginTop: '0.25rem' }}>
                {userStats?.blockedUsers || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Restricted from shopping
              </div>
            </div>

            <div className="card-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                New This Week
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.25rem' }}>
                {userStats?.newUsersThisWeek || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Joined past 7 days
              </div>
            </div>

            <div className="card-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Administrators
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem' }}>
                {userStats?.adminUsers || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                System-level access
              </div>
            </div>
          </div>

          {/* Search & Filters Toolbar */}
          <div
            className="card-panel"
            style={{
              padding: '1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* Search Input */}
            <form onSubmit={handleUserSearchSubmit} style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '380px' }}>
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.4rem', height: '2.4rem', fontSize: '0.85rem' }}
              />
            </form>

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="select-field"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem', width: 'auto' }}
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select-field"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem', width: 'auto' }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="select-field"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem', width: 'auto' }}
              >
                <option value="all">All Dates</option>
                <option value="today">Joined Today</option>
                <option value="this_week">Joined This Week</option>
                <option value="this_month">Joined This Month</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select-field"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem', width: 'auto' }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="orders">Most Orders</option>
                <option value="activity">Recent Activity</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="card-panel table-responsive-wrapper" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            {usersLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s infinite linear', margin: '0 auto 0.5rem' }} />
                <div>Loading user records from database...</div>
              </div>
            ) : usersList.length === 0 ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Users size={32} style={{ margin: '0 auto 0.75rem' }} />
                <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--text-primary)' }}>No users found</strong>
                <span style={{ fontSize: '0.85rem' }}>Try adjusting your search query or filter parameters.</span>
              </div>
            ) : (
              <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>User</th>
                    <th style={{ padding: '0.75rem' }}>Email</th>
                    <th style={{ padding: '0.75rem' }}>Role</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Joined</th>
                    <th style={{ padding: '0.75rem' }}>Last Active</th>
                    <th style={{ padding: '0.75rem' }}>Orders</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const isSelf = currentUser && (currentUser.id === u._id || currentUser._id === u._id);

                    return (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <UserAvatar name={u.name} email={u.email} avatar={u.avatar} size="sm" />
                          <Link
                            to={`/admin/users/${u._id}`}
                            style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}
                          >
                            {u.name}
                          </Link>
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`badge ${u.role === 'admin' ? 'badge-curated' : 'badge-neutral'}`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span
                            className={`badge ${
                              u.status === 'blocked'
                                ? 'badge-danger'
                                : u.status === 'deleted'
                                ? 'badge-neutral'
                                : 'badge-success'
                            }`}
                          >
                            {u.status === 'blocked' ? 'Blocked' : u.status === 'deleted' ? 'Deleted' : 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {u.lastActivityAt
                            ? new Date(u.lastActivityAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : '—'}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{u.ordersCount || 0}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                            <Link
                              to={`/admin/users/${u._id}`}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                              title="View Full Profile & Analytics"
                            >
                              Profile <ExternalLink size={11} />
                            </Link>

                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              disabled={isSelf}
                              className={`btn ${u.status === 'blocked' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                              title={isSelf ? 'Cannot block yourself' : u.status === 'blocked' ? 'Unblock User' : 'Block User'}
                            >
                              {u.status === 'blocked' ? <Unlock size={13} /> : <Lock size={13} />}
                            </button>

                            <button
                              onClick={() => handleToggleUserRole(u)}
                              disabled={isSelf}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                              title={isSelf ? 'Cannot change your own role' : `Switch to ${u.role === 'admin' ? 'User' : 'Admin'}`}
                            >
                              <Shield size={13} />
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={isSelf}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', color: '#B91C1C' }}
                              title={isSelf ? 'Cannot delete yourself' : 'Soft Delete User'}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination Controls */}
            {userPagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Showing Page {userPagination.page} of {userPagination.pages} ({userPagination.total} total users)
                </span>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => loadUsersData(userPagination.page - 1)}
                    disabled={userPagination.page <= 1 || usersLoading}
                    className="btn btn-secondary btn-sm"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button
                    onClick={() => loadUsersData(userPagination.page + 1)}
                    disabled={userPagination.page >= userPagination.pages || usersLoading}
                    className="btn btn-secondary btn-sm"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ML & RECOMMENDATIONS TAB */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* KPI Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="card-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Impressions Logged
                </span>
                <Eye size={18} color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{recAnalytics.impressions}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Product views & impressions
              </div>
            </div>

            <div className="card-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Recommendation Clicks
                </span>
                <MousePointer size={18} color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{recAnalytics.clicks}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Explicit clicks on recommendations
              </div>
            </div>

            <div className="card-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Click-Through Rate (CTR)
                </span>
                <Percent size={18} color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>
                {recAnalytics.ctr}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '0.25rem' }}>
                Industry benchmark: 3.5%
              </div>
            </div>

            <div className="card-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Not Interested Signals
                </span>
                <EyeOff size={18} color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{recAnalytics.totalDismissals}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Negative feedback filtered
              </div>
            </div>
          </div>

          {/* Dismissed Products Analysis */}
          <div className="card-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <EyeOff size={18} color="#B91C1C" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Most Dismissed Products ("Not Interested" Feedback)</h3>
            </div>

            {stats?.mostDismissedProducts?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No dismissal feedback recorded yet. Products marked as "Not Interested" by shoppers will appear here.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {stats?.mostDismissedProducts?.map(({ product, dismissals }, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                      <img
                        src={product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt={product?.name}
                        style={{ width: '40px', height: '40px', objectFit: 'contain', background: '#FBFBFA', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                      />
                      <div style={{ overflow: 'hidden' }}>
                        <Link to={`/products/${product?._id}`} style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product?.name}
                        </Link>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product?.category}</span>
                      </div>
                    </div>
                    <span className="badge badge-danger">{dismissals} dismissals</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="card-panel table-responsive-wrapper" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Product</th>
                <th style={{ padding: '0.75rem' }}>Source</th>
                <th style={{ padding: '0.75rem' }}>Category</th>
                <th style={{ padding: '0.75rem' }}>Price</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Rating</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => {
                const isAmazon = prod.source === 'amazon' || !!prod.asin || !!prod.affiliateUrl;
                const isActive = prod.isActive !== false;

                return (
                  <tr key={prod._id} style={{ borderBottom: '1px solid var(--border-light)', opacity: isActive ? 1 : 0.6 }}>
                    <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt={prod.name}
                        style={{ width: '38px', height: '38px', objectFit: 'contain', background: '#FBFBFA', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                      />
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.875rem' }}>{prod.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prod.brand} {prod.asin ? `• ASIN: ${prod.asin}` : ''}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${isAmazon ? 'badge-curated' : 'badge-neutral'}`}>
                        {isAmazon ? 'Amazon Affiliate' : 'Catalog'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{prod.category}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>₹{prod.price?.toLocaleString('en-IN') || prod.price?.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        onClick={() => handleToggleProductStatus(prod)}
                        className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                        title="Click to toggle Active/Inactive status"
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem' }}>★ {prod.rating?.toFixed(1)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                        {isAmazon && (
                          <button
                            onClick={() => handleSyncAmazonProduct(prod)}
                            style={{ color: 'var(--accent)', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                            title="Sync live pricing & details with Amazon India"
                            aria-label="Sync with Amazon India"
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingProduct(prod);
                            setModalOpen(true);
                          }}
                          style={{ color: 'var(--text-primary)', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                          aria-label="Edit product"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod._id, prod.name)}
                          style={{ color: '#B91C1C', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                          aria-label="Delete product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="card-panel table-responsive-wrapper" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Order ID</th>
                <th style={{ padding: '0.75rem' }}>Customer</th>
                <th style={{ padding: '0.75rem' }}>Items</th>
                <th style={{ padding: '0.75rem' }}>Total</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => (
                <tr key={ord._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>#{ord._id.slice(-6)}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div>{ord.shippingAddress?.fullName}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.userId?.email}</span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{ord.items?.length} items</td>
                  <td style={{ padding: '0.75rem', fontWeight: 800 }}>${ord.totalAmount?.toFixed(2)}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className="badge badge-neutral">{ord.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <select
                      value={ord.status}
                      onChange={(e) => handleUpdateOrderStatus(ord._id, e.target.value)}
                      className="select-field"
                      style={{ padding: '0.3rem 0.5rem', width: 'auto', fontSize: '0.8rem', display: 'inline-block' }}
                    >
                      <option value="Processing">Processing</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <AdminProductModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSaved={loadAdminData}
      />
    </div>
  );
};

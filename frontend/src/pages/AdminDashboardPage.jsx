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

  const toast = useToast();

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, prodsRes, ordersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/products', { params: { limit: 50 } }),
        api.get('/admin/orders', { params: { limit: 30 } }),
      ]);

      if (statsRes.data?.stats) setStats(statsRes.data.stats);
      if (prodsRes.data?.products) setProducts(prodsRes.data.products);
      if (ordersRes.data?.orders) setOrders(ordersRes.data.orders);
    } catch (err) {
      toast.error('Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const loadUsersData = async (page = 1) => {
    setUsersLoading(true);
    try {
      const [uStatsRes, usersRes] = await Promise.all([
        api.get('/admin/users/stats'),
        api.get('/admin/users', {
          params: {
            page,
            limit: userPagination.limit,
            q: userSearch.trim(),
            role: roleFilter,
            status: statusFilter,
            dateRange: dateFilter,
            sortBy,
          },
        }),
      ]);

      if (uStatsRes.data?.stats) setUserStats(uStatsRes.data.stats);
      if (usersRes.data?.users) {
        setUsersList(usersRes.data.users);
        setUserPagination(usersRes.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
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
          { id: 'users', label: `Users (${userStats?.totalUsers || stats?.totalUsers || 0})` },
          { id: 'analytics', label: 'ML & Recommendations' },
          { id: 'products', label: `Products (${products.length})` },
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

      {/* 2. USERS MANAGEMENT TAB */}
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
          <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Product</th>
                <th style={{ padding: '0.75rem' }}>Category</th>
                <th style={{ padding: '0.75rem' }}>Price</th>
                <th style={{ padding: '0.75rem' }}>Stock</th>
                <th style={{ padding: '0.75rem' }}>Rating</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                      alt={prod.name}
                      style={{ width: '38px', height: '38px', objectFit: 'contain', background: '#FBFBFA', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                    />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.875rem' }}>{prod.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prod.brand}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{prod.category}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>${prod.price?.toFixed(2)}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${prod.stock > 10 ? 'badge-neutral' : 'badge-danger'}`}>
                      {prod.stock} in stock
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>★ {prod.rating?.toFixed(1)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setEditingProduct(prod);
                          setModalOpen(true);
                        }}
                        style={{ color: 'var(--text-primary)', padding: '4px' }}
                        aria-label="Edit product"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod._id, prod.name)}
                        style={{ color: '#B91C1C', padding: '4px' }}
                        aria-label="Delete product"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

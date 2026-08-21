import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PackageCheck,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const statusConfig = {
  Processing: { color: '#B45309', bg: '#FFFBEB', icon: Clock },
  Confirmed: { color: '#1D4ED8', bg: '#EFF6FF', icon: CheckCircle2 },
  Shipped: { color: '#0369A1', bg: '#F0F9FF', icon: Truck },
  Delivered: { color: '#15803D', bg: '#F0FDF4', icon: PackageCheck },
  Cancelled: { color: '#B91C1C', bg: '#FEF2F2', icon: AlertCircle },
};

export const OrdersPage = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        if (res.data?.orders) {
          setOrders(res.data.orders);
        }
      } catch (err) {
        console.warn('Error fetching orders:', err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <div className="card-panel" style={{ maxWidth: '480px', margin: '0 auto', padding: '4rem 2rem', boxShadow: 'var(--shadow-card)' }}>
          <ShoppingBag size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.25rem' }} />
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.5rem' }}>Sign In to View Orders</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '2rem' }}>
            Please sign in to track and review your orders.
          </p>
          <Link to="/login?redirect=/orders" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container orders-page-container" style={{ padding: '3rem 1.5rem 5rem', maxWidth: '1000px' }}>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Order History</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.35rem' }}>
          Track recent shipments, deliveries, and past purchase receipts
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-card)' }} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card-panel" style={{ padding: '4.5rem 2rem', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
          <ShoppingBag size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.25rem' }} />
          <h3 style={{ fontSize: '1.35rem', fontWeight: 750, marginBottom: '0.4rem' }}>No orders placed yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1.75rem' }}>
            Explore our curated catalog to start shopping.
          </p>
          <Link to="/products" className="btn btn-primary btn-sm">
            Explore Products
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map((order) => {
            const statusInfo = statusConfig[order.status] || statusConfig.Processing;
            const StatusIcon = statusInfo.icon;
            const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={order._id}
                className="card-panel"
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'var(--transition)',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)', fontWeight: 650 }}>
                      ORDER #{order._id}
                    </span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Placed on {dateStr}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.3rem 0.65rem',
                        borderRadius: 'var(--radius-badge)',
                        fontSize: '0.785rem',
                        fontWeight: 700,
                        color: statusInfo.color,
                        background: statusInfo.bg,
                      }}
                    >
                      <StatusIcon size={13} /> {order.status}
                    </span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ${order.totalAmount?.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items row */}
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  {order.items?.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minWidth: '220px', background: 'var(--bg-secondary)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                      <img
                        src={it.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt={it.name}
                        style={{ width: '44px', height: '44px', objectFit: 'contain', background: '#F9F9F8', borderRadius: 'var(--radius-xs)' }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.835rem', fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {it.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Qty: {it.quantity} • ${it.price?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                  <Link to={`/orders/${order._id}`} className="view-all-link" style={{ fontSize: '0.85rem' }}>
                    View Full Order Details <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .orders-page-container {
            padding: 1.5rem 1rem 3.5rem !important;
          }
          .orders-page-container h1 {
            font-size: 1.6rem !important;
          }
          .orders-page-container .card-panel {
            padding: 1.25rem 1rem !important;
          }
        }
        @media (max-width: 480px) {
          .orders-page-container {
            padding: 1rem 0.75rem 3rem !important;
          }
          .orders-page-container h1 {
            font-size: 1.4rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OrdersPage;

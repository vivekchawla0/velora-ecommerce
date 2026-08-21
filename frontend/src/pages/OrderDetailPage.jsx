import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PackageCheck,
  Truck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const steps = ['Processing', 'Confirmed', 'Shipped', 'Delivered'];

export const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, setIsDrawerOpen } = useCart();
  const toast = useToast();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        if (res.data?.order) {
          setOrder(res.data.order);
        }
      } catch (err) {
        console.warn('Error fetching order details:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleReorder = () => {
    if (!order || !order.items) return;
    order.items.forEach((item) => {
      addToCart(
        {
          _id: item.productId,
          name: item.name,
          price: item.price,
          images: [item.image],
        },
        item.quantity
      );
    });
    toast.success('Items added to bag');
    setIsDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="container-narrow" style={{ padding: '4rem 1.5rem' }}>
        <div className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-card)' }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>Order Not Found</h2>
        <Link to="/orders" className="btn btn-primary">
          Back to Orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = steps.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <div className="container-narrow order-detail-container" style={{ padding: '3rem 1.5rem 5rem' }}>
      <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.75rem', fontWeight: 550 }}>
        <ArrowLeft size={15} /> Back to All Orders
      </Link>

      <div className="card-panel" style={{ padding: '2.5rem', boxShadow: 'var(--shadow-card)' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.75rem', marginBottom: '2.25rem' }}>
          <div>
            <span className="badge badge-neutral" style={{ marginBottom: '0.45rem' }}>
              Order #{order._id}
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Order Details</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.885rem', marginTop: '0.25rem' }}>
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { dateStyle: 'full' })}
            </p>
          </div>

          <button onClick={handleReorder} className="btn btn-secondary btn-sm">
            <ShoppingBag size={14} /> Reorder All Items
          </button>
        </div>

        {/* Progress Tracker (unless Cancelled) */}
        {!isCancelled && (
          <div style={{ marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              {/* Connecting line */}
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '30px',
                  right: '30px',
                  height: '2px',
                  background: 'var(--border)',
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: '#15803D',
                    width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%`,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              {steps.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div
                    key={step}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      zIndex: 2,
                      gap: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: isPassed ? '#15803D' : '#FFFFFF',
                        border: '2px solid',
                        borderColor: isPassed ? '#15803D' : 'var(--border)',
                        color: isPassed ? '#FFFFFF' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {isPassed ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: isCurrent ? 750 : 500,
                        color: isPassed ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Items Table */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 750, marginBottom: '1.25rem' }}>Purchased Items</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {order.items?.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                    alt={item.name}
                    style={{ width: '56px', height: '56px', objectFit: 'contain', background: '#F9F9F8', borderRadius: 'var(--radius-xs)', padding: '2px' }}
                  />
                  <div>
                    <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.name}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Qty: {item.quantity} × ${item.price?.toFixed(2)}
                    </span>
                  </div>
                </div>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Payment Summary Grid */}
        <div className="order-summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.75rem', fontSize: '0.885rem' }}>
          <div>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 750, marginBottom: '0.75rem' }}>Delivery Address</h4>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <div>{order.shippingAddress?.fullName}</div>
              <div>{order.shippingAddress?.street}</div>
              <div>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
              </div>
              <div>{order.shippingAddress?.country}</div>
              <div style={{ marginTop: '0.35rem', color: 'var(--text-muted)' }}>{order.shippingAddress?.phone}</div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 750, marginBottom: '0.75rem' }}>Payment Summary</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Method</span>
                <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {order.paymentMethod?.replace('_', ' ') || 'Credit Card'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Paid</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ${order.totalAmount?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .order-detail-container {
            padding: 1.5rem 1rem 3.5rem !important;
          }
          .order-detail-container .card-panel {
            padding: 1.5rem 1rem !important;
          }
          .order-detail-container h1 {
            font-size: 1.5rem !important;
          }
          .order-summary-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
        @media (max-width: 480px) {
          .order-detail-container {
            padding: 1rem 0.75rem 3rem !important;
          }
          .order-detail-container h1 {
            font-size: 1.35rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderDetailPage;

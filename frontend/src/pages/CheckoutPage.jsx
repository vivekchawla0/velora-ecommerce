import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';

export const CheckoutPage = () => {
  const { cart, subtotal, tax, shippingFee, totalAmount, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || 'Alex Morgan',
    street: '742 Evergreen Terrace',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94107',
    country: 'United States',
    phone: '+1 (555) 234-5678',
  });

  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('889');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderComplete, setOrderComplete] = useState(null);

  if (cart.length === 0 && !orderComplete) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <div className="card-panel" style={{ maxWidth: '480px', margin: '0 auto', padding: '4rem 2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Your Bag is Empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.925rem' }}>
            Please add items to your cart before proceeding to checkout.
          </p>
          <Link to="/products" className="btn btn-primary btn-lg">
            Explore Products
          </Link>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please sign in or register to place your order.');
      navigate('/login?redirect=/checkout');
      return;
    }

    setIsPlacingOrder(true);

    try {
      const itemsPayload = cart.map((item) => ({
        productId: item.product._id,
        quantity: item.quantity,
      }));

      const res = await api.post('/orders', {
        items: itemsPayload,
        shippingAddress,
        paymentMethod,
      });

      if (res.data?.success && res.data.order) {
        const createdOrder = res.data.order;
        setOrderComplete(createdOrder);
        clearCart();

        // Confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {
          // Non-critical
        }

        toast.success('Order confirmed successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Order Confirmation Success View
  if (orderComplete) {
    return (
      <div className="container-narrow" style={{ padding: '4.5rem 1.5rem' }}>
        <div className="card-panel" style={{ padding: '3.5rem 2.5rem', textAlign: 'center', boxShadow: 'var(--shadow-hover)' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#F0FDF4',
              border: '1px solid #DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.35rem',
            }}
          >
            <CheckCircle2 size={34} color="#15803D" />
          </div>

          <span className="badge badge-success" style={{ marginBottom: '0.85rem' }}>
            Payment Confirmed (Simulated)
          </span>

          <h1 style={{ fontSize: '2.35rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            Thank You for Your Order
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2.25rem' }}>
            Order ID: <strong>{orderComplete._id}</strong>
            <br />
            A receipt has been generated and purchase interactions logged for real-time recommendation training.
          </p>

          <div
            className="card-panel-subtle"
            style={{ padding: '1.75rem', textAlign: 'left', marginBottom: '2.5rem', fontSize: '0.885rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{orderComplete.status}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Amount Paid:</span>
              <strong style={{ fontWeight: 800 }}>${orderComplete.totalAmount?.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Ship To:</span>
              <span>{orderComplete.shippingAddress?.fullName} — {orderComplete.shippingAddress?.city}, {orderComplete.shippingAddress?.state}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/orders" className="btn btn-primary">
              View Order History
            </Link>
            <Link to="/for-you" className="btn btn-secondary">
              <Sparkles size={15} color="var(--accent)" />
              See Updated Recommendations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container checkout-page-container" style={{ padding: '2.5rem 1.5rem 5rem' }}>
      {/* Breadcrumb / Back Link */}
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 550 }}>
          <ArrowLeft size={15} /> Back to Bag
        </Link>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Secure Checkout</h1>
      </div>

      <form onSubmit={handlePlaceOrder} style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem' }} className="checkout-layout">
        {/* Left Column: Shipping Address & Payment Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* 1. Shipping Address */}
          <div className="card-panel" style={{ padding: '2.25rem', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
              <Truck size={18} color="var(--accent)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>1. Delivery Address</h2>
            </div>

            <div className="form-grid-2">
              <div className="input-group">
                <label className="input-label">Full Name *</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.fullName}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Street Address *</label>
              <input
                type="text"
                required
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="form-grid-3">
              <div className="input-group">
                <label className="input-label">City *</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">State *</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">ZIP Code *</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.postalCode}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* 2. Payment Method */}
          <div className="card-panel" style={{ padding: '2.25rem', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={18} color="var(--accent)" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>2. Payment Method</h2>
              </div>
              <span className="badge badge-neutral">Simulated Sandbox</span>
            </div>

            {/* Payment Method Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
              {[
                { id: 'credit_card', label: 'Credit Card' },
                { id: 'paypal', label: 'PayPal' },
                { id: 'upi', label: 'UPI / NetBanking' },
                { id: 'cod', label: 'Cash on Delivery' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-btn)',
                    border: paymentMethod === m.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: paymentMethod === m.id ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                    fontWeight: paymentMethod === m.id ? 700 : 500,
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {paymentMethod === 'credit_card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="input-field"
                    placeholder="4532 •••• •••• 8892"
                  />
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="input-field"
                      placeholder="12/28"
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">CVC Code</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="input-field"
                      placeholder="889"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Review */}
        <div>
          <div className="card-panel" style={{ padding: '2rem', position: 'sticky', top: '5.5rem', boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.35rem' }}>
              Items in Order ({cart.length})
            </h3>

            {/* Cart Items Preview List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '230px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.25rem' }}>
              {cart.map(({ product, quantity }) => (
                <div key={product._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                      alt={product.name}
                      style={{
                        width: '42px',
                        height: '42px',
                        objectFit: 'contain',
                        background: '#F9F9F8',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px',
                      }}
                    />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px', fontWeight: 600 }}>
                      {product.name} (x{quantity})
                    </span>
                  </div>
                  <strong style={{ whiteSpace: 'nowrap' }}>${(product.price * quantity).toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.885rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Estimated Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Standard Shipping</span>
                <span>{shippingFee === 0 ? <strong style={{ color: '#15803D' }}>Free</strong> : `$${shippingFee.toFixed(2)}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.25rem' }}>
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPlacingOrder}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '1.85rem' }}
            >
              <Lock size={16} />
              {isPlacingOrder ? 'Processing...' : `Confirm & Pay $${totalAmount.toFixed(2)}`}
            </button>

            <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.785rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              <ShieldCheck size={14} color="#15803D" /> 256-Bit SSL Encrypted Simulated Payment
            </p>
          </div>
        </div>
      </form>

      <style>{`
        @media (max-width: 868px) {
          .checkout-layout {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
        @media (max-width: 640px) {
          .checkout-page-container {
            padding: 1.5rem 1rem 3.5rem !important;
          }
          .checkout-layout .card-panel {
            padding: 1.5rem 1.15rem !important;
          }
          .checkout-page-container h1 {
            font-size: 1.6rem !important;
          }
        }
        @media (max-width: 480px) {
          .checkout-page-container {
            padding: 1rem 0.75rem 3rem !important;
          }
          .checkout-layout .card-panel {
            padding: 1.25rem 0.85rem !important;
          }
          .checkout-page-container h1 {
            font-size: 1.4rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CheckoutPage;

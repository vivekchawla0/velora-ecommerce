import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Tag,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const CartPage = () => {
  const {
    cart,
    totalItems,
    subtotal,
    tax,
    shippingFee,
    totalAmount,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleApplyPromo = (e) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'VELORA10' || code === 'NEXA10') {
      const discount = Number((subtotal * 0.1).toFixed(2));
      setDiscountAmount(discount);
      setPromoApplied(true);
      toast.success('Promo code VELORA10 applied: 10% discount added');
    } else {
      toast.error('Invalid promo code. Try "VELORA10" for 10% discount.');
    }
  };

  const handleClearCartClick = () => {
    if (window.confirm('Remove all items from your cart?')) {
      clearCart();
      toast.info('Cart cleared');
    }
  };

  const handleProceedToCheckout = () => {
    const amazonItem = cart.find(
      (item) => item.product?.source === 'amazon' || item.product?.affiliateUrl || item.product?.amazonUrl
    );
    if (amazonItem) {
      const destUrl = amazonItem.product?.affiliateUrl || amazonItem.product?.amazonUrl;
      if (destUrl) {
        toast.info('Redirecting to Amazon India to complete your purchase...');
        window.open(destUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    }
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <div
          className="card-panel"
          style={{ maxWidth: '480px', margin: '0 auto', padding: '4rem 2rem' }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <ShoppingBag size={32} color="var(--text-muted)" />
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.5rem' }}>Your shopping bag is empty</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '2rem' }}>
            Discover something you'll love from our curated catalog.
          </p>
          <Link to="/products" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Explore Catalog <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-page-container" style={{ padding: '2.5rem 1.5rem 5rem' }}>
      {/* Breadcrumbs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.825rem',
          color: 'var(--text-muted)',
          marginBottom: '1.5rem',
        }}
      >
        <Link to="/" style={{ color: 'var(--text-secondary)' }}>Home</Link>
        <ChevronRight size={13} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 650 }}>Shopping Bag ({totalItems})</span>
      </div>

      {/* Header Bar */}
      <div
        className="cart-page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '1.5rem',
          marginBottom: '2.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Shopping Bag</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.35rem' }}>
            Review your selected items before proceeding to checkout
          </p>
        </div>
        <button
          onClick={handleClearCartClick}
          style={{ color: '#B91C1C', fontSize: '0.865rem', fontWeight: 650, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Trash2 size={15} /> Clear Bag
        </button>
      </div>

      {/* Main Cart Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem' }} className="cart-layout">
        {/* Left Column: Cart Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {cart.map((item) => {
            const product = item.product || item;
            const pId = product._id || product.id || item.productId;
            const quantity = item.quantity || 1;
            const price = item.price || product.price || 0;

            return (
              <div
                key={pId}
                className="card-panel"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'center',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                {/* Image Frame */}
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                  alt={product.name}
                  style={{
                    width: '96px',
                    height: '96px',
                    objectFit: 'contain',
                    background: '#F9F9F8',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem',
                    flexShrink: 0,
                  }}
                />

                {/* Info & Controls */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                        {product.brand || product.category || 'Velora'}
                      </span>
                      <Link
                        to={`/products/${pId}`}
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          display: 'block',
                          color: 'var(--text-primary)',
                          marginTop: '2px',
                          lineHeight: 1.35,
                        }}
                      >
                        {product.name}
                      </Link>
                    </div>
                    <button
                      onClick={() => removeFromCart(pId)}
                      style={{ color: 'var(--text-muted)', padding: '4px' }}
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.35rem' }}>
                    {/* Stepper */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        background: 'var(--bg-secondary)',
                        padding: '0.35rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <button onClick={() => updateQuantity(pId, quantity - 1)} style={{ display: 'flex' }} aria-label="Decrease quantity">
                        <Minus size={13} />
                      </button>
                      <span style={{ fontSize: '0.9rem', fontWeight: 750, minWidth: '20px', textAlign: 'center' }}>
                        {quantity}
                      </span>
                      <button onClick={() => updateQuantity(pId, quantity + 1)} style={{ display: 'flex' }} aria-label="Increase quantity">
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        ${(price * quantity).toFixed(2)}
                      </div>
                      {quantity > 1 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ${price.toFixed(2)} each
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Order Summary */}
        <div>
          <div className="card-panel" style={{ padding: '2rem', position: 'sticky', top: '5.5rem', boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.35rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
              Order Summary
            </h3>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Tag size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Promo Code (VELORA10)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.4rem', height: '2.5rem', fontSize: '0.835rem' }}
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-sm" style={{ height: '2.5rem' }}>
                Apply
              </button>
            </form>

            {/* Cost Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.885rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal ({totalItems} items)</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 650 }}>${subtotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Estimated Sales Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Standard Shipping</span>
                <span>{shippingFee === 0 ? <strong style={{ color: '#15803D' }}>Complimentary</strong> : `$${shippingFee.toFixed(2)}`}</span>
              </div>

              {promoApplied && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803D', fontWeight: 650 }}>
                  <span>Promo Discount (10%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '1.15rem',
                  marginTop: '0.5rem',
                }}
              >
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '1.85rem' }}
            >
              Proceed to Checkout <ArrowRight size={16} />
            </button>

            <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.785rem', color: 'var(--text-muted)', marginTop: '1.15rem' }}>
              <ShieldCheck size={15} color="#15803D" /> 256-Bit Encrypted Simulated Checkout
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 868px) {
          .cart-layout {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
        @media (max-width: 640px) {
          .cart-page-container {
            padding: 1.5rem 1rem 3.5rem !important;
          }
          .cart-page-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
            margin-bottom: 1.5rem !important;
            padding-bottom: 1rem !important;
          }
          .cart-page-header h1 {
            font-size: 1.6rem !important;
          }
        }
        @media (max-width: 480px) {
          .cart-page-container {
            padding: 1rem 0.75rem 3rem !important;
          }
          .cart-page-header h1 {
            font-size: 1.4rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CartPage;

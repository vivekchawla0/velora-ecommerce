import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer = () => {
  const {
    cart,
    totalItems,
    subtotal,
    isDrawerOpen,
    setIsDrawerOpen,
    updateQuantity,
    removeFromCart,
  } = useCart();
  const navigate = useNavigate();

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const handleCheckoutClick = () => {
    setIsDrawerOpen(false);
    navigate('/checkout');
  };

  const handleViewCartClick = () => {
    setIsDrawerOpen(false);
    navigate('/cart');
  };

  const freeShippingThreshold = 50;
  const progressToFreeShipping = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={() => setIsDrawerOpen(false)}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '430px',
          height: '100%',
          background: 'var(--bg-primary)',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.35rem 1.75rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Shopping Bag</h3>
            <span className="badge badge-neutral">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="btn-icon"
            style={{ border: 'none', background: 'transparent' }}
            aria-label="Close cart drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1.75rem', borderBottom: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontWeight: 600 }}>
            {subtotal >= freeShippingThreshold ? (
              <span style={{ color: '#15803D' }}>🎉 You unlocked Free Complimentary Shipping!</span>
            ) : (
              <span>Add ${(freeShippingThreshold - subtotal).toFixed(2)} more for Free Shipping</span>
            )}
            <span style={{ color: 'var(--text-muted)' }}>{progressToFreeShipping}%</span>
          </div>
          <div style={{ width: '100%', height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${progressToFreeShipping}%`, height: '100%', background: subtotal >= freeShippingThreshold ? '#15803D' : 'var(--accent)', transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cart.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', padding: '2rem 1rem' }}>
              <ShoppingBag size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem' }}>Your bag is empty</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Discover our curated products and intelligent recommendations.
              </p>
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate('/products');
                }}
                className="btn btn-primary btn-sm"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const product = item.product || item;
              const pId = product._id || product.id || item.productId;
              const quantity = item.quantity || 1;
              const price = item.price || product.price || 0;

              return (
                <div
                  key={pId}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border-light)',
                    alignItems: 'center',
                  }}
                >
                  <img
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150'}
                    alt={product.name}
                    style={{
                      width: '72px',
                      height: '72px',
                      objectFit: 'contain',
                      background: '#F9F9F8',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.35rem',
                      border: '1px solid var(--border-light)',
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Link
                        to={`/products/${pId}`}
                        onClick={() => setIsDrawerOpen(false)}
                        style={{
                          fontWeight: 650,
                          fontSize: '0.885rem',
                          color: 'var(--text-primary)',
                          lineHeight: 1.35,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {product.name}
                      </Link>
                      <button
                        onClick={() => removeFromCart(pId)}
                        style={{ color: 'var(--text-muted)', padding: '2px', marginLeft: '0.5rem' }}
                        aria-label="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                      {/* Quantity Stepper */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.25rem 0.5rem',
                          background: 'var(--bg-secondary)',
                        }}
                      >
                        <button onClick={() => updateQuantity(pId, quantity - 1)} style={{ display: 'flex' }} aria-label="Decrease quantity">
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '0.825rem', fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>
                          {quantity}
                        </span>
                        <button onClick={() => updateQuantity(pId, quantity + 1)} style={{ display: 'flex' }} aria-label="Increase quantity">
                          <Plus size={12} />
                        </button>
                      </div>

                      <span style={{ fontWeight: 750, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        ${(price * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions & Subtotal */}
        {cart.length > 0 && (
          <div
            style={{
              padding: '1.5rem 1.75rem',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>Subtotal</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                onClick={handleCheckoutClick}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>

              <button
                onClick={handleViewCartClick}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', padding: '0.6rem' }}
              >
                View Full Bag Details
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} color="#15803D" /> Simulated instant checkout with encrypted protection
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default CartDrawer;

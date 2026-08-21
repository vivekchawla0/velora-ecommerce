import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import api from '../api/client';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('velora_cart') || localStorage.getItem('nexacart_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loadingCart, setLoadingCart] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  const getAuthToken = () => localStorage.getItem('velora_token') || localStorage.getItem('nexacart_token');

  // Load and synchronize cart from backend MongoDB if user is authenticated
  const fetchBackendCart = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoadingCart(true);
    try {
      // Check if there are local guest items to merge
      const localGuest = localStorage.getItem('velora_cart');
      let guestItems = [];
      try {
        guestItems = localGuest ? JSON.parse(localGuest) : [];
      } catch {
        guestItems = [];
      }

      if (guestItems.length > 0) {
        const payload = guestItems.map((i) => ({
          productId: i.product?._id || i.product,
          quantity: i.quantity || 1,
        }));

        const mergeRes = await api.post('/cart/merge', { items: payload });
        if (mergeRes.data?.cart?.items) {
          setCart(mergeRes.data.cart.items);
          localStorage.removeItem('velora_cart');
          localStorage.removeItem('nexacart_cart');
        }
      } else {
        const res = await api.get('/cart');
        if (res.data?.cart?.items) {
          setCart(res.data.cart.items);
        }
      }
    } catch (err) {
      console.debug('Error syncing cart with backend:', err.message);
    } finally {
      setLoadingCart(false);
    }
  }, []);

  // Fetch cart on initial load or token changes
  useEffect(() => {
    fetchBackendCart();
  }, [fetchBackendCart]);

  // Persist to localStorage for guests
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      localStorage.setItem('velora_cart', JSON.stringify(cart));
    }
  }, [cart]);

  // Add Item to Cart
  const addToCart = async (product, quantity = 1) => {
    if (!product || !product._id) return { success: false };

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const token = getAuthToken();

    // Check client-side stock availability first
    if (product.stock !== undefined && product.stock < qty) {
      toast.error(`Only ${product.stock} units available in stock.`);
      return { success: false };
    }

    setActionLoading(true);

    if (token) {
      // Authenticated User: Persist in MongoDB
      try {
        const res = await api.post('/cart/add', {
          productId: product._id,
          quantity: qty,
        });

        if (res.data?.cart?.items) {
          setCart(res.data.cart.items);
          toast.success(`Added ${product.name} to cart ✓`);
          return { success: true };
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to add item to cart';
        toast.error(msg);
        return { success: false, message: msg };
      } finally {
        setActionLoading(false);
      }
    } else {
      // Guest User: Local storage with stock validation
      setCart((prev) => {
        const existingIndex = prev.findIndex(
          (item) => (item.product?._id || item.product) === product._id
        );

        if (existingIndex > -1) {
          const currentQty = prev[existingIndex].quantity;
          const updatedQty = Math.min(
            currentQty + qty,
            product.stock !== undefined ? product.stock : 99
          );

          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: updatedQty,
            itemTotal: Number((product.price * updatedQty).toFixed(2)),
          };
          return next;
        }

        return [
          ...prev,
          {
            product,
            quantity: qty,
            price: product.price,
            itemTotal: Number((product.price * qty).toFixed(2)),
          },
        ];
      });

      toast.success(`Added ${product.name} to cart ✓`);
      setActionLoading(false);
      return { success: true };
    }
  };

  // Update Item Quantity
  const updateQuantity = async (productId, newQuantity) => {
    if (!productId) return;
    const qty = parseInt(newQuantity, 10);
    const token = getAuthToken();

    if (qty <= 0) {
      return removeFromCart(productId);
    }

    if (token) {
      try {
        const res = await api.patch(`/cart/${productId}`, { quantity: qty });
        if (res.data?.cart?.items) {
          setCart(res.data.cart.items);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Cannot update quantity');
      }
    } else {
      setCart((prev) =>
        prev.map((item) => {
          const id = item.product?._id || item.product;
          if (id === productId) {
            const maxStock = item.product?.stock !== undefined ? item.product.stock : 99;
            const validQty = Math.min(Math.max(1, qty), maxStock);
            return {
              ...item,
              quantity: validQty,
              itemTotal: Number(((item.product?.price || item.price) * validQty).toFixed(2)),
            };
          }
          return item;
        })
      );
    }
  };

  // Remove Item from Cart
  const removeFromCart = async (productId) => {
    if (!productId) return;
    const token = getAuthToken();

    if (token) {
      try {
        const res = await api.delete(`/cart/${productId}`);
        if (res.data?.cart?.items) {
          setCart(res.data.cart.items);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to remove item');
      }
    } else {
      setCart((prev) => prev.filter((item) => (item.product?._id || item.product) !== productId));
    }

    toast.info('Product removed from cart');
  };

  // Clear Cart
  const clearCart = async () => {
    const token = getAuthToken();

    if (token) {
      try {
        await api.delete('/cart');
      } catch (err) {
        console.debug('Clear cart error:', err.message);
      }
    }

    setCart([]);
    localStorage.removeItem('velora_cart');
    localStorage.removeItem('nexacart_cart');
  };

  // Check if product exists in cart
  const isInCart = useCallback(
    (productId) => {
      if (!productId) return false;
      const targetId = productId.toString();
      return cart.some((item) => {
        const id = item.product?._id || item.product?.id || item.product || item.productId;
        return id && id.toString() === targetId;
      });
    },
    [cart]
  );

  // Calculations
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = Number(
    cart
      .reduce((sum, item) => {
        const price = item.price || item.product?.price || 0;
        const qty = item.quantity || 1;
        return sum + price * qty;
      }, 0)
      .toFixed(2)
  );
  const tax = Number((subtotal * 0.08).toFixed(2));
  const shippingFee = subtotal >= 50 || subtotal === 0 ? 0 : 5.99;
  const totalAmount = Number((subtotal + tax + shippingFee).toFixed(2));

  return (
    <CartContext.Provider
      value={{
        cart,
        totalItems,
        subtotal,
        tax,
        shippingFee,
        totalAmount,
        isDrawerOpen,
        setIsDrawerOpen,
        loadingCart,
        actionLoading,
        addToCart,
        isInCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchBackendCart,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        toggleDrawer: () => setIsDrawerOpen((prev) => !prev),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

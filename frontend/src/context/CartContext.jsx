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

  // Check if product exists in cart
  const isInCart = useCallback(
    (productOrId) => {
      if (!productOrId) return false;
      const targetIds = new Set();
      let targetName = null;

      if (typeof productOrId === 'object') {
        if (productOrId._id) targetIds.add(String(productOrId._id));
        if (productOrId.id) targetIds.add(String(productOrId.id));
        if (productOrId.sku) targetIds.add(String(productOrId.sku));
        if (productOrId.productId) targetIds.add(String(productOrId.productId));
        if (productOrId.name) targetName = String(productOrId.name).toLowerCase().trim();
      } else {
        targetIds.add(String(productOrId));
      }

      return cart.some((item) => {
        const itemProd = item.product;
        if (!itemProd) return false;

        const itemIds = [
          item.productId ? String(item.productId) : null,
          itemProd?._id ? String(itemProd._id) : null,
          itemProd?.id ? String(itemProd.id) : null,
          itemProd?.sku ? String(itemProd.sku) : null,
          typeof itemProd === 'string' ? itemProd : null,
        ].filter(Boolean);

        const idMatch = itemIds.some((id) => targetIds.has(id));
        if (idMatch) return true;

        if (targetName && itemProd?.name) {
          return String(itemProd.name).toLowerCase().trim() === targetName;
        }

        return false;
      });
    },
    [cart]
  );

  // Add Item to Cart
  const addToCart = async (product, quantity = 1) => {
    const pId = product?._id || product?.id || product?.sku;
    if (!product || !pId) return { success: false };

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    if (product.stock !== undefined && product.stock < qty) {
      toast.error(`Only ${product.stock} units available in stock.`);
      return { success: false };
    }

    // 1. Instantly update local cart state & header count (0ms response)
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => {
        const itemProd = item.product;
        const itemIds = [
          item.productId ? String(item.productId) : null,
          itemProd?._id ? String(itemProd._id) : null,
          itemProd?.id ? String(itemProd.id) : null,
          itemProd?.sku ? String(itemProd.sku) : null,
        ].filter(Boolean);
        const targetIds = [product._id, product.id, product.sku, pId].filter(Boolean).map(String);
        const matchId = itemIds.some((id) => targetIds.includes(id));
        if (matchId) return true;
        if (product.name && itemProd?.name) {
          return String(itemProd.name).toLowerCase().trim() === String(product.name).toLowerCase().trim();
        }
        return false;
      });

      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity || 1;
        const updatedQty = Math.min(
          currentQty + qty,
          product.stock !== undefined ? product.stock : 99
        );
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: updatedQty,
          itemTotal: Number(((product.price || 0) * updatedQty).toFixed(2)),
        };
        return next;
      }

      return [
        ...prev,
        {
          product,
          quantity: qty,
          price: product.price || 0,
          itemTotal: Number(((product.price || 0) * qty).toFixed(2)),
        },
      ];
    });

    toast.success(`Added ${product.name || 'item'} to cart ✓`);

    // 2. Perform background API call if logged in
    const token = getAuthToken();
    if (token) {
      try {
        const res = await api.post('/cart/add', {
          productId: pId,
          quantity: qty,
        });

        if (res.data?.cart?.items && Array.isArray(res.data.cart.items) && res.data.cart.items.length > 0) {
          setCart((prev) => {
            const serverItems = res.data.cart.items;
            const merged = [...serverItems];
            for (const localItem of prev) {
              const localProd = localItem.product;
              const localName = localProd?.name ? String(localProd.name).toLowerCase().trim() : null;
              const localId = String(localProd?._id || localProd?.id || localItem.productId || '');

              const existsInServer = serverItems.some((sItem) => {
                const sProd = sItem.product;
                const sName = sProd?.name ? String(sProd.name).toLowerCase().trim() : null;
                const sId = String(sProd?._id || sProd?.id || sItem.productId || '');
                return (localId && sId && localId === sId) || (localName && sName && localName === sName);
              });

              if (!existsInServer) {
                merged.push(localItem);
              }
            }
            return merged;
          });
        }
      } catch (err) {
        console.warn('Background cart sync warning:', err.message);
      }
    }

    return { success: true };
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

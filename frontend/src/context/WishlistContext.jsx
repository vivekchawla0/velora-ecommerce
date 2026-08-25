import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('velora_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const getAuthToken = () => localStorage.getItem('velora_token') || localStorage.getItem('nexacart_token');

  // Load wishlist from backend if authenticated
  const fetchWishlist = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(true);
    try {
      const res = await api.get('/wishlist');
      if (res.data && Array.isArray(res.data.wishlist)) {
        setWishlist(res.data.wishlist);
      }
    } catch (err) {
      console.debug('Error fetching wishlist:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Persist guest wishlist to localStorage
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      localStorage.setItem('velora_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist]);

  const isInWishlist = useCallback(
    (productOrId) => {
      if (!productOrId) return false;
      const targetIds = new Set();

      if (typeof productOrId === 'object') {
        if (productOrId._id) targetIds.add(String(productOrId._id));
        if (productOrId.id) targetIds.add(String(productOrId.id));
        if (productOrId.sku) targetIds.add(String(productOrId.sku));
      } else {
        targetIds.add(String(productOrId));
      }

      return wishlist.some((item) => {
        const itemIds = [
          item?._id ? String(item._id) : null,
          item?.id ? String(item.id) : null,
          item?.sku ? String(item.sku) : null,
          typeof item === 'string' ? item : null,
        ].filter(Boolean);

        return itemIds.some((id) => targetIds.has(id));
      });
    },
    [wishlist]
  );

  const toggleWishlist = async (product) => {
    if (!product) return;
    const pId = product._id || product.id || product;
    const token = getAuthToken();

    if (token) {
      try {
        const res = await api.post(`/wishlist/${pId}`);
        if (res.data?.inWishlist) {
          setWishlist((prev) => [...prev, product]);
          toast.info(`Saved ${product.name || 'item'} to your wishlist`);
        } else {
          setWishlist((prev) => prev.filter((item) => (item._id || item.id || item) !== pId));
          toast.info(`Removed ${product.name || 'item'} from wishlist`);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update wishlist');
      }
    } else {
      // Guest state
      if (isInWishlist(pId)) {
        setWishlist((prev) => prev.filter((item) => (item._id || item.id || item) !== pId));
        toast.info(`Removed from wishlist`);
      } else {
        setWishlist((prev) => [...prev, product]);
        toast.info(`Saved ${product.name || 'item'} to wishlist`);
      }
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!productId) return;
    const pId = productId._id || productId.id || productId;
    const token = getAuthToken();

    if (token) {
      try {
        await api.delete(`/wishlist/${pId}`);
      } catch (err) {
        console.debug('Remove wishlist error:', err.message);
      }
    }

    setWishlist((prev) => prev.filter((item) => (item._id || item.id || item) !== pId));
    toast.info('Item removed from wishlist');
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        totalWishlistItems: wishlist.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        fetchWishlist,
        loadingWishlist: loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

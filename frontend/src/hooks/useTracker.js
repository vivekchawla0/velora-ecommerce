import { useCallback, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const useTracker = () => {
  const { isAuthenticated } = useAuth();
  const trackedViews = useRef(new Set());

  const trackEvent = useCallback(
    async (productId, type, ratingValue = null) => {
      if (!isAuthenticated || !productId) return;

      // Prevent redundant rapid duplicate view pings in same session
      if (type === 'view') {
        if (trackedViews.current.has(productId)) return;
        trackedViews.current.add(productId);
      }

      try {
        await api.post('/interactions', {
          productId,
          type,
          ratingValue,
        });
      } catch (err) {
        // Silent catch so UI is never blocked
        console.debug(`[Tracker] Could not record ${type}:`, err.message);
      }
    },
    [isAuthenticated]
  );

  return {
    trackView: (productId) => trackEvent(productId, 'view'),
    trackClick: (productId) => trackEvent(productId, 'click'),
    trackRating: (productId, val) => trackEvent(productId, 'rating', val),
  };
};

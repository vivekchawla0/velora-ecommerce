import React, { useState, useEffect } from 'react';
import { X, Save, Package } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';

export const AdminProductModal = ({ isOpen, onClose, product = null, onSaved }) => {
  const isEditing = Boolean(product && product._id);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'electronics',
    brand: '',
    stock: '',
    images: '',
    tags: '',
    featured: false,
    collections: ['shop-all'],
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        category: product.category || 'electronics',
        brand: product.brand || '',
        stock: product.stock !== undefined ? product.stock : 25,
        images: Array.isArray(product.images) ? product.images.join(', ') : '',
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
        featured: Boolean(product.featured),
        collections: Array.isArray(product.collections) && product.collections.length > 0 ? product.collections : ['shop-all'],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        category: 'electronics',
        brand: '',
        stock: 20,
        images: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
        tags: 'premium, new',
        featured: false,
        collections: ['best-sellers', 'shop-all'],
      });
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleCollectionToggle = (colKey) => {
    const currentCols = [...formData.collections];
    if (currentCols.includes(colKey)) {
      setFormData({ ...formData, collections: currentCols.filter((c) => c !== colKey) });
    } else {
      setFormData({ ...formData, collections: [...currentCols, colKey] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        category: formData.category,
        brand: formData.brand,
        stock: Number(formData.stock),
        images: formData.images
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        tags: formData.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        featured: formData.featured,
        collections: formData.collections.length > 0 ? formData.collections : ['shop-all'],
      };

      if (isEditing) {
        await api.put(`/admin/products/${product._id}`, payload);
        toast.success('Product updated successfully.');
      } else {
        await api.post('/admin/products', payload);
        toast.success('Product added to catalog.');
      }

      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)',
        }}
      />

      <div
        className="admin-modal-container"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-modal)',
          padding: '2rem',
          zIndex: 1101,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} color="var(--accent)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {isEditing ? 'Edit Catalog Product' : 'Add New Product'}
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ border: 'none', background: 'transparent' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Product Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="e.g. TitanBook Pro 16"
            />
          </div>

          <div className="admin-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="select-field"
              >
                <option value="electronics">Electronics</option>
                <option value="audio">Audio</option>
                <option value="fashion">Fashion</option>
                <option value="home">Home & Kitchen</option>
                <option value="fitness">Fitness</option>
                <option value="beauty">Beauty</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Brand Name *</label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="input-field"
                placeholder="e.g. LuminaAudio"
              />
            </div>
          </div>

          <div className="admin-modal-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input-field"
                placeholder="199.00"
              />
            </div>

            <div className="input-group">
              <label className="input-label">MSRP / Original Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                className="input-field"
                placeholder="249.00"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Stock Units *</label>
              <input
                type="number"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="input-field"
                placeholder="25"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Image URLs (comma separated) *</label>
            <input
              type="text"
              required
              value={formData.images}
              onChange={(e) => setFormData({ ...formData, images: e.target.value })}
              className="input-field"
              placeholder="https://images.unsplash.com/..., https://..."
            />
          </div>

          <div className="input-group">
            <label className="input-label">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="input-field"
              placeholder="wireless, anc, studio"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Product Description *</label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              placeholder="Detailed technical and design specifications..."
            />
          </div>

          <div className="input-group" style={{ marginBottom: '1.25rem' }}>
            <label className="input-label" style={{ fontWeight: 750 }}>Assigned Store Sections / Collections</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', marginTop: '0.35rem' }}>
              {[
                { id: 'new-arrivals', label: 'New Arrivals' },
                { id: 'best-sellers', label: 'Best Sellers' },
                { id: 'trending', label: 'Trending' },
                { id: 'offers', label: 'Limited-Time Offers' },
                { id: 'featured', label: 'Featured' },
                { id: 'shop-all', label: 'Shop All' },
              ].map((col) => (
                <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.825rem', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.collections.includes(col.id)}
                    onChange={() => handleCollectionToggle(col.id)}
                    style={{ width: '15px', height: '15px', accentColor: 'var(--accent)' }}
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0 1.5rem' }}>
            <input
              type="checkbox"
              id="featured-check"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
            />
            <label htmlFor="featured-check" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
              Spotlight this product on Homepage
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
              <Save size={14} /> {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .admin-modal-grid-2,
          .admin-modal-grid-3 {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .admin-modal-container {
            padding: 1.25rem 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

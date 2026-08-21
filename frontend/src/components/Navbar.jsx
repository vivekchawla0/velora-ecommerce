import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  User,
  Heart,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Shield,
  Package,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { VeloraLogo } from './VeloraLogo';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItems, setIsDrawerOpen } = useCart();
  const { totalWishlistItems } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu and dropdown on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Shop All', path: '/products' },
    { label: 'New Arrivals', path: '/products?sort=newest' },
    { label: 'Best Sellers', path: '/products?sort=popular' },
    { label: 'For You', path: '/for-you' },
  ];

  const isLinkActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' && !location.search;
    }
    if (path === '/for-you') {
      return location.pathname === '/for-you';
    }
    if (path === '/products?sort=newest') {
      return location.pathname === '/products' && location.search.includes('sort=newest');
    }
    if (path === '/products?sort=popular') {
      return location.pathname === '/products' && location.search.includes('sort=popular');
    }
    if (path === '/products') {
      return (
        location.pathname === '/products' &&
        (!location.search ||
          location.search === '?page=1' ||
          (!location.search.includes('sort=newest') && !location.search.includes('sort=popular')))
      );
    }
    return location.pathname + location.search === path;
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#111111',
        borderBottom: '1px solid #222222',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Main Dark Header Bar */}
      <div className="container navbar-container">
        <div className="navbar-row">
          {/* 1. Left: Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
              <VeloraLogo variant="full" size="md" color="#FFFFFF" />
            </Link>
          </div>

          {/* 2. Center: Navigation Links (Desktop) */}
          <nav
            className="desktop-nav-links"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.75rem',
            }}
          >
            {navLinks.map((link) => {
              const active = isLinkActive(link.path);
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  style={{
                    fontSize: '0.885rem',
                    fontWeight: 600,
                    color: active ? '#FFFFFF' : '#B0B0AF',
                    letterSpacing: '0.01em',
                    transition: 'var(--transition-fast)',
                    position: 'relative',
                    padding: '0.35rem 0',
                  }}
                  className="nav-hover-link"
                >
                  {link.label}
                  {active && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '1px',
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 3. Center/Right: Integrated Search Bar */}
          <div
            className="desktop-search-container"
            style={{
              flex: '1',
              maxWidth: '380px',
              position: 'relative',
            }}
          >
            <form onSubmit={handleSearchSubmit} style={{ width: '100%' }}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Search
                  size={15}
                  color="#8A8A8A"
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search products, brands, styles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 2.25rem 0.55rem 2.4rem',
                    fontSize: '0.835rem',
                    borderRadius: 'var(--radius-full)',
                    background: '#222222',
                    border: '1px solid #333333',
                    color: '#FFFFFF',
                    outline: 'none',
                    transition: 'var(--transition-fast)',
                  }}
                  className="dark-nav-search"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    style={{
                      position: 'absolute',
                      right: '0.85rem',
                      color: '#8A8A8A',
                      padding: '2px',
                      display: 'flex',
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* 4. Right: Action Icons (Wishlist, Cart, Profile, Hamburger) */}
          <div className="navbar-actions">
            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              style={{
                position: 'relative',
                color: '#FFFFFF',
                padding: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'var(--transition-fast)',
              }}
              className="icon-button-dark"
              aria-label="Wishlist"
            >
              <Heart size={19} />
              {totalWishlistItems > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: 'var(--accent)',
                    color: '#FFFFFF',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  }}
                >
                  {totalWishlistItems}
                </span>
              )}
            </Link>

            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              style={{
                position: 'relative',
                color: '#FFFFFF',
                padding: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'var(--transition-fast)',
              }}
              className="icon-button-dark"
              aria-label="Shopping Cart"
            >
              <ShoppingBag size={19} />
              {totalItems > 0 && (
                <span
                  key={totalItems}
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: '#FFFFFF',
                    color: '#111111',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  }}
                  className="nav-cart-badge"
                >
                  {totalItems}
                </span>
              )}
            </button>

            {/* Profile Dropdown (Desktop) */}
            <div className="desktop-profile-wrapper" style={{ position: 'relative' }} ref={dropdownRef}>
              {isAuthenticated ? (
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    background: '#222222',
                    border: '1px solid #333333',
                    color: '#FFFFFF',
                    fontSize: '0.835rem',
                    fontWeight: 650,
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown size={13} color="#8A8A8A" />
                </button>
              ) : (
                <Link
                  to="/login"
                  style={{
                    color: '#FFFFFF',
                    padding: '0.45rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  className="icon-button-dark"
                  aria-label="Sign In"
                >
                  <User size={19} />
                </Link>
              )}

              {/* User Dropdown Menu */}
              {userDropdownOpen && isAuthenticated && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '210px',
                    background: '#FFFFFF',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-modal)',
                    padding: '0.5rem 0',
                    zIndex: 1000,
                  }}
                  className="user-dropdown-menu"
                >
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ fontWeight: 750, fontSize: '0.885rem', color: 'var(--text-primary)' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email}
                    </div>
                  </div>

                  <div style={{ padding: '0.35rem 0' }}>
                    <Link
                      to="/profile"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.6rem 1rem',
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                      }}
                      className="dropdown-item"
                    >
                      <User size={15} color="var(--text-muted)" /> Account Profile
                    </Link>

                    <Link
                      to="/orders"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.6rem 1rem',
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                      }}
                      className="dropdown-item"
                    >
                      <Package size={15} color="var(--text-muted)" /> Order History
                    </Link>

                    <Link
                      to="/for-you"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.6rem 1rem',
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                      }}
                      className="dropdown-item"
                    >
                      <Sparkles size={15} color="var(--accent)" /> Recommendations
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.6rem 1rem',
                          fontSize: '0.85rem',
                          color: 'var(--accent)',
                          fontWeight: 700,
                        }}
                        className="dropdown-item"
                      >
                        <Shield size={15} /> Admin Dashboard
                      </Link>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.35rem' }}>
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.6rem 1rem',
                        fontSize: '0.85rem',
                        color: '#B91C1C',
                        textAlign: 'left',
                      }}
                      className="dropdown-item"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-trigger"
              style={{
                display: 'none',
                color: '#FFFFFF',
                padding: '0.45rem',
              }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: '#111111',
            borderTop: '1px solid #222222',
            padding: '1.25rem 2rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
          className="mobile-drawer-content"
        >
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit}>
            <div style={{ position: 'relative' }}>
              <Search
                size={15}
                color="#8A8A8A"
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem 0.65rem 2.4rem',
                  fontSize: '0.885rem',
                  borderRadius: 'var(--radius-full)',
                  background: '#222222',
                  border: '1px solid #333333',
                  color: '#FFFFFF',
                  outline: 'none',
                }}
              />
            </div>
          </form>

          {/* Navigation links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: '1rem',
                  fontWeight: 650,
                  color: '#FFFFFF',
                  padding: '0.4rem 0',
                  borderBottom: '1px solid #222222',
                }}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontSize: '1rem',
                    fontWeight: 650,
                    color: '#FFFFFF',
                    padding: '0.4rem 0',
                    borderBottom: '1px solid #222222',
                  }}
                >
                  Account Profile
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontSize: '1rem',
                    fontWeight: 650,
                    color: '#FFFFFF',
                    padding: '0.4rem 0',
                    borderBottom: '1px solid #222222',
                  }}
                >
                  My Orders
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--accent)',
                      padding: '0.4rem 0',
                      borderBottom: '1px solid #222222',
                    }}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    textAlign: 'left',
                    fontSize: '0.95rem',
                    color: '#EF4444',
                    padding: '0.4rem 0',
                    fontWeight: 650,
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}

      <style>{`
        .navbar-container {
          padding: 0.85rem 2rem;
        }
        .navbar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          width: 100%;
        }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-shrink: 0;
        }
        .nav-hover-link {
          transition: color var(--transition-fast);
        }
        .nav-hover-link:hover {
          color: #FFFFFF !important;
        }
        .icon-button-dark {
          transition: all var(--transition-fast);
        }
        @media (hover: hover) and (pointer: fine) {
          .icon-button-dark:hover {
            background-color: #222222;
          }
        }
        .icon-button-dark:active {
          transform: scale(0.92);
        }
        .dark-nav-search {
          transition: all var(--transition-fast);
        }
        .dark-nav-search:focus {
          border-color: #555555 !important;
          background: #1A1A1A !important;
        }
        .dropdown-item {
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }
        .dropdown-item:hover {
          background-color: var(--bg-secondary);
        }
        .user-dropdown-menu {
          animation: dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mobile-drawer-content {
          animation: drawerSlideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-cart-badge {
          animation: badgePop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (max-width: 960px) {
          .navbar-container {
            padding: 0.75rem 1rem !important;
          }
          .navbar-row {
            gap: 0.65rem !important;
          }
          .navbar-actions {
            gap: 0.35rem !important;
          }
          .desktop-nav-links, .desktop-search-container, .desktop-profile-wrapper {
            display: none !important;
          }
          .mobile-menu-trigger {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
          }
        }
        @media (max-width: 480px) {
          .navbar-container {
            padding: 0.65rem 0.75rem !important;
          }
          .navbar-actions {
            gap: 0.25rem !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;

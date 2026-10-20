import React, { useState } from 'react';
import { FiArrowUpRight, FiLogOut, FiMenu, FiShoppingCart, FiX } from 'react-icons/fi';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { isAdminUser, useAuth } from '../contexts/AuthContext';
import './navbar.css';

const categories = [
  { label: 'Shop', path: '/shop' },
  { label: 'Kitchen', path: '/kitchen' },
  { label: 'Appliances', path: '/appliances' },
  { label: 'Others', path: '/others' },
];

const Navbar = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getTotalItems } = useCart();
  const { user, logout } = useAuth();
  const accountPath = isAdminUser(user) ? '/admin' : '/dashboard';
  const itemCount = getTotalItems();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/');
  };

  return (
    <>
      <header className="store-header">
        <nav className="navbar" aria-label="Main navigation">
          <Link to="/" className="brand-name" onClick={closeMobileMenu}>
            <span className="brand-mark">AV</span>
            <span className="brand-copy">
              <strong>Araire</strong>
              <small>VENTURES</small>
            </span>
          </Link>

          <div className="nav-links desktop-nav">
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Home</NavLink>
            {categories.map(({ label, path }) => (
              <NavLink key={path} to={path} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                {label}
              </NavLink>
            ))}
          </div>

          <div className="nav-right">
            <div className="nav-auth-actions">
              {user ? (
                <>
                  <Link to={accountPath} className="nav-auth-login">Dashboard</Link>
                  <button type="button" className="nav-auth-register" onClick={handleLogout}>
                    <FiLogOut /> Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-auth-login">Sign in</Link>
                  <Link to="/register" className="nav-auth-register">Sign up</Link>
                </>
              )}
            </div>

            <Link to="/cart" className="nav-icon cart-icon" aria-label={`Shopping cart, ${itemCount} items`}>
              <FiShoppingCart aria-hidden="true" />
              <span className="cart-label">Cart</span>
              {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
            </Link>

            <button
              className="hamburger"
              type="button"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            >
              {isMobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </nav>
      </header>

      <div
        className={`mobile-menu${isMobileMenuOpen ? ' active' : ''}`}
        aria-hidden={!isMobileMenuOpen}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeMobileMenu();
        }}
      >
        <div className="mobile-menu-content" id="mobile-navigation">
          <div className="mobile-menu-heading">
            <span>Explore Araire</span>
            <button type="button" className="mobile-close-btn" aria-label="Close menu" onClick={closeMobileMenu}>
              <FiX />
            </button>
          </div>
          <nav className="mobile-category-links" aria-label="Mobile navigation">
            <NavLink to="/" end onClick={closeMobileMenu}>Home <FiArrowUpRight /></NavLink>
            {categories.map(({ label, path }) => (
              <NavLink key={path} to={path} onClick={closeMobileMenu}>{label} <FiArrowUpRight /></NavLink>
            ))}
            <NavLink to="/cart" onClick={closeMobileMenu}>Shopping cart <FiShoppingCart /></NavLink>
          </nav>
          <div className="mobile-auth-links">
            {user ? (
              <>
                <Link className="nav-auth-login" to={accountPath} onClick={closeMobileMenu}>Dashboard</Link>
                <button className="nav-auth-register" type="button" onClick={handleLogout}><FiLogOut /> Log out</button>
              </>
            ) : (
              <>
                <Link className="nav-auth-login" to="/login" onClick={closeMobileMenu}>Sign in</Link>
                <Link className="nav-auth-register" to="/register" onClick={closeMobileMenu}>Sign up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;

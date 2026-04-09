import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import './navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getTotalItems } = useCart();

  const handleNavClick = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="brand-name">Araire Ventures</Link>

        {/* Desktop Navigation */}
        <div className="nav-links desktop-nav">
          <span onClick={() => handleNavClick('/kitchen')} className="nav-link">Kitchen</span>
          <span onClick={() => handleNavClick('/appliances')} className="nav-link">Appliances</span>
          <span onClick={() => handleNavClick('/others')} className="nav-link">Others</span>
        </div>

        {/* ✅ Icons + hamburger wrapped together on the right */}
        <div className="nav-right">
          <div className="nav-icons">
            <span
              className="nav-icon cart-icon"
              onClick={() => handleNavClick('/cart')}
            >
              🛒
              {getTotalItems() > 0 && (
                <span className="cart-count">{getTotalItems()}</span>
              )}
            </span>
            <span className="nav-icon">👤</span>
          </div>

          {/* Hamburger — only visible on mobile */}
          <div className="hamburger" onClick={toggleMobileMenu}>
            <span className={`bar ${isMobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`bar ${isMobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`bar ${isMobileMenuOpen ? 'open' : ''}`}></span>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={toggleMobileMenu}
      >
        <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
          <button className="mobile-close-btn" onClick={toggleMobileMenu}>✕</button>

          <div className="mobile-home-section">
            <button className="mobile-home-btn" onClick={() => handleNavClick('/')}>
              🏠 Home
            </button>
          </div>

          <div className="mobile-categories-section">
            <h3 className="mobile-section-title">Shop by Category</h3>
            <div className="mobile-categories">
              <div className="mobile-category-item">
                <span className="mobile-category-name">Kitchen</span>
                <button className="mobile-explore-btn" onClick={() => handleNavClick('/kitchen')}>Explore</button>
              </div>
              <div className="mobile-category-item">
                <span className="mobile-category-name">Appliances</span>
                <button className="mobile-explore-btn" onClick={() => handleNavClick('/appliances')}>Explore</button>
              </div>
              <div className="mobile-category-item">
                <span className="mobile-category-name">Others</span>
                <button className="mobile-explore-btn" onClick={() => handleNavClick('/others')}>Explore</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
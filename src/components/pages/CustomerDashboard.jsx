import React from 'react';
import { FiArrowUpRight, FiLogOut, FiUser } from 'react-icons/fi';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isAdminUser, useAuth } from '../../contexts/AuthContext';
import './CustomerDashboard.css';

function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="customer-dashboard">
      <header className="customer-dashboard-nav">
        <Link to="/" className="customer-dashboard-brand">Araire Ventures</Link>
        <nav aria-label="Customer dashboard navigation">
          <Link to="/">Storefront <FiArrowUpRight /></Link>
          <button type="button" onClick={handleLogout}><FiLogOut /> Log out</button>
        </nav>
      </header>

      <section className="customer-dashboard-content">
        <p className="customer-dashboard-eyebrow">CUSTOMER ACCOUNT</p>
        <h1>Welcome{user?.name ? `, ${user.name}` : ' back'}.</h1>
        <p className="customer-dashboard-intro">View your account details and continue exploring the store.</p>

        <article className="customer-account-card">
          <span className="customer-account-icon"><FiUser /></span>
          <div>
            <p className="customer-account-label">ACCOUNT DETAILS</p>
            <h2>{user?.name || user?.fullName || 'Customer'}</h2>
            <p>{user?.email || 'No email address provided'}</p>
          </div>
        </article>

        <div className="customer-shop-links">
          <Link to="/kitchen">Explore Kitchen <FiArrowUpRight /></Link>
          <Link to="/appliances">Explore Appliances <FiArrowUpRight /></Link>
          <Link to="/others">Explore Others <FiArrowUpRight /></Link>
        </div>
      </section>
    </main>
  );
}

export function ProtectedCustomerRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (isAdminUser(user)) return <Navigate to="/admin" replace />;
  return user
    ? children
    : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export default CustomerDashboard;

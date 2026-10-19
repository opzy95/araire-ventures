import React, { useState } from 'react';
import { FiArrowLeft, FiLock, FiMail, FiUser } from 'react-icons/fi';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isAdminUser, useAuth } from '../../contexts/AuthContext';
import './AdminAuth.css';

function AdminAuth({ mode }) {
  const isRegister = mode === 'register';
  const { user, login, register, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.message || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isRegister && user && isAdminUser(user)) return <Navigate to="/admin" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
        setNotice('Account created. Sign in to continue.');
        navigate('/admin/login', { replace: true, state: { message: 'Account created. Sign in to continue.' } });
      } else {
        const session = await login({ email: form.email.trim(), password: form.password });
        if (!isAdminUser(session.user)) {
          logout();
          throw new Error('This account does not have administrator access.');
        }
        navigate('/admin', { replace: true });
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to complete your request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="admin-auth-page">
      <Link to="/" className="auth-back-link"><FiArrowLeft /> Storefront</Link>
      <section className="admin-auth-shell">
        <div className="admin-auth-brand">
          <span className="auth-monogram">AV</span>
          <p className="auth-brand-label">ARAIRE VENTURES</p>
          <h1>{isRegister ? 'Create your account.' : 'Welcome back.'}</h1>
          <p className="auth-brand-copy">{isRegister ? 'Join the Araire Ventures community.' : 'Sign in to manage your store.'}</p>
        </div>

        <div className="admin-auth-form-panel">
          <div className="auth-form-heading">
            <p className="auth-form-kicker">{isRegister ? 'CUSTOMER ACCOUNT' : 'ADMINISTRATOR ACCESS'}</p>
            <h2>{isRegister ? 'Register' : 'Sign in'}</h2>
            <p>{isRegister ? 'Create an account to continue.' : 'Use your seeded administrator account.'}</p>
          </div>

          {error && <div className="auth-message auth-error" role="alert">{error}</div>}
          {notice && <div className="auth-message auth-notice" role="status">{notice}</div>}

          <form className="admin-auth-form" onSubmit={submit}>
            {isRegister && (
              <label className="auth-field">
                <span>Full name</span>
                <span className="auth-input-wrap"><FiUser /><input autoComplete="name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></span>
              </label>
            )}
            <label className="auth-field">
              <span>Email address</span>
              <span className="auth-input-wrap"><FiMail /><input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></span>
            </label>
            <label className="auth-field">
              <span>Password</span>
              <span className="auth-input-wrap"><FiLock /><input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : undefined} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></span>
              {isRegister && <small>Use at least 8 characters.</small>}
            </label>
            <button className="auth-submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch-link">
            {isRegister ? 'Already registered?' : 'Need a customer account?'}{' '}
            <Link to={isRegister ? '/admin/login' : '/register'}>{isRegister ? 'Sign in' : 'Register'}</Link>
          </p>
          {!isRegister && user && (
            <button className="auth-signout-link" onClick={logout}>Sign out of current session</button>
          )}
        </div>
      </section>
    </main>
  );
}

export default AdminAuth;

export function ProtectedAdminRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  return isAdminUser(user)
    ? children
    : <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
}
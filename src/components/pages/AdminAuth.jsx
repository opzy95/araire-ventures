import React, { useState } from 'react';
import { FiArrowLeft, FiEye, FiEyeOff, FiLock, FiMail, FiUser } from 'react-icons/fi';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isAdminUser, useAuth } from '../../contexts/AuthContext';
import './AdminAuth.css';

function AdminAuth({ mode }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.message || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const requestedPath = typeof location.state?.from === 'string'
    ? location.state.from
    : location.state?.from?.pathname;
  const customerDestination = [
    '/',
    '/shop',
    '/kitchen',
    '/appliances',
    '/others',
    '/cart',
    '/dashboard',
  ].includes(requestedPath) ? requestedPath : '/dashboard';
  const customerRedirect = location.state?.continueCheckout
    ? { pathname: '/cart', state: { openCheckout: true } }
    : customerDestination;

  if (user) return <Navigate to={isAdminUser(user) ? '/admin' : customerRedirect} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
        setNotice('Account created. Sign in to continue.');
        navigate('/login', {
          replace: true,
          state: { ...location.state, message: 'Account created. Sign in to continue.' },
        });
      } else {
        const session = await login({ email: form.email.trim(), password: form.password });
        navigate(isAdminUser(session.user) ? '/admin' : customerRedirect, { replace: true });
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
          <p className="auth-brand-copy">{isRegister ? 'Join the Araire Ventures community.' : 'Sign in and continue to your account dashboard.'}</p>
        </div>

        <div className="admin-auth-form-panel">
          <div className="auth-form-heading">
            <p className="auth-form-kicker">{isRegister ? 'CUSTOMER ACCOUNT' : 'ACCOUNT ACCESS'}</p>
            <h2>{isRegister ? 'Register' : 'Sign in'}</h2>
            <p>{isRegister ? 'Create an account to continue.' : 'Your role will take you to the right dashboard.'}</p>
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
              <span className="auth-input-wrap">
                <FiLock />
                <input type={isPasswordVisible ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : undefined} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                <button
                  className="auth-password-toggle"
                  type="button"
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  aria-pressed={isPasswordVisible}
                  onClick={() => setIsPasswordVisible((visible) => !visible)}
                >
                  {isPasswordVisible ? <FiEyeOff /> : <FiEye />}
                </button>
              </span>
              {isRegister && <small>Use at least 8 characters.</small>}
            </label>
            <button className="auth-submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch-link">
            {isRegister ? 'Already registered?' : 'New to Araire Ventures?'}{' '}
            <Link
              to={isRegister ? '/login' : '/register'}
              state={isRegister ? location.state : undefined}
            >
              {isRegister ? 'Sign in' : 'Sign up'}
            </Link>
          </p>
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
    : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
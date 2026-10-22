import React, { useState } from 'react';
import { FiArrowLeft, FiEye, FiEyeOff, FiLock, FiMail, FiUser } from 'react-icons/fi';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isAdminUser, useAuth } from '../../contexts/AuthContext';
import { apiRequest, authEndpoints } from '../../services/api';
import './AdminAuth.css';

function AdminAuth({ mode }) {
  const isRegister = mode === 'register';
  const isAdminLogin = mode === 'admin-login';
  const isForgotPassword = mode === 'forgot-password';
  const isResetPassword = mode === 'reset-password';
  const isPasswordRecovery = isForgotPassword || isResetPassword;
  const { user, login, register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: location.state?.email || '',
    code: '',
    password: '',
    confirmPassword: '',
  });
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
    if ((isRegister || isResetPassword) && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
        setNotice('Account created. Sign in to continue.');
        navigate('/login', {
          replace: true,
          state: { ...location.state, message: 'Account created. Sign in to continue.' },
        });
      } else if (isForgotPassword) {
        const response = await apiRequest(authEndpoints.forgotPassword, {
          method: 'POST',
          body: { email: form.email.trim() },
        });
        const resetNotice = typeof response === 'string'
          ? response
          : response?.message || 'Password reset code sent to your email.';
        navigate('/reset-password', {
          replace: true,
          state: {
            email: form.email.trim(),
            message: resetNotice,
          },
        });
      } else if (isResetPassword) {
        await apiRequest(authEndpoints.resetPassword, {
          method: 'POST',
          body: {
            email: form.email.trim(),
            code: form.code.trim(),
            password: form.password,
            confirmPassword: form.confirmPassword,
          },
        });
        navigate('/login', {
          replace: true,
          state: { message: 'Password reset. Sign in with your new password.' },
        });
      } else {
        const session = await login({ email: form.email.trim(), password: form.password });
        navigate(isAdminUser(session.user) ? '/admin' : customerRedirect, { replace: true });
      }
    } catch (requestError) {
      setError(isForgotPassword
        ? requestError.apiMessage || requestError.message || 'Unable to send a password reset code.'
        : requestError.message || 'Unable to complete your request.');
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
          <h1>{isRegister ? 'Create your account.' : isPasswordRecovery ? 'Reset your password.' : isAdminLogin ? 'Administrator access.' : 'Welcome back.'}</h1>
          <p className="auth-brand-copy">
            {isRegister
              ? 'Join the Araire Ventures community.'
              : isPasswordRecovery
                ? 'Recover access to your Araire Ventures account.'
                  : isAdminLogin
                    ? 'Sign in to manage the Araire Ventures store.'
                : 'Sign in and continue to your account dashboard.'}
          </p>
        </div>

        <div className="admin-auth-form-panel">
          <div className="auth-form-heading">
            <p className="auth-form-kicker">
              {isRegister ? 'CUSTOMER ACCOUNT' : isPasswordRecovery ? 'ACCOUNT RECOVERY' : isAdminLogin ? 'ADMIN ACCESS' : 'ACCOUNT ACCESS'}
            </p>
            <h2>
              {isRegister ? 'Register' : isForgotPassword ? 'Get a reset code' : isResetPassword ? 'Choose a new password' : isAdminLogin ? 'Admin sign in' : 'Sign in'}
            </h2>
            <p>
              {isRegister
                ? 'Create an account to continue.'
                : isForgotPassword
                  ? 'Enter your email and we’ll send a one-time code.'
                  : isResetPassword
                    ? 'Enter the code from your email and choose a new password.'
                    : isAdminLogin
                      ? 'Use your administrator credentials to continue.'
                      : 'Your role will take you to the right dashboard.'}
            </p>
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
            {!isResetPassword && (
              <label className="auth-field">
                <span>Email address</span>
                <span className="auth-input-wrap"><FiMail /><input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></span>
              </label>
            )}
            {isResetPassword && (
              <>
                <label className="auth-field">
                  <span>Email address</span>
                  <span className="auth-input-wrap"><FiMail /><input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></span>
                </label>
                <label className="auth-field">
                  <span>Reset code</span>
                  <span className="auth-input-wrap"><FiLock /><input inputMode="numeric" autoComplete="one-time-code" required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} /></span>
                </label>
              </>
            )}
            {!isForgotPassword && (
              <>
                <label className="auth-field">
                  <span>Password</span>
                  <span className="auth-input-wrap">
                    <FiLock />
                    <input type={isPasswordVisible ? 'text' : 'password'} autoComplete={isRegister || isResetPassword ? 'new-password' : 'current-password'} minLength={isRegister || isResetPassword ? 8 : undefined} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
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
                  {(isRegister || isResetPassword) && <small>Use at least 8 characters.</small>}
                </label>
                {(isRegister || isResetPassword) && (
                  <label className="auth-field">
                    <span>Confirm password</span>
                    <span className="auth-input-wrap"><FiLock /><input type="password" autoComplete="new-password" minLength={8} required value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></span>
                  </label>
                )}
              </>
            )}
            <button className="auth-submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Please wait…'
                : isRegister
                  ? 'Create account'
                  : isForgotPassword
                    ? 'Send reset code'
                    : isResetPassword
                      ? 'Reset password'
                      : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch-link">
            {isRegister
              ? <>Already registered? <Link to="/login">Sign in</Link></>
              : isPasswordRecovery
                ? <>Remembered your password? <Link to="/login">Sign in</Link></>
                : isAdminLogin
                  ? 'Administrator account required.'
                  : <>New to Araire Ventures? <Link to="/register">Sign up</Link></>}
          </p>
          {isResetPassword && (
            <p className="auth-admin-link"><Link to="/forgot-password" state={{ email: form.email }}>Send a new code</Link></p>
          )}
          {!isRegister && !isAdminLogin && !isPasswordRecovery && (
            <p className="auth-admin-link"><Link to="/forgot-password">Forgot password?</Link></p>
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
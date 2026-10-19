/* eslint react-refresh/only-export-components: off */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, authEndpoints } from '../services/api';

const AuthContext = createContext(null);
const SESSION_KEY = 'araire-auth-session';

function getAuthResult(payload) {
  const result = payload?.data ?? payload ?? {};
  const user = result.user ?? result.profile ?? result;
  const token = result.token ?? result.accessToken ?? result.access_token;
  return { user, token };
}

export function isAdminUser(user) {
  const role = String(user?.role ?? user?.userType ?? '').toLowerCase();
  const roles = Array.isArray(user?.roles) ? user.roles.map((item) => String(item).toLowerCase()) : [];
  return role === 'admin' || roles.includes('admin') || user?.isAdmin === true;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (session?.token) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  }, [session]);

  const login = async (credentials) => {
    const payload = await apiRequest(authEndpoints.login, { method: 'POST', body: credentials });
    const nextSession = getAuthResult(payload);
    if (!nextSession.token || !nextSession.user) {
      throw new Error('The login response must include a user and an access token.');
    }
    setSession(nextSession);
    return nextSession;
  };

  const register = (details) =>
    apiRequest(authEndpoints.register, { method: 'POST', body: details });

  const logout = () => setSession(null);

  return (
    <AuthContext.Provider value={{
      user: session?.user ?? null,
      token: session?.token ?? null,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
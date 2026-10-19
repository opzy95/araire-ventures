const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://araire-backend.onrender.com';

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}${path}`, {
    method,
    headers: {
      ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
  });

  const responseText = await response.text();
  let payload = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = { message: responseText };
    }
  }

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Request failed (${response.status})`);
  }

  return payload;
}

export const authEndpoints = {
  login: import.meta.env.VITE_AUTH_LOGIN_PATH || '/api/auth/login',
  register: import.meta.env.VITE_AUTH_REGISTER_PATH || '/api/auth/register',
  users: import.meta.env.VITE_USERS_PATH || '/api/users',
  products: import.meta.env.VITE_PRODUCTS_PATH || '/api/products',
};
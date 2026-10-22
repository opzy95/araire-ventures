const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://araire-backend.onrender.com/api').replace(/\/+$/, '');

function endpoint(path, fallback) {
  const value = import.meta.env[path] || fallback;
  return `${apiBaseUrl}${value.startsWith('/') ? value : `/${value}`}`;
}

export const authEndpoints = {
  login: endpoint('VITE_AUTH_LOGIN_PATH', '/auth/login'),
  register: endpoint('VITE_AUTH_REGISTER_PATH', '/auth/register'),
  forgotPassword: endpoint('VITE_AUTH_FORGOT_PASSWORD_PATH', '/auth/forgot-password'),
  resetPassword: endpoint('VITE_AUTH_RESET_PASSWORD_PATH', '/auth/reset-password'),
  users: endpoint('VITE_USERS_PATH', '/users'),
  products: endpoint('VITE_PRODUCTS_PATH', '/products'),
  cart: endpoint('VITE_CART_PATH', '/cart'),
  cartItems: `${endpoint('VITE_CART_PATH', '/cart')}/items`,
  orders: endpoint('VITE_ORDERS_PATH', '/orders'),
  myOrders: `${endpoint('VITE_ORDERS_PATH', '/orders')}/my-orders`,
};

export async function apiRequest(url, { method = 'GET', body, token, headers = {} } = {}) {
  const requestHeaders = new Headers(headers);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (token) requestHeaders.set('Authorization', `Bearer ${token}`);
  if (body !== undefined && !isFormData && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    ...(body === undefined ? {} : { body: isFormData ? body : JSON.stringify(body) }),
  });

  const responseText = await response.text();
  let payload = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = responseText;
    }
  }

  if (!response.ok) {
    const reason = typeof payload === 'string'
      ? payload
      : payload?.message || payload?.error || response.statusText || 'Unknown API error.';
    const error = new Error(`${method} ${url} failed (${response.status}): ${reason}`);
    error.status = response.status;
    error.apiMessage = reason;
    throw error;
  }

  return payload;
}
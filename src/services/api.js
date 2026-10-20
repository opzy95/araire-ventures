const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://araire-backend.onrender.com/api').replace(/\/+$/, '');

function endpoint(path, fallback) {
  const value = import.meta.env[path] || fallback;
  return `${apiBaseUrl}${value.startsWith('/') ? value : `/${value}`}`;
}

export const authEndpoints = {
  login: endpoint('VITE_AUTH_LOGIN_PATH', '/auth/login'),
  register: endpoint('VITE_AUTH_REGISTER_PATH', '/auth/register'),
  users: endpoint('VITE_USERS_PATH', '/users'),
  products: endpoint('VITE_PRODUCTS_PATH', '/products'),
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
    const message = typeof payload === 'string'
      ? payload
      : payload?.message || payload?.error || `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload;
}
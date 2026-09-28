const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('grocery_token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('grocery_token');
      localStorage.removeItem('grocery_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

async function adminRequest(endpoint, options = {}) {
  const adminToken = localStorage.getItem('grocery_admin_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('grocery_admin_token');
    }
    throw new Error(data.error || 'Admin request failed');
  }

  return data;
}

export const api = {
  // Auth
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  requestOtp: (email) => request('/auth/request-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOtpChangePassword: (data) => request('/auth/verify-otp-password', { method: 'POST', body: JSON.stringify(data) }),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),

  // Cart
  getCart: () => request('/cart'),
  addToCart: (productId, quantity = 1) => request('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  updateCartItem: (id, quantity) => request(`/cart/${id}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeCartItem: (id) => request(`/cart/${id}`, { method: 'DELETE' }),
  clearCart: () => request('/cart', { method: 'DELETE' }),

  // Orders
  placeOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: () => request('/orders'),
  getOrder: (id) => request(`/orders/${id}`),

  // Mandatory Pages
  getPage: (slug) => request(`/pages/${slug}`),
  getAllPages: () => request('/pages'),

  // Feedback
  submitFeedback: (data) => request('/feedback', { method: 'POST', body: JSON.stringify(data) }),
  getAdminFeedbacks: () => adminRequest('/feedback'),

  // Admin
  adminLogin: (credentials) => request('/admin/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getAdminDashboard: () => adminRequest('/admin/dashboard'),
  getAdminOrderDetails: (id) => adminRequest(`/admin/orders/${id}`),
  getAdminSettings: () => adminRequest('/admin/settings'),
  updateAdminSettings: (data) => adminRequest('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
  updateProductStock: (id, data) => adminRequest(`/admin/products/${id}/stock`, { method: 'PUT', body: JSON.stringify(data) }),
};

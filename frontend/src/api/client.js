// Centralized API Client for BookLoop AI Second-Hand Marketplace

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export const getAuthToken = () => localStorage.getItem('bookloop_token');
export const setAuthToken = (token) => localStorage.setItem('bookloop_token', token);
export const removeAuthToken = () => localStorage.removeItem('bookloop_token');

export const getUserPincode = () => localStorage.getItem('bookloop_pincode') || '560001';
export const setUserPincode = (pin) => localStorage.setItem('bookloop_pincode', pin);

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMsg = 'An unexpected error occurred.';
    if (data && data.detail) {
      if (Array.isArray(data.detail)) {
        errorMsg = data.detail.map(d => d.msg || d.message).join(', ');
      } else {
        errorMsg = data.detail;
      }
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Authentication
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  register: (payload) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getMe: () => request('/auth/me'),
  updateProfile: (payload) => request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  updatePreferences: (payload) => request('/auth/preferences', {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),

  // Books & Marketplace
  getCategories: () => request('/books/categories'),
  getBooks: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.category_id) q.append('category_id', params.category_id);
    if (params.condition && params.condition !== 'All') q.append('condition', params.condition);
    if (params.min_price !== undefined && params.min_price !== '') q.append('min_price', params.min_price);
    if (params.max_price !== undefined && params.max_price !== '') q.append('max_price', params.max_price);
    if (params.min_discount !== undefined && params.min_discount !== '') q.append('min_discount', params.min_discount);
    if (params.sort_by) q.append('sort_by', params.sort_by);
    if (params.available_only !== undefined) q.append('available_only', params.available_only);
    if (params.limit) q.append('limit', params.limit);
    if (params.offset) q.append('offset', params.offset);
    return request(`/books?${q.toString()}`);
  },
  getBookDetails: (id) => request(`/books/${id}`),
  getMyBookshelf: () => request('/books/my/bookshelf'),
  createBook: (payload) => request('/books', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateBook: (id, payload) => request(`/books/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  deleteBook: (id) => request(`/books/${id}`, {
    method: 'DELETE'
  }),
  getCuratedDeals: (minDiscount = 40, limit = 8) => request(`/books/curated/deals?min_discount=${minDiscount}&limit=${limit}`),
  getCuratedBudget: (maxPrice = 200, limit = 8) => request(`/books/curated/budget?max_price=${maxPrice}&limit=${limit}`),
  getCuratedNearby: (pincode = '560001', limit = 8) => request(`/books/curated/nearby?pincode=${encodeURIComponent(pincode)}&limit=${limit}`),
  getSimilarBooks: (bookId, limit = 4) => request(`/books/${bookId}/similar?limit=${limit}`),

  // Delivery & Distance Estimator
  estimateDelivery: (payload) => request('/delivery/estimate', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  lookupPincode: (pincode) => request(`/delivery/pincode-lookup/${pincode}`),

  // Orders & E-Commerce
  createOrder: (payload) => request('/orders', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getMyOrders: () => request('/orders/my-orders'),
  getMySales: () => request('/orders/my-sales'),
  getOrderDetails: (id) => request(`/orders/${id}`),
  updateOrderStatus: (orderId, status) => request(`/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),

  // Wishlist
  toggleWishlist: (bookId) => request(`/wishlist/toggle/${bookId}`, {
    method: 'POST'
  }),
  getWishlist: () => request('/wishlist'),

  // Reviews & Ratings
  createReview: (payload) => request('/reviews', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getSellerReviews: (sellerId) => request(`/reviews/seller/${sellerId}`),
  getBookReviews: (bookId) => request(`/reviews/book/${bookId}`),

  // Delivery Addresses
  getAddresses: () => request('/addresses'),
  createAddress: (payload) => request('/addresses', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  deleteAddress: (id) => request(`/addresses/${id}`, {
    method: 'DELETE'
  }),

  // AI Intelligence & Pricing
  chatWithAI: (message, sessionId = null, buyerPincode = null) => request('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      session_id: sessionId,
      buyer_pincode: buyerPincode
    })
  }),
  recommendPrice: (payload) => request('/ai/recommend-price', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getCuratedShelves: (pincode = '560001') => request(`/ai/shelves?pincode=${encodeURIComponent(pincode)}`),
  getRecommendations: (limit = 6) => request(`/ai/recommendations?limit=${limit}`),

  // Exchanges (Preserved for compatibility)
  createExchange: (payload) => request('/exchanges', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getIncomingExchanges: () => request('/exchanges/incoming'),
  getOutgoingExchanges: () => request('/exchanges/outgoing'),
  acceptExchange: (id) => request(`/exchanges/${id}/accept`, { method: 'POST' }),
  rejectExchange: (id) => request(`/exchanges/${id}/reject`, { method: 'POST' }),
  cancelExchange: (id) => request(`/exchanges/${id}/cancel`, { method: 'POST' }),
  completeExchange: (id) => request(`/exchanges/${id}/complete`, { method: 'POST' }),

  // Credits
  getCreditBalance: () => request('/credits/balance'),
  getTransactions: () => request('/credits/transactions'),

  // Admin
  getStats: () => request('/admin/stats'),
  getAllUsers: () => request('/admin/users'),
  getAllOrders: () => request('/admin/orders'),
  getDeliveryRules: () => request('/admin/delivery-rules'),
  updateDeliveryRules: (payload) => request('/admin/delivery-rules', {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  adjustCredits: (userId, amount, reason) => request(`/admin/users/${userId}/credits?amount=${amount}&reason=${encodeURIComponent(reason)}`, {
    method: 'POST'
  }),

  // Users
  getPublicProfile: (userId) => request(`/users/${userId}/public-profile`),
  healthCheck: () => request('/health')
};

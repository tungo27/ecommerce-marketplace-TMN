const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
};

export const adminApi = {
  // Dashboard
  getStats: () =>
    fetch(`${API_BASE}/admin/stats`, { headers: getHeaders() }).then(handleResponse),

  // Audit Logs
  getAuditLogs: (page = 1, limit = 20) =>
    fetch(`${API_BASE}/admin/audit-logs?page=${page}&limit=${limit}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  // Product Moderation
  forceHideProduct: (productId: string) =>
    fetch(`${API_BASE}/admin/products/${productId}/force-hide`, {
      method: 'PATCH',
      headers: getHeaders(),
    }).then(handleResponse),

  // User Management
  getUsers: (role?: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (role) params.set('role', role);
    return fetch(`${API_BASE}/admin/users?${params}`, { headers: getHeaders() }).then(handleResponse);
  },

  toggleUserBan: (userId: string, isActive: boolean) =>
    fetch(`${API_BASE}/admin/users/${userId}/ban`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ isActive }),
    }).then(handleResponse),

  getSellerProfile: (sellerId: string) =>
    fetch(`${API_BASE}/admin/sellers/${sellerId}/profile`, {
      headers: getHeaders(),
    }).then(handleResponse),

  // Order Management
  getAllOrders: (params: { search?: string; status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.status) q.set('status', params.status);
    q.set('page', String(params.page ?? 1));
    q.set('limit', String(params.limit ?? 20));
    return fetch(`${API_BASE}/admin/orders?${q}`, { headers: getHeaders() }).then(handleResponse);
  },

  forceCancelOrder: (orderId: string) =>
    fetch(`${API_BASE}/admin/orders/${orderId}/force-cancel`, {
      method: 'PATCH',
      headers: getHeaders(),
    }).then(handleResponse),

  // Transactions
  getTransactions: (params: { type?: string; status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params.type) q.set('type', params.type);
    if (params.status) q.set('status', params.status);
    q.set('page', String(params.page ?? 1));
    q.set('limit', String(params.limit ?? 20));
    return fetch(`${API_BASE}/admin/transactions?${q}`, { headers: getHeaders() }).then(handleResponse);
  },

  // Review Moderation
  getAllReviews: (page = 1, limit = 20) =>
    fetch(`${API_BASE}/admin/reviews?page=${page}&limit=${limit}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  toggleReviewVisibility: (reviewId: string) =>
    fetch(`${API_BASE}/admin/reviews/${reviewId}/toggle-hide`, {
      method: 'PATCH',
      headers: getHeaders(),
    }).then(handleResponse),

  // Pending products (reuse existing endpoint)
  getPendingProducts: (page = 1, limit = 20) =>
    fetch(`${API_BASE}/admin/products/pending?page=${page}&limit=${limit}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  getAllProducts: (page = 1, limit = 20) =>
    fetch(`${API_BASE}/admin/products?page=${page}&limit=${limit}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  reviewProduct: (productId: string, action: 'APPROVE' | 'REJECT') =>
    fetch(`${API_BASE}/admin/products/${productId}/review`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ action }),
    }).then(handleResponse),

  // Category Management
  getCategories: () =>
    fetch(`${API_BASE}/categories/admin`, {
      headers: getHeaders(),
    }).then(handleResponse),

  createCategory: (data: { name: string; description?: string }) =>
    fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  updateCategory: (id: string, data: { name?: string; description?: string; isActive?: boolean }) =>
    fetch(`${API_BASE}/categories/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  deleteCategory: (id: string) =>
    fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),

  // CMS Management
  getStorefrontConfig: () =>
    fetch(`${API_BASE}/cms/storefront`, {
      headers: getHeaders(),
    }).then(handleResponse),

  updateStorefrontConfig: (data: any) =>
    fetch(`${API_BASE}/cms/storefront`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  // Dispute Management
  getDisputes: () =>
    fetch(`${API_BASE}/disputes`, {
      headers: getHeaders(),
    }).then(handleResponse),

  getDisputeDetails: (id: string) =>
    fetch(`${API_BASE}/disputes/${id}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  sendDisputeMessage: (id: string, message: string) =>
    fetch(`${API_BASE}/disputes/${id}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message }),
    }).then(handleResponse),

  resolveDispute: (id: string, status: 'IN_REVIEW' | 'RESOLVED_REFUND' | 'RESOLVED_REJECT') =>
    fetch(`${API_BASE}/disputes/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    }).then(handleResponse),
};

import axios from 'axios';

const normalizeApiBaseUrl = (value?: string) => {
  const raw = (value || 'http://localhost:4000').trim().replace(/\/+$/, '');
  return raw.endsWith('/api') ? raw : `${raw}/api`;
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and user data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      // Redirect to login (assuming backoffice uses /seller/login or similar)
      window.location.href = '/seller/login';
    }
    return Promise.reject(error);
  }
);

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: 'SELLER' | 'CUSTOMER';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export const authApi = {
  register: (data: RegisterPayload) => apiClient.post<User>('/auth/register', data),
  login: (email: string, password: string) => 
    apiClient.post<LoginResponse>('/auth/login', { email, password }),
};

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  status: string;
  seller: {
    name: string;
    email: string;
  };
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminProductApi = {
  getPendingProducts: (page: number = 1, limit: number = 10) => 
    apiClient.get<PaginatedProducts>('/admin/products/pending', { params: { page, limit } }),
  reviewProduct: (id: string, action: 'APPROVE' | 'REJECT') =>
    apiClient.patch(`/admin/products/${id}/review`, { action }),
};

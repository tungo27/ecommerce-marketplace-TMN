import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the token
apiClient.interceptors.request.use((config) => {
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('accessToken');
  }
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: 'CUSTOMER';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export const authApi = {
  register: (data: RegisterPayload) => apiClient.post<User>('/auth/register', data),
  login: (data: LoginPayload) => apiClient.post<LoginResponse>('/auth/login', data),
};

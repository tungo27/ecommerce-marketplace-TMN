import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

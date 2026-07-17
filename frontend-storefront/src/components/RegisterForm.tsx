'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthForm } from './AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { authApi, RegisterPayload } from '@/utils/api';
import { useToastStore } from '@/hooks/useToastStore';

export const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [retryAfter, setRetryAfter] = useState<number>(0);
  const { isLoading, error, setLoading, setError, setUser } = useAuth();
  const { showToast } = useToastStore();
  const router = useRouter();

  // Đếm ngược thời gian chờ khi bị Rate Limit (NFR UX)
  useEffect(() => {
    if (retryAfter <= 0) return;

    showToast(`Too many attempts. Please try again in ${retryAfter}s...`, 'error');

    const timer = setTimeout(() => {
      setRetryAfter(retryAfter - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [retryAfter, showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name) {
      errors.name = 'Name is required';
    }
    if (!formData.email) {
      errors.email = 'Email is required';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (retryAfter > 0) return;

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload: RegisterPayload = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: 'CUSTOMER',
      };

      const response = await authApi.register(payload);
      setUser(response.data);
      setLoading(false);
      showToast('Account registered successfully. Please sign in.', 'success');
      router.push('/login');
    } catch (err: any) {
      setLoading(false);
      const data = err.response?.data;

      if (err.response?.status === 429) {
        const seconds = data?.retryAfter || 60;
        setRetryAfter(seconds);
        showToast(`Too many attempts. Please try again in ${seconds}s...`, 'error');
      } else if (err.response?.status === 400 && data?.fields) {
        // Tự động map lỗi validation từ API xuống trường tương ứng
        setFieldErrors(data.fields);
      } else {
        // Hiển thị thông báo thân thiện cho các lỗi khác
        let friendlyMsg = 'Registration failed. Please try again.';
        if (data?.message?.toLowerCase().includes('already exists') || data?.message?.toLowerCase().includes('conflict')) {
          friendlyMsg = 'Email is already registered. Please use another email or sign in.';
        } else if (err.response?.status >= 500) {
          friendlyMsg = 'Server error. An unexpected error occurred. Please try again later.';
        }
        showToast(friendlyMsg, 'error');
        setError(friendlyMsg);
      }
    }
  };

  return (
    <AuthForm
      title="Create Account"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      disabled={retryAfter > 0}
      submitButtonText={retryAfter > 0 ? `Retry in ${retryAfter}s` : 'Register'}
      error={error}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
          Full Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 transition-colors bg-white text-gray-900 ${
            fieldErrors.name 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-primary focus:ring-primary'
          }`}
          placeholder="John Doe"
          required
        />
        {fieldErrors.name && (
          <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldErrors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
          Email Address
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 transition-colors bg-white text-gray-900 ${
            fieldErrors.email 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-primary focus:ring-primary'
          }`}
          placeholder="you@example.com"
          required
        />
        {fieldErrors.email && (
          <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
          Password
        </label>
        <div className="relative">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 transition-colors bg-white text-gray-900 ${
              fieldErrors.password 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-primary focus:ring-primary'
            }`}
            placeholder="••••••••"
            required
          />
        </div>
        {fieldErrors.password ? (
          <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldErrors.password}</p>
        ) : (
          <p className="text-xs text-gray-500 mt-1.5">Minimum 8 characters</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
          Confirm Password
        </label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 transition-colors bg-white text-gray-900 ${
            fieldErrors.confirmPassword 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-primary focus:ring-primary'
          }`}
          placeholder="••••••••"
          required
        />
        {fieldErrors.confirmPassword && (
          <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary-hover font-semibold transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </AuthForm>
  );
};

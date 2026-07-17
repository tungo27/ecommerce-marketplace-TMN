'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthForm } from './AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/utils/api';
import { useCart } from '@/hooks/useCart';
import { useToastStore } from '@/hooks/useToastStore';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (retryAfter > 0) return;
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      
      // Store token and user in localStorage
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Also write token to cookie so Next.js middleware (Edge Runtime) can read it
      document.cookie = `accessToken=${response.data.accessToken}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
      
      // Update AuthContext user state
      setUser(response.data.user);
      
      setLoading(false);

      // Sync guest cart to user cart
      await useCart.getState().syncGuestCartAfterLogin();
      
      // Redirect to home page
      router.push('/');
    } catch (err: any) {
      setLoading(false);
      const data = err.response?.data;

      if (err.response?.status === 429) {
        const seconds = data?.retryAfter || 60;
        setRetryAfter(seconds);
        showToast(`Too many attempts. Please try again in ${seconds}s...`, 'error');
      } else if (err.response?.status === 400 && data?.fields) {
        // Tự động map lỗi validation vào đúng helper text dưới input tương ứng
        setFieldErrors(data.fields);
      } else {
        // Hiển thị thông báo thân thiện cho các lỗi khác (401, 500, Network)
        let friendlyMsg = 'Login failed. Please try again.';
        if (err.response?.status === 401 || data?.message?.toLowerCase().includes('invalid') || data?.message?.toLowerCase().includes('incorrect')) {
          friendlyMsg = 'Incorrect password or email. Please double-check and try again.';
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
      title="Customer Login"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      disabled={retryAfter > 0}
      submitButtonText={retryAfter > 0 ? `Retry in ${retryAfter}s` : 'Login'}
      error={error}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldErrors(prev => ({ ...prev, email: '' }));
          }}
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
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors(prev => ({ ...prev, password: '' }));
            }}
            className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 transition-colors bg-white text-gray-900 ${
              fieldErrors.password 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-primary focus:ring-primary'
            }`}
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-primary transition-colors focus:outline-none"
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-red-500 text-xs mt-1.5 font-medium">{fieldErrors.password}</p>
        )}
      </div>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary hover:text-primary-hover font-semibold transition-colors">
            Sign Up
          </Link>
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="border-b w-1/5 lg:w-1/4"></span>
        <span className="text-xs text-center text-gray-500 uppercase">Or continue with</span>
        <span className="border-b w-1/5 lg:w-1/4"></span>
      </div>
      
      <div className="mt-6">
        <a 
          href="http://localhost:4000/api/auth/google" 
          className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 font-medium py-2.5 px-6 rounded-md shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </a>
      </div>
    </AuthForm>
  );
};

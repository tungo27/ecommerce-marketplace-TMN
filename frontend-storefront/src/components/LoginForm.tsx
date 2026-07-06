'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthForm } from './AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/utils/api';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, error, setLoading, setError, setUser } = useAuth();

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
      
      // Redirect to home page
      router.push('/');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="Customer Login"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white text-gray-900"
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white text-gray-900"
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
      </div>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary hover:text-primary-hover font-semibold transition-colors">
            Sign Up
          </Link>
        </p>
      </div>
    </AuthForm>
  );
};

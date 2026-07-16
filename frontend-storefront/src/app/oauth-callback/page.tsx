'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser, setLoading } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      setLoading(true);
      // Save token to localStorage
      localStorage.setItem('accessToken', token);
      
      // Save to cookie for Next.js Middleware
      document.cookie = `accessToken=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
      
      try {
        // Decode JWT payload to get user info
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        console.log('JWT Payload from backend:', payload);
        
        const urlName = searchParams.get('name');
        
        const user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          name: urlName || payload.name || payload.fullName || payload.given_name || payload.email.split('@')[0], // Use name from URL or JWT payload if available, else fallback
          picture: payload.picture
        };
        
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
      } catch (e) {
        console.error('Failed to parse JWT token', e);
      }
      
      setLoading(false);
      // Redirect to home page
      router.push('/');
    } else {
      router.push('/login');
    }
  }, [searchParams, router, setUser, setLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Authenticating...</h2>
        <p className="text-gray-500">Please wait a moment.</p>
        <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OAuthCallbackContent />
    </Suspense>
  );
}

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAuthStore } from '../stores/authStore';

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Save token
      localStorage.setItem('accessToken', token);
      
      try {
        // Decode JWT payload
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        
        const user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          name: payload.email.split('@')[0]
        };
        
        const target = searchParams.get('target');
        
        if (target === 'admin' && payload.role !== 'ADMIN') {
          localStorage.removeItem('accessToken');
          useAuthStore.getState().setError('Your account does not have permission to access the admin portal.');
          navigate('/admin/login');
          return;
        }
        
        if (target === 'seller' && payload.role === 'CUSTOMER') {
          localStorage.removeItem('accessToken');
          useAuthStore.getState().setError('Your account does not have permission to access the seller portal.');
          navigate('/seller/login');
          return;
        }

        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        
        // Redirect based on role
        if (payload.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (payload.role === 'SELLER') {
          navigate('/seller/dashboard');
        } else {
          navigate('/seller/login');
        }
      } catch (e) {
        console.error('Failed to parse JWT token', e);
        navigate('/seller/login');
      }
    } else {
      navigate('/seller/login');
    }
  }, [searchParams, navigate, setUser]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Authenticating...</Typography>
      <CircularProgress color="primary" />
    </Box>
  );
};

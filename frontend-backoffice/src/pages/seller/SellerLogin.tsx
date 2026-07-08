import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Typography, Button, Divider } from '@mui/material';
import { AuthLayout } from '../../components/AuthLayout';
import { AuthForm } from '../../components/AuthForm';
import { InputField } from '../../components/InputField';
import { useAuthApi } from '../../hooks/useAuthApi';
import { useAuthStore } from '../../stores/authStore';

export const SellerLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthApi();
  const { isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      const user = useAuthStore.getState().user;
      if (user && user.role === 'CUSTOMER') {
        useAuthStore.getState().logout();
        useAuthStore.getState().setError('Your account does not have permission to access the seller portal.');
        return;
      }
      navigate('/seller/dashboard');
    }
  };

  return (
    <AuthLayout
      title="Seller Portal"
      headerColor="#FF8C42"
      backgroundColor="#FF8C42"
    >
      <AuthForm
        title="Seller Login"
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
        submitButtonText="Login"
      >
        <InputField
          label="Email Address"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
        />

        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
        />

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link to="/seller/register" style={{ color: '#FF8C42', fontWeight: 'bold' }}>
              Sign Up
            </Link>
          </Typography>
        </Box>
        
        <Divider sx={{ my: 1 }}>Or continue with</Divider>
        <Button 
          variant="outlined" 
          fullWidth 
          href="http://localhost:4000/api/auth/google?target=seller"
          startIcon={
            <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          }
          sx={{ borderColor: '#ddd', color: '#555', textTransform: 'none', py: 1.2 }}
        >
          Google
        </Button>
      </AuthForm>
    </AuthLayout>
  );
};

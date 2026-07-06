import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
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
      </AuthForm>
    </AuthLayout>
  );
};

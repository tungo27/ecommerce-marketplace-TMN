import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert } from '@mui/material';
import { AuthLayout } from '../../components/AuthLayout';
import { AuthForm } from '../../components/AuthForm';
import { InputField } from '../../components/InputField';
import { useAuthApi } from '../../hooks/useAuthApi';
import { useAuthStore } from '../../stores/authStore';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthApi();
  const { isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/admin/dashboard');
    }
  };

  return (
    <AuthLayout
      title="Admin Portal"
      headerColor="#0D47A1"
      backgroundColor="#E3F2FD"
    >
      <AuthForm
        title="Administrator Login"
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
        submitButtonText="Login"
      >
        <Alert severity="info" sx={{ mb: 2 }}>
          Admin access only. Authorized personnel required.
        </Alert>

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
          <Typography variant="caption" sx={{ color: '#666' }}>
            For admin support, contact the system administrator
          </Typography>
        </Box>
      </AuthForm>
    </AuthLayout>
  );
};

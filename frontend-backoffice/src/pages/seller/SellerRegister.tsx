import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { AuthLayout } from '../../components/AuthLayout';
import { AuthForm } from '../../components/AuthForm';
import { InputField } from '../../components/InputField';
import { useAuthApi } from '../../hooks/useAuthApi';
import { useAuthStore } from '../../stores/authStore';
import { validateEmail, validatePassword, validateName } from '../../utils/validation';
import { useNotificationStore } from '../../stores/notificationStore';

export const SellerRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [retryAfter, setRetryAfter] = useState<number>(0);
  const navigate = useNavigate();
  const { register } = useAuthApi();
  const { isLoading, error } = useAuthStore();
  const { showNotification } = useNotificationStore();

  // Đếm ngược thời gian chờ khi bị Rate Limit (NFR UX)
  useEffect(() => {
    if (retryAfter <= 0) return;

    showNotification(`Too many attempts. Please try again in ${retryAfter}s...`, 'error');

    const timer = setTimeout(() => {
      setRetryAfter(retryAfter - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [retryAfter, showNotification]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!validateName(formData.name)) {
      errors.name = 'Name is required';
    }
    if (!validateEmail(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!validatePassword(formData.password)) {
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
    if (retryAfter > 0) return;

    if (!validateForm()) {
      return;
    }

    const result = await register(
      formData.email,
      formData.password,
      formData.name,
      'SELLER'
    );

    if (result.success) {
      showNotification('Account registered successfully. Please sign in.', 'success');
      navigate('/seller/login');
    } else {
      if (result.retryAfter) {
        setRetryAfter(result.retryAfter);
        showNotification(`Too many attempts. Please try again in ${result.retryAfter}s...`, 'error');
      } else if (result.fields) {
        // Ánh xạ lỗi validation từ API xuống trường nhập liệu tương ứng
        setFieldErrors(result.fields);
      } else {
        // Hiển thị thông báo thân thiện cho các lỗi khác
        let friendlyMsg = 'Registration failed. Please try again.';
        if (result.error?.toLowerCase().includes('already exists') || result.error?.toLowerCase().includes('conflict')) {
          friendlyMsg = 'Email is already registered. Please use another email or sign in.';
        } else if (result.error?.toLowerCase().includes('unexpected error')) {
          friendlyMsg = 'Server error. An unexpected error occurred. Please try again later.';
        }
        showNotification(friendlyMsg, 'error');
      }
    }
  };

  return (
    <AuthLayout
      title="Seller Portal"
      headerColor="#FF8C42"
      backgroundColor="#FF8C42"
    >
      <AuthForm
        title="Create Seller Account"
        onSubmit={handleSubmit}
        isLoading={isLoading}
        disabled={retryAfter > 0}
        error={error}
        submitButtonText={retryAfter > 0 ? `Retry in ${retryAfter}s` : 'Register'}
      >
        <InputField
          label="Full Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          error={!!fieldErrors.name}
          helperText={fieldErrors.name}
          required
        />

        <InputField
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={!!fieldErrors.email}
          helperText={fieldErrors.email}
          required
        />

        <InputField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={!!fieldErrors.password}
          helperText={fieldErrors.password || 'Minimum 8 characters'}
          required
        />

        <InputField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={!!fieldErrors.confirmPassword}
          helperText={fieldErrors.confirmPassword}
          required
        />

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link to="/seller/login" style={{ color: '#FF8C42', fontWeight: 'bold' }}>
              Sign In
            </Link>
          </Typography>
        </Box>
      </AuthForm>
    </AuthLayout>
  );
};

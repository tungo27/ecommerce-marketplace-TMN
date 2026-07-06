import React from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';

interface AuthFormProps {
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error?: string | null;
  children: React.ReactNode;
  submitButtonText?: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  title,
  onSubmit,
  isLoading,
  error,
  children,
  submitButtonText = 'Submit',
}) => {
  return (
    <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" component="h1" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
        {title}
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {children}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={isLoading}
        sx={{ mt: 2, py: 1.5 }}
      >
        {isLoading ? 'Loading...' : submitButtonText}
      </Button>
    </Box>
  );
};

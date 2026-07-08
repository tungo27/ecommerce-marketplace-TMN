import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Box, Typography, Button } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

interface RoleGuardProps {
  allowedRoles: string[];
  redirectPath?: string;
}

/**
 * RoleGuard - Protects routes based on user role.
 * - If not authenticated → redirect to login page
 * - If authenticated but insufficient role → show 403 Forbidden page
 * - If role matches → render the protected route
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  redirectPath = '/seller/login',
}) => {
  const { user } = useAuthStore();

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  // Logged in but role not allowed → show 403 page
  if (!allowedRoles.includes(user.role)) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#F9FAFB',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 4,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: 40, color: '#FF4742' }} />
        </Box>

        <Typography
          variant="h3"
          sx={{ fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}
        >
          403
        </Typography>

        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: '#374151' }}
        >
          Access Denied
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: '#6B7280', textAlign: 'center', maxWidth: 360 }}
        >
          Your account (role: <strong>{user.role}</strong>) does not have permission to
          access this page. Please contact an administrator if you believe this is an error.
        </Typography>

        <Button
          variant="outlined"
          disableElevation
          onClick={() => window.history.back()}
          sx={{
            mt: 1,
            textTransform: 'none',
            borderColor: '#E5E7EB',
            color: '#374151',
            '&:hover': { borderColor: '#FF4742', color: '#FF4742', backgroundColor: 'transparent' },
          }}
        >
          Go back
        </Button>
      </Box>
    );
  }

  // Role matches → render nested routes
  return <Outlet />;
};

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export const SellerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    logout();
    navigate('/seller/login');
  };

  return (
    <Box sx={{ p: 4, bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Paper sx={{ p: 6, width: '100%', maxWidth: 600, textAlign: 'center', borderRadius: 2 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', mb: 2 }}>
          ShopNexus Seller
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
          Manage your products and orders with ease.
        </Typography>
        
        {user ? (
          <Box sx={{ mb: 4, p: 4, bgcolor: 'primary.light', border: '1px solid', borderColor: 'primary.main', borderRadius: 2 }}>
            <Box sx={{ 
              width: 64, height: 64, bgcolor: 'primary.main', color: 'white', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', mx: 'auto', mb: 2 
            }}>
              {user.name.charAt(0).toUpperCase()}
            </Box>
            <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
              {user.name}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
              {user.email}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 'bold', bgcolor: 'primary.main', color: 'white', 
                px: 2, py: 0.5, borderRadius: 10, textTransform: 'uppercase' 
              }}
            >
              {user.role}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body1" sx={{ mb: 4 }}>
            Please login to view your store statistics.
          </Typography>
        )}
        <Button 
          variant="contained" 
          onClick={handleLogout}
          sx={{ width: '100%' }}
        >
          Logout
        </Button>
      </Paper>
    </Box>
  );
};

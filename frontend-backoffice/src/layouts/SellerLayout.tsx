import React from 'react';
import { Box, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, AppBar, Toolbar, Avatar, IconButton } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RateReviewIcon from '@mui/icons-material/RateReview';

const DRAWER_WIDTH = 260;
const HEADER_HEIGHT = 72;

export const SellerLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    logout();
    navigate('/seller/login');
  };

  const getInitials = (name = 'User') => name.charAt(0).toUpperCase();

  const menuItems = [
    { text: 'Dashboard', path: '/seller/dashboard', icon: <DashboardIcon /> },
    { text: 'Products', path: '/seller/products', icon: <InventoryIcon /> },
    { text: 'Orders', path: '/seller/orders', icon: <ShoppingCartIcon /> },
    { text: 'Reviews', path: '/seller/reviews', icon: <RateReviewIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F9FAFB' }}>
      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#FFFFFF', // Flat white background
            borderRight: '1px solid #E5E7EB',
          },
        }}
      >
        <Box
          sx={{
            height: HEADER_HEIGHT,
            px: 3,
            boxSizing: 'border-box',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ width: 32, height: 32, bgcolor: '#FF4742', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 900, lineHeight: 1 }}>E</Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
            Seller Portal
          </Typography>
        </Box>
        
        <List sx={{ px: 2, pt: 2, flex: 1 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path) &&
                             (item.path !== '/seller/dashboard' || location.pathname === '/seller/dashboard');
                             
            return (
              <ListItem disablePadding sx={{ mb: 1 }} key={item.text}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    color: isActive ? '#FF4742' : '#4B5563',
                    bgcolor: isActive ? '#FEF2F2' : 'transparent',
                    '&.Mui-selected': {
                      bgcolor: '#FEF2F2',
                      color: '#FF4742',
                      '&:hover': { bgcolor: '#FEE2E2' },
                    },
                    '&:hover': { bgcolor: '#F3F4F6' },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ fontWeight: isActive ? 700 : 500 }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        
        <Box sx={{ p: 2, borderTop: '1px solid #E5E7EB' }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                color: '#DC2626',
                '&:hover': { bgcolor: '#FEF2F2' },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <AppBar 
          position="sticky" 
          elevation={0}
          sx={{ 
            bgcolor: '#FFFFFF', 
            borderBottom: '1px solid #E5E7EB',
            color: '#111827',
          }}
        >
          <Toolbar
            sx={{
              justifyContent: 'flex-end',
              minHeight: HEADER_HEIGHT,
              height: HEADER_HEIGHT,
              boxSizing: 'border-box',
            }}
          >
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.name}
                </Typography>
                <Avatar sx={{ bgcolor: '#FF4742', width: 36, height: 36, fontWeight: 700 }}>
                  {getInitials(user.name)}
                </Avatar>
              </Box>
            )}
          </Toolbar>
        </AppBar>

        {/* Dynamic Route Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

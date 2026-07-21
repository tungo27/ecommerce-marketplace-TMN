import React from 'react';
import {
  Box, Typography, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, AppBar, Toolbar, Avatar,
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { adminTheme } from '../theme/adminTheme';
import { useAuthStore } from '../stores/authStore';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import HistoryIcon from '@mui/icons-material/History';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RateReviewIcon from '@mui/icons-material/RateReview';
import LogoutIcon from '@mui/icons-material/Logout';
import CategoryIcon from '@mui/icons-material/Category';
import WebIcon from '@mui/icons-material/Web';
import GavelIcon from '@mui/icons-material/Gavel';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

const DRAWER_WIDTH = 260;
const HEADER_HEIGHT = 72;

const menuItems = [
  { text: 'Overview', path: '/admin/dashboard', icon: <DashboardIcon /> },
  { text: 'Product Moderation', path: '/admin/moderation', icon: <FactCheckIcon /> },
  { text: 'Categories', path: '/admin/categories', icon: <CategoryIcon /> },
  { text: 'Storefront', path: '/admin/storefront', icon: <WebIcon /> },
  { text: 'Flash Sales', path: '/admin/flash-sales', icon: <LocalOfferIcon /> },
  { text: 'Disputes', path: '/admin/disputes', icon: <GavelIcon /> },
  { text: 'Audit Log', path: '/admin/audit-logs', icon: <HistoryIcon /> },
  { text: 'User Management', path: '/admin/users', icon: <PeopleIcon /> },
  { text: 'Order Management', path: '/admin/orders', icon: <ShoppingBagIcon /> },
  { text: 'Transactions', path: '/admin/transactions', icon: <AccountBalanceIcon /> },
  { text: 'Review Moderation', path: '/admin/reviews', icon: <RateReviewIcon /> },
];

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    logout();
    navigate('/admin/login');
  };

  const getInitials = (name = 'A') => name.charAt(0).toUpperCase();

  return (
    <ThemeProvider theme={adminTheme}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F9FAFB' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#FFFFFF',
            borderRight: '1px solid #E5E7EB',
          },
        }}
      >
        {/* Logo */}
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
          <Box
            sx={{
              width: 32, height: 32, bgcolor: '#2563EB', borderRadius: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 900, lineHeight: 1 }}>A</Typography>
          </Box>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 800, color: '#111827', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              Admin Portal
            </Typography>
            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
              System Management
            </Typography>
          </Box>
        </Box>

        {/* Nav Items */}
        <List sx={{ px: 2, pt: 2, flex: 1 }}>
          {menuItems.map((item) => {
            const isActive =
              item.path === '/admin/dashboard'
                ? location.pathname === '/admin/dashboard'
                : location.pathname.startsWith(item.path);

            return (
              <ListItem disablePadding sx={{ mb: 0.5 }} key={item.text}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    color: isActive ? '#FFFFFF' : '#4B5563',
                    bgcolor: isActive ? '#2563EB' : 'transparent',
                    '&.Mui-selected': {
                      bgcolor: '#2563EB',
                      color: '#FFFFFF',
                      '&:hover': { bgcolor: '#1D4ED8' },
                    },
                    '&:hover': { bgcolor: isActive ? '#1D4ED8' : '#F3F4F6' },
                    py: 1,
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: isActive ? 700 : 500, fontSize: '0.875rem' }}>
                        {item.text}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Logout */}
        <Box sx={{ p: 2, borderTop: '1px solid #E5E7EB' }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{ borderRadius: 2, color: '#DC2626', '&:hover': { bgcolor: '#EFF6FF' } }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary={<Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Logout</Typography>}
              />
            </ListItemButton>
          </ListItem>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Header */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', color: '#111827' }}
        >
          <Toolbar sx={{ justifyContent: 'flex-end', minHeight: HEADER_HEIGHT, height: HEADER_HEIGHT }}>
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                    Administrator
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#2563EB', width: 36, height: 36, fontWeight: 700 }}>
                  {getInitials(user.name)}
                </Avatar>
              </Box>
            )}
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  </ThemeProvider>
  );
};

import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, AppBar, Toolbar, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import LogoutIcon from '@mui/icons-material/Logout';
import { ProductModeration } from './ProductModeration';

const DRAWER_WIDTH = 260;

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'moderation'>('overview');

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    logout();
    navigate('/admin/login');
  };

  const getInitials = (name = 'Admin') => name.charAt(0).toUpperCase();

  return (
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
            bgcolor: '#1E3A8A', // Deep Blue
            color: 'white',
            borderRight: 'none',
          },
        }}
      >
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            E-commerce MVP
          </Typography>
          <Typography variant="caption" sx={{ color: '#93C5FD' }}>
            Admin Portal
          </Typography>
        </Box>
        <List sx={{ px: 2, pt: 2, flex: 1 }}>
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)' },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Overview" sx={{ '& .MuiListItemText-primary': { fontWeight: 500 } }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={activeTab === 'moderation'}
              onClick={() => setActiveTab('moderation')}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)' },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                <FactCheckIcon />
              </ListItemIcon>
              <ListItemText primary="Product Moderation" sx={{ '& .MuiListItemText-primary': { fontWeight: 500 } }} />
            </ListItemButton>
          </ListItem>
        </List>
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="text"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              color: '#93C5FD',
              justifyContent: 'flex-start',
              px: 2,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: 'white' },
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Logout
          </Button>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #E5E7EB', color: '#111827' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {activeTab === 'overview' ? 'Dashboard Overview' : 'Product Moderation Management'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Hello, {user?.name || 'Admin'}
              </Typography>
              <Avatar sx={{ bgcolor: '#2563EB', width: 36, height: 36, fontWeight: 600 }}>
                {getInitials(user?.name)}
              </Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content Area */}
        <Box sx={{ p: 4 }}>
          {activeTab === 'overview' && (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid #E5E7EB' }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: '#EFF6FF', color: '#2563EB', mx: 'auto', mb: 2 }}>
                <DashboardIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                MVP Admin System
              </Typography>
              <Typography variant="body1" sx={{ color: '#6B7280', mb: 4, maxWidth: 500, mx: 'auto' }}>
                Welcome to the admin panel. Please select a feature from the navigation bar to get started.
              </Typography>
              <Button 
                variant="contained" 
                disableElevation
                onClick={() => setActiveTab('moderation')}
                sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, textTransform: 'none', fontWeight: 600, px: 4, py: 1.5, borderRadius: 2 }}
              >
                Go to Product Moderation
              </Button>
            </Paper>
          )}

          {activeTab === 'moderation' && <ProductModeration />}
        </Box>
      </Box>
    </Box>
  );
};

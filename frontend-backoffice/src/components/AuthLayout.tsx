import React from 'react';
import { Box, Container, Paper, AppBar, Toolbar, Typography } from '@mui/material';

interface AuthLayoutProps {
  title: string;
  headerColor: string;
  backgroundColor: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  headerColor,
  backgroundColor,
  children,
}) => {
  return (
    <Box 
      sx={{ 
        backgroundColor, 
        backgroundImage: 'url("https://res.cloudinary.com/gnlx1ljp/image/upload/v1783389563/n%E1%BB%81n_x%C3%A1m_dtvees.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column' 
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4, flexDirection: 'column' }}>
        <Typography 
          variant="h3" 
          component="div" 
          sx={{ 
            fontWeight: 800, 
            color: '#FFFFFF', 
            mb: 4,
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            letterSpacing: '-1px'
          }}
        >
          E-commerce MVP
        </Typography>
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ p: 4, backgroundColor: '#FFFFFF' }}>
            {children}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

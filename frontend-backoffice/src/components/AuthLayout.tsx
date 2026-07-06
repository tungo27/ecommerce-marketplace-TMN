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
    <Box sx={{ backgroundColor, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" sx={{ backgroundColor: headerColor }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ p: 4, backgroundColor: '#FFFFFF' }}>
            {children}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

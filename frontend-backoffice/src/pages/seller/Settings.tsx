import React from 'react';
import { Box, Typography, Paper, FormControlLabel, Switch, Button, TextField } from '@mui/material';

// Trang cài đặt cá nhân (Settings)
export const Settings: React.FC = () => {
  return (
    <Box className="bg-slate-50/50 min-h-full p-6 md:p-8">
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Box className="mb-8">
          <Typography variant="h4" className="font-extrabold text-slate-900 tracking-tight">
            Settings
          </Typography>
          <Typography variant="body1" className="text-slate-500 mt-1">
            Manage your account security and notification preferences.
          </Typography>
        </Box>

        <Paper elevation={0} className="p-6 rounded-xl border border-slate-100 shadow-sm bg-white mb-6">
          <Typography variant="h6" className="font-bold text-slate-800 mb-4">
            Change Password
          </Typography>
          <div className="space-y-4 max-w-md">
            <TextField fullWidth variant="outlined" type="password" label="Current Password" size="small" />
            <TextField fullWidth variant="outlined" type="password" label="New Password" size="small" />
            <TextField fullWidth variant="outlined" type="password" label="Confirm New Password" size="small" />
            <Button variant="contained" sx={{ bgcolor: '#FF4742', '&:hover': { bgcolor: '#e63f3a' }, mt: 2 }}>
              Update Password
            </Button>
          </div>
        </Paper>

        <Paper elevation={0} className="p-6 rounded-xl border border-slate-100 shadow-sm bg-white">
          <Typography variant="h6" className="font-bold text-slate-800 mb-4">
            Notification Preferences
          </Typography>
          <div className="flex flex-col space-y-2">
            <FormControlLabel control={<Switch defaultChecked color="primary" />} label="Email notifications for new orders" />
            <FormControlLabel control={<Switch defaultChecked color="primary" />} label="Email notifications for new reviews" />
            <FormControlLabel control={<Switch color="primary" />} label="Weekly summary reports" />
          </div>
        </Paper>
      </Box>
    </Box>
  );
};

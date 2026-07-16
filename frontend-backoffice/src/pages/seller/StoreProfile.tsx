import React from 'react';
import { Box, Typography, Paper, TextField, Button } from '@mui/material';

// Trang chỉnh sửa thông tin cửa hàng (Store Profile)
export const StoreProfile: React.FC = () => {
  return (
    <Box className="bg-slate-50/50 min-h-full p-6 md:p-8">
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Box className="mb-8">
          <Typography variant="h4" className="font-extrabold text-slate-900 tracking-tight">
            Store Profile
          </Typography>
          <Typography variant="body1" className="text-slate-500 mt-1">
            Manage your store's public identity and contact information.
          </Typography>
        </Box>

        <Paper elevation={0} className="p-6 rounded-xl border border-slate-100 shadow-sm bg-white">
          <div className="space-y-6">
            <div>
              <Typography className="font-semibold text-slate-700 mb-2">Store Name</Typography>
              <TextField fullWidth variant="outlined" placeholder="Enter your store name" size="small" />
            </div>
            <div>
              <Typography className="font-semibold text-slate-700 mb-2">Description</Typography>
              <TextField fullWidth variant="outlined" multiline rows={4} placeholder="Tell customers about your store..." />
            </div>
            <div>
              <Typography className="font-semibold text-slate-700 mb-2">Contact Email</Typography>
              <TextField fullWidth variant="outlined" placeholder="support@yourstore.com" size="small" />
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button variant="contained" sx={{ bgcolor: '#FF4742', '&:hover': { bgcolor: '#e63f3a' } }}>
                Save Changes
              </Button>
            </div>
          </div>
        </Paper>
      </Box>
    </Box>
  );
};

import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { apiClient } from '../../utils/api';
import { Link } from 'react-router-dom';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FiberNewIcon from '@mui/icons-material/FiberNew';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  newOrders: number;
}

export const SellerDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get<DashboardStats>('/seller/dashboard/stats');
        setStats(response.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Could not load stats.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <Box className="bg-slate-50/50 min-h-full p-6 md:p-8">
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box className="mb-8">
          <Typography variant="h4" className="font-extrabold text-slate-900 tracking-tight">
            Dashboard Overview
          </Typography>
          <Typography variant="body1" className="text-slate-500 mt-1">
            Track your sales performance and monitor your store metrics in real-time.
          </Typography>
        </Box>

        {error && (
          <Box className="mb-6 border border-red-200 bg-red-50 p-4 text-red-700 rounded-xl">
            {error}
          </Box>
        )}

        {isLoading ? (
          <Box className="flex justify-center items-center py-20">
            <CircularProgress size={40} sx={{ color: '#FF4742' }} />
          </Box>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Revenue */}
            <Link
              to="/seller/orders"
              className="block"
            >
              <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <Typography className="text-slate-500 font-medium mb-1">Total Revenue</Typography>
                    <Typography className="text-3xl font-bold text-slate-900 text-right">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue)}
                    </Typography>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                    <AttachMoneyIcon />
                  </div>
                </div>
              </div>
            </Link>
            {/* Card 2: New Orders */}
            <Link
              to="/seller/orders"
              className="block"
            >
              <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full -z-0 opacity-50" />
                <div className="flex justify-between items-start z-10">
                  <div>
                    <Typography className="text-slate-500 font-medium mb-1">New Orders</Typography>
                    <Typography className="text-3xl font-bold text-slate-900 text-right">
                      {stats.newOrders}
                    </Typography>
                  </div>
                  <div className="bg-orange-50 p-2 rounded-lg text-orange-600 animate-pulse">
                    <FiberNewIcon />
                  </div>
                </div>
              </div>
            </Link>
            {/* Card 3: Total Orders */}
            <Link
              to="/seller/orders"
              className="block"
            >
              <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <Typography className="text-slate-500 font-medium mb-1">Total Orders</Typography>
                    <Typography className="text-3xl font-bold text-slate-900 text-right">
                      {stats.totalOrders}
                    </Typography>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <ShoppingCartIcon />
                  </div>
                </div>
              </div>
            </Link>
            {/* Card 4: Total Products */}
            <Link
              to="/seller/products"
              className="block"
            >
              <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <Typography className="text-slate-500 font-medium mb-1">Total Products</Typography>
                    <Typography className="text-3xl font-bold text-slate-900 text-right">
                      {stats.totalProducts}
                    </Typography>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                    <InventoryIcon />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ) : null}
      </Box>
    </Box>
  );
};

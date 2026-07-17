import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, Button, Chip, Rating, Avatar } from '@mui/material';
import { apiClient } from '../../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  newOrders: number;
  recentOrders: any[];
  topProducts: any[];
  lowStockProducts: any[];
  recentReviews: any[];
  salesChart: { name: string; revenue: number; fullDate: string }[];
}

// Màn hình Dashboard Tổng Quan
export const SellerDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy dữ liệu thống kê từ API
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

  // Hàm helper chọn màu badge theo status
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'SHIPPED': return 'info';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box className="bg-slate-50/50 min-h-full p-6 md:p-8">
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        
        {/* Header & Quick Actions */}
        <Box className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Box>
            <Typography variant="h4" className="font-extrabold text-slate-900 tracking-tight">
              Dashboard Overview
            </Typography>
            <Typography variant="body1" className="text-slate-500 mt-1">
              Track your sales performance and monitor your store metrics in real-time.
            </Typography>
          </Box>
          <Box className="flex gap-2 flex-wrap">
            <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#FF4742', '&:hover': { bgcolor: '#e63f3a' } }} onClick={() => navigate('/seller/products/new')}>
              Add Product
            </Button>
            <Button variant="outlined" startIcon={<ListAltIcon />} color="inherit" onClick={() => navigate('/seller/orders')}>
              View Orders
            </Button>
            <Button variant="outlined" startIcon={<RateReviewIcon />} color="inherit" onClick={() => navigate('/seller/reviews')}>
              Manage Reviews
            </Button>
          </Box>
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
          <>
            {/* Overview Cards - 4 KPI cơ bản */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Card 1: Revenue */}
                <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <Typography className="text-slate-500 font-medium mb-1">Total Revenue</Typography>
                      <Typography className="text-3xl font-bold text-slate-900 text-left">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue)}
                      </Typography>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                      <AttachMoneyIcon />
                    </div>
                  </div>
                </div>
              {/* Card 2: New Orders */}
              <Link to="/seller/orders" className="block">
                <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full -z-0 opacity-50" />
                  <div className="flex justify-between items-start z-10">
                    <div>
                      <Typography className="text-slate-500 font-medium mb-1">New Orders</Typography>
                      <Typography className="text-3xl font-bold text-slate-900 text-left">
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
              <Link to="/seller/orders" className="block">
                <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <Typography className="text-slate-500 font-medium mb-1">Total Orders</Typography>
                      <Typography className="text-3xl font-bold text-slate-900 text-left">
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
              <Link to="/seller/products" className="block">
                <div className="bg-white p-6 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <Typography className="text-slate-500 font-medium mb-1">Total Products</Typography>
                      <Typography className="text-3xl font-bold text-slate-900 text-left">
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

            {/* Charts and Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
              {/* Sales Chart bằng thư viện recharts */}
              <div className="lg:col-span-8">
                <Paper elevation={0} className="p-6 rounded-xl border border-slate-100 shadow-sm bg-white h-full">
                  <Typography variant="h6" className="font-bold text-slate-800 mb-6">
                    Revenue (Last 7 Days)
                  </Typography>
                  <Box sx={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                      <BarChart data={stats.salesChart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                          tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: "compact", compactDisplay: "short" }).format(value)}
                        />
                        <RechartsTooltip 
                          cursor={{ fill: '#F3F4F6' }}
                          formatter={(value: any) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value)), 'Revenue']}
                          labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: 4 }}
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="revenue" fill="#FF4742" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </div>

              {/* Danh sách Đơn hàng gần nhất */}
              <div className="lg:col-span-4">
                <Paper elevation={0} className="p-6 rounded-xl border border-slate-100 shadow-sm bg-white h-full flex flex-col">
                  <Box className="flex justify-between items-center mb-4">
                    <Typography variant="h6" className="font-bold text-slate-800">
                      Recent Orders
                    </Typography>
                    <Link to="/seller/orders" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                      View All
                    </Link>
                  </Box>
                  <Box className="flex-grow flex flex-col gap-3">
                    {stats.recentOrders.length === 0 ? (
                      <Typography className="text-slate-500 text-center py-10">No recent orders found.</Typography>
                    ) : (
                      stats.recentOrders.map((order) => (
                        <Box key={order.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center hover:bg-slate-100 transition-colors">
                          <Box>
                            <Typography className="font-semibold text-slate-900 text-sm line-clamp-1">
                              {order.customer?.name || 'Guest User'}
                            </Typography>
                            <Typography className="text-xs text-slate-500 mt-1">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Box className="flex flex-col items-end gap-2">
                            <Chip 
                              label={order.status} 
                              size="small" 
                              color={getOrderStatusColor(order.status) as any}
                              sx={{ fontWeight: 'bold', height: 20, fontSize: '0.65rem' }} 
                            />
                            <Typography className="font-bold text-slate-900 text-sm">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    )}
                  </Box>
                </Paper>
              </div>
            </div>

            {/* Bottom 3 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Top Products - 5 Sản phẩm bán chạy */}
              <div className="lg:col-span-4">
                <Paper elevation={0} className="p-6 rounded-xl border border-slate-100 shadow-sm bg-white h-full">
                  <Typography variant="h6" className="font-bold text-slate-800 mb-4">
                    Top Products
                  </Typography>
                  <Box className="flex flex-col gap-3">
                    {stats.topProducts.length === 0 ? (
                      <Typography className="text-slate-500 text-center py-6">No top products yet.</Typography>
                    ) : (
                      stats.topProducts.map((prod, idx) => (
                        <Box key={prod.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                          <Typography className="font-bold text-slate-300 w-4">{idx + 1}</Typography>
                          <Avatar src={prod.images?.[0]} variant="rounded" sx={{ width: 40, height: 40 }} />
                          <Box className="flex-grow min-w-0">
                            <Typography className="font-semibold text-slate-900 text-sm line-clamp-1">{prod.name}</Typography>
                            <Typography className="text-xs text-slate-500">{prod.totalSold} sold</Typography>
                          </Box>
                          <Typography className="font-bold text-slate-900 text-sm shrink-0">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(prod.price)}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                </Paper>
              </div>

              {/* Low Stock Alert - Sản phẩm sắp hết hàng */}
              <div className="lg:col-span-4">
                <Paper elevation={0} className="p-6 rounded-xl border border-slate-100 shadow-sm bg-white h-full">
                  <Typography variant="h6" className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    Low Stock Alerts
                    {stats.lowStockProducts.length > 0 && (
                      <Chip label={stats.lowStockProducts.length} size="small" color="error" sx={{ height: 20, minWidth: 20 }} />
                    )}
                  </Typography>
                  <Box className="flex flex-col gap-3">
                    {stats.lowStockProducts.length === 0 ? (
                      <Typography className="text-slate-500 text-center py-6">All products are well stocked.</Typography>
                    ) : (
                      stats.lowStockProducts.map((prod) => (
                        <Box key={prod.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                          <Avatar src={prod.images?.[0]} variant="rounded" sx={{ width: 40, height: 40 }} />
                          <Box className="flex-grow min-w-0">
                            <Typography className="font-semibold text-slate-900 text-sm line-clamp-1">{prod.name}</Typography>
                            <Chip 
                              label={`Only ${prod.stock} left`} 
                              size="small" 
                              color="error" 
                              variant="outlined"
                              sx={{ fontWeight: 'bold', height: 20, fontSize: '0.65rem', mt: 0.5 }} 
                            />
                          </Box>
                        </Box>
                      ))
                    )}
                  </Box>
                </Paper>
              </div>

              {/* Latest Reviews - Đánh giá mới nhất */}
              <div className="lg:col-span-4">
                <Paper elevation={0} className="p-6 rounded-xl border border-slate-100 shadow-sm bg-white h-full">
                  <Box className="flex justify-between items-center mb-4">
                    <Typography variant="h6" className="font-bold text-slate-800">
                      Latest Reviews
                    </Typography>
                    <Link to="/seller/reviews" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                      Manage All
                    </Link>
                  </Box>
                  <Box className="flex flex-col gap-4">
                    {stats.recentReviews.length === 0 ? (
                      <Typography className="text-slate-500 text-center py-6">No recent reviews.</Typography>
                    ) : (
                      stats.recentReviews.map((rev) => (
                        <Box key={rev.id} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                          <Box className="flex justify-between items-start mb-1">
                            <Typography className="font-semibold text-slate-900 text-sm">{rev.user?.name}</Typography>
                            <Rating value={rev.rating} readOnly size="small" />
                          </Box>
                          <Typography className="text-xs text-slate-500 line-clamp-1 mb-1">
                            {rev.product?.name}
                          </Typography>
                          <Typography className="text-sm text-slate-700 line-clamp-2 italic">
                            "{rev.comment || 'No comment provided.'}"
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                </Paper>
              </div>
            </div>
          </>
        ) : null}
      </Box>
    </Box>
  );
};

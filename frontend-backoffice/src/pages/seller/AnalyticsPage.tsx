import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';

// Dữ liệu giả lập cho biểu đồ doanh thu (Revenue Chart)
const revenueData = [
  { month: 'Jan', revenue: 12000 },
  { month: 'Feb', revenue: 19000 },
  { month: 'Mar', revenue: 15000 },
  { month: 'Apr', revenue: 22000 },
  { month: 'May', revenue: 28000 },
  { month: 'Jun', revenue: 32000 },
];

// Dữ liệu giả lập cho biểu đồ nhân khẩu học (Demographics Chart)
const demographicsData = [
  { name: '18-24', value: 35 },
  { name: '25-34', value: 45 },
  { name: '35-44', value: 15 },
  { name: '45+', value: 5 },
];
// Mã màu hiện đại: Vàng, Xanh lá, Xanh dương, Tím
const COLORS = ['#FBBF24', '#34D399', '#60A5FA', '#A78BFA'];

// Dữ liệu giả lập cho danh mục sản phẩm (Category Sales)
const categoryData = [
  { name: 'Electronics', sales: 45000 },
  { name: 'Fashion', sales: 32000 },
  { name: 'Home', sales: 28000 },
  { name: 'Beauty', sales: 24000 },
  { name: 'Sports', sales: 18000 },
];

// Trang hiển thị giao diện phân tích dữ liệu (Analytics)
export const AnalyticsPage: React.FC = () => {
  return (
    <Box className="bg-slate-50/50 min-h-full p-6 md:p-8">
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Box className="mb-8">
          <Typography variant="h4" className="font-extrabold text-slate-900 tracking-tight">
            Analytics
          </Typography>
          <Typography variant="body1" className="text-slate-500 mt-1">
            Deep dive into your store's performance metrics and customer insights.
          </Typography>
        </Box>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Paper elevation={0} className="p-6 rounded-xl border border-slate-100 shadow-sm h-96 flex items-center justify-center bg-white">
              {/* Detailed Revenue Chart */}
              <div className="w-full h-full flex flex-col">
                <Typography variant="h6" className="font-bold text-slate-800 mb-4">
                  Revenue Overview
                </Typography>
                <div className="flex-grow w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6B7280', fontSize: 12 }} 
                        tickFormatter={(value) => `$${value / 1000}k`}
                      />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`$${new Intl.NumberFormat('en-US').format(value)}`, 'Revenue']}
                        labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: 4 }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Paper>
          </div>
          <div className="lg:col-span-4">
            <Paper elevation={0} className="p-6 rounded-xl border border-slate-100 shadow-sm h-96 flex items-center justify-center bg-white">
              {/* Customer Demographics Chart */}
              <div className="w-full h-full flex flex-col">
                <Typography variant="h6" className="font-bold text-slate-800 mb-4">
                  Customer Age Groups
                </Typography>
                <div className="flex-grow w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demographicsData}
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {demographicsData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`${value}%`, 'Customers']}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Paper>
          </div>
          <div className="col-span-1 lg:col-span-12">
            <Paper elevation={0} className="p-6 rounded-xl border border-slate-100 shadow-sm h-80 flex items-center justify-center bg-white">
              {/* Sales by Category Chart */}
              <div className="w-full h-full flex flex-col">
                <Typography variant="h6" className="font-bold text-slate-800 mb-4">
                  Top Categories
                </Typography>
                <div className="flex-grow w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 13, fontWeight: 500 }} />
                      <RechartsTooltip 
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`$${new Intl.NumberFormat('en-US').format(value)}`, 'Sales']}
                      />
                      <Bar dataKey="sales" fill="#EC4899" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Paper>
          </div>
        </div>
      </Box>
    </Box>
  );
};

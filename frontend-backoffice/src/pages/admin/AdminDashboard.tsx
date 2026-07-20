import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, CircularProgress, Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { adminApi } from '../../hooks/useAdminApi';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  CONFIRMED: '#3B82F6',
  SHIPPED: '#8B5CF6',
  DELIVERED: '#10B981',
  CANCELLED: '#EF4444',
};

const CATEGORY_COLOR = '#2563EB';

interface StatsData {
  gmv: number;
  totalOrders: number;
  newUsers: number;
  newSellers: number;
  orderStatusChart: { status: string; count: number }[];
  categoryProductChart: { category: string; count: number }[];
}

const KpiCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
}> = ({ title, value, icon, subtitle }) => (
  <Paper
    elevation={0}
    sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}
  >
    <Box
      sx={{
        width: 48, height: 48, borderRadius: 2, bgcolor: '#EFF6FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500, mb: 0.25 }}>
        {title}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  </Paper>
);

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress sx={{ color: '#2563EB' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Chip label={`Error: ${error}`} color="error" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
          Dashboard Overview
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
          Platform-wide metrics and analytics
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Gross Merchandise Value"
            value={formatCurrency(stats?.gmv ?? 0)}
            icon={<TrendingUpIcon />}
            subtitle="From delivered orders"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Total Orders"
            value={stats?.totalOrders ?? 0}
            icon={<ShoppingCartIcon />}
            subtitle="All time"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="New Customers"
            value={stats?.newUsers ?? 0}
            icon={<PersonAddIcon />}
            subtitle="Last 7 days"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="New Sellers"
            value={stats?.newSellers ?? 0}
            icon={<StorefrontIcon />}
            subtitle="Last 7 days"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Pie Chart — Order Status */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827', mb: 3 }}>
              Order Status Distribution
            </Typography>
            {stats?.orderStatusChart && stats.orderStatusChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats.orderStatusChart}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={55}
                  >
                    {stats.orderStatusChart.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#9CA3AF'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any, name: any) => [value, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6, color: '#9CA3AF' }}>
                <Typography>No order data yet</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Bar Chart — Products by Category */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827', mb: 3 }}>
              Products by Category
            </Typography>
            {stats?.categoryProductChart && stats.categoryProductChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.categoryProductChart} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(v) => v.replace('_', ' ')}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill={CATEGORY_COLOR} radius={[4, 4, 0, 0]} name="Products" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6, color: '#9CA3AF' }}>
                <Typography>No product data yet</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

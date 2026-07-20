import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, CircularProgress, Chip, Button, Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarIcon from '@mui/icons-material/Star';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../hooks/useAdminApi';

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <Paper elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 2, textAlign: 'center' }}>
    <Box sx={{ width: 44, height: 44, bgcolor: '#EFF6FF', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', mx: 'auto', mb: 1.5 }}>
      {icon}
    </Box>
    <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', mb: 0.5 }}>{value}</Typography>
    <Typography variant="body2" sx={{ color: '#6B7280' }}>{label}</Typography>
  </Paper>
);

export const SellerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    adminApi.getSellerProfile(id)
      .then(setSeller)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
      <CircularProgress sx={{ color: '#2563EB' }} />
    </Box>
  );

  if (error) return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;

  return (
    <Box sx={{ p: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/admin/users')}
        sx={{ mb: 3, textTransform: 'none', fontWeight: 600, color: '#4B5563' }}
      >
        Back to Users
      </Button>

      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
        <Box sx={{ width: 64, height: 64, bgcolor: '#EFF6FF', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
          <StorefrontIcon sx={{ fontSize: 32 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
              {seller?.name}
            </Typography>
            <Chip
              label={seller?.isActive ? 'Active' : 'Banned'}
              size="small"
              sx={{
                fontWeight: 700, fontSize: '0.75rem',
                bgcolor: seller?.isActive ? '#ECFDF5' : '#EFF6FF',
                color: seller?.isActive ? '#059669' : '#DC2626',
                border: `1px solid ${seller?.isActive ? '#6EE7B7' : '#FCA5A5'}`,
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>{seller?.email}</Typography>
          <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
            Joined {new Date(seller?.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Typography>
        </Box>
      </Paper>

      {/* Metrics */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard
            icon={<InventoryIcon />}
            label="Total Products"
            value={seller?.totalProducts ?? 0}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard
            icon={<AttachMoneyIcon />}
            label="Total Revenue (Delivered)"
            value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(seller?.totalRevenue ?? 0)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <MetricCard
            icon={<StarIcon />}
            label={`Avg. Rating (${seller?.totalReviews ?? 0} reviews)`}
            value={seller?.averageRating ? Number(seller.averageRating).toFixed(1) + ' ★' : 'N/A'}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

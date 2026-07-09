import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';

interface SellerProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
  images: string[];
  isRejected?: boolean;
}

const badgeColors: Record<string, { background: string; color: string }> = {
  Published: { background: '#DCFCE7', color: '#166534' },
  Pending: { background: '#FEF3C7', color: '#92400E' },
  Hidden: { background: '#F3F4F6', color: '#374151' },
  Draft: { background: '#FFE8D9', color: '#9A3412' },
};

export const SellerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchProducts = async (status = '') => {
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.get<SellerProduct[]>('/seller/products', {
        params: status ? { status } : {},
      });
      setProducts(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not load products.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(statusFilter);
  }, [statusFilter]);

  const handleStatusToggle = async (product: SellerProduct) => {
    const nextStatus = product.status === 'Hidden' ? 'Draft' : 'Hidden';
    try {
      await apiClient.patch(`/seller/products/${product.id}/status`, { status: nextStatus });
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, status: nextStatus } : item)),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to update product status.');
    }
  };

  return (
    <Box sx={{ bgcolor: '#F9FAFB' }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 4 } }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: '1px solid #E5E7EB', bgcolor: 'white', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827' }}>
            Seller Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
            Manage your listings, review product status, and keep your catalog up to date.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 3 }}>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              displayEmpty
              size="small"
              sx={{ minWidth: 180, bgcolor: '#FFFFFF' }}
            >
              <MenuItem value="">All status</MenuItem>
              <MenuItem value="Published">Active</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Hidden">Hidden</MenuItem>
              <MenuItem value="Draft">Draft</MenuItem>
            </Select>

            <Button
              variant="contained"
              sx={{ bgcolor: '#FF4742', '&:hover': { bgcolor: '#e63f3a' } }}
              onClick={() => navigate('/seller/products/new')}
            >
              Add product
            </Button>
          </Box>
        </Paper>

        {error ? (
          <Box sx={{ mb: 3, border: '1px solid #FECACA', bgcolor: '#FEF2F2', p: 2, color: '#B91C1C', borderRadius: 2 }}>
            {error}
          </Box>
        ) : null}

        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#6B7280' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#6B7280' }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#6B7280' }}>Stock</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#6B7280' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#6B7280' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 8, textAlign: 'center', color: '#6B7280' }}>
                    <CircularProgress size={24} sx={{ color: '#FF4742' }} />
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 8, textAlign: 'center', color: '#6B7280' }}>
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell sx={{ py: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 64, height: 64, borderRadius: 2, overflow: 'hidden', bgcolor: '#F3F4F6' }}>
                          {product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Box sx={{ alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center', color: '#9CA3AF' }}>
                              No image
                            </Box>
                          )}
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 700, color: '#111827' }}>{product.name}</Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            ID: {product.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 3, color: '#111827' }}>₫{Number(product.price).toLocaleString()}</TableCell>
                    <TableCell sx={{ py: 3, color: '#111827' }}>{product.stock}</TableCell>
                    <TableCell sx={{ py: 3 }}>
                      <Chip
                        label={product.status}
                        sx={{
                          backgroundColor: badgeColors[product.status]?.background ?? '#F3F4F6',
                          color: badgeColors[product.status]?.color ?? '#374151',
                          fontWeight: 700,
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ py: 3 }}>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                        <Button
                          variant="outlined"
                          disabled={product.isRejected}
                          sx={{ borderColor: '#E5E7EB', color: '#111827', textTransform: 'none' }}
                          onClick={() => navigate(`/seller/products/${product.id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          disabled={product.isRejected}
                          sx={{ borderColor: '#E5E7EB', color: '#111827', textTransform: 'none' }}
                          onClick={() => handleStatusToggle(product)}
                        >
                          {product.status === 'Hidden' ? 'Unhide' : 'Hide'}
                        </Button>
                      </Box>
                      {product.isRejected && (
                        <Typography variant="caption" sx={{ color: '#DC2626', display: 'block', mt: 1, fontWeight: 500 }}>
                          Rejected by Admin
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

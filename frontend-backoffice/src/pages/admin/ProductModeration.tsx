import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, Avatar, 
  Snackbar, Alert, CircularProgress
} from '@mui/material';
import { adminProductApi, type Product } from '../../utils/api';

export const ProductModeration: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getLocalizedText = (text: any) => typeof text === 'string' ? text : (text?.en || text?.vi || '');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await adminProductApi.getPendingProducts(1, 50);
      setProducts(res.data.data);
    } catch (err: any) {
      setError('Failed to fetch pending products');
      setToast({ open: true, message: err.response?.data?.message || 'Failed to load product list', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleReview = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      setActionLoading(id);
      await adminProductApi.reviewProduct(id, action);
      setToast({ open: true, message: `Product has been ${action === 'APPROVE' ? 'approved' : 'rejected'}`, severity: 'success' });
      fetchProducts();
    } catch (err: any) {
      setToast({ open: true, message: err.response?.data?.message || 'An error occurred', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseToast = () => setToast({ ...toast, open: false });

  return (
    <Box>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: '1px solid #E5E7EB', bgcolor: 'white', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
          Moderation Queue
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
          Review and determine the visibility status of products uploaded by sellers.
        </Typography>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#2563EB' }} />
        </Box>
      ) : error ? (
         <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#6B7280' }}>Image</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#6B7280' }}>Product Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#6B7280' }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#6B7280' }}>Seller</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#6B7280' }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8, color: '#6B7280' }}>
                    There are no products pending review at the moment.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ py: 3 }}>
                      <Avatar src={row.images?.[0]} variant="rounded" sx={{ width: 56, height: 56, border: '1px solid #E5E7EB', bgcolor: '#F3F4F6' }} />
                    </TableCell>
                    <TableCell sx={{ py: 3, color: '#111827', fontWeight: 600 }}>{getLocalizedText(row.name)}</TableCell>
                    <TableCell sx={{ py: 3, color: '#111827' }}>${row.price}</TableCell>
                    <TableCell sx={{ py: 3, color: '#374151' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>{row.seller.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>{row.seller.email}</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 3 }}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button 
                          variant="contained" 
                          disableElevation
                          disabled={actionLoading === row.id}
                          onClick={() => handleReview(row.id, 'APPROVE')}
                          sx={{ 
                            bgcolor: '#2563EB', 
                            '&:hover': { bgcolor: '#1D4ED8' },
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2
                          }}
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="outlined" 
                          disableElevation
                          disabled={actionLoading === row.id}
                          onClick={() => handleReview(row.id, 'REJECT')}
                          sx={{ 
                            color: '#4B5563', 
                            borderColor: '#D1D5DB',
                            '&:hover': { bgcolor: '#F3F4F6', borderColor: '#9CA3AF' },
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2
                          }}
                        >
                          Reject
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar 
        open={toast.open} 
        autoHideDuration={5000} 
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

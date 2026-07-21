import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, CircularProgress, Tabs, Tab,
  Pagination, Alert, Tooltip, IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { adminApi } from '../../hooks/useAdminApi';
import { ProductPreviewDrawer } from '../../components/ProductPreviewDrawer';

const STATUS_COLORS: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  Pending: 'warning',
  Published: 'success',
  Hidden: 'default',
  Draft: 'default',
};

export const ProductModerationPage: React.FC = () => {
  const [tab, setTab] = useState(0); // 0=Pending, 1=Published
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let result;
      if (tab === 0) {
        result = await adminApi.getPendingProducts(page, 10);
      } else {
        result = await adminApi.getAllProducts(page, 10);
      }
      setData(result);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  }, [page, tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (productId: string, action: 'APPROVE' | 'REJECT' | 'FORCE_HIDE') => {
    setActionLoading(productId);
    try {
      if (action === 'FORCE_HIDE') {
        await adminApi.forceHideProduct(productId);
        setMessage({ type: 'success', text: 'Product hidden successfully. AuditLog recorded.' });
      } else {
        await adminApi.reviewProduct(productId, action);
        setMessage({ type: 'success', text: `Product ${action === 'APPROVE' ? 'approved' : 'rejected'}.` });
      }
      fetchData();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
          Product Moderation
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
          Review and manage product submissions from sellers
        </Typography>
      </Box>

      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={(_, v) => { setTab(v); setPage(1); }}
        sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }, '& .Mui-selected': { color: '#2563EB' }, '& .MuiTabs-indicator': { bgcolor: '#2563EB' } }}
      >
        <Tab label="Pending Review" />
        <Tab label="All Products" />
      </Tabs>

      <Paper elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                {['Product Name', 'Category', 'Price', 'Seller', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#374151', fontSize: '0.8rem', borderBottom: '1px solid #E5E7EB' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={28} sx={{ color: '#2563EB' }} />
                  </TableCell>
                </TableRow>
              ) : data?.products?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: '#9CA3AF' }}>
                    No pending products.
                  </TableCell>
                </TableRow>
              ) : (
                data?.products?.map((p: any) => (
                  <TableRow key={p.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: '#111827', maxWidth: 200 }}>
                      <Tooltip title={p.name}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ color: '#4B5563' }}>{p.category}</TableCell>
                    <TableCell sx={{ color: '#4B5563' }}>
                      {Number(p.price).toLocaleString('vi-VN')}đ
                    </TableCell>
                    <TableCell sx={{ color: '#4B5563' }}>{p.seller?.name ?? '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={p.status}
                        size="small"
                        color={STATUS_COLORS[p.status] ?? 'default'}
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewProduct(p)}
                          sx={{ color: '#6B7280', '&:hover': { color: '#2563EB', bgcolor: '#EFF6FF' } }}
                          title="View"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {p.status === 'Pending' && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              disableElevation
                              startIcon={<CheckCircleIcon />}
                              disabled={actionLoading === p.id}
                              onClick={() => handleAction(p.id, 'APPROVE')}
                              sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<CancelIcon />}
                              disabled={actionLoading === p.id}
                              onClick={() => handleAction(p.id, 'REJECT')}
                              sx={{ borderColor: '#D1D5DB', color: '#374151', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {p.status === 'Published' && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityOffIcon />}
                            disabled={actionLoading === p.id}
                            onClick={() => handleAction(p.id, 'FORCE_HIDE')}
                            sx={{ borderColor: '#2563EB', color: '#2563EB', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', '&:hover': { bgcolor: '#EFF6FF', borderColor: '#DC2626' } }}
                          >
                            Force Hide
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {data?.meta && data.meta.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={data.meta.totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            sx={{ '& .Mui-selected': { bgcolor: '#2563EB !important', color: 'white' } }}
          />
        </Box>
      )}

      <ProductPreviewDrawer 
        open={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        productId={selectedProduct?.id} 
      />
    </Box>
  );
};

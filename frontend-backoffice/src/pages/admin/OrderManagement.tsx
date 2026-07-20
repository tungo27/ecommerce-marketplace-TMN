import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, CircularProgress, TextField, Select,
  MenuItem, FormControl, InputLabel, Pagination, Alert, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions, InputAdornment, List, ListItem, ListItemText
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import { adminApi } from '../../hooks/useAdminApi';
import { ProductPreviewDrawer } from '../../components/ProductPreviewDrawer';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PENDING:   { bg: '#FFFBEB', text: '#D97706', border: '#FCD34D' },
  CONFIRMED: { bg: '#EFF6FF', text: '#2563EB', border: '#93C5FD' },
  SHIPPED:   { bg: '#F5F3FF', text: '#7C3AED', border: '#C4B5FD' },
  DELIVERED: { bg: '#ECFDF5', text: '#059669', border: '#6EE7B7' },
  CANCELLED: { bg: '#EFF6FF', text: '#DC2626', border: '#FCA5A5' },
};

export const OrderManagement: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; orderId: string }>({ open: false, orderId: '' });
  
  const [itemsDialog, setItemsDialog] = useState<{ open: boolean; items: any[] }>({ open: false, items: [] });
  const [previewProductId, setPreviewProductId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getAllOrders({ search: search || undefined, status: statusFilter || undefined, page, limit: 15 });
      setData(result);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleForceCancel = async () => {
    try {
      await adminApi.forceCancelOrder(confirmDialog.orderId);
      setMessage({ type: 'success', text: 'Order cancelled and refund transaction created.' });
      fetchData();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setConfirmDialog({ open: false, orderId: '' });
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>Order Management</Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>Bird's-eye view of all platform orders</Typography>
      </Box>

      {message && <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>{message.text}</Alert>}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <TextField
            size="small"
            placeholder="Search by Order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#9CA3AF', fontSize: 20 }} /></InputAdornment>,
              },
            }}
            sx={{ width: 280, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </form>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">All</MenuItem>
            {['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Action'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#374151', fontSize: '0.8rem', borderBottom: '1px solid #E5E7EB' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}><CircularProgress size={28} sx={{ color: '#2563EB' }} /></TableCell></TableRow>
              ) : data?.orders?.length === 0 ? (
                <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: '#9CA3AF' }}>No orders found</TableCell></TableRow>
              ) : (
                data?.orders?.map((o: any) => {
                  const sc = STATUS_COLORS[o.status] ?? { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };
                  const canCancel = !['DELIVERED', 'CANCELLED'].includes(o.status);
                  return (
                    <TableRow key={o.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6B7280' }}>
                        {o.id.slice(0, 8)}…
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>{o.customer?.name}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{o.customer?.email}</Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#374151', fontSize: '0.875rem' }}>
                        <Typography 
                          sx={{ fontSize: 'inherit', color: '#2563EB', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          onClick={() => setItemsDialog({ open: true, items: o.items || [] })}
                        >
                          {o.items?.length ?? 0} item(s)
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#111827' }}>
                        {Number(o.totalAmount).toLocaleString('vi-VN')}đ
                      </TableCell>
                      <TableCell>
                        <Chip label={o.status} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }} />
                      </TableCell>
                      <TableCell sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
                        {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        {canCancel && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={() => setConfirmDialog({ open: true, orderId: o.id })}
                            sx={{ borderColor: '#2563EB', color: '#2563EB', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', '&:hover': { bgcolor: '#EFF6FF', borderColor: '#DC2626' } }}
                          >
                            Force Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {data?.meta?.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={data.meta.totalPages} page={page} onChange={(_, v) => setPage(v)} sx={{ '& .Mui-selected': { bgcolor: '#2563EB !important', color: 'white' } }} />
        </Box>
      )}

      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, orderId: '' })}>
        <DialogTitle sx={{ fontWeight: 700 }}>Force Cancel Order?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will cancel the order and create a <strong>REFUND transaction (PENDING)</strong>. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setConfirmDialog({ open: false, orderId: '' })} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" disableElevation onClick={handleForceCancel}
            sx={{ bgcolor: '#2563EB', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#DC2626' } }}>
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Items Dialog */}
      <Dialog open={itemsDialog.open} onClose={() => setItemsDialog({ open: false, items: [] })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Order Items</DialogTitle>
        <DialogContent dividers>
          <List>
            {itemsDialog.items.map((item: any) => (
              <ListItem key={item.id} divider>
                <ListItemText 
                  primary={
                    <Typography 
                      sx={{ color: '#2563EB', cursor: 'pointer', '&:hover': { textDecoration: 'underline' }, fontWeight: 600 }}
                      onClick={() => setPreviewProductId(item.productId)}
                    >
                      {item.product?.name || 'Unknown Product'}
                    </Typography>
                  } 
                  secondary={`Quantity: ${item.quantity} | Price: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}`} 
                />
              </ListItem>
            ))}
            {itemsDialog.items.length === 0 && (
              <Typography sx={{ p: 2, textAlign: 'center', color: '#6B7280' }}>No items found.</Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemsDialog({ open: false, items: [] })}>Close</Button>
        </DialogActions>
      </Dialog>

      <ProductPreviewDrawer 
        open={!!previewProductId} 
        onClose={() => setPreviewProductId(null)} 
        productId={previewProductId!} 
      />
    </Box>
  );
};

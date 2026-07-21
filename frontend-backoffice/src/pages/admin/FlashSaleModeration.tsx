import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { apiClient } from '../../utils/api';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Seller {
  name: string;
  email: string;
}

interface FlashSale {
  id: string;
  product: Product;
  seller: Seller;
  discountPercentage: number;
  salePrice: number;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const FlashSaleModeration: React.FC = () => {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [adminNote, setAdminNote] = useState('');

  const showToast = (message: string, severity: 'success' | 'error') => setToast({ open: true, message, severity });

  useEffect(() => {
    fetchFlashSales();
  }, []);

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/flash-sales/admin');
      setFlashSales(res.data.data || res.data || []);
    } catch (error) {
      showToast('Failed to load flash sales', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.patch(`/flash-sales/admin/${id}`, { status: 'APPROVED' });
      showToast('Flash sale approved', 'success');
      fetchFlashSales();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to approve', 'error');
    }
  };

  const handleReject = async () => {
    if (!adminNote) {
      showToast('Please provide a reason for rejection', 'error');
      return;
    }
    try {
      await apiClient.patch(`/flash-sales/admin/${rejectDialog.id}`, { status: 'REJECTED', adminNote });
      showToast('Flash sale rejected', 'success');
      setRejectDialog({ open: false, id: '' });
      setAdminNote('');
      fetchFlashSales();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to reject', 'error');
    }
  };

  if (loading && flashSales.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#0d9488' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: '#F9FAFB', minHeight: '100vh' }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: '1px solid #E5E7EB', bgcolor: 'white', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mb: 3 }}>
          Flash Sale Moderation
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Seller</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Discount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sale Price</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Timeframe</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flashSales.map((fs) => (
                <TableRow key={fs.id}>
                  <TableCell>{fs.product?.name}</TableCell>
                  <TableCell>
                    {fs.seller?.name} <br />
                    <Typography variant="caption" color="textSecondary">{fs.seller?.email}</Typography>
                  </TableCell>
                  <TableCell>{fs.discountPercentage}%</TableCell>
                  <TableCell>${Number(fs.salePrice).toFixed(2)}</TableCell>
                  <TableCell>
                    {new Date(fs.startTime).toLocaleString()} - <br/> {new Date(fs.endTime).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="contained" color="success" size="small" onClick={() => handleApprove(fs.id)}>
                        Approve
                      </Button>
                      <Button variant="outlined" color="error" size="small" onClick={() => setRejectDialog({ open: true, id: fs.id })}>
                        Reject
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {flashSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No pending flash sale requests.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, id: '' })}>
        <DialogTitle>Reject Flash Sale</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for rejection"
            type="text"
            fullWidth
            variant="outlined"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, id: '' })}>Cancel</Button>
          <Button onClick={handleReject} color="error" variant="contained">Reject</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast(prev => ({ ...prev, open: false }))}>
        <Alert onClose={() => setToast(prev => ({ ...prev, open: false }))} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

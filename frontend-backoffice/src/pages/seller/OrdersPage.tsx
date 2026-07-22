import React, { useEffect, useState } from 'react';
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
  Chip,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  TablePagination,
  MenuItem,
  Select,
} from '@mui/material';
import { useSellerOrders, type Order } from '../../hooks/useSellerOrders';

const statusMap: Record<Order['status'], { label: string; color: 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default' }> = {
  PENDING: { label: 'Pending', color: 'warning' },
  CONFIRMED: { label: 'Confirmed', color: 'info' },
  SHIPPED: { label: 'Shipped', color: 'primary' },
  DELIVERED: { label: 'Delivered', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'error' },
  CANCELLATION_REQUESTED: { label: 'Cancel Requested', color: 'warning' },
};

const getNextStatus = (current: Order['status']): Order['status'] | null => {
  switch (current) {
    case 'PENDING':
      return 'CONFIRMED';
    case 'CONFIRMED':
      return 'SHIPPED';
    case 'SHIPPED':
      return 'DELIVERED';
    default:
      return null;
  }
};

const getActionLabel = (next: Order['status'] | null): string => {
  if (next === 'CONFIRMED') return 'Confirm Order';
  if (next === 'SHIPPED') return 'Ship Order';
  if (next === 'DELIVERED') return 'Mark Delivered';
  return '';
};

export const OrdersPage: React.FC = () => {
  const { orders, total, loading, error, fetchOrders, updateOrderStatus, handleCancellationRequest } = useSellerOrders();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [statusFilter, setStatusFilter] = useState<string>('');

  const getLocalizedText = (text: any) => typeof text === 'string' ? text : (text?.en || text?.vi || '');

  useEffect(() => {
    fetchOrders(page + 1, rowsPerPage);
  }, [fetchOrders, page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: Order['status']) => {
    const success = await updateOrderStatus(orderId, nextStatus);
    if (success) {
      setToast({ open: true, message: `Status updated to ${statusMap[nextStatus].label}`, severity: 'success' });
    } else {
      setToast({ open: true, message: 'Failed to update status', severity: 'error' });
    }
  };

  const handleCancellationDecision = async (orderId: string, approve: boolean) => {
    const success = await handleCancellationRequest(orderId, approve);
    if (success) {
      setToast({
        open: true,
        message: approve ? 'Cancellation approved. Order has been cancelled.' : 'Cancellation rejected. Order restored.',
        severity: 'success',
      });
      fetchOrders(page + 1, rowsPerPage); // refresh to get actual server status
    } else {
      setToast({ open: true, message: 'Failed to process cancellation request.', severity: 'error' });
    }
  };

  if (loading && orders.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#FF4742' }} />
      </Box>
    );
  }

  const filteredOrders = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;

  return (
    <Box sx={{ p: 4, bgcolor: '#F9FAFB', minHeight: '100vh' }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: '1px solid #E5E7EB', bgcolor: 'white', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827' }}>
          Order Management
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
          Manage your store's customer orders and status updates.
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
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="CONFIRMED">Confirmed</MenuItem>
            <MenuItem value="SHIPPED">Shipped</MenuItem>
            <MenuItem value="DELIVERED">Delivered</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
            <MenuItem value="CANCELLATION_REQUESTED">Cancel Requested</MenuItem>
          </Select>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          borderRadius: 2,
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#F3F4F6' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '35%' }}>Products</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '260px' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#6B7280' }}>
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const nextStatus = getNextStatus(order.status);
                const actionLabel = getActionLabel(nextStatus);

                return (
                  <TableRow key={order.id} hover>
                    <TableCell sx={{ color: '#4B5563', fontSize: '0.875rem' }}>
                      {order.id.split('-')[0]}
                    </TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString('en-US')}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {order.customer.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {order.phoneNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {order.items.map((item, idx) => (
                        <Typography 
                          key={idx} 
                          variant="body2" 
                          sx={{ 
                            mb: 0.5, 
                            display: '-webkit-box', 
                            WebkitLineClamp: 2, 
                            WebkitBoxOrient: 'vertical', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            wordBreak: 'break-word'
                          }}
                        >
                          • {getLocalizedText(item.product.name)} (x{item.quantity})
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#111827' }}>
                      {Number(order.totalAmount).toLocaleString()}đ
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusMap[order.status]?.label || order.status}
                        color={statusMap[order.status]?.color || 'default'}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, justifyContent: 'center' }}>
                        {/* Cancel Request: show Approve/Reject buttons */}
                        {order.status === 'CANCELLATION_REQUESTED' && (
                          <>
                            <Button
                              variant="contained"
                              disableElevation
                              size="small"
                              onClick={() => handleCancellationDecision(order.id, true)}
                              sx={{
                                bgcolor: '#DC2626',
                                color: 'white',
                                textTransform: 'none',
                                fontWeight: 'bold',
                                width: '120px',
                                whiteSpace: 'nowrap',
                                '&:hover': { bgcolor: '#B91C1C' },
                              }}
                            >
                              Approve Cancel
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleCancellationDecision(order.id, false)}
                              sx={{
                                borderColor: '#16A34A',
                                color: '#16A34A',
                                textTransform: 'none',
                                fontWeight: 'bold',
                                width: '120px',
                                whiteSpace: 'nowrap',
                                '&:hover': { bgcolor: '#F0FDF4', borderColor: '#15803D' },
                              }}
                            >
                              Reject Cancel
                            </Button>
                          </>
                        )}
                        {/* Normal orders: advance status */}
                        {order.status !== 'CANCELLATION_REQUESTED' && nextStatus && (
                          <Button
                            variant="contained"
                            disableElevation
                            size="small"
                            onClick={() => handleUpdateStatus(order.id, nextStatus)}
                            sx={{
                              bgcolor: '#FF4742',
                              color: 'white',
                              textTransform: 'none',
                              fontWeight: 'bold',
                              width: '120px',
                              whiteSpace: 'nowrap',
                              '&:hover': { bgcolor: '#E63E39' },
                            }}
                          >
                            {actionLabel}
                          </Button>
                        )}
                        {order.status !== 'CANCELLATION_REQUESTED' && order.status !== 'SHIPPED' && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to cancel this order?')) {
                                handleUpdateStatus(order.id, 'CANCELLED');
                              }
                            }}
                            sx={{
                              borderColor: '#E5E7EB',
                              color: '#111827',
                              textTransform: 'none',
                              width: '80px',
                              whiteSpace: 'nowrap',
                              '&:hover': { bgcolor: '#F9FAFB', borderColor: '#D1D5DB' },
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={statusFilter ? filteredOrders.length : total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Rows per page:"
        />
      </TableContainer>

      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

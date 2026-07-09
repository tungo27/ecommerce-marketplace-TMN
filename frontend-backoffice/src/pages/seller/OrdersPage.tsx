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
} from '@mui/material';
import { useSellerOrders, type Order } from '../../hooks/useSellerOrders';

const statusMap: Record<Order['status'], { label: string; color: 'warning' | 'info' | 'primary' | 'success' | 'error' }> = {
  PENDING: { label: 'Chờ xác nhận', color: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'info' },
  SHIPPED: { label: 'Đang giao hàng', color: 'primary' },
  DELIVERED: { label: 'Đã giao', color: 'success' },
  CANCELLED: { label: 'Đã hủy', color: 'error' },
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
  if (next === 'CONFIRMED') return 'Xác nhận đơn';
  if (next === 'SHIPPED') return 'Giao hàng';
  if (next === 'DELIVERED') return 'Hoàn thành';
  return '';
};

export const OrdersPage: React.FC = () => {
  const { orders, total, loading, error, fetchOrders, updateOrderStatus } = useSellerOrders();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

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
      setToast({ open: true, message: `Đã chuyển trạng thái thành ${statusMap[nextStatus].label}`, severity: 'success' });
    } else {
      setToast({ open: true, message: 'Cập nhật thất bại', severity: 'error' });
    }
  };

  if (loading && orders.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#FF4742' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: '#F9FAFB', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, color: '#111827' }}>
        Quản lý Đơn hàng
      </Typography>

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
              <TableCell sx={{ fontWeight: 'bold' }}>Mã đơn</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Ngày đặt</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Khách hàng</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Sản phẩm</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tổng tiền</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#6B7280' }}>
                  Không có đơn hàng nào
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const nextStatus = getNextStatus(order.status);
                const actionLabel = getActionLabel(nextStatus);

                return (
                  <TableRow key={order.id} hover>
                    <TableCell sx={{ color: '#4B5563', fontSize: '0.875rem' }}>
                      {order.id.split('-')[0]}
                    </TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {order.customer.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {order.phoneNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {order.items.map((item, idx) => (
                        <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                          • {item.product.name} (x{item.quantity})
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
                        {nextStatus && (
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
                              '&:hover': {
                                bgcolor: '#E63E39',
                              },
                            }}
                          >
                            {actionLabel}
                          </Button>
                        )}
                        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
                                handleUpdateStatus(order.id, 'CANCELLED');
                              }
                            }}
                            sx={{
                              borderColor: '#E5E7EB',
                              color: '#111827',
                              textTransform: 'none',
                              '&:hover': {
                                bgcolor: '#F9FAFB',
                                borderColor: '#D1D5DB'
                              },
                            }}
                          >
                            Hủy
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
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Số dòng:"
        />
      </TableContainer>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
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

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, CircularProgress, Tabs, Tab,
  Pagination, Alert, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { adminApi } from '../../hooks/useAdminApi';
import { useNavigate } from 'react-router-dom';

export const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0); // 0=Customers, 1=Sellers
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; userId: string; name: string; isActive: boolean }>({
    open: false, userId: '', name: '', isActive: true,
  });

  const roleMap = ['CUSTOMER', 'SELLER'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getUsers(roleMap[tab], page, 20);
      setData(result);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBanConfirm = async () => {
    try {
      await adminApi.toggleUserBan(confirmDialog.userId, confirmDialog.isActive);
      setMessage({ type: 'success', text: `User ${confirmDialog.isActive ? 'activated' : 'banned'} successfully.` });
      fetchData();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>User Management</Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>Manage customers and sellers on the platform</Typography>
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
        <Tab label="Customers" />
        <Tab label="Sellers" />
      </Tabs>

      <Paper elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                {['Name', 'Email', 'Joined', tab === 1 ? 'Products' : 'Orders', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#374151', fontSize: '0.8rem', borderBottom: '1px solid #E5E7EB' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}><CircularProgress size={28} sx={{ color: '#2563EB' }} /></TableCell></TableRow>
              ) : data?.users?.length === 0 ? (
                <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: '#9CA3AF' }}>No users found</TableCell></TableRow>
              ) : (
                data?.users?.map((u: any) => (
                  <TableRow key={u.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: '#111827' }}>{u.name}</TableCell>
                    <TableCell sx={{ color: '#6B7280', fontSize: '0.875rem' }}>{u.email}</TableCell>
                    <TableCell sx={{ color: '#6B7280', fontSize: '0.8rem' }}>
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell sx={{ color: '#374151', fontWeight: 600 }}>
                      {tab === 1 ? u._count.products : u._count.orders}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.isActive ? 'Active' : 'Banned'}
                        size="small"
                        sx={{
                          fontWeight: 700, fontSize: '0.75rem',
                          bgcolor: u.isActive ? '#ECFDF5' : '#EFF6FF',
                          color: u.isActive ? '#059669' : '#DC2626',
                          border: `1px solid ${u.isActive ? '#6EE7B7' : '#FCA5A5'}`,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant={u.isActive ? 'outlined' : 'contained'}
                          disableElevation
                          startIcon={u.isActive ? <BlockIcon /> : <CheckCircleOutlinedIcon />}
                          onClick={() => setConfirmDialog({ open: true, userId: u.id, name: u.name, isActive: !u.isActive })}
                          sx={{
                            textTransform: 'none', fontWeight: 600, fontSize: '0.75rem',
                            borderColor: u.isActive ? '#2563EB' : '#10B981',
                            color: u.isActive ? '#2563EB' : 'white',
                            bgcolor: u.isActive ? 'transparent' : '#10B981',
                            '&:hover': { bgcolor: u.isActive ? '#EFF6FF' : '#059669', borderColor: u.isActive ? '#DC2626' : '#059669' },
                          }}
                        >
                          {u.isActive ? 'Ban' : 'Unban'}
                        </Button>
                        {tab === 1 && (
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<OpenInNewIcon />}
                            onClick={() => navigate(`/admin/sellers/${u.id}`)}
                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', color: '#3B82F6' }}
                          >
                            View
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

      {data?.meta?.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={data.meta.totalPages} page={page} onChange={(_, v) => setPage(v)} sx={{ '& .Mui-selected': { bgcolor: '#2563EB !important', color: 'white' } }} />
        </Box>
      )}

      {/* Ban Confirm Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {confirmDialog.isActive ? 'Unban User' : 'Ban User'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to <strong>{confirmDialog.isActive ? 'unban' : 'ban'}</strong> user <strong>{confirmDialog.name}</strong>?
            {!confirmDialog.isActive && ' This will prevent them from logging in.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleBanConfirm}
            sx={{ bgcolor: confirmDialog.isActive ? '#10B981' : '#2563EB', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: confirmDialog.isActive ? '#059669' : '#DC2626' } }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

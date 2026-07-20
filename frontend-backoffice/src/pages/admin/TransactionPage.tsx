import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, FormControl, InputLabel,
  Select, MenuItem, Pagination,
} from '@mui/material';
import { adminApi } from '../../hooks/useAdminApi';

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  DEBIT:  { bg: '#EFF6FF', text: '#DC2626' },
  CREDIT: { bg: '#ECFDF5', text: '#059669' },
  REFUND: { bg: '#FFFBEB', text: '#D97706' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:  { bg: '#FFFBEB', text: '#D97706' },
  SETTLED:  { bg: '#ECFDF5', text: '#059669' },
};

export const TransactionPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getTransactions({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 20,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>Transactions</Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
          Platform transaction ledger — for seller reconciliation
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} label="Type" onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} sx={{ borderRadius: 2 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="DEBIT">DEBIT</MenuItem>
            <MenuItem value="CREDIT">CREDIT</MenuItem>
            <MenuItem value="REFUND">REFUND</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} sx={{ borderRadius: 2 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="PENDING">PENDING</MenuItem>
            <MenuItem value="SETTLED">SETTLED</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                {['Tx ID', 'Order', 'Customer', 'Amount', 'Type', 'Status', 'Description', 'Date'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#374151', fontSize: '0.8rem', borderBottom: '1px solid #E5E7EB' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}><CircularProgress size={28} sx={{ color: '#2563EB' }} /></TableCell></TableRow>
              ) : data?.transactions?.length === 0 ? (
                <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: '#9CA3AF' }}>No transactions found</TableCell></TableRow>
              ) : (
                data?.transactions?.map((tx: any) => {
                  const tc = TYPE_COLORS[tx.type] ?? { bg: '#F3F4F6', text: '#374151' };
                  const sc = STATUS_COLORS[tx.status] ?? { bg: '#F3F4F6', text: '#374151' };
                  return (
                    <TableRow key={tx.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#9CA3AF' }}>{tx.id.slice(0, 8)}…</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6B7280' }}>{tx.orderId.slice(0, 8)}…</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', color: '#374151' }}>{tx.order?.customer?.name ?? '—'}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: tx.type === 'CREDIT' ? '#059669' : tx.type === 'DEBIT' ? '#DC2626' : '#D97706' }}>
                        {tx.type === 'CREDIT' ? '+' : '-'}{Number(tx.amount).toLocaleString('vi-VN')}đ
                      </TableCell>
                      <TableCell>
                        <Chip label={tx.type} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: tc.bg, color: tc.text }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={tx.status} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: sc.bg, color: sc.text }} />
                      </TableCell>
                      <TableCell sx={{ color: '#6B7280', fontSize: '0.8rem', maxWidth: 160 }}>
                        <Typography noWrap sx={{ fontSize: 'inherit' }}>{tx.description}</Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#9CA3AF', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
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
    </Box>
  );
};

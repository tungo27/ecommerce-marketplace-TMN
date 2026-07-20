import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, CircularProgress, Pagination, Rating, Alert,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { adminApi } from '../../hooks/useAdminApi';
import { ProductPreviewDrawer } from '../../components/ProductPreviewDrawer';

export const ReviewModeration: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewProductId, setPreviewProductId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getAllReviews(page, 20);
      setData(result);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      await adminApi.toggleReviewVisibility(reviewId);
      setMessage({ type: 'success', text: 'Review visibility updated.' });
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
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>Review Moderation</Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
          Monitor and moderate customer reviews across all products
        </Typography>
      </Box>

      {message && <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                {['Reviewer', 'Product', 'Rating', 'Comment', 'Has Reply', 'Visibility', 'Date', 'Action'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: '#374151', fontSize: '0.8rem', borderBottom: '1px solid #E5E7EB' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}><CircularProgress size={28} sx={{ color: '#2563EB' }} /></TableCell></TableRow>
              ) : data?.reviews?.length === 0 ? (
                <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: '#9CA3AF' }}>No reviews yet</TableCell></TableRow>
              ) : (
                data?.reviews?.map((r: any) => (
                  <TableRow
                    key={r.id}
                    hover
                    sx={{ '&:last-child td': { border: 0 }, opacity: r.isHidden ? 0.5 : 1 }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>{r.user?.name}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{r.user?.email}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#374151', fontSize: '0.875rem', maxWidth: 160 }}>
                      <Typography 
                        noWrap 
                        sx={{ fontSize: 'inherit', color: '#2563EB', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        onClick={() => setPreviewProductId(r.productId)}
                      >
                        {r.product?.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Rating value={r.rating} readOnly size="small" sx={{ color: '#F59E0B' }} />
                    </TableCell>
                    <TableCell sx={{ color: '#4B5563', fontSize: '0.8rem', maxWidth: 200 }}>
                      <Typography noWrap sx={{ fontSize: 'inherit' }}>{r.comment ?? <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>No comment</span>}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.reply ? 'Yes' : 'No'}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: r.reply ? '#EFF6FF' : '#F9FAFB', color: r.reply ? '#2563EB' : '#9CA3AF' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.isHidden ? 'Hidden' : 'Visible'}
                        size="small"
                        sx={{
                          fontWeight: 700, fontSize: '0.7rem',
                          bgcolor: r.isHidden ? '#EFF6FF' : '#ECFDF5',
                          color: r.isHidden ? '#DC2626' : '#059669',
                          border: `1px solid ${r.isHidden ? '#FCA5A5' : '#6EE7B7'}`,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#9CA3AF', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={r.isHidden ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        disabled={actionLoading === r.id}
                        onClick={() => handleToggle(r.id)}
                        sx={{
                          textTransform: 'none', fontWeight: 600, fontSize: '0.75rem',
                          borderColor: r.isHidden ? '#10B981' : '#2563EB',
                          color: r.isHidden ? '#10B981' : '#2563EB',
                          '&:hover': { bgcolor: r.isHidden ? '#ECFDF5' : '#EFF6FF' },
                        }}
                      >
                        {r.isHidden ? 'Restore' : 'Hide'}
                      </Button>
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

      <ProductPreviewDrawer 
        open={!!previewProductId} 
        onClose={() => setPreviewProductId(null)} 
        productId={previewProductId!} 
      />
    </Box>
  );
};

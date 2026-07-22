import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Chip, Pagination,
} from '@mui/material';
import { adminApi } from '../../hooks/useAdminApi';

const ACTION_COLORS: Record<string, string> = {
  APPROVE: '#10B981',
  REJECT: '#EF4444',
  FORCE_HIDE: '#F59E0B',
};

export const AuditLogPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getAuditLogs(page, 20);
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
          Audit Log
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
          Full history of admin moderation actions — anti-abuse trail
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                {['Timestamp', 'Admin', 'Action', 'Target Type', 'Target ID', 'Details'].map((h) => (
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
              ) : data?.logs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: '#9CA3AF' }}>
                    No audit logs yet
                  </TableCell>
                </TableRow>
              ) : (
                data?.logs?.map((log: any) => (
                  <TableRow key={log.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ color: '#6B7280', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                        {log.admin?.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                        {log.admin?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        sx={{
                          fontWeight: 700, fontSize: '0.7rem',
                          bgcolor: (ACTION_COLORS[log.action] ?? '#9CA3AF') + '22',
                          color: ACTION_COLORS[log.action] ?? '#374151',
                          border: `1px solid ${ACTION_COLORS[log.action] ?? '#9CA3AF'}`,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                      {log.targetType}
                    </TableCell>
                    <TableCell sx={{ color: '#9CA3AF', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      {log.targetId ? (log.targetId.length > 8 ? log.targetId.slice(0, 8) + '…' : log.targetId) : '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: '#4B5563', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.details ? JSON.stringify(log.details) : ''}>
                      {log.details ? JSON.stringify(log.details) : '—'}
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
          <Pagination
            count={data.meta.totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            sx={{ '& .Mui-selected': { bgcolor: '#2563EB !important', color: 'white' } }}
          />
        </Box>
      )}
    </Box>
  );
};

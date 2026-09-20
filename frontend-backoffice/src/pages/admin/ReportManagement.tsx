import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, CircularProgress, Alert,
  Select, MenuItem, FormControl, InputLabel, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { adminApi } from '../../hooks/useAdminApi';

const STATUS_COLORS: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};


export const ReportManagement: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; report: any | null; decision: 'APPROVED' | 'REJECTED' | null }>({ open: false, report: null, decision: null });
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getReports();
      setReports(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const openReviewDialog = (report: any, decision: 'APPROVED' | 'REJECTED') => {
    setReviewDialog({ open: true, report, decision });
    setAdminNote('');
  };

  const handleReview = async () => {
    if (!reviewDialog.report || !reviewDialog.decision) return;
    setSubmitting(true);
    try {
      await adminApi.reviewReport(reviewDialog.report.id, { status: reviewDialog.decision, adminNote });
      setReviewDialog({ open: false, report: null, decision: null });
      fetchReports();
    } catch (e: any) {
      alert(e.message || 'Failed to review report');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = statusFilter ? reports.filter((r) => r.status === statusFilter) : reports;

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
          Product Reports
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
          Review customer reports about inappropriate or unsafe products
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
            <MenuItem value="">All</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="APPROVED">Approved</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="textSecondary">{filtered.length} report{filtered.length !== 1 ? 's' : ''}</Typography>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F9FAFB' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reporter</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 200 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#6B7280' }}>No reports found.</TableCell></TableRow>
              ) : filtered.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {r.product?.images?.[0] && (
                        <img src={r.product.images[0]} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                      )}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.product?.name}</Typography>
                        <Typography variant="caption" color="textSecondary">by {r.product?.seller?.name}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{r.reporter?.name}</Typography>
                    <Typography variant="caption" color="textSecondary">{r.reporter?.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.reason}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={r.status} color={STATUS_COLORS[r.status] ?? 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    {r.status === 'PENDING' ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => openReviewDialog(r, 'APPROVED')}
                          sx={{ textTransform: 'none', fontWeight: 'bold' }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => openReviewDialog(r, 'REJECTED')}
                          sx={{ textTransform: 'none', fontWeight: 'bold' }}
                        >
                          Reject
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        {r.adminNote || '-'}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Review Confirmation Dialog */}
      <Dialog open={reviewDialog.open} onClose={() => setReviewDialog({ open: false, report: null, decision: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {reviewDialog.decision === 'APPROVED' ? '✅ Approve Report' : '❌ Reject Report'}
        </DialogTitle>
        <DialogContent>
          {reviewDialog.decision === 'APPROVED' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Approving this report will <strong>automatically hide the product</strong> from the marketplace.
            </Alert>
          )}
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Product:</strong> {reviewDialog.report?.product?.name}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Reported for:</strong> {reviewDialog.report?.reason}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Admin Note (optional)"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Add a note to explain your decision..."
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setReviewDialog({ open: false, report: null, decision: null })} color="inherit" sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            onClick={handleReview}
            variant="contained"
            color={reviewDialog.decision === 'APPROVED' ? 'success' : 'error'}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          >
            {submitting ? 'Submitting...' : `Confirm ${reviewDialog.decision === 'APPROVED' ? 'Approval' : 'Rejection'}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

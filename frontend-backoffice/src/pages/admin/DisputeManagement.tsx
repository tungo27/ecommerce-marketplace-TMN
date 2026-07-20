import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, CircularProgress, Alert, Drawer,
  TextField, IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { adminApi } from '../../hooks/useAdminApi';

export const DisputeManagement: React.FC = () => {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getDisputes();
      setDisputes(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const loadDisputeDetails = async (id: string) => {
    try {
      const data = await adminApi.getDisputeDetails(id);
      setSelectedDispute(data);
      setDrawerOpen(true);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e: any) {
      alert(e.message || 'Failed to fetch dispute details');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedDispute) return;
    setSending(true);
    try {
      await adminApi.sendDisputeMessage(selectedDispute.id, message);
      setMessage('');
      loadDisputeDetails(selectedDispute.id); // Reload messages
    } catch (e: any) {
      alert(e.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (status: 'IN_REVIEW' | 'RESOLVED_REFUND' | 'RESOLVED_REJECT') => {
    try {
      await adminApi.resolveDispute(selectedDispute.id, status);
      loadDisputeDetails(selectedDispute.id);
      fetchDisputes();
    } catch (e: any) {
      alert(e.message || 'Failed to update status');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
          Disputes & Complaints
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
          Manage customer complaints and mediate disputes
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F9FAFB' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Order ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
              ) : disputes.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center">No disputes found.</TableCell></TableRow>
              ) : disputes.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell>{d.id.substring(0,8)}...</TableCell>
                  <TableCell>{d.orderId.substring(0,8)}...</TableCell>
                  <TableCell>{d.customer?.name}</TableCell>
                  <TableCell>{d.reason}</TableCell>
                  <TableCell>
                    <Chip 
                      label={d.status} 
                      color={d.status === 'OPEN' ? 'error' : d.status === 'IN_REVIEW' ? 'warning' : 'success'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => loadDisputeDetails(d.id)} sx={{ color: '#2563EB' }}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Detail & Chat Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 450, display: 'flex', flexDir: 'column', height: '100%' }}>
          {selectedDispute && (
            <>
              {/* Header */}
              <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Dispute Details</Typography>
                <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
              </Box>

              {/* Info */}
              <Box sx={{ p: 2, bgcolor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Order: {selectedDispute.orderId}</Typography>
                <Typography variant="body2">Customer: {selectedDispute.customer?.name} ({selectedDispute.customer?.email})</Typography>
                <Typography variant="body2" sx={{ mt: 1, color: '#4b5563' }}>Reason: {selectedDispute.reason}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: '#4b5563' }}>{selectedDispute.description}</Typography>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined" color="warning" onClick={() => handleUpdateStatus('IN_REVIEW')}>Mark Review</Button>
                  <Button size="small" variant="contained" color="success" onClick={() => handleUpdateStatus('RESOLVED_REFUND')}>Refund</Button>
                  <Button size="small" variant="contained" color="error" onClick={() => handleUpdateStatus('RESOLVED_REJECT')}>Reject</Button>
                </Box>
              </Box>

              {/* Chat History */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                {selectedDispute.messages?.map((msg: any) => {
                  const isAdmin = msg.sender.role === 'ADMIN';
                  return (
                    <Box key={msg.id} sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                      <Typography variant="caption" sx={{ color: '#6b7280', mb: 0.5 }}>{msg.sender.name}</Typography>
                      <Paper sx={{ p: 1.5, bgcolor: isAdmin ? '#2563EB' : '#F3F4F6', color: isAdmin ? 'white' : 'black', borderRadius: 2, maxWidth: '85%' }}>
                        <Typography variant="body2">{msg.message}</Typography>
                      </Paper>
                    </Box>
                  );
                })}
                <div ref={chatEndRef} />
              </Box>

              {/* Input */}
              <Box sx={{ p: 2, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 1 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder="Type a message..." 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <IconButton color="primary" onClick={handleSendMessage} disabled={sending || !message.trim()}>
                  <SendIcon />
                </IconButton>
              </Box>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

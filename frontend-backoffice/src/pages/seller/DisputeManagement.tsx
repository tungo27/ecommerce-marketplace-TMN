import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, CircularProgress, Alert, Drawer,
  TextField, IconButton, Tooltip
} from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { apiClient } from '../../utils/api';
import { io, Socket } from 'socket.io-client';

export const DisputeManagement: React.FC = () => {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/disputes');
      setDisputes(res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  useEffect(() => {
    if (selectedDispute && drawerOpen) {
      const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000/disputes');
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_dispute_room', { disputeId: selectedDispute.id });
      });

      socket.on('new_dispute_message', (msg: any) => {
        setSelectedDispute((prev: any) => {
          if (!prev) return prev;
          // Avoid duplicates
          if (prev.messages?.find((m: any) => m.id === msg.id)) return prev;
          return { ...prev, messages: [...(prev.messages || []), msg] };
        });
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });

      socket.on('dispute_status_updated', (data: any) => {
        setSelectedDispute((prev: any) => prev ? { ...prev, status: data.status } : null);
        fetchDisputes(); // Refresh the list to update status there too
      });

      return () => {
        socket.emit('leave_dispute_room', { disputeId: selectedDispute.id });
        socket.disconnect();
      };
    }
  }, [selectedDispute?.id, drawerOpen, fetchDisputes]);

  const loadDisputeDetails = async (id: string) => {
    try {
      const res = await apiClient.get(`/disputes/${id}`);
      setSelectedDispute(res.data);
      setDrawerOpen(true);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to fetch dispute details');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedDispute) return;
    setSending(true);
    try {
      await apiClient.post(`/disputes/${selectedDispute.id}/messages`, { message });
      setMessage('');
      // Message is appended via socket
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'OPEN') return 'error';
    if (status === 'IN_REVIEW') return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
          Disputes & Complaints
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
          Manage customer complaints for your store's orders
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
                  <TableCell>{d.id.substring(0, 8)}...</TableCell>
                  <TableCell>{d.orderId.substring(0, 8)}...</TableCell>
                  <TableCell>{d.customer?.name}</TableCell>
                  <TableCell>{d.reason}</TableCell>
                  <TableCell>
                    <Chip
                      label={d.status}
                      color={getStatusColor(d.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Open Chat">
                      <IconButton size="small" onClick={() => loadDisputeDetails(d.id)} sx={{ color: '#2563EB' }}>
                        <ForumIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Detail & Chat Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 450, display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                <Typography variant="body2">Customer: {selectedDispute.customer?.name}</Typography>
                <Typography variant="body2" sx={{ mt: 1, color: '#4b5563' }}>Reason: {selectedDispute.reason}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: '#4b5563', fontStyle: 'italic' }}>"{selectedDispute.description}"</Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip size="small" label={selectedDispute.status} color={getStatusColor(selectedDispute.status)} />
                </Box>
              </Box>

              {/* Chat History */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#F9FAFB' }}>
                {selectedDispute.messages?.length === 0 ? (
                  <Typography align="center" color="textSecondary" sx={{ mt: 4 }}>No messages yet.</Typography>
                ) : (
                  selectedDispute.messages?.map((msg: any) => {
                    const isMe = msg.sender.role === 'SELLER';
                    const isAdmin = msg.sender.role === 'ADMIN';
                    return (
                      <Box key={msg.id} sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', mb: 0.5 }}>
                          {isAdmin ? 'Admin Support' : isMe ? 'You' : msg.sender.name}
                        </Typography>
                        <Paper sx={{ p: 1.5, bgcolor: isMe ? '#2563EB' : '#fff', color: isMe ? 'white' : 'black', borderRadius: 2, maxWidth: '85%' }}>
                          <Typography variant="body2">{msg.message}</Typography>
                        </Paper>
                      </Box>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </Box>

              {/* Input */}
              <Box sx={{ p: 2, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 1, bgcolor: '#fff' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={selectedDispute.status.includes('RESOLVED') ? "Dispute is resolved" : "Type your message..."}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={selectedDispute.status.includes('RESOLVED') || sending}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={sending || !message.trim() || selectedDispute.status.includes('RESOLVED')}
                >
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

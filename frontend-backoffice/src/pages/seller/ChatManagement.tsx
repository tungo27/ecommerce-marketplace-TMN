import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Alert, Drawer,
  TextField, IconButton, Tooltip
} from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { apiClient } from '../../utils/api';
import { io, Socket } from 'socket.io-client';

export const ChatManagement: React.FC = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchChats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/chats');
      setChats(res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  useEffect(() => {
    if (selectedChat && drawerOpen) {
      const socketUrl = (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000') + '/chats';
      const socket = io(socketUrl);
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_chat_room', { chatId: selectedChat.id });
      });

      socket.on('new_chat_message', (msg: any) => {
        setSelectedChat((prev: any) => {
          if (!prev) return prev;
          if (prev.messages?.find((m: any) => m.id === msg.id)) return prev;
          return { ...prev, messages: [...(prev.messages || []), msg] };
        });
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });

      return () => {
        socket.emit('leave_chat_room', { chatId: selectedChat.id });
        socket.disconnect();
      };
    }
  }, [selectedChat?.id, drawerOpen]);

  const loadChatDetails = async (id: string) => {
    try {
      const res = await apiClient.get(`/chats/${id}`);
      setSelectedChat(res.data);
      setDrawerOpen(true);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to fetch chat details');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;
    setSending(true);
    try {
      await apiClient.post(`/chats/${selectedChat.id}/messages`, { message });
      setMessage('');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
          Order Chats
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
          Chat with customers about their orders in real-time
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F9FAFB' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Chat ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Order ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Messages</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
              ) : chats.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#6B7280' }}>No chats found.</TableCell></TableRow>
              ) : chats.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.id.substring(0, 8)}...</TableCell>
                  <TableCell>{c.orderId.substring(0, 8)}...</TableCell>
                  <TableCell>{c.customer?.name}</TableCell>
                  <TableCell>{c._count?.messages ?? 0}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.status}
                      color={c.status === 'OPEN' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Open Chat">
                      <IconButton size="small" onClick={() => loadChatDetails(c.id)} sx={{ color: '#2563EB' }}>
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

      {/* Chat Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 450, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {selectedChat && (
            <>
              {/* Header */}
              <Box sx={{ p: 2, background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'white' }}>Order Chat</Typography>
                  <Typography variant="caption" sx={{ color: '#bfdbfe' }}>Order #{selectedChat.orderId.substring(0, 8).toUpperCase()}</Typography>
                </Box>
                <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
              </Box>

              {/* Info */}
              <Box sx={{ p: 2, bgcolor: '#eff6ff', borderBottom: '1px solid #dbeafe' }}>
                <Typography variant="body2" sx={{ color: '#1d4ed8', fontWeight: 500 }}>
                  Customer: {selectedChat.customer?.name} ({selectedChat.customer?.email})
                </Typography>
                {selectedChat.order && (
                  <Typography variant="body2" sx={{ color: '#3b82f6', mt: 0.5 }}>
                    Order Status: {selectedChat.order.status} · {Number(selectedChat.order.totalAmount).toLocaleString()}₫
                  </Typography>
                )}
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#F9FAFB' }}>
                {selectedChat.messages?.length === 0 ? (
                  <Typography align="center" color="textSecondary" sx={{ mt: 4 }}>No messages yet.</Typography>
                ) : (
                  selectedChat.messages?.map((msg: any) => {
                    const isMe = msg.sender?.role === 'SELLER';
                    const isCustomer = msg.sender?.role === 'CUSTOMER';
                    return (
                      <Box key={msg.id} sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        <Typography variant="caption" sx={{ color: '#6b7280', mb: 0.5 }}>
                          {isMe ? 'You' : isCustomer ? `👤 ${msg.sender?.name}` : msg.sender?.name}
                        </Typography>
                        <Paper sx={{ p: 1.5, bgcolor: isMe ? '#2563EB' : '#fff', color: isMe ? 'white' : 'black', borderRadius: 2, maxWidth: '85%', border: isMe ? 'none' : '1px solid #e5e7eb' }}>
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
                  placeholder={selectedChat.status === 'CLOSED' ? 'Chat is closed' : 'Type a message...'}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={selectedChat.status === 'CLOSED' || sending}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={sending || !message.trim() || selectedChat.status === 'CLOSED'}
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

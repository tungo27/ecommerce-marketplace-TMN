'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';

export default function DisputeChatPage() {
  const { user, isHydrated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const disputeId = params.id as string;
  
  const [dispute, setDispute] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/login');
    }
  }, [user, isHydrated, router]);

  useEffect(() => {
    if (user && disputeId) {
      fetchDisputeDetails();
      
      // Initialize Socket.IO
      const socket = io('http://localhost:4000/disputes');
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_dispute_room', { disputeId });
      });

      socket.on('new_dispute_message', (msg: any) => {
        setMessages((prev) => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      });

      socket.on('dispute_status_updated', (data: any) => {
        setDispute((prev: any) => prev ? { ...prev, status: data.status } : null);
      });

      return () => {
        socket.emit('leave_dispute_room', { disputeId });
        socket.disconnect();
      };
    }
  }, [user, disputeId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchDisputeDetails = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:4000/api/disputes/${disputeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDispute(data);
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch dispute', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:4000/api/disputes/${disputeId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: newMessage }),
      });
      if (res.ok) {
        setNewMessage('');
        // We rely on socket to append the message to the list
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Action Required</span>;
      case 'IN_REVIEW':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">In Review</span>;
      case 'RESOLVED_REFUND':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">Resolved (Refunded)</span>;
      case 'RESOLVED_REJECT':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">Resolved (Rejected)</span>;
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (!isHydrated || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header searchAction="/" currentSearch="" />

      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-8 flex flex-col">
        <Link href="/disputes" className="inline-flex items-center text-gray-500 hover:text-[#FF4742] transition-colors mb-6 font-medium">
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Disputes
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF4742] border-t-transparent"></div>
          </div>
        ) : !dispute ? (
          <div className="text-center py-20 text-gray-500">Dispute not found</div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col h-[70vh] overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{dispute.reason}</h2>
                <p className="text-sm text-gray-500 mt-1">Order #{dispute.orderId.substring(0,8).toUpperCase()}</p>
              </div>
              <div>{getStatusBadge(dispute.status)}</div>
            </div>

            {/* Initial description */}
            <div className="px-6 py-4 bg-red-50/50 border-b border-red-50">
              <p className="text-sm text-gray-700 italic">"{dispute.description}"</p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-white to-gray-50/30">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-10">No messages yet. Send a message to start the conversation.</div>
              ) : (
                messages.map((msg: any) => {
                  const isMe = msg.senderId === user.id;
                  const isAdmin = msg.sender.role === 'ADMIN';
                  const isSeller = msg.sender.role === 'SELLER';
                  
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2 mb-1">
                        {!isMe && (
                          <span className={`text-xs font-bold ${isAdmin ? 'text-blue-600' : isSeller ? 'text-orange-600' : 'text-gray-500'}`}>
                            {isAdmin ? 'Store Support' : isSeller ? 'Seller' : msg.sender.name}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div 
                        className={`px-5 py-3 rounded-2xl max-w-[80%] break-words ${
                          isMe 
                            ? 'bg-[#FF4742] text-white rounded-tr-sm shadow-md shadow-red-200' 
                            : isAdmin 
                              ? 'bg-blue-50 text-blue-900 rounded-tl-sm border border-blue-100'
                              : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100 shadow-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={dispute.status.includes('RESOLVED') ? 'This dispute has been resolved.' : 'Type your message...'}
                  disabled={dispute.status.includes('RESOLVED') || sending}
                  className="flex-1 bg-gray-50 border-transparent focus:bg-white focus:border-[#FF4742] focus:ring-1 focus:ring-[#FF4742] rounded-full px-6 py-3 text-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending || dispute.status.includes('RESOLVED')}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-[#FF4742] text-white hover:bg-[#e63d39] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md shadow-red-200"
                >
                  {sending ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

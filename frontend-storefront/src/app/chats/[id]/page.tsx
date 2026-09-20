'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';

export default function ChatPage() {
  const { user, isHydrated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;

  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHydrated && !user) router.push('/login');
  }, [user, isHydrated, router]);

  useEffect(() => {
    if (user && chatId) {
      fetchChatDetails();

      const socket = io('http://localhost:4000/chats');
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_chat_room', { chatId });
      });

      socket.on('new_chat_message', (msg: any) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      });

      return () => {
        socket.emit('leave_chat_room', { chatId });
        socket.disconnect();
      };
    }
  }, [user, chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const fetchChatDetails = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:4000/api/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChat(data);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
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
      const res = await fetch(`http://localhost:4000/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: newMessage }),
      });
      if (res.ok) {
        setNewMessage('');
        // Socket will append message to list
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!isHydrated || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header searchAction="/" currentSearch="" />
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-8 flex flex-col">
        <Link href="/chats" className="inline-flex items-center text-gray-500 hover:text-[#FF4742] transition-colors mb-6 font-medium">
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Chats
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF4742] border-t-transparent" />
          </div>
        ) : !chat ? (
          <div className="text-center py-20 text-gray-500">Chat not found</div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col h-[72vh] overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Order Chat</h2>
                  <p className="text-xs text-blue-200">Order #{chat.orderId.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${chat.status === 'OPEN' ? 'bg-green-400/30 text-green-100' : 'bg-gray-400/30 text-gray-200'}`}>
                {chat.status}
              </span>
            </div>

            {/* Order info strip */}
            {chat.order && (
              <div className="px-5 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center gap-3 text-sm text-blue-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Status: <strong>{chat.order.status}</strong> · Total: <strong>{Number(chat.order.totalAmount).toLocaleString()}₫</strong></span>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-white to-gray-50/30">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-10 text-sm">
                  No messages yet. Say hello to start the conversation!
                </div>
              ) : (
                messages.map((msg: any) => {
                  const isMe = msg.senderId === user.id;
                  const isSeller = msg.sender?.role === 'SELLER';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2 mb-1">
                        {!isMe && (
                          <span className={`text-xs font-bold ${isSeller ? 'text-blue-600' : 'text-gray-500'}`}>
                            {isSeller ? '🏪 Seller' : msg.sender?.name}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[78%] break-words text-sm ${
                        isMe
                          ? 'bg-[#FF4742] text-white rounded-tr-sm shadow-sm shadow-red-200'
                          : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100 shadow-sm'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={chat.status === 'CLOSED' ? 'This chat is closed.' : 'Type your message...'}
                  disabled={chat.status === 'CLOSED' || sending}
                  className="flex-1 bg-gray-50 border-transparent focus:bg-white focus:border-[#FF4742] focus:ring-1 focus:ring-[#FF4742] rounded-full px-5 py-3 text-sm transition-all outline-none border"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending || chat.status === 'CLOSED'}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-[#FF4742] text-white hover:bg-[#e63d39] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md shadow-red-200"
                >
                  {sending ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

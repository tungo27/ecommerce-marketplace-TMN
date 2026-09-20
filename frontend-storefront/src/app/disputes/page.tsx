'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function DisputesPage() {
  const { user, isHydrated } = useAuth();
  const router = useRouter();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/login');
    }
  }, [user, isHydrated, router]);

  useEffect(() => {
    if (user) {
      fetchDisputes();
    }
  }, [user]);

  const fetchDisputes = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:4000/api/disputes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDisputes(data);
      }
    } catch (error) {
      console.error('Failed to fetch disputes', error);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header searchAction="/" currentSearch="" />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#FF4742] tracking-tight">My Disputes</h1>
          <p className="text-gray-500 mt-2">Track and manage your filed complaints</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF4742] border-t-transparent"></div>
          </div>
        ) : disputes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-24 h-24 mb-6 mx-auto rounded-full bg-green-50 flex items-center justify-center">
              <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Disputes</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              You haven't filed any disputes. If you have an issue with an order, you can file a dispute from your Order History.
            </p>
            <Link
              href="/orders/history"
              className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-bold rounded-full text-white bg-[#FF4742] hover:bg-[#E63E39] shadow-lg shadow-red-200 transition-all transform hover:-translate-y-0.5"
            >
              Go to Order History
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <Link href={`/disputes/${dispute.id}`} key={dispute.id} className="block">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order #{dispute.orderId.substring(0,8).toUpperCase()}</span>
                      <span className="text-xs text-gray-400">&bull;</span>
                      <span className="text-sm text-gray-500">{new Date(dispute.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#FF4742] transition-colors">
                      {dispute.reason}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(dispute.status)}
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-[#FF4742] transform group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

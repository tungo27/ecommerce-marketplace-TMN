'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Link from 'next/link';

function NewDisputeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [reason, setReason] = useState('Product defective');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      alert('Missing order ID.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:4000/api/disputes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          reason,
          description,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/disputes/${data.id}`);
      } else {
        alert(data.message || 'Failed to create dispute');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl shadow-red-100/50 border border-gray-100 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">File a Dispute</h2>
      {orderId ? (
        <p className="text-gray-500 mb-6 font-medium">Order ID: #{orderId.substring(0, 8).toUpperCase()}</p>
      ) : (
        <p className="text-red-500 mb-6 font-medium">No order ID specified.</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for dispute</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF4742] focus:ring-[#FF4742] bg-gray-50 p-3"
            required
          >
            <option value="Product defective">Product is defective or does not work</option>
            <option value="Not as described">Product is not as described</option>
            <option value="Wrong item">Received the wrong item</option>
            <option value="Missing parts">Missing parts or accessories</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Please provide details about the issue..."
            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#FF4742] focus:ring-[#FF4742] bg-gray-50 p-3"
            required
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
          <Link
            href="/orders/history"
            className="px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !orderId}
            className="px-6 py-3 rounded-xl font-bold text-white bg-[#FF4742] hover:bg-[#e63d39] transition-all transform hover:-translate-y-0.5 shadow-lg shadow-red-200 disabled:opacity-50 disabled:transform-none"
          >
            {loading ? 'Submitting...' : 'Submit Dispute'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewDisputePage() {
  const { user, isHydrated } = useAuth();
  const router = useRouter();

  if (isHydrated && !user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchAction="/" currentSearch="" />
      <main className="max-w-5xl mx-auto px-4 py-12">
        <Suspense fallback={<div className="text-center p-12">Loading form...</div>}>
          <NewDisputeForm />
        </Suspense>
      </main>
    </div>
  );
}

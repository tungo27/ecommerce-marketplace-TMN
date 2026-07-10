'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

const TABS = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Đã xác nhận', value: 'CONFIRMED' },
  { label: 'Đang giao', value: 'SHIPPED' },
  { label: 'Đã giao', value: 'DELIVERED' },
];

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const query = activeTab ? `?status=${activeTab}` : '';
      const response = await fetch(`http://localhost:4000/api/orders/my-orders${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.data.items);
      } else {
        console.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(amount));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Chờ duyệt</span>;
      case 'CONFIRMED':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Đã xác nhận</span>;
      case 'SHIPPED':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">Đang giao</span>;
      case 'DELIVERED':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">Đã giao</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Đã hủy</span>;
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">{status}</span>;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header
        searchAction="/"
        currentSearch=""
        currentCategory={undefined}
        currentMinPrice={undefined}
        currentMaxPrice={undefined}
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {/* Back Link */}
            <div className="mt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-lg font-semibold text-[#FF4742] transition-all duration-200 hover:text-[#e63d39] hover:translate-x-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Continue Shopping
              </Link>
            </div>
            <h1 className="text-2xl text-[#FF4742] font-extrabold tracking-tight">
              Order History
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white p-2 rounded-xl shadow-sm mb-6 border border-gray-100 overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab.value
                    ? 'bg-[#FF4742] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF4742] border-t-transparent"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <div className="w-24 h-24 mb-6 rounded-full bg-gray-50 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {activeTab
                ? `Bạn chưa có đơn hàng nào trong trạng thái "${TABS.find(t => t.value === activeTab)?.label}".`
                : 'Bạn chưa thực hiện bất kỳ đơn hàng nào. Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-bold rounded-full text-white bg-[#FF4742] hover:bg-[#E63E39] shadow-lg shadow-red-200 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.orderId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="border-b border-gray-100 p-5 sm:p-6 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Mã đơn hàng</p>
                      <p className="font-bold text-gray-900">#{order.orderId.substring(0, 8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Ngày đặt</p>
                      <p className="font-semibold text-gray-900">{new Date(order.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Tổng tiền</p>
                      <p className="font-bold text-[#FF4742]">{formatCurrency(order.totalPrice)}</p>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <ul className="divide-y divide-gray-100">
                    {order.items.map((item: any, index: number) => (
                      <li key={index} className="py-4 flex first:pt-0 last:pb-0 gap-6">
                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center p-2">
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.productName}
                              className="h-full w-full object-contain object-center"
                            />
                          ) : (
                            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col justify-center">
                          <div className="flex justify-between text-base font-semibold text-gray-900 mb-1">
                            <h4 className="line-clamp-2 pr-4">{item.productName}</h4>
                            <p className="ml-4 whitespace-nowrap text-[#FF4742]">{formatCurrency(item.price)}</p>
                          </div>
                          <p className="text-sm text-gray-500 font-medium">Số lượng: {item.quantity}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

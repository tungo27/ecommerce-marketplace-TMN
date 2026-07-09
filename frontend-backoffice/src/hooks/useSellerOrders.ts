import { useState, useCallback } from 'react';
import { apiClient } from '../utils/api';

export interface Customer {
  id: string;
  name: string;
  email: string;
}

export interface Product {
  id: string;
  name: string;
  price: string | number;
  images: string[];
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: string | number;
  
  product: Product;
}

export interface Order {
  id: string;
  totalAmount: string | number;
  shippingAddress: string;
  phoneNumber: string;
  paymentMethod: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  customer: Customer;
  items: OrderItem[];
}

export const useSellerOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (page: number = 1, limit: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/orders/seller?page=${page}&limit=${limit}`);
      setOrders(response.data.data);
      setTotal(response.data.meta.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await apiClient.patch(`/orders/seller/${orderId}/status`, { status });
      // Update local state for immediate feedback
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status } : order))
      );
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Cập nhật trạng thái thất bại';
      setError(msg);
      return false;
    }
  };

  return {
    orders,
    total,
    loading,
    error,
    fetchOrders,
    updateOrderStatus,
  };
};

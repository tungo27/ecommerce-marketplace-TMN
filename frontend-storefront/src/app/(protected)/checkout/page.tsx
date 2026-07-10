'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart } from '@/hooks/useCart';
import { apiClient } from '@/utils/api';
import Header from '@/components/Header';

// 1. Zod Schema
const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phoneNumber: z.string().min(10, 'Số điện thoại không hợp lệ'),
  shippingAddress: z.string().min(10, 'Địa chỉ chi tiết quá ngắn'),
  paymentMethod: z.enum(['COD', 'BANK_TRANSFER'], { required_error: 'Vui lòng chọn phương thức thanh toán' }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalCartPrice, clearCart, showToast } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const SHIPPING_FEE = 30000;

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'COD' }
  });

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) return showToast('Giỏ hàng trống!', 'error');
    setIsSubmitting(true);
    try {
      await apiClient.post('/orders/checkout', {
        shippingAddress: `${data.fullName} - ${data.shippingAddress}`,
        phoneNumber: data.phoneNumber,
        paymentMethod: data.paymentMethod
      });
      showToast('Đặt hàng thành công!', 'success');
      await clearCart(true); // reset UI cart
      router.push('/orders/history'); // redirect to orders history
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi đặt hàng', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pt-24">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">Thanh toán</h1>
        <div className="flex flex-col gap-8 lg:flex-row">
          
          {/* Cột trái: Form */}
          <div className="w-full lg:w-[70%]">
            <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">Thông tin giao hàng</h2>
              
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Họ và tên <span className="text-red-500">*</span></label>
                <input {...register('fullName')} className={`w-full rounded-lg border p-3 outline-none focus:ring-1 ${errors.fullName ? 'border-red-500' : 'border-gray-300 focus:border-[#FF4742] focus:ring-[#FF4742]'}`} placeholder="Nhập họ tên" />
                {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Số điện thoại <span className="text-red-500">*</span></label>
                <input {...register('phoneNumber')} className={`w-full rounded-lg border p-3 outline-none focus:ring-1 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300 focus:border-[#FF4742] focus:ring-[#FF4742]'}`} placeholder="Nhập số điện thoại" />
                {errors.phoneNumber && <p className="mt-1 text-xs text-red-500">{errors.phoneNumber.message}</p>}
              </div>

              <div className="mb-6">
                <label className="mb-1 block text-sm font-medium text-gray-700">Địa chỉ chi tiết <span className="text-red-500">*</span></label>
                <textarea {...register('shippingAddress')} rows={3} className={`w-full rounded-lg border p-3 outline-none focus:ring-1 ${errors.shippingAddress ? 'border-red-500' : 'border-gray-300 focus:border-[#FF4742] focus:ring-[#FF4742]'}`} placeholder="Số nhà, đường, phường/xã, quận/huyện..." />
                {errors.shippingAddress && <p className="mt-1 text-xs text-red-500">{errors.shippingAddress.message}</p>}
              </div>

              <h2 className="mb-4 mt-8 text-lg font-bold">Phương thức thanh toán <span className="text-red-500">*</span></h2>
              <div className="flex flex-col gap-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50">
                  <input type="radio" value="COD" {...register('paymentMethod')} className="h-5 w-5 text-[#FF4742] accent-[#FF4742]" />
                  <span className="font-medium text-gray-800">Thanh toán khi nhận hàng (COD)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50">
                  <input type="radio" value="BANK_TRANSFER" {...register('paymentMethod')} className="h-5 w-5 text-[#FF4742] accent-[#FF4742]" />
                  <span className="font-medium text-gray-800">Chuyển khoản ngân hàng</span>
                </label>
              </div>
              {errors.paymentMethod && <p className="mt-1 text-xs text-red-500">{errors.paymentMethod.message}</p>}
            </form>
          </div>

          {/* Cột phải: Order Summary */}
          <div className="w-full lg:w-[30%]">
            <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">Tổng kết đơn hàng</h2>
              
              <div className="mb-4 max-h-60 overflow-y-auto pr-2 text-sm">
                {items.map(item => (
                  <div key={item.productId} className="mb-3 flex justify-between gap-2 border-b border-gray-100 pb-3 last:border-0">
                    <div className="line-clamp-2 flex-1 text-gray-700">{item.name} <span className="font-bold text-gray-900">x{item.quantity}</span></div>
                    <div className="font-medium">{(item.price * item.quantity).toLocaleString()}đ</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between border-t border-gray-100 pt-4 text-gray-600">
                <span>Tạm tính</span>
                <span>{totalCartPrice.toLocaleString()}đ</span>
              </div>
              <div className="mt-2 flex justify-between text-gray-600">
                <span>Phí ship</span>
                <span>{SHIPPING_FEE.toLocaleString()}đ</span>
              </div>
              <div className="mt-4 flex justify-between border-t border-gray-100 pt-4 text-lg font-bold text-gray-900">
                <span>Tổng cộng</span>
                <span className="text-[#FF4742]">{(totalCartPrice + SHIPPING_FEE).toLocaleString()}đ</span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting || items.length === 0}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF4742] py-3.5 font-bold text-white transition hover:bg-[#E63E39] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

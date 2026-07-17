'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { apiClient } from '@/utils/api';

const getLocalizedText = (text: any) => typeof text === 'string' ? text : (text?.en || text?.vi || '');

// Toast Component

function Toast({
  toast,
  onClose,
}: {
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  const colorMap = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      icon: (
        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: (
        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: (
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const styles = colorMap[toast.type];

  return (
    <div
      className={`fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-xl border px-5 py-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${styles.bg} ${styles.border} max-w-sm w-full animate-[slideIn_0.3s_ease-out]`}
      style={{ animation: 'slideIn 0.3s ease-out forwards' }}
      role="alert"
      aria-live="assertive"
    >
      {styles.icon}
      <p className={`text-sm font-medium leading-snug ${styles.text} flex-1`}>
        {toast.message}
      </p>
      <button
        onClick={onClose}
        id="toast-close-btn"
        aria-label="Close notification"
        className={`ml-2 rounded-md p-1 transition hover:bg-black/5 ${styles.text}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Skeleton Row

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 animate-pulse">
      <td className="py-5 px-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-gray-200 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </td>
      <td className="py-5 px-4"><div className="h-4 bg-gray-200 rounded w-20 mx-auto" /></td>
      <td className="py-5 px-4"><div className="h-9 bg-gray-200 rounded-xl w-28 mx-auto" /></td>
      <td className="py-5 px-4"><div className="h-4 bg-gray-200 rounded w-24 mx-auto" /></td>
      <td className="py-5 px-4"><div className="h-8 bg-gray-200 rounded-lg w-8 mx-auto" /></td>
    </tr>
  );
}

// Quantity Control

interface QuantityControlProps {
  productId: string;
  quantity: number;
  stock: number;
  isAuthenticated: boolean;
  isLoading: boolean;
}

function QuantityControl({
  productId,
  quantity,
  stock,
  isAuthenticated,
  isLoading,
}: QuantityControlProps) {
  const { setQuantity } = useCart();

  const handleDecrease = useCallback(() => {
    if (quantity <= 1) return;
    setQuantity(productId, quantity - 1, isAuthenticated);
  }, [productId, quantity, isAuthenticated, setQuantity]);

  const handleIncrease = useCallback(() => {
    if (quantity >= stock) return;
    setQuantity(productId, quantity + 1, isAuthenticated);
  }, [productId, quantity, stock, isAuthenticated, setQuantity]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (isNaN(val) || val <= 0) return;
      if (val > stock) {
        useCart.getState().showToast('Requested quantity exceeds available stock', 'error');
        return;
      }
      setQuantity(productId, val, isAuthenticated);
    },
    [productId, stock, isAuthenticated, setQuantity],
  );

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        id={`qty-decrease-${productId}`}
        onClick={handleDecrease}
        disabled={isLoading || quantity <= 1}
        aria-label="Decrease quantity"
        className="flex h-9 w-9 items-center justify-center rounded-l-xl border border-r-0 border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>
      <input
        id={`qty-input-${productId}`}
        type="number"
        min={1}
        max={stock}
        value={quantity}
        onChange={handleInputChange}
        disabled={isLoading}
        aria-label="Quantity"
        className="h-9 w-14 border-y border-gray-200 bg-white text-center text-sm font-semibold text-gray-800 outline-none transition focus:border-[#FF4742] focus:ring-1 focus:ring-[#FF4742]/30 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        id={`qty-increase-${productId}`}
        onClick={handleIncrease}
        disabled={isLoading || quantity >= stock}
        aria-label="Increase quantity"
        className="flex h-9 w-9 items-center justify-center rounded-r-xl border border-l-0 border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

// Empty State

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-[#FFF1EE] scale-150 opacity-60" />
        <svg
          className="relative w-24 h-24 text-[#FF4742] opacity-70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">
        Your Cart is Empty
      </h2>
      <p className="text-sm text-gray-500 max-w-xs mb-8">
        Explore great products and add them to your cart.
      </p>
      <Link
        href="/"
        id="continue-shopping-btn"
        className="inline-flex items-center gap-2 rounded-xl bg-[#FF4742] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#E63E39] hover:shadow-lg hover:shadow-[#FF4742]/25 active:scale-[0.98]"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Continue Shopping
      </Link>
    </div>
  );
}

// Main Cart Page

export default function CartPage() {
  const { items, totalCartPrice, totalItems, isLoading, toast, removeItem, clearCart, hideToast } =
    useCart();
  const { user } = useAuth();
  const router = useRouter();
  const isAuthenticated = Boolean(user);
  const hasLoaded = useRef(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // Tải giỏ hàng một lần khi component mount
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      useCart.getState().loadCart(isAuthenticated);
    }
  }, [isAuthenticated]);

  const handleRemoveItem = useCallback(
    (productId: string) => {
      removeItem(productId, isAuthenticated);
    },
    [removeItem, isAuthenticated],
  );

  const handleClearCart = useCallback(() => {
    if (items.length === 0) return;
    clearCart(isAuthenticated);
  }, [clearCart, isAuthenticated, items.length]);

  const handleCheckout = () => {
    if (!isAuthenticated) return;
    router.push('/checkout');
  };

  const imageUrl = (images: string[]) =>
    images?.[0] ||
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80';

  return (
    <>
      {/* Keyframe animation cho toast */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100%) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)  scale(1); }
        }
      `}</style>

      {/* Global Toast */}
      <Toast toast={toast} onClose={hideToast} />

      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header
          searchAction="/"
          currentSearch=""
          currentCategory={undefined}
          currentMinPrice={undefined}
          currentMaxPrice={undefined}
        />

        <main className="mx-auto max-w-[1600px] px-4 py-8">
          {/* Page Header */}
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {/* Continue Shopping Link */}
              {items.length > 0 && (
                <div className="mt-4">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#FF4742] px-4 py-2 text-sm font-semibold !text-white shadow-sm transition-all duration-200 hover:bg-[#e63d39] hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Continue Shopping
                  </Link>
                </div>
              )}
              <h1 className="text-2xl text-[#FF4742] font-extrabold tracking-tight">
                Your Cart
              </h1>
              {!isLoading && (
                <p className="mt-0.5 text-sm text-gray-500">
                  {totalItems === 0
                    ? 'No items.'
                    : `${totalItems} items`}
                </p>
              )}
            </div>

            {items.length > 0 && (
              <button
                id="clear-cart-btn"
                onClick={handleClearCart}
                disabled={isLoading}
                className="self-start sm:self-auto flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All
              </button>
            )}
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Cart Items Table */}
            <div className="flex-1 min-w-0">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {isLoading && items.length === 0 ? (
                  /* Loading skeletons */
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="py-4 px-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-full">Product</th>
                        <th className="py-4 px-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap hidden sm:table-cell">Price</th>
                        <th className="py-4 px-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Quantity</th>
                        <th className="py-4 px-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap hidden md:table-cell">Subtotal</th>
                        <th className="py-4 px-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </tbody>
                  </table>
                ) : items.length === 0 ? (
                  <EmptyCart />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="py-4 px-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                            Product
                          </th>
                          <th className="py-4 px-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400 hidden sm:table-cell">
                            Price
                          </th>
                          <th className="py-4 px-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                            Quantity
                          </th>
                          <th className="py-4 px-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400 hidden md:table-cell">
                            Subtotal
                          </th>
                          <th className="py-4 px-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                            <span className="sr-only">Remove</span>
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {items.map((item) => {
                          const subtotal = item.price * item.quantity;
                          return (
                            <tr
                              key={item.productId}
                              className="group transition hover:bg-gray-50/60"
                            >
                              {/* Sản phẩm */}
                              <td className="py-5 px-4">
                                <div className="flex items-center gap-4">
                                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                    <img
                                      src={imageUrl(item.images)}
                                      alt={getLocalizedText(item.name)}
                                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                    />
                                    {/* Stock badge */}
                                    {item.stock <= 5 && item.stock > 0 && (
                                      <span className="absolute bottom-0 left-0 right-0 bg-amber-500 py-0.5 text-center text-[10px] font-bold text-white">
                                        Only {item.stock} left
                                      </span>
                                    )}
                                    {item.stock === 0 && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                        <span className="text-[10px] font-bold text-white">Out of stock</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-800">
                                      {getLocalizedText(item.name)}
                                    </p>
                                    {/* Hiển thị đơn giá trên mobile */}
                                    <p className="mt-1 text-xs text-gray-500 sm:hidden">
                                      {item.price.toLocaleString('vi-VN')} VND
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Đơn giá (ẩn trên mobile nhỏ) */}
                              <td className="py-5 px-4 text-center hidden sm:table-cell">
                                <span className="text-sm font-semibold text-gray-700">
                                  {item.price.toLocaleString('vi-VN')}
                                  <span className="text-xs text-gray-400"> VND</span>
                                </span>
                              </td>

                              {/* Số lượng */}
                              <td className="py-5 px-4 text-center">
                                <QuantityControl
                                  productId={item.productId}
                                  quantity={item.quantity}
                                  stock={item.stock}
                                  isAuthenticated={isAuthenticated}
                                  isLoading={isLoading}
                                />
                              </td>

                              {/* Thành tiền (ẩn trên tablet nhỏ) */}
                              <td className="py-5 px-4 text-center hidden md:table-cell">
                                <span className="text-sm font-bold text-[#FF4742]">
                                  {subtotal.toLocaleString('vi-VN')}
                                  <span className="text-xs font-normal text-gray-400"> VND</span>
                                </span>
                              </td>

                              {/* Nút xóa */}
                              <td className="py-5 px-4 text-center">
                                <button
                                  id={`remove-item-${item.productId}`}
                                  onClick={() => handleRemoveItem(item.productId)}
                                  disabled={isLoading}
                                  aria-label={`Remove ${getLocalizedText(item.name)} from cart`}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            {items.length > 0 && (
              <div className="w-full lg:w-[340px] shrink-0">
                <div className="sticky top-24 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  {/* Header */}
                  <div className="border-b border-gray-100 bg-gradient-to-r from-[#FF4742] to-[#FF2A24] px-6 py-5">
                    <h2 className="text-base font-bold text-white">
                      Order Summary
                    </h2>
                  </div>

                  {/* Body */}
                  <div className="px-6 py-5 space-y-4">
                    {/* Items breakdown */}
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.productId}
                          className="flex justify-between gap-2 text-sm"
                        >
                          <span className="text-gray-600 line-clamp-1 flex-1">
                            {getLocalizedText(item.name)}
                            <span className="ml-1 text-gray-400">×{item.quantity}</span>
                          </span>
                          <span className="font-semibold text-gray-800 shrink-0">
                            {(item.price * item.quantity).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-dashed border-gray-200 pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold">
                          {totalCartPrice.toLocaleString('vi-VN')} VND
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-semibold text-emerald-600">Free</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between">
                        <span className="text-base font-bold text-gray-900">
                          Total
                        </span>
                        <span className="text-xl font-extrabold text-[#FF4742]">
                          {totalCartPrice.toLocaleString('vi-VN')}
                          <span className="text-sm font-bold"> VND</span>
                        </span>
                      </div>
                    </div>

                    {/* Checkout Button */}
                    {!isAuthenticated ? (
                      <div className="space-y-3 pt-1">
                        <p className="text-center text-xs text-gray-500">
                          Log in to checkout and sync your cart.
                        </p>
                        <Link
                          href="/login"
                          id="checkout-login-btn"
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF4742] py-3.5 text-sm font-bold text-white transition hover:bg-[#E63E39] hover:shadow-lg hover:shadow-[#FF4742]/20 active:scale-[0.98]"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                          </svg>
                          Log in to checkout
                        </Link>
                      </div>
                    ) : (
                      <button
                        id="checkout-btn"
                        onClick={handleCheckout}
                        disabled={isLoading || isCheckoutLoading || items.length === 0}
                        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF4742] py-3.5 text-sm font-bold text-white transition hover:bg-[#E63E39] hover:shadow-lg hover:shadow-[#FF4742]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCheckoutLoading ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                            </svg>
                            Proceed to Checkout
                          </>
                        )}
                      </button>
                    )}

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-4 pt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        Secure Payment
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                        Free Shipping
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

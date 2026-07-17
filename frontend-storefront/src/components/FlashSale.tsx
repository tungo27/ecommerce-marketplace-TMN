'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

type FlashSaleProps = {
  products?: any[];
};

const formatVND = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const getLocalizedText = (text: any) => typeof text === 'string' ? text : (text?.en || text?.vi || '');

function Countdown() {
  const [time, setTime] = useState({ h: 2, m: 15, s: 30 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        let { h, m, s } = prev;
        if (s > 0) return { h, m, s: s - 1 };
        if (m > 0) return { h, m: m - 1, s: 59 };
        if (h > 0) return { h: h - 1, m: 59, s: 59 };
        return { h: 0, m: 0, s: 0 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1 text-gray-900">
      {[pad(time.h), pad(time.m), pad(time.s)].map((unit, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="rounded-md bg-gray-900 px-2 py-1 text-lg font-black tabular-nums text-white shadow-sm">
            {unit}
          </span>
          {i < 2 && <span className="font-black text-gray-900">:</span>}
        </span>
      ))}
    </div>
  );
}

export default function FlashSale({ products = [] }: FlashSaleProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const isAuthenticated = !!user;

  if (!products || products.length === 0) return null;

  const handleAddToCart = async (e: React.MouseEvent, product: any, salePrice: number) => {
    e.preventDefault();
    await addToCart(
      {
        productId: product.id,
        name: product.name,
        price: salePrice,
        images: product.images || [],
        stock: product.stock,
      },
      1,
      isAuthenticated
    );
    router.push('/cart');
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-gray-50 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚡</span>
          <div>
            <h2 className="text-xl font-black uppercase tracking-wide text-gray-900 sm:text-2xl">
              Flash Sale
            </h2>
            <p className="text-xs text-gray-500">Limited time offers — Shop now!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-500">Ends in:</span>
          <Countdown />
        </div>
      </div>

      {/* Products */}
      <div className="px-4 py-5 sm:px-6 bg-gray-50">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
          {products.slice(0, 5).map((product) => {
            const numericPrice = Number(product.price) || 0;
            const salePrice = numericPrice * 0.5; // Simulate 50% discount
            const discountPercent = 50;
            const imageUrl =
              product.images?.[0] ||
              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80';
            
            // Mock sold/total just for UI visualization
            const total = 100;
            const getDeterministicSold = (id: string) => {
              let hash = 0;
              for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % 80;
              return hash + 10;
            };
            const sold = getDeterministicSold(product.id);

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Image */}
                <div className="relative overflow-hidden aspect-[4/3] shrink-0">
                  <img
                    src={imageUrl}
                    alt={getLocalizedText(product.name)}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-2 left-2 rounded-lg bg-red-500 px-2 py-1 text-xs font-black text-white shadow">
                    -{discountPercent}%
                  </span>
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col justify-between p-3">
                  <div>
                    <p className="line-clamp-2 min-h-[2.5rem] text-xs font-semibold text-gray-800 sm:text-sm">
                      {getLocalizedText(product.name)}
                    </p>

                    <div className="mt-2 flex flex-col gap-0.5">
                      <p className="text-base font-extrabold text-primary">
                        {formatVND(salePrice)}
                      </p>
                      <p className="text-xs text-gray-400 line-through">
                        {formatVND(numericPrice)}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Sold {sold}</span>
                        <span>{Math.round((sold / total) * 100)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${(sold / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleAddToCart(e, product, salePrice)}
                    disabled={product.stock <= 0}
                    className="mt-3 w-full shrink-0 rounded-lg bg-primary py-2 text-xs font-bold text-white transition-all duration-200 hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add to Cart
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

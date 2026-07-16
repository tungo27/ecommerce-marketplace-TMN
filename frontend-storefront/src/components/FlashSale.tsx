'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FlashProduct {
  id: string;
  name: string;
  imageUrl: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  sold: number;
  total: number;
}

const FLASH_PRODUCTS: FlashProduct[] = [
  {
    id: '1',
    name: 'Tai nghe Bluetooth Pro Max',
    imageUrl: 'https://picsum.photos/seed/flash-headphone/300/300',
    originalPrice: 1_200_000,
    salePrice: 599_000,
    discountPercent: 50,
    sold: 87,
    total: 100,
  },
  {
    id: '2',
    name: 'Đồng hồ thông minh SportFit',
    imageUrl: 'https://picsum.photos/seed/flash-watch/300/300',
    originalPrice: 2_500_000,
    salePrice: 1_250_000,
    discountPercent: 50,
    sold: 63,
    total: 80,
  },
  {
    id: '3',
    name: 'Son môi Velvet Matte #07',
    imageUrl: 'https://picsum.photos/seed/flash-lipstick/300/300',
    originalPrice: 450_000,
    salePrice: 220_000,
    discountPercent: 51,
    sold: 120,
    total: 150,
  },
  {
    id: '4',
    name: 'Áo hoodie Unisex Premium',
    imageUrl: 'https://picsum.photos/seed/flash-hoodie/300/300',
    originalPrice: 850_000,
    salePrice: 399_000,
    discountPercent: 53,
    sold: 45,
    total: 60,
  },
  {
    id: '5',
    name: 'Nồi chiên không dầu 5.5L',
    imageUrl: 'https://picsum.photos/seed/flash-airfryer/300/300',
    originalPrice: 3_200_000,
    salePrice: 1_580_000,
    discountPercent: 51,
    sold: 29,
    total: 40,
  },
];

const formatVND = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

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
    <div className="flex items-center gap-1 text-white">
      {[pad(time.h), pad(time.m), pad(time.s)].map((unit, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="rounded-md bg-white/20 px-2 py-1 text-lg font-black tabular-nums backdrop-blur-sm">
            {unit}
          </span>
          {i < 2 && <span className="font-black text-white/80">:</span>}
        </span>
      ))}
    </div>
  );
}

export default function FlashSale() {
  return (
    <section className="overflow-hidden rounded-2xl border-2 border-orange-400 bg-gradient-to-r from-orange-500 to-red-500 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚡</span>
          <div>
            <h2 className="text-xl font-black uppercase tracking-wide text-white sm:text-2xl">
              Flash Sale
            </h2>
            <p className="text-xs text-white/80">Giảm sâu có hạn — Đặt hàng ngay!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white/80">Kết thúc sau:</span>
          <Countdown />
        </div>
      </div>

      {/* Products */}
      <div className="bg-gray-50 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
          {FLASH_PRODUCTS.map((product) => (
            <Link
              key={product.id}
              href="/"
              className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Image */}
              <div className="relative overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-2 left-2 rounded-lg bg-red-500 px-2 py-1 text-xs font-black text-white shadow">
                  -{product.discountPercent}%
                </span>
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col p-3">
                <p className="line-clamp-2 text-xs font-semibold text-gray-800 sm:text-sm">
                  {product.name}
                </p>

                <div className="mt-2 flex flex-col gap-0.5">
                  <p className="text-base font-extrabold text-orange-500">
                    {formatVND(product.salePrice)}
                  </p>
                  <p className="text-xs text-gray-400 line-through">
                    {formatVND(product.originalPrice)}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Đã bán {product.sold}</span>
                    <span>{Math.round((product.sold / product.total) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-orange-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
                      style={{ width: `${(product.sold / product.total) * 100}%` }}
                    />
                  </div>
                </div>

                <button className="mt-3 w-full rounded-lg bg-orange-500 py-2 text-xs font-bold text-white transition-all duration-200 hover:bg-orange-600 active:scale-95">
                  Thêm vào giỏ
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

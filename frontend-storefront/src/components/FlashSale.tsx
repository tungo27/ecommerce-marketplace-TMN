'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

type FlashSaleProps = {
  flashSales?: any[];
};

const formatVND = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const getLocalizedText = (text: any) => typeof text === 'string' ? text : (text?.en || text?.vi || '');

function Countdown({ endTime }: { endTime: string }) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const end = new Date(endTime).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(interval);
        setTime({ h: 0, m: 0, s: 0 });
        return;
      }

      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      setTime({ h, m, s });
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

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

export default function FlashSale({ flashSales = [] }: FlashSaleProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = !!user;
  
  // Drag to scroll logic
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // scroll-fast multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  if (!flashSales || flashSales.length === 0) return null;
  
  const earliestEndTime = flashSales.reduce((earliest, current) => {
    return new Date(current.endTime) < new Date(earliest.endTime) ? current : earliest;
  }).endTime;

  const handleAddToCart = async (e: React.MouseEvent, product: any, salePrice: number) => {
    e.preventDefault();
    await addToCart(
      {
        productId: product.id,
        name: product.name,
        price: salePrice,
        originalPrice: Number(product.price) || 0,
        isFlashSale: true,
        images: product.images || [],
        stock: product.stock,
      },
      1,
      isAuthenticated
    );
    router.push('/cart');
  };
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 256; // Exactly one card width (240px) + gap (16px)
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
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
          <Countdown endTime={earliestEndTime} />
        </div>
      </div>

      {/* Products */}
      <div className="relative bg-gray-50 px-4 py-5 sm:px-6 group/slider">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md text-gray-600 hover:text-primary hover:bg-gray-50 transition disabled:opacity-50"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div 
          ref={scrollRef} 
          className="flex gap-4 overflow-x-auto hide-scrollbar cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseLeave}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
        >
          {flashSales.map((fs) => {
            const product = fs.product;
            const numericPrice = Number(product.price) || 0;
            const salePrice = Number(fs.salePrice) || 0;
            const discountPercent = fs.discountPercentage;
            const imageUrl =
              product.images?.[0] ||
              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80';
            
            const total = 100;
            const sold = 10;

            return (
              <Link
                key={fs.id}
                href={`/products/${product.id}`}
                className="group flex h-full w-[240px] shrink-0 flex-col overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
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
        
        <button 
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md text-gray-600 hover:text-primary hover:bg-gray-50 transition disabled:opacity-50"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}

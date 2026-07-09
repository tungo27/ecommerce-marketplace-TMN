'use client';
import { useRef } from 'react';

export default function HorizontalScrollWrapper({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative group">
      <button 
        onClick={() => scroll('left')}
        className="lg:hidden absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center bg-white shadow-md rounded-full border border-gray-200 text-gray-700 focus:outline-none transition-colors active:bg-gray-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
      </button>
      
      <div 
        ref={scrollRef}
        className="flex lg:grid gap-2 overflow-x-auto pb-2 lg:pb-0 px-10 lg:px-0 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {children}
      </div>

      <button 
        onClick={() => scroll('right')}
        className="lg:hidden absolute right-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center bg-white shadow-md rounded-full border border-gray-200 text-gray-700 focus:outline-none transition-colors active:bg-gray-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
}

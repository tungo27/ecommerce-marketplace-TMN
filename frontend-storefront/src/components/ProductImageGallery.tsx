'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  isFlashSale?: boolean;
  discountPercentage?: number;
}

export default function ProductImageGallery({
  images,
  productName,
  isFlashSale,
  discountPercentage,
}: ProductImageGalleryProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fallback =
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80';

  const allImages = images && images.length > 0 ? images : [fallback];
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selectedImage = allImages[selectedIdx];

  return (
    <div className="flex flex-col gap-4">
      {/* Ảnh chính */}
      <div className="relative aspect-square w-full overflow-hidden rounded-none lg:rounded-xl bg-gray-50 lg:bg-gray-100 border-b lg:border border-gray-100 lg:shadow-inner">
        {isFlashSale && (
          <div className="absolute left-4 top-4 z-10 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white shadow-md">
            -{discountPercentage}% OFF
          </div>
        )}
        {/* priority prop giúp tải nhanh hơn cho ảnh chính (LCP) */}
        <Image
          key={selectedImage}
          src={selectedImage}
          alt={productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain lg:object-cover mix-blend-multiply lg:mix-blend-normal transition-opacity duration-300"
        />
      </div>

      {/* Danh sách ảnh nhỏ (thumbnail) */}
      {allImages.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 px-4 lg:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              aria-label={`Xem ảnh ${idx + 1} của ${productName}`}
              className={`relative h-20 w-20 lg:h-24 lg:w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 bg-gray-100 hover:border-primary/60 ${
                idx === selectedIdx
                  ? 'border-primary shadow-md scale-105'
                  : 'border-transparent'
              }`}
            >
              <Image
                src={img}
                alt={`${productName} ${idx + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

type ProductDetailActionsProps = {
  product: {
    id: string;
    name: string;
    price: string | number;
    stock: number;
    images?: string[];
  };
};

export default function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const isAuthenticated = !!user;

  const handleDecrease = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncrease = () => setQuantity((q) => Math.min(product.stock, q + 1));

  const handleAddToCart = async () => {
    await addToCart(
      {
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        images: product.images || [],
        stock: product.stock,
      },
      quantity,
      isAuthenticated
    );
    router.push('/cart');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 bg-white px-4 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] lg:static lg:mt-10 lg:flex-row lg:bg-transparent lg:p-0 lg:shadow-none border-t border-gray-200 lg:border-none">
      <div className="flex h-12 w-28 lg:h-14 lg:w-36 shrink-0 items-center rounded-md border border-gray-200 bg-gray-50">
        <button
          onClick={handleDecrease}
          className="flex h-full flex-1 items-center justify-center text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none rounded-l-md"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="w-10 lg:w-12 text-center font-semibold text-sm lg:text-base text-gray-900">
          {quantity}
        </span>
        <button
          onClick={handleIncrease}
          className="flex h-full flex-1 items-center justify-center text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none rounded-r-md"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <button
        disabled={product.stock <= 0}
        onClick={handleAddToCart}
        className="flex h-12 lg:h-14 flex-1 items-center justify-center rounded-md bg-primary px-4 lg:px-8 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-primary/30 transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
      >
        Add to cart
      </button>
    </div>
  );
}

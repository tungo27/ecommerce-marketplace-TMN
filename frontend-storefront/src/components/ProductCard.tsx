'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    price: string | number;
    stock: number;
    images?: string[];
    averageRating?: number;
    reviewCount?: number;
    seller?: {
      name?: string;
    };
  };
};

// Reusable VND formatter — Intl.NumberFormat handles grouping & symbol correctly
const formatVND = (value: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const getLocalizedText = (text: any) => typeof text === 'string' ? text : (text?.en || text?.vi || '');

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const isAuthenticated = !!user;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    await addToCart(
      {
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        images: product.images || [],
        stock: product.stock,
      },
      1,
      isAuthenticated
    );
    router.push('/cart');
  };

  // Prisma Decimal arrives as a string — cast strictly before any arithmetic
  const numericPrice = Number(product.price) || 0;
  const originalPrice = numericPrice * 1.15;

  const imageUrl =
    product.images?.[0] ||
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80';

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md group">
      <Link href={`/products/${product.id}`} className="relative aspect-[4/3] overflow-hidden bg-gray-100 block">
        <div className="absolute left-3 top-3 z-10 rounded-md bg-primary px-2 py-1 text-xs font-semibold uppercase tracking-widest text-white">
          -15%
        </div>
        {/* Next.js <Image /> with fill to prevent CLS — parent has aspect ratio set */}
        <Image
          src={imageUrl}
          alt={getLocalizedText(product.name)}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          {product.seller?.name || 'Official Store'}
        </p>
        <Link href={`/products/${product.id}`} className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-gray-900 hover:text-primary transition-colors">
          {getLocalizedText(product.name)}
        </Link>

        <div className="mt-1 flex items-center gap-0.5">
          {/* Dynamic rating stars from database */}
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-4 h-4 fill-current ${
                star <= Math.round(product.averageRating || 0)
                  ? 'text-[#F59E0B]'
                  : 'text-gray-300'
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="ml-1 text-xs text-gray-500">
            {product.averageRating && product.averageRating > 0
              ? `${Number(product.averageRating).toFixed(1)} (${product.reviewCount ?? 0})`
              : 'No reviews yet'}
          </span>
        </div>

        <div className="mt-auto pt-5">
          <div className="text-lg font-bold text-primary">
            {formatVND(numericPrice)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span className="line-through">
              {formatVND(originalPrice)}
            </span>
            <span>{product.stock > 0 ? `${product.stock} left` : 'Out of stock'}</span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="mt-4 w-full rounded-md bg-primary py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}

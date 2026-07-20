'use client';
import Link from 'next/link';
import Image from 'next/image';

interface CategoryItem {
  id: string;
  name: string;
  imageUrl?: string;
  productCount?: number;
}

// Fallback images for common category names
const CATEGORY_IMAGE_MAP: Record<string, string> = {
  electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=300&auto=format&fit=crop',
  fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=300&auto=format&fit=crop',
  'home & living': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=300&auto=format&fit=crop',
  'home_living': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=300&auto=format&fit=crop',
  cosmetics: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=300&auto=format&fit=crop',
  food: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300&auto=format&fit=crop',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1472851294502-8a8bef1cf152?q=80&w=300&auto=format&fit=crop';

function getCategoryImage(name: string, imageUrl?: string): string {
  if (imageUrl) return imageUrl;
  const key = name.toLowerCase().replace(/\s+/g, '_');
  return CATEGORY_IMAGE_MAP[key] || CATEGORY_IMAGE_MAP[name.toLowerCase()] || DEFAULT_IMAGE;
}

interface CategoryShowcaseProps {
  counts?: Record<string, number>;
  categories?: CategoryItem[];
}

export default function CategoryShowcase({ counts = {}, categories }: CategoryShowcaseProps) {
  // If no dynamic categories passed, render nothing gracefully
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 sm:text-2xl">Top Categories</h2>
          <p className="mt-1 text-sm text-gray-500">Explore products by category</p>
        </div>
        <Link
          href="/"
          className="text-sm font-semibold text-primary hover:text-primary/80 hover:underline"
        >
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-6">
        {categories.map((cat) => {
          const count = counts[cat.id] ?? cat.productCount ?? 0;
          const imgSrc = getCategoryImage(cat.name, cat.imageUrl);
          return (
            <Link
              key={cat.id}
              href={`/?category=${cat.id}`}
              scroll={false}
              className="group relative overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Background image */}
              <div className="relative h-36 w-full sm:h-40">
                <img
                  src={imgSrc}
                  alt={cat.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Subtle bottom shadow overlay instead of full gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col p-3">
                  <p className="text-base font-bold text-white drop-shadow-md leading-tight">
                    {cat.name}
                  </p>
                  <p className="text-xs text-gray-300 drop-shadow">{count} Items</p>
                </div>
              </div>
            </Link>
          );
        })}

        {/* All Categories link */}
        <Link
          href="/"
          scroll={false}
          className="group relative overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="relative h-36 w-full sm:h-40">
            <img
              src={DEFAULT_IMAGE}
              alt="All Categories"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col p-3">
              <p className="text-base font-bold text-white drop-shadow-md leading-tight">All Categories</p>
              <p className="text-xs text-gray-300 drop-shadow">{counts[''] ?? 0} Items</p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

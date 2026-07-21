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
  // New DummyJSON categories
  smartphones: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=300&auto=format&fit=crop',
  laptops: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=300&auto=format&fit=crop',
  fragrances: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300&auto=format&fit=crop',
  skincare: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=300&auto=format&fit=crop',
  groceries: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300&auto=format&fit=crop',
  'home-decoration': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=300&auto=format&fit=crop',
  furniture: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=300&auto=format&fit=crop',
  tops: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=300&auto=format&fit=crop',
  'womens-dresses': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=300&auto=format&fit=crop',
  'womens-shoes': 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=300&auto=format&fit=crop',
  'mens-shirts': 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=300&auto=format&fit=crop',
  'mens-shoes': 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=300&auto=format&fit=crop',
  'mens-watches': 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=300&auto=format&fit=crop',
  'womens-watches': 'https://images.unsplash.com/photo-1508656937048-985160df6463?q=80&w=300&auto=format&fit=crop',
  'womens-bags': 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=300&auto=format&fit=crop',
  'womens-jewellery': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=300&auto=format&fit=crop',
  sunglasses: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=300&auto=format&fit=crop',
  automotive: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=300&auto=format&fit=crop',
  motorcycle: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=300&auto=format&fit=crop',
  lighting: 'https://images.unsplash.com/photo-1513506003901-1e6a229e9d15?q=80&w=300&auto=format&fit=crop',
  beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=300&auto=format&fit=crop',
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
          const imgSrc = cat.imageUrl || DEFAULT_IMAGE;
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

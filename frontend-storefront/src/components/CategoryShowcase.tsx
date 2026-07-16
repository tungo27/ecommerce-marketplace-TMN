import Link from 'next/link';

interface Category {
  id: string;
  label: string;
  value: string;
  emoji: string;
  imageUrl: string;
  productCount: number;
  color: string;
}

const CATEGORIES: Category[] = [
  {
    id: '1',
    label: 'Electronics',
    value: 'Electronics',
    emoji: '',
    imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=300&auto=format&fit=crop',
    productCount: 128,
    color: '',
  },
  {
    id: '2',
    label: 'Fashion',
    value: 'Fashion',
    emoji: '',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=300&auto=format&fit=crop',
    productCount: 245,
    color: '',
  },
  {
    id: '3',
    label: 'Home & Living',
    value: 'Home_Living',
    emoji: '',
    imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=300&auto=format&fit=crop',
    productCount: 87,
    color: '',
  },
  {
    id: '4',
    label: 'Cosmetics',
    value: 'Cosmetics',
    emoji: '',
    imageUrl: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=300&auto=format&fit=crop',
    productCount: 193,
    color: '',
  },
  {
    id: '5',
    label: 'Food',
    value: 'Food',
    emoji: '',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300&auto=format&fit=crop',
    productCount: 312,
    color: '',
  },
  {
    id: '6',
    label: 'All Categories',
    value: '',
    emoji: '',
    imageUrl: 'https://images.unsplash.com/photo-1472851294502-8a8bef1cf152?q=80&w=300&auto=format&fit=crop',
    productCount: 0,
    color: '',
  },
];

interface CategoryShowcaseProps {
  counts?: Record<string, number>;
}

export default function CategoryShowcase({ counts = {} }: CategoryShowcaseProps) {
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
        {CATEGORIES.map((cat) => {
          const count = counts[cat.value] ?? cat.productCount;
          return (
            <Link
              key={cat.id}
              href={cat.value ? `/?category=${cat.value}` : '/'}
              scroll={false}
              className="group relative overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Background image */}
              <div className="relative h-36 w-full sm:h-40">
                <img
                  src={cat.imageUrl}
                  alt={cat.label}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Subtle bottom shadow overlay instead of full gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col p-3">
                  <p className="text-base font-bold text-white drop-shadow-md leading-tight">
                    {cat.label}
                  </p>
                  <p className="text-xs text-gray-300 drop-shadow">{count} Items</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

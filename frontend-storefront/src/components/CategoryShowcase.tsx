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
    label: 'Điện Tử',
    value: 'Electronics',
    emoji: '📱',
    imageUrl: 'https://picsum.photos/seed/cat-electronics/300/300',
    productCount: 128,
    color: 'from-blue-500 to-blue-700',
  },
  {
    id: '2',
    label: 'Thời Trang',
    value: 'Fashion',
    emoji: '👗',
    imageUrl: 'https://picsum.photos/seed/cat-fashion/300/300',
    productCount: 245,
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: '3',
    label: 'Nhà & Nội Thất',
    value: 'Home_Living',
    emoji: '🛋️',
    imageUrl: 'https://picsum.photos/seed/cat-home/300/300',
    productCount: 87,
    color: 'from-green-500 to-emerald-700',
  },
  {
    id: '4',
    label: 'Mỹ Phẩm',
    value: 'Cosmetics',
    emoji: '💄',
    imageUrl: 'https://picsum.photos/seed/cat-cosmetics/300/300',
    productCount: 193,
    color: 'from-purple-500 to-violet-700',
  },
  {
    id: '5',
    label: 'Thực Phẩm',
    value: 'Food',
    emoji: '🍜',
    imageUrl: 'https://picsum.photos/seed/cat-food/300/300',
    productCount: 312,
    color: 'from-orange-400 to-orange-600',
  },
  {
    id: '6',
    label: 'Tất Cả',
    value: '',
    emoji: '🛍️',
    imageUrl: 'https://picsum.photos/seed/cat-all/300/300',
    productCount: 965,
    color: 'from-gray-500 to-gray-700',
  },
];

export default function CategoryShowcase() {
  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 sm:text-2xl">Danh Mục Nổi Bật</h2>
          <p className="mt-1 text-sm text-gray-500">Khám phá sản phẩm theo từng danh mục</p>
        </div>
        <Link
          href="/"
          className="text-sm font-semibold text-orange-500 hover:text-orange-600 hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-6">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={cat.value ? `/?category=${cat.value}` : '/'}
            className="group relative overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            {/* Background image */}
            <div className="relative h-36 w-full sm:h-40">
              <img
                src={cat.imageUrl}
                alt={cat.label}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-60`} />
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                <span className="text-3xl drop-shadow-md">{cat.emoji}</span>
                <p className="mt-2 text-sm font-bold text-white drop-shadow-md leading-tight">
                  {cat.label}
                </p>
                <p className="mt-0.5 text-xs text-white/80 drop-shadow">{cat.productCount} SP</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

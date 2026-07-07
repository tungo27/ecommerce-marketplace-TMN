type ProductCardProps = {
  product: {
    name: string;
    price: string | number;
    stock: number;
    images?: string[];
    seller?: {
      name?: string;
    };
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  const price = Number(product.price) || 0;
  const originalPrice = price * 1.15;
  const imageUrl =
    product.images?.[0] ||
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80';

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <div className="absolute left-3 top-3 z-10 rounded-md bg-primary px-2 py-1 text-xs font-semibold uppercase tracking-widest text-white">
          -15%
        </div>
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          {product.seller?.name || 'Official Store'}
        </p>
        <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-gray-900">
          {product.name}
        </h3>

        <div className="mt-auto pt-5">
          <div className="text-lg font-bold text-primary">
            {price.toLocaleString('vi-VN')} VND
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span className="line-through">
              {originalPrice.toLocaleString('vi-VN')} VND
            </span>
            <span>{product.stock > 0 ? `${product.stock} left` : 'Out of stock'}</span>
          </div>
          <button className="mt-4 w-full rounded-md bg-primary py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-primary-hover">
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}

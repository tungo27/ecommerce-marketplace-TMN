interface ProductProps {
  product: any;
}

export default function ProductCard({ product }: ProductProps) {
  const price = Number(product.price) || 0;
  const originalPrice = price * 1.15;
  const discountPercent = 15;
  const ratingCount = product.ratingCount ?? 24;
  const ratingStars = '★★★★★';

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative overflow-hidden bg-gray-100">
        <div className="absolute left-4 top-4 rounded-lg bg-[#FF4742] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
          -{discountPercent}%
        </div>
        <img
          src={'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-card-40-17pro-202509_FMT_WHH?wid=508&hei=472&fmt=p-jpg&qlt=95&.v=WVVFRzUzVk1oblJhbW9PbGNSU25ja3doNjVzb1FWSTVwZWJJYThYTHlrNzQzbUlIR1RvazhDRHNOQlYvM3g2dFIwdkZSSnBZYjhOaHBpM2lkYTFBUEZHTmVoMWFVZloyU3lqdmZCOUFEeDF6K2N6UFd4K21VWHNnbWZBQ3hSanQ'}
          alt={product.name}
          className="h-full w-full min-h-[220px] object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            {product.seller?.name || 'Official Store'}
          </p>
          <h3 className="mt-3 text-sm font-semibold leading-6 text-gray-900 line-clamp-2">
            {product.name}
          </h3>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#F59E0B]">{ratingStars}</span>
            <span className="text-xs text-gray-500">({ratingCount})</span>
          </div>

          <div className="space-y-3">
            <div className="text-lg font-bold text-[#FF4742]">
              {price.toLocaleString('vi-VN')} ₫
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="line-through">
                {originalPrice.toLocaleString('vi-VN')} ₫
              </span>
              <span>{product.stock > 0 ? `Items: ${product.stock}` : 'Out of stock'}</span>
            </div>
          </div>

          <button className="mt-3 w-full rounded-full bg-[#FF4742] py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#E63E39]">
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}
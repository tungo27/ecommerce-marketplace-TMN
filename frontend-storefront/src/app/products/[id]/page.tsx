import Header from '@/components/Header';
import Link from 'next/link';
import ProductDetailActions from '@/components/ProductDetailActions';
import ProductReviewsSection from '@/components/ProductReviewsSection';
import ProductImageGallery from '@/components/ProductImageGallery';

async function fetchProduct(id: string) {
  try {
    const normalizeApiBaseUrl = (value?: string) => {
      const raw = (value || 'http://localhost:4000').trim().replace(/\/+$/, '');
      return raw.endsWith('/api') ? raw : `${raw}/api`;
    };

    const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const response = await fetch(`${apiBaseUrl}/products/${id}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

async function fetchProductReviews(id: string) {
  try {
    const normalizeApiBaseUrl = (value?: string) => {
      const raw = (value || 'http://localhost:4000').trim().replace(/\/+$/, '');
      return raw.endsWith('/api') ? raw : `${raw}/api`;
    };

    const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const response = await fetch(`${apiBaseUrl}/products/${id}/reviews`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch {
    return [];
  }
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review_order?: string }>;
}) {
  const { id } = await params;
  const { review_order } = await searchParams;
  const product = await fetchProduct(id);
  const initialReviews = await fetchProductReviews(id);

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been removed.</p>
          <Link href="/" className="rounded-md bg-primary px-6 py-2 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-primary-hover">
            Back to Home
          </Link>
        </main>
      </div>
    );
  }

  const activeFlashSale = product.flashSales?.[0];
  const isFlashSale = !!activeFlashSale;
  // Prisma Decimal arrives as a string — cast strictly before any arithmetic
  const numericPrice = Number(product.price) || 0;
  const originalPrice = numericPrice;
  const displayPrice = isFlashSale ? Number(activeFlashSale.salePrice) : numericPrice;

  // Cập nhật product object để truyền vào ProductDetailActions
  const productForActions = {
    ...product,
    price: displayPrice,
    originalPrice,
    isFlashSale,
  };

  // VND currency formatter using the standard Intl API
  const formatVND = (value: number): string =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const getLocalizedText = (text: any) => typeof text === 'string' ? text : (text?.en || text?.vi || '');

  return (
    <div className="min-h-screen bg-white lg:bg-gray-50 text-gray-900 pb-20 lg:pb-0">
      <Header />

      <main className="mx-auto max-w-[1600px] lg:px-4 lg:py-8">
        {/* Breadcrumbs - scrollable on mobile */}
        <nav className="mb-2 lg:mb-6 text-sm text-gray-500 overflow-x-auto p-4 lg:p-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <ol className="flex items-center space-x-2 whitespace-nowrap">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link href={`/?category=${product.category || 'All'}`} className="hover:text-primary transition-colors">
                {product.category || 'Category'}
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium truncate max-w-[200px] md:max-w-xs" title={getLocalizedText(product.name)}>
              {getLocalizedText(product.name)}
            </li>
          </ol>
        </nav>

        <div className="rounded-none lg:rounded-[1.25rem] bg-white p-0 lg:p-10 lg:shadow-sm">
          
          {/* Mobile Title & Rating (Amazon style: Title above image) */}
          <div className="lg:hidden px-4 pt-2 pb-4">
            <div className="mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                {product.seller?.name || 'Official Store'}
              </span>
            </div>
            <h1 className="text-xl font-bold leading-tight text-gray-900">
              {getLocalizedText(product.name)}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center text-[#F59E0B]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`h-4 w-4 ${star <= Math.round(product.averageRating || 0) ? 'fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs font-medium text-gray-500 underline decoration-gray-300 underline-offset-4">{initialReviews.length} Reviews</span>
            </div>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-0 lg:gap-12">
            
            {/* Left: Image Gallery - Component Client để xử lý tương tác chuyển ảnh */}
            <ProductImageGallery
              images={product.images || []}
              productName={getLocalizedText(product.name)}
              isFlashSale={isFlashSale}
              discountPercentage={activeFlashSale?.discountPercentage}
            />

            {/* Right: Product Info */}
            <div className="flex flex-col p-4 lg:p-0">
              
              {/* Desktop Title & Rating */}
              <div className="hidden lg:block">
                <div className="mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    {product.seller?.name || 'Official Store'}
                  </span>
                </div>
                
                <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl lg:text-4xl">
                  {getLocalizedText(product.name)}
                </h1>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center text-[#F59E0B]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`h-5 w-5 ${star <= Math.round(product.averageRating || 0) ? 'fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-500 underline decoration-gray-300 underline-offset-4 cursor-pointer hover:text-gray-700">{initialReviews.length} Reviews</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    {product.stock > 0 ? 'In Stock' : 'Out of stock'}
                  </span>
                </div>
              </div>

              {/* Mobile Stock Status (since it's moved from Title area on mobile) */}
              <div className="lg:hidden mb-2">
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {product.stock > 0 ? 'In Stock' : 'Out of stock'}
                </span>
              </div>

              <div className="mt-2 lg:mt-6 flex flex-wrap items-end gap-3 lg:gap-4 border-b border-gray-100 pb-4 lg:pb-6">
                <span className="text-3xl lg:text-4xl font-black tracking-tight text-primary">
                  {formatVND(displayPrice)}
                </span>
                {isFlashSale && (
                  <span className="mb-1 text-base lg:text-lg font-medium text-gray-400 line-through">
                    {formatVND(originalPrice)}
                  </span>
                )}
              </div>

              <div className="mt-4 lg:mt-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-2 lg:mb-3">
                  Description
                </h3>
                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                  {getLocalizedText(product.description) || (
                    <p>No description provided for this product.</p>
                  )}
                </div>
              </div>

              <ProductDetailActions product={productForActions} />
              
              {/* Trust badges */}
              <div className="mt-8 grid grid-cols-2 gap-3 lg:gap-4 border-t border-gray-100 pt-6 sm:grid-cols-4">
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-orange-50 text-primary">
                    <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                  </div>
                  <span className="text-[10px] lg:text-xs font-medium text-gray-500">Free Shipping</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-orange-50 text-primary">
                    <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <span className="text-[10px] lg:text-xs font-medium text-gray-500">Secure Payment</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-orange-50 text-primary">
                    <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  </div>
                  <span className="text-[10px] lg:text-xs font-medium text-gray-500">Authentic</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center gap-2">
                  <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-orange-50 text-primary">
                    <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </div>
                  <span className="text-[10px] lg:text-xs font-medium text-gray-500">30-Day Return</span>
                </div>
              </div>
              
              {/* Reviews Section */}
              <ProductReviewsSection 
                productId={product.id}
                averageRating={product.averageRating || 0}
                initialReviews={initialReviews}
                reviewOrderFromUrl={review_order}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import HorizontalScrollWrapper from '@/components/HorizontalScrollWrapper';
import HeroBanner from '@/components/HeroBanner';
import CategoryShowcase from '@/components/CategoryShowcase';
import FlashSale from '@/components/FlashSale';
import HomepageSocialProof from '@/components/HomepageSocialProof';
import Footer from '@/components/Footer';

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type HomePageProps = {
  searchParams: Promise<SearchParams>;
};

const priceRanges = [
  { label: 'Any Price', minPrice: null, maxPrice: null },
  { label: 'Under 500k', minPrice: '0', maxPrice: '500000' },
  { label: '500k - 2 million', minPrice: '500000', maxPrice: '2000000' },
  { label: '2 - 10 million', minPrice: '2000000', maxPrice: '10000000' },
  { label: 'Over 10 million', minPrice: '10000000', maxPrice: '1000000000' },
];

const getFirstParam = (value: string | string[] | undefined) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
};

const buildHref = (
  resolvedParams: SearchParams,
  overrides: Record<string, string | null | undefined> = {},
) => {
  const urlParams = new URLSearchParams();

  Object.entries(resolvedParams || {}).forEach(([key, value]) => {
    if (typeof value === 'string' && value) {
      urlParams.set(key, value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) urlParams.append(key, item);
      });
    }
  });

  Object.entries(overrides).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      urlParams.delete(key);
      return;
    }

    urlParams.set(key, value);
  });

  const query = urlParams.toString();
  return query ? `/?${query}` : '/';
};

async function fetchProducts(resolvedParams: SearchParams) {
  try {
    const page = getFirstParam(resolvedParams.page) || '1';
    const params = new URLSearchParams({
      page,
      limit: '12',
    });

    const category = getFirstParam(resolvedParams.category);
    const search = getFirstParam(resolvedParams.search);
    const minPrice = getFirstParam(resolvedParams.minPrice);
    const maxPrice = getFirstParam(resolvedParams.maxPrice);

    if (category) params.set('categoryId', category);
    if (search) params.set('search', search);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    const normalizeApiBaseUrl = (value?: string) => {
      const raw = (value || 'http://localhost:4000').trim().replace(/\/+$/, '');
      return raw.endsWith('/api') ? raw : `${raw}/api`;
    };

    const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const response = await fetch(`${apiBaseUrl}/products?${params.toString()}`, {
      next: { revalidate: 30 },
    });

    if (!response.ok) return { products: [], meta: { total: 0 } };

    const result = await response.json();
    return result.data ?? result;
  } catch {
    return { products: [], meta: { total: 0 } };
  }
}

async function fetchReviews(productId: string) {
  try {
    const normalizeApiBaseUrl = (value?: string) => {
      const raw = (value || 'http://localhost:4000').trim().replace(/\/+$/, '');
      return raw.endsWith('/api') ? raw : `${raw}/api`;
    };
    const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const response = await fetch(`${apiBaseUrl}/products/${productId}/reviews`, {
      next: { revalidate: 30 },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch {
    return [];
  }
}

async function fetchStorefrontConfig() {
  try {
    const normalizeApiBaseUrl = (value?: string) => {
      const raw = (value || 'http://localhost:4000').trim().replace(/\/+$/, '');
      return raw.endsWith('/api') ? raw : `${raw}/api`;
    };
    const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const response = await fetch(`${apiBaseUrl}/cms/storefront`, { next: { revalidate: 30 } });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchCategories() {
  try {
    const normalizeApiBaseUrl = (value?: string) => {
      const raw = (value || 'http://localhost:4000').trim().replace(/\/+$/, '');
      return raw.endsWith('/api') ? raw : `${raw}/api`;
    };
    const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const response = await fetch(`${apiBaseUrl}/categories`, { next: { revalidate: 30 } });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

async function fetchActiveFlashSales() {
  try {
    const normalizeApiBaseUrl = (value?: string) => {
      const raw = (value || 'http://localhost:4000').trim().replace(/\/+$/, '');
      return raw.endsWith('/api') ? raw : `${raw}/api`;
    };
    const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const response = await fetch(`${apiBaseUrl}/flash-sales/active`, { next: { revalidate: 30 } });
    if (!response.ok) return [];
    const result = await response.json();
    return result.data || result || [];
  } catch {
    return [];
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = await searchParams;
  const data = await fetchProducts(resolvedParams);
  const products = data.products || [];
  const total = data.meta?.total || 0;
  const currentPage = Number(getFirstParam(resolvedParams.page)) || 1;
  const totalPages = Math.ceil(total / 12);

  let reviews: any[] = [];
  if (products.length > 0) {
    reviews = await fetchReviews(products[0].id);
  }

  const activeFlashSales = await fetchActiveFlashSales();
  const flashSalesMap = activeFlashSales.reduce((acc: any, fs: any) => {
    acc[fs.productId] = fs;
    return acc;
  }, {});


  const fetchedCategories = await fetchCategories();
  const categories = [
    { label: 'All', value: null },
    ...fetchedCategories.map((c: any) => ({ label: c.name, value: c.id }))
  ];

  const storefrontConfig = await fetchStorefrontConfig();

  // Hero product lookup if admin chose a product instead of a URL
  let heroImage = storefrontConfig?.heroImage || '';
  let heroProduct = products.length > 0 ? products[0] : undefined;
  let heroFlashSale = undefined;

  if (storefrontConfig?.heroProductId) {
    let p = products.find((p: any) => p.id === storefrontConfig.heroProductId);
    if (!p) {
      try {
        const normalizeApiBaseUrl = (value?: string) => {
          const raw = (value || 'http://localhost:4000').trim().replace(/\/+$/, '');
          return raw.endsWith('/api') ? raw : `${raw}/api`;
        };
        const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
        const pRes = await fetch(`${apiBaseUrl}/products/${storefrontConfig.heroProductId}`, { next: { revalidate: 30 } });
        if (pRes.ok) {
           const json = await pRes.json();
           p = json.data || json;
        }
      } catch (e) {}
    }
    if (p) {
      heroProduct = p;
      if (!heroImage && p.images?.[0]) {
        heroImage = p.images[0];
      }
    }
  }

  // Get flash sale for the hero product
  if (heroProduct) {
    heroFlashSale = flashSalesMap[heroProduct.id] || (heroProduct.flashSales?.length > 0 ? heroProduct.flashSales[0] : undefined);
  }
  const showcaseCategories = storefrontConfig?.featuredCategoryIds?.length
    ? fetchedCategories.filter((c: any) => storefrontConfig.featuredCategoryIds.includes(c.id))
    : fetchedCategories.slice(0, 5);

  const categoriesCountArr = await Promise.all([
    ...showcaseCategories.map((c: any) => fetchProducts({ category: c.id }).then(r => ({ value: c.id, count: r.meta?.total || 0 }))),
    fetchProducts({}).then(r => ({ value: '', count: r.meta?.total || 0 })),
  ]);

  const categoriesCount = categoriesCountArr.reduce((acc, curr) => {
    acc[curr.value] = curr.count;
    return acc;
  }, {} as Record<string, number>);

  const currentCategory = getFirstParam(resolvedParams.category);
  const currentSearch = getFirstParam(resolvedParams.search) || '';
  const currentMinPrice = getFirstParam(resolvedParams.minPrice);
  const currentMaxPrice = getFirstParam(resolvedParams.maxPrice);
  const searchAction = buildHref(resolvedParams, { search: null });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header
        searchAction={searchAction}
        currentSearch={currentSearch}
        currentCategory={currentCategory}
        currentMinPrice={currentMinPrice}
        currentMaxPrice={currentMaxPrice}
      />

      <main className={`mx-auto max-w-[1600px] px-4 py-6 ${storefrontConfig?.theme === 'dark' ? 'bg-gray-900 text-white' : ''}`}>
        
        {storefrontConfig?.announcement && (
          <div className="mb-4 rounded-md bg-blue-50 p-4 text-sm font-medium text-blue-800 text-center">
            {storefrontConfig.announcement}
          </div>
        )}

        {/* Homepage sections — hidden when user is searching */}
        {!currentSearch && (
          <>
            {/* 1. Hero Banner */}
            <HeroBanner 
              product={heroProduct} 
              heroImage={heroImage} 
              heroProductId={storefrontConfig?.heroProductId} 
              flashSale={heroFlashSale}
            />

            {/* 2. Category Showcase */}
            <div className="mt-8">
              <CategoryShowcase counts={categoriesCount} categories={showcaseCategories} />
            </div>

            {/* 3. Flash Sale */}
            <div className="mt-8">
              <FlashSale flashSales={activeFlashSales} />
            </div>
          </>
        )}

        {/* 4. Product List with Sidebar Filters */}
        <div className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 sm:text-2xl">All Products</h2>
              <p className="mt-1 text-sm text-gray-500">{total} products available</p>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <aside className="w-full shrink-0 lg:w-64">
              <div className="flex flex-col gap-4 lg:sticky lg:top-24">
                <section className="rounded-md border-0 lg:border border-gray-200 bg-transparent lg:bg-white p-0 lg:p-5 shadow-none lg:shadow-sm">
                  <h3 className="hidden lg:block text-xs font-bold uppercase tracking-widest text-gray-500">
                    Categories
                  </h3>
                  <HorizontalScrollWrapper>
                    {categories.map((category) => {
                      const isActive = currentCategory === (category.value || undefined);
                      return (
                        <Link
                          key={category.label}
                          href={buildHref(resolvedParams, {
                            category: category.value,
                            page: '1',
                          })}
                          scroll={false}
                          className={`shrink-0 rounded-full lg:rounded-md px-4 py-1.5 lg:px-3 lg:py-2 text-sm transition ${isActive
                              ? 'bg-primary lg:bg-[#FFF1EE] font-bold text-white lg:text-primary shadow-md lg:shadow-none'
                              : 'bg-white lg:bg-transparent border border-gray-200 lg:border-transparent text-[#475569] hover:bg-gray-50 hover:text-primary shadow-sm lg:shadow-none'
                            }`}
                        >
                          {category.label}
                        </Link>
                      );
                    })}
                  </HorizontalScrollWrapper>
                </section>

                <section className="rounded-md border-0 lg:border border-gray-200 bg-transparent lg:bg-white p-0 lg:p-5 shadow-none lg:shadow-sm">
                  <h3 className="hidden lg:block text-xs font-bold uppercase tracking-widest text-gray-500">
                    Price Range
                  </h3>
                  <HorizontalScrollWrapper>
                    {priceRanges.map((range) => {
                      const isActive =
                        currentMinPrice === (range.minPrice || undefined) &&
                        currentMaxPrice === (range.maxPrice || undefined);
                      return (
                        <Link
                          key={range.label}
                          href={buildHref(resolvedParams, {
                            minPrice: range.minPrice,
                            maxPrice: range.maxPrice,
                            page: '1',
                          })}
                          scroll={false}
                          className={`shrink-0 rounded-full lg:rounded-md px-4 py-1.5 lg:px-3 lg:py-2 text-sm transition ${isActive
                              ? 'bg-primary lg:bg-[#FFEEF0] lg:border border-[#FFCBC7] border-transparent font-bold text-white lg:text-primary shadow-md lg:shadow-none'
                              : 'bg-white lg:bg-transparent border border-gray-200 lg:border-transparent text-[#475569] hover:bg-gray-50 hover:text-primary shadow-sm lg:shadow-none'
                            }`}
                        >
                          {range.label}
                        </Link>
                      );
                    })}
                  </HorizontalScrollWrapper>
                </section>
              </div>
            </aside>

            <section className="min-w-0 flex-1">
              <div className="hidden lg:block rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
                  {total} products
                </p>
              </div>

              <div className="lg:mt-4 grid grid-cols-2 gap-2 lg:gap-4 xl:grid-cols-4">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} flashSale={flashSalesMap[product.id]} />
                ))}
              </div>

              {products.length === 0 && (
                <div className="mt-4 rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                  No products found. Try again later.
                </div>
              )}

            </section>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 mb-8 flex justify-center items-center gap-2">
              <Link
                href={currentPage > 1 ? buildHref(resolvedParams, { page: (currentPage - 1).toString() }) : '#'}
                scroll={false}
                className={`flex items-center justify-center w-10 h-10 rounded-md border transition-all duration-300 ${currentPage > 1
                    ? 'border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary shadow-sm'
                    : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed pointer-events-none'
                  }`}
                aria-disabled={currentPage <= 1}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  href={buildHref(resolvedParams, { page: page.toString() })}
                  scroll={false}
                  className={`flex items-center justify-center w-10 h-10 rounded-md text-sm font-semibold transition-all duration-300 ${page === currentPage
                      ? 'bg-primary text-white shadow-md transform scale-110'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary hover:bg-[#FFF1EE]'
                    }`}
                >
                  {page}
                </Link>
              ))}

              <Link
                href={currentPage < totalPages ? buildHref(resolvedParams, { page: (currentPage + 1).toString() }) : '#'}
                scroll={false}
                className={`flex items-center justify-center w-10 h-10 rounded-md border transition-all duration-300 ${currentPage < totalPages
                    ? 'border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary shadow-sm'
                    : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed pointer-events-none'
                  }`}
                aria-disabled={currentPage >= totalPages}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* 5. Social Proof */}
        <div className="mt-8">
          <HomepageSocialProof reviews={reviews} />
        </div>

        {/* 6. Footer */}
        <div className="mt-8">
          <Footer />
        </div>
      </main>
    </div>
  );
}

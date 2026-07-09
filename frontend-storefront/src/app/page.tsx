import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import HorizontalScrollWrapper from '@/components/HorizontalScrollWrapper';

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type HomePageProps = {
  searchParams: Promise<SearchParams>;
};

const categories = [
  { label: 'All', value: null },
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Fashion', value: 'Fashion' },
  { label: 'Home & Living', value: 'Home_Living' },
  { label: 'Cosmetics', value: 'Cosmetics' },
  { label: 'Food', value: 'Food' },
];

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
    const params = new URLSearchParams({
      page: '1',
      limit: '12',
    });

    const category = getFirstParam(resolvedParams.category);
    const search = getFirstParam(resolvedParams.search);
    const minPrice = getFirstParam(resolvedParams.minPrice);
    const maxPrice = getFirstParam(resolvedParams.maxPrice);

    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    const normalizeApiBaseUrl = (value?: string) => {
      const raw = (value || 'http://localhost:4000').trim().replace(/\/+$/, '');
      return raw.endsWith('/api') ? raw : `${raw}/api`;
    };

    const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const response = await fetch(`${apiBaseUrl}/products?${params.toString()}`, {
      cache: 'no-store',
    });

    if (!response.ok) return { products: [], meta: { total: 0 } };

    const result = await response.json();
    return result.data ?? result;
  } catch {
    return { products: [], meta: { total: 0 } };
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = await searchParams;
  const data = await fetchProducts(resolvedParams);
  const products = data.products || [];
  const total = data.meta?.total || 0;

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

      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-r from-[#FF654C] via-[#FF4B39] to-[#FF2A24] px-6 py-12 text-white shadow-lg">
          <div className="absolute inset-y-0 left-0 w-72 opacity-30 blur-3xl">
            <div className="h-full w-full rounded-full bg-white/20" />
          </div>
          <div className="absolute inset-y-0 right-0 w-72 opacity-20 blur-3xl">
            <div className="h-full w-full rounded-full bg-white/20" />
          </div>
          <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 md:flex-row">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
                Welcome to
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-black uppercase tracking-tight sm:text-5xl">
                E-commerce MVP
              </h1>
              <p className="mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
                Find products for every everyday workflow. Browse public products, filter by category or price, and sign in only when you are ready to manage your account.
              </p>
            </div>
            <div className="hidden md:block flex-1 w-full max-w-sm">
              <img
                src="/hero-image.png"
                alt="Shopping Illustration"
                className="w-full h-auto object-cover rounded-lg drop-shadow-2xl hover:-translate-y-2 transition-transform duration-500"
              />
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="w-full shrink-0 lg:w-64">
            <div className="flex flex-col gap-4 lg:sticky lg:top-24">
              
              <section className="rounded-md border-0 lg:border border-gray-200 bg-transparent lg:bg-white p-0 lg:p-5 shadow-none lg:shadow-sm">
                <h2 className="hidden lg:block text-xs font-bold uppercase tracking-widest text-gray-500">
                  Categories
                </h2>
                {/* Mobile: horizontal scroll, Desktop: grid column */}
                <HorizontalScrollWrapper>
                  {categories.map((category) => {
                    const isActive = currentCategory === (category.value || undefined);

                    return (
                      <Link
                        key={category.label}
                        href={buildHref(resolvedParams, {
                          category: category.value,
                        })}
                        className={`shrink-0 rounded-full lg:rounded-md px-4 py-1.5 lg:px-3 lg:py-2 text-sm transition ${
                          isActive
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
                <h2 className="hidden lg:block text-xs font-bold uppercase tracking-widest text-gray-500">
                  Price Range
                </h2>
                {/* Mobile: horizontal scroll, Desktop: grid column */}
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
                        })}
                        className={`shrink-0 rounded-full lg:rounded-md px-4 py-1.5 lg:px-3 lg:py-2 text-sm transition ${
                          isActive
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

            {/* Mobile: grid-cols-2 gap-2, Desktop: gap-4 xl:grid-cols-4 */}
            <div className="lg:mt-4 grid grid-cols-2 gap-2 lg:gap-4 xl:grid-cols-4">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {products.length === 0 && (
              <div className="mt-4 rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                No products found. Start the backend and seed the database to
                load homepage products.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

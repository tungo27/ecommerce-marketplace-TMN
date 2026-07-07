import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

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

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
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
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link href="/" className="shrink-0 text-xl font-extrabold text-primary">
            E-commerce MVP
          </Link>

          <form method="get" action={searchAction} className="relative flex-1">
            <input
              name="search"
              defaultValue={currentSearch}
              type="search"
              placeholder="Search products"
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-4 pr-24 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
            />
            <input type="hidden" name="category" value={currentCategory || ''} />
            <input type="hidden" name="minPrice" value={currentMinPrice || ''} />
            <input type="hidden" name="maxPrice" value={currentMaxPrice || ''} />
            <button
              type="submit"
              className="absolute right-1 top-1/2 h-8 -translate-y-1/2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Search
            </button>
          </form>

          <nav className="flex shrink-0 items-center gap-2 text-sm font-semibold">
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-gray-700 transition hover:bg-gray-100 hover:text-primary"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-primary px-4 py-2 text-white transition hover:bg-primary-hover"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="rounded-md border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Customer Storefront
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-normal text-gray-950 sm:text-5xl">
            Find products for every everyday workflow.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
            Browse public products, filter by category or price, and sign in only
            when you are ready to manage your account.
          </p>
        </section>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="w-full shrink-0 lg:w-64">
            <div className="space-y-4 lg:sticky lg:top-24">
              <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Categories
                </h2>
                <div className="mt-4 grid gap-2">
                  {categories.map((category) => {
                    const isActive = currentCategory === (category.value || undefined);

                    return (
                      <Link
                        key={category.label}
                        href={buildHref(resolvedParams, {
                          category: category.value,
                        })}
                        className={`rounded-md px-3 py-2 text-sm transition ${
                          isActive
                            ? 'bg-primary-light font-bold text-primary'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                        }`}
                      >
                        {category.label}
                      </Link>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Price Range
                </h2>
                <div className="mt-4 grid gap-2">
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
                        className={`rounded-md px-3 py-2 text-sm transition ${
                          isActive
                            ? 'bg-primary-light font-bold text-primary'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                        }`}
                      >
                        {range.label}
                      </Link>
                    );
                  })}
                </div>
              </section>
            </div>
          </aside>

          <section className="min-w-0 flex-1">
            <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
                {total} products
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

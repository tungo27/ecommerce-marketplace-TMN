import ProductCard from '@/components/ProductCard';

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

const getFirstParam = (value: string | string[] | undefined) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
};

async function fetchProducts(resolvedParams: SearchParams) {
  try {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', '12');

    const category = getFirstParam(resolvedParams.category);
    const search = getFirstParam(resolvedParams.search);
    const minPrice = getFirstParam(resolvedParams.minPrice);
    const maxPrice = getFirstParam(resolvedParams.maxPrice);

    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    const res = await fetch(`http://127.0.0.1:4000/api/products?${params.toString()}`, {
      cache: 'no-store',
    });

    if (!res.ok) return { products: [], meta: { total: 0 } };
    const result = await res.json();
    return result.data ?? result;
  } catch {
    return { products: [], meta: { total: 0 } };
  }
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<any> | any;
}) {
  const resolvedParams = await searchParams;
  const data = await fetchProducts(resolvedParams);
  const products = data.products || [];
  const total = data.meta?.total || 0;

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const urlParams = new URLSearchParams();

    Object.entries(resolvedParams || {}).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) {
        value.forEach((item) => urlParams.append(key, item));
        return;
      }
      urlParams.set(key, value);
    });

    Object.entries(overrides).forEach(([key, value]) => {
      if (value === undefined) urlParams.delete(key);
      else urlParams.set(key, value);
    });

    const query = urlParams.toString();
    return query ? `/?${query}` : '/';
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-r from-[#FF654C] via-[#FF4B39] to-[#FF2A24] px-6 py-12 text-white shadow-lg">
        <div className="absolute inset-y-0 left-0 w-72 opacity-30 blur-3xl">
          <div className="h-full w-full rounded-full bg-white/20" />
        </div>
        <div className="absolute inset-y-0 right-0 w-72 opacity-20 blur-3xl">
          <div className="h-full w-full rounded-full bg-white/20" />
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
              Welcome to
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black uppercase tracking-tight sm:text-5xl">
              TMN Shop
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
              Millions of products, best prices every day.
            </p>
          </div>
          <a
            href="/"
            className="inline-flex w-fit items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#FF4742] shadow-md transition hover:bg-gray-100"
          >
            Shop Now →
          </a>
        </div>
      </section>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full lg:w-60 shrink-0">
          <div className="sticky top-32 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-[0.24em] text-gray-500">
                Categories
              </h2>
              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href={buildHref({ category: null })}
                    className="block rounded-2xl px-4 py-3 text-sm font-semibold text-gray-800 transition hover:text-[#FF4742]"
                  >
                    All
                  </a>
                </li>
                <li>
                  <a
                    href={buildHref({ category: 'Electronics' })}
                    className="block rounded-2xl px-4 py-3 text-sm text-gray-600 transition hover:text-[#FF4742]"
                  >
                    Electronics
                  </a>
                </li>
                <li>
                  <a
                    href={buildHref({ category: 'Fashion' })}
                    className="block rounded-2xl px-4 py-3 text-sm text-gray-600 transition hover:text-[#FF4742]"
                  >
                    Fashion
                  </a>
                </li>
                <li>
                  <a
                    href={buildHref({ category: 'Home_Living' })}
                    className="block rounded-2xl px-4 py-3 text-sm text-gray-600 transition hover:text-[#FF4742]"
                  >
                    Home & Living
                  </a>
                </li>
                <li>
                  <a
                    href={buildHref({ category: 'Cosmetics' })}
                    className="block rounded-2xl px-4 py-3 text-sm text-gray-600 transition hover:text-[#FF4742]"
                  >
                    Cosmetics
                  </a>
                </li>
                <li>
                  <a
                    href={buildHref({ category: 'Food' })}
                    className="block rounded-2xl px-4 py-3 text-sm text-gray-600 transition hover:text-[#FF4742]"
                  >
                    Food
                  </a>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-[0.24em] text-gray-500">
                Price Range
              </h2>
              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href={buildHref({ minPrice: null, maxPrice: null })}
                    className="block rounded-2xl bg-[#FFEEF0] px-4 py-3 text-sm font-semibold text-[#FF4742] transition"
                  >
                    Any Price
                  </a>
                </li>
                <li>
                  <a
                    href={buildHref({ minPrice: '0', maxPrice: '500000' })}
                    className="block rounded-2xl px-4 py-3 text-sm text-gray-600 transition hover:text-[#FF4742]"
                  >
                    Under 500k
                  </a>
                </li>
                <li>
                  <a
                    href={buildHref({ minPrice: '500000', maxPrice: '2000000' })}
                    className="block rounded-2xl px-4 py-3 text-sm text-gray-600 transition hover:text-[#FF4742]"
                  >
                    500k - 2 million
                  </a>
                </li>
                <li>
                  <a
                    href={buildHref({ minPrice: '2000000', maxPrice: '10000000' })}
                    className="block rounded-2xl px-4 py-3 text-sm text-gray-600 transition hover:text-[#FF4742]"
                  >
                    2 - 10 million
                  </a>
                </li>
                <li>
                  <a
                    href={buildHref({ minPrice: '10000000', maxPrice: '1000000000' })}
                    className="block rounded-2xl px-4 py-3 text-sm text-gray-600 transition hover:text-[#FF4742]"
                  >
                    Over 10 million
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-500">
              {total} products
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
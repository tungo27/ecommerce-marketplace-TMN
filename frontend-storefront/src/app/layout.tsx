import './globals.css';
import Link from 'next/link';

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

const getParamValue = (value: string | string[] | undefined) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return '';
};

const buildHref = (
  searchParams: SearchParams = {},
  overrides: { [key: string]: string | null } = {},
) => {
  const params = new URLSearchParams();
  const preservedKeys = ['search', 'category', 'minPrice', 'maxPrice'];

  preservedKeys.forEach((key) => {
    const value = getParamValue(searchParams[key]);
    if (value) params.set(key, value);
  });

  Object.entries(overrides).forEach(([key, value]) => {
    if (value === null) {
      params.delete(key);
      return;
    }
    params.set(key, value);
  });

  const query = params.toString();
  return query ? `/?${query}` : '/';
};

const preservedInputs = (searchParams: SearchParams = {}) =>
  Object.entries(searchParams)
    .filter(([key]) => key !== 'search' && key !== 'page' && key !== undefined)
    .flatMap(([key, value]) => {
      if (typeof value === 'string') {
        return <input key={key} type="hidden" name={key} value={value} />;
      }

      if (Array.isArray(value)) {
        return value.map((item, index) => (
          <input key={`${key}-${index}`} type="hidden" name={key} value={item} />
        ));
      }

      return [];
    });

export const metadata = {
  title: 'TMN Shop - E-commerce Marketplace',
  description: 'Buy and sell products on TMN Shop',
};

export default function PublicLayout({
  children,
  searchParams = {},
}: {
  children: React.ReactNode;
  searchParams?: SearchParams;
}) {
  const currentSearch =
    typeof searchParams.search === 'string' ? searchParams.search : '';
  const searchAction = buildHref(searchParams, { search: null });

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 font-sans antialiased text-gray-800">
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-50">
            <div className="bg-[#FF4742] text-white shadow-md">
              <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
                <Link href="/" className="flex items-center gap-3 text-lg font-bold">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/15 text-white">
                    🛒
                  </span>
                  TMN Shop
                </Link>

                <div className="flex-1">
                  <form method="get" action={searchAction} className="relative">
                    <input
                      name="search"
                      defaultValue={currentSearch}
                      type="text"
                      placeholder="Search..."
                      className="w-full rounded-sm border border-white/30 bg-white px-4 py-2 pr-24 text-gray-700 placeholder:text-gray-400 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/40"
                    />
                    {preservedInputs(searchParams)}
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm bg-[#FF4742] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
                    >
                      Search
                    </button>
                  </form>
                </div>

                <div className="flex items-center gap-3 text-sm font-medium">
                  <Link href="/login" className="hover:underline">
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full bg-white px-4 py-2 text-[#FF4742] shadow-sm transition hover:bg-gray-100 hover:text-[#E53E3E]"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-[#E63E39] border-t border-[#F05545]">
              <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-4 text-sm font-medium text-white">
                <Link
                  href={buildHref(searchParams, { category: null })}
                  className="rounded-full bg-white/20 px-3 py-1.5 text-white transition hover:bg-white/30"
                >
                  All Categories
                </Link>
                <Link href={buildHref(searchParams, { category: 'Electronics' })} className="transition hover:text-gray-100">
                  Electronics
                </Link>
                <Link href={buildHref(searchParams, { category: 'Fashion' })} className="transition hover:text-gray-100">
                  Fashion
                </Link>
                <Link href={buildHref(searchParams, { category: 'Home_Living' })} className="transition hover:text-gray-100">
                  Home & Living
                </Link>
                <Link href={buildHref(searchParams, { category: 'Cosmetics' })} className="transition hover:text-gray-100">
                  Cosmetics
                </Link>
                <Link href={buildHref(searchParams, { category: 'Food' })} className="transition hover:text-gray-100">
                  Food
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
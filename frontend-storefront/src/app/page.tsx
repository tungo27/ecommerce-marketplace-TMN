import ProductCard from '@/components/ProductCard';

// Giả lập hàm gọi API SSR
async function fetchProducts(searchParams: any) {
  const query = new URLSearchParams(searchParams).toString();
  const res = await fetch(`http://127.0.0.1:4000/api/products?${query}`, { cache: 'no-store' });
  if (!res.ok) return { products: [], meta: { total: 0 } };
  return res.json();
}

export default async function MarketplacePage({ searchParams }: { searchParams: any }) {
  const data = await fetchProducts(searchParams);
  const products = data.products || [];
  const total = data.meta?.total || 0;

  return (
    <div className="flex gap-6 items-start">
      {/* STICKY SIDEBAR */}
      <aside className="w-60 sticky top-[120px] flex-shrink-0">
        <div className="bg-white p-4 border border-gray-100 rounded-sm shadow-sm mb-4">
          <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase">Categories</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><a href="/" className="block py-1 hover:text-[#FF4742]">All</a></li>
            <li><a href="/?category=Electronics" className="block py-1 hover:text-[#FF4742]">Electronics</a></li>
            <li><a href="/?category=Fashion" className="block py-1 hover:text-[#FF4742]">Fashion</a></li>
            <li><a href="/?category=Home_Living" className="block py-1 hover:text-[#FF4742]">Home & Living</a></li>
            <li><a href="/?category=Cosmetics" className="block py-1 hover:text-[#FF4742]">Cosmetics</a></li>
            <li><a href="/?category=Food" className="block py-1 hover:text-[#FF4742]">Food</a></li>
          </ul>
        </div>

        <div className="bg-white p-4 border border-gray-100 rounded-sm shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase">Price Range</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><a href="/" className="block py-1 hover:text-[#FF4742] bg-red-50 text-[#FF4742] px-2 -mx-2 rounded">All Prices</a></li>
            <li><a href="/?maxPrice=500000" className="block py-1 hover:text-[#FF4742]">Under 500.000₫</a></li>
            <li><a href="/?minPrice=500000&maxPrice=2000000" className="block py-1 hover:text-[#FF4742]">500K - 2 Million</a></li>
            <li><a href="/?minPrice=2000000&maxPrice=10000000" className="block py-1 hover:text-[#FF4742]">2 - 10 Million</a></li>
            <li><a href="/?minPrice=10000000" className="block py-1 hover:text-[#FF4742]">Over 10 Million</a></li>
          </ul>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1">
        {/* FLAT BANNER (No Gradients) */}
        <div className="bg-[#FF4742] rounded-sm p-8 mb-6 text-white flex flex-col justify-center min-h-[200px] shadow-sm">
          <p className="text-sm font-bold tracking-wider mb-2 uppercase opacity-90">Welcome to</p>
          <h1 className="text-5xl font-extrabold mb-4">VietMart</h1>
          <p className="text-lg opacity-90 mb-6">Millions of products. Best prices everyday.</p>
          <div>
            <button className="bg-white text-[#FF4742] font-bold px-6 py-2.5 rounded-full shadow-sm hover:bg-gray-50 transition-colors">
              Shop Now →
            </button>
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-600 font-medium">
          <span className="text-gray-900 font-bold">{total}</span> items found
        </div>

        {/* PRODUCT GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
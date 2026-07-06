import Link from 'next/link';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* STICKY HEADER */}
      <header className="sticky top-0 z-50 bg-[#FF4742] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold flex items-center gap-2">
            🛒 VietMart
          </Link>
          
          <div className="flex-1 max-w-2xl mx-8">
            <form className="relative flex items-center">
              <input 
                type="text" 
                placeholder="Search products, brands..." 
                className="w-full px-4 py-2 text-gray-800 rounded-sm focus:outline-none"
              />
              <button type="submit" className="absolute right-0 px-4 text-[#FF4742] font-bold">
                🔍
              </button>
            </form>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/login" className="hover:underline">Sign In</Link>
            <Link href="/register" className="bg-white text-[#FF4742] px-4 py-1.5 rounded-sm shadow-sm hover:bg-gray-100">
              Sign Up
            </Link>
          </div>
        </div>

        {/* Sub-menu Header (No Dropdowns, flat links) */}
        <div className="bg-[#e63e39] border-t border-[#ff6b67]">
          <div className="max-w-7xl mx-auto px-4 h-10 flex items-center gap-6 text-sm">
            <Link href="/" className="font-semibold bg-white/20 px-2 py-1 rounded-sm">All Categories</Link>
            <Link href="/?category=Electronics" className="hover:text-gray-200">Electronics</Link>
            <Link href="/?category=Fashion" className="hover:text-gray-200">Fashion</Link>
            <Link href="/?category=Home_Living" className="hover:text-gray-200">Home & Living</Link>
            <Link href="/?category=Cosmetics" className="hover:text-gray-200">Cosmetics</Link>
            <Link href="/?category=Food" className="hover:text-gray-200">Food</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
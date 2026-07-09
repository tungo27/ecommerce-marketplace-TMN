'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/navigation';

export default function Header({ searchAction, currentSearch, currentCategory, currentMinPrice, currentMaxPrice }: any) {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isAuthenticated = Boolean(user);

  useEffect(() => {
    setIsMounted(true);
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tải giỏ hàng khi component mount và trạng thái auth đã xác định
  useEffect(() => {
    if (isMounted) {
      useCart.getState().loadCart(isAuthenticated);
    }
  }, [isMounted, isAuthenticated]);

  const handleLogout = () => {
    // Xóa cart state khi logout (không cần gọi API vì Redis vẫn giữ)
    useCart.setState({ items: [], totalCartPrice: 0, totalItems: 0 });
    logout();
    setDropdownOpen(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b-4 border-[#F05545] bg-[#FF4742] shadow-md">
      {/* Mobile: flex-wrap to break search into next line. Desktop: h-16, flex-nowrap */}
      <div className="mx-auto flex flex-wrap lg:flex-nowrap lg:h-16 max-w-7xl items-center justify-between lg:justify-start gap-4 px-4 py-3 lg:py-0">
        
        {/* Logo and Hamburger (Mobile Dòng 1) */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            className="lg:hidden flex flex-col justify-center gap-1 p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="block w-5 h-0.5 bg-white"></span>
            <span className="block w-5 h-0.5 bg-white"></span>
            <span className="block w-5 h-0.5 bg-white"></span>
          </button>
          <Link href="/" className="shrink-0 text-xl font-extrabold text-white">
            E-commerce MVP
          </Link>
        </div>

        {/* Mobile Cart Icon (Mobile Dòng 1, Góc phải) */}
        <div className="lg:hidden flex items-center shrink-0">
           <Link href="/cart" className="text-white">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
           </Link>
        </div>

        {/* Search Bar (Mobile Dòng 2: w-full order-last. Desktop: order-none flex-1) */}
        <form method="get" action={searchAction} className="relative w-full lg:w-auto lg:flex-1 order-last lg:order-none">
          <input
            name="search"
            defaultValue={currentSearch}
            type="search"
            placeholder="Search products"
            className="h-10 w-full rounded-md border border-transparent bg-white px-4 pr-24 text-sm text-gray-900 outline-none transition focus:border-white focus:ring-2 focus:ring-white/50 shadow-inner"
          />
          <input type="hidden" name="category" value={currentCategory || ''} />
          <input type="hidden" name="minPrice" value={currentMinPrice || ''} />
          <input type="hidden" name="maxPrice" value={currentMaxPrice || ''} />
          <button
            type="submit"
            className="absolute right-1 top-1/2 h-8 -translate-y-1/2 rounded-md bg-[#E63E39] px-4 text-sm font-semibold text-white transition hover:bg-[#D53530]"
          >
            Search
          </button>
        </form>

        {/* Navigation / Icons (Desktop right side, Mobile hidden inside Hamburger) */}
        <nav className="hidden lg:flex shrink-0 items-center gap-4 text-sm font-semibold relative">
          {/* Cart Icon với Badge */}
          <Link
            href="/cart"
            id="cart-icon-btn"
            aria-label={`Giỏ hàng ${isMounted && totalItems > 0 ? `(${totalItems} sản phẩm)` : ''}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-[#E63E39]"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
            {/* Badge hiển thị số lượng */}
            {isMounted && totalItems > 0 && (
              <span
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-[#FF4742] shadow ring-2 ring-[#FF4742] transition-all duration-300"
                aria-hidden="true"
              >
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          {!isMounted || !user ? (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-white transition hover:bg-[#E63E39]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-white px-4 py-2 text-[#FF4742] transition hover:bg-gray-100 shadow-sm"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full px-2 py-1 text-white transition hover:bg-[#E63E39]"
              >
                <img
                  src={(user as any).picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border border-white"
                />
                <span className="font-semibold">{user.name}</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md bg-white py-1 shadow-lg border border-gray-200">
                  <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 mb-1">
                    Logged in as <br />
                    <strong className="text-gray-800 block break-all">{user.email}</strong>
                  </div>
                  <Link
                    href="/cart"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                    Shopping cart
                    {totalItems > 0 && (
                      <span className="ml-auto rounded-full bg-[#FF4742] px-2 py-0.5 text-[10px] font-bold text-white">
                        {totalItems}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/orders/history"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    My orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Mobile Menu Overlay & Drawer */}
      <div className={`lg:hidden fixed inset-0 z-[100] transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        {/* Overlay backdrop */}
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setMobileMenuOpen(false)}
        ></div>
        
        {/* Drawer sliding in from left */}
        <div 
          className={`absolute top-0 left-0 bottom-0 flex w-4/5 max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 ease-out transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Header of Drawer */}
          <div className="bg-[#FF4742] px-4 py-4 flex items-center justify-between text-white border-b-4 border-[#F05545]">
            <span className="font-extrabold text-lg">Menu</span>
            <button onClick={() => setMobileMenuOpen(false)} className="p-1 focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          {/* Drawer Links */}
          <div className="px-4 py-6 flex-1 overflow-y-auto bg-gray-50">
             {!isMounted || !user ? (
               <div className="flex flex-col gap-3">
                 <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center rounded-md bg-[#FF4742] px-4 py-2 font-bold text-white shadow-sm transition hover:bg-[#E63E39]">Sign In</Link>
                 <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center rounded-md bg-white border border-gray-300 px-4 py-2 font-bold text-gray-700 shadow-sm transition hover:bg-gray-50">Sign Up</Link>
               </div>
             ) : (
               <>
                 <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                   <img
                     src={(user as any).picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`}
                     alt="Avatar"
                     className="w-12 h-12 rounded-full object-cover border border-gray-200"
                   />
                   <div className="flex-1 min-w-0">
                     <div className="font-bold text-gray-900 truncate">{user.name}</div>
                     <div className="text-xs text-gray-500 truncate">{user.email}</div>
                   </div>
                 </div>
                 <div className="space-y-1">
                   <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 text-sm font-semibold text-gray-700 rounded-md hover:bg-gray-100">Home</Link>
                   <Link href="/orders/history" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 text-sm font-semibold text-gray-700 rounded-md hover:bg-gray-100">My Orders</Link>
                   <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 text-sm font-semibold text-gray-700 rounded-md hover:bg-gray-100">Account Settings</Link>
                 </div>
                 <div className="mt-8 pt-6 border-t border-gray-200">
                   <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full block px-3 py-3 text-sm font-semibold text-red-600 rounded-md hover:bg-red-50 text-left">Logout</button>
                 </div>
               </>
             )}
          </div>
        </div>
      </div>
    </header>
  );
}

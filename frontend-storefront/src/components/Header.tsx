'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Header({ searchAction, currentSearch, currentCategory, currentMinPrice, currentMaxPrice }: any) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b-4 border-[#F05545] bg-[#FF4742] shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="shrink-0 text-xl font-extrabold text-white">
          E-commerce MVP
        </Link>

        <form method="get" action={searchAction} className="relative flex-1">
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

        <nav className="flex shrink-0 items-center gap-4 text-sm font-semibold relative">
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
                    Logged in as <br/>
                    <strong className="text-gray-800 block break-all">{user.email}</strong>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

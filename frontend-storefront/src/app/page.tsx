'use client';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    logout();
    router.push('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 py-4 px-8 flex justify-between items-center shadow-sm">
        <div className="text-2xl font-extrabold text-primary tracking-tight">
          ShopNexus
        </div>
        <div>
          {user ? (
            <button 
              onClick={handleLogout}
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              Sign out
            </button>
          ) : (
            <Link href="/login" className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-md shadow-sm border border-gray-200 max-w-2xl w-full p-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Welcome to <span className="text-primary">ShopNexus</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
            Discover amazing products, manage your orders, and experience seamless shopping with our modern marketplace.
          </p>

          {user ? (
            <div className="flex flex-col items-center bg-gray-50 border border-gray-100 rounded-md p-6 w-full max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary-light text-primary rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                {(user.name || 'User').charAt(0).toUpperCase()}
              </div>
              <p className="text-xl text-gray-900 font-bold mb-1">
                {user.name || 'User'}
              </p>
              <p className="text-sm text-gray-500 mb-3">
                {user.email || 'No email'}
              </p>
              <span className="px-3 py-1 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wide shadow-sm">
                {user.role}
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-6 rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 w-full sm:w-auto text-center">
                Create new account
              </Link>
              <Link href="/login" className="border border-primary text-primary hover:bg-primary-light font-medium py-2.5 px-6 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-transparent w-full sm:w-auto text-center">
                Login to your account
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
